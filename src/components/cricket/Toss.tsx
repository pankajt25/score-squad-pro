import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface TossProps {
  teamA: string;
  teamB: string;
  onSubmit: (winner: string, decision: "bat" | "bowl") => void;
}

function playCoinFlipSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const playClick = (time: number, freq: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.06);
    filter.type = "bandpass";
    filter.frequency.value = freq * 1.5;
    filter.Q.value = 8;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.08);
  };
  const now = ctx.currentTime;
  for (let i = 0; i < 14; i++) {
    const t = now + i * (0.08 + i * 0.012);
    const freq = 2800 + Math.random() * 600 - i * 80;
    const vol = 0.12 - i * 0.006;
    playClick(t, freq, Math.max(vol, 0.02));
  }
}

function playCoinLandSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1800, now);
  osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(3600, now);
  osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.2);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc1.connect(gain).connect(ctx.destination);
  osc2.connect(gain);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.5);
  osc2.stop(now + 0.5);
  [0.12, 0.2, 0.26].forEach((delay, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 2200 - i * 300;
    g.gain.setValueAtTime(0.06 - i * 0.015, now + delay);
    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
    o.connect(g).connect(ctx.destination);
    o.start(now + delay);
    o.stop(now + delay + 0.06);
  });
}

export default function Toss({ teamA, teamB, onSubmit }: TossProps) {
  const [winner, setWinner] = useState(teamA);
  const [decision, setDecision] = useState<"bat" | "bowl">("bat");
  const [flipping, setFlipping] = useState(false);
  const [flipDone, setFlipDone] = useState(false);
  const [coinSide, setCoinSide] = useState<"heads" | "tails">("heads");
  const flipCountRef = useRef(0);

  const handleFlip = () => {
    setFlipping(true);
    setFlipDone(false);
    flipCountRef.current += 1;
    playCoinFlipSound();
    const entropy = crypto.getRandomValues(new Uint32Array(1))[0];
    const timeSeed = Date.now() % 1000;
    const combined = (entropy + timeSeed + flipCountRef.current * 7919) % 100;
    const isHeads = combined < 50;
    const randomWinner = isHeads ? teamA : teamB;
    setTimeout(() => {
      setWinner(randomWinner);
      setCoinSide(isHeads ? "heads" : "tails");
      setFlipping(false);
      setFlipDone(true);
      playCoinLandSound();
    }, 2200);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-stadium overflow-y-auto">
      <div className="w-full max-w-sm slide-up text-center py-4">
        {/* Ancient Coin */}
        <div className="relative inline-block mb-8">
          <div className={`absolute -inset-3 rounded-full opacity-40 ${flipping ? "animate-spin" : ""}`}
            style={{
              background: "conic-gradient(from 0deg, hsl(var(--cricket-gold) / 0.6), transparent, hsl(var(--cricket-gold) / 0.4), transparent, hsl(var(--cricket-gold) / 0.6))",
              filter: "blur(8px)",
            }}
          />
          <div
            className={`relative w-28 h-28 ${flipping ? "ancient-coin-flip" : flipDone ? "bounce-in" : ""}`}
            style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
          >
            <div
              className="w-28 h-28 rounded-full relative"
              style={{
                background: `
                  radial-gradient(ellipse at 35% 30%, hsl(43 80% 72%), transparent 50%),
                  radial-gradient(ellipse at 65% 70%, hsl(30 60% 30%), transparent 50%),
                  linear-gradient(145deg, hsl(43 85% 65%) 0%, hsl(38 75% 45%) 40%, hsl(30 70% 32%) 70%, hsl(25 60% 25%) 100%)
                `,
                boxShadow: `
                  inset 0 2px 6px hsl(43 90% 80% / 0.5),
                  inset 0 -3px 8px hsl(25 70% 18% / 0.6),
                  0 4px 20px hsl(var(--cricket-gold) / 0.4),
                  0 0 40px hsl(var(--cricket-gold) / 0.15)
                `,
              }}
            >
              <div className="absolute inset-1 rounded-full" style={{ border: "2px solid hsl(43 70% 55% / 0.6)", boxShadow: "inset 0 1px 2px hsl(43 80% 75% / 0.3), inset 0 -1px 2px hsl(25 60% 20% / 0.4)" }} />
              <div className="absolute inset-3 rounded-full" style={{ border: "1.5px solid hsl(43 60% 50% / 0.4)", boxShadow: "inset 0 1px 1px hsl(43 80% 75% / 0.2)" }} />
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute w-[2px] h-[5px] rounded-full" style={{ background: "hsl(43 60% 55% / 0.5)", top: "50%", left: "50%", transformOrigin: "0 0", transform: `rotate(${i * 15}deg) translate(-1px, -54px)` }} />
              ))}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {coinSide === "heads" || !flipDone ? (
                  <>
                    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm" style={{ filter: "drop-shadow(0 1px 1px hsl(25 60% 20% / 0.4))" }}>
                      <path d="M20 28 Q22 16 28 14 Q30 10 32 8 Q34 10 36 14 Q42 16 44 28" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M24 26 Q26 18 30 16 Q32 13 32 13 Q32 13 34 16 Q38 18 40 26" fill="hsl(43 65% 50% / 0.3)" stroke="none"/>
                      <circle cx="32" cy="32" r="10" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1.2"/>
                      <circle cx="29" cy="30" r="1.2" fill="hsl(43 70% 55%)"/>
                      <circle cx="35" cy="30" r="1.2" fill="hsl(43 70% 55%)"/>
                      <path d="M31 33 L32 35 L33 33" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M22 32 L28 32" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <path d="M22 34 L28 33.5" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <path d="M36 32 L42 32" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <path d="M36 33.5 L42 34" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <path d="M18 30 Q16 36 20 42 Q24 46 32 48 Q40 46 44 42 Q48 36 46 30" fill="none" stroke="hsl(43 60% 50% / 0.5)" strokeWidth="1" strokeDasharray="3 2"/>
                    </svg>
                    <span className="text-[8px] font-heading font-bold tracking-[0.25em] mt-0.5 uppercase" style={{ color: "hsl(43 60% 55%)", textShadow: "0 1px 2px hsl(25 60% 20% / 0.5)" }}>HEADS</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-sm" style={{ filter: "drop-shadow(0 1px 1px hsl(25 60% 20% / 0.4))" }}>
                      <rect x="18" y="12" width="5" height="28" rx="2" transform="rotate(-25 20 26)" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1.3"/>
                      <rect x="41" y="12" width="5" height="28" rx="2" transform="rotate(25 44 26)" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1.3"/>
                      <line x1="18" y1="12" x2="14" y2="6" stroke="hsl(43 70% 55%)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-25 20 26)"/>
                      <line x1="46" y1="12" x2="50" y2="6" stroke="hsl(43 70% 55%)" strokeWidth="1.5" strokeLinecap="round" transform="rotate(25 44 26)"/>
                      <circle cx="32" cy="44" r="6" fill="none" stroke="hsl(43 70% 55%)" strokeWidth="1.2"/>
                      <path d="M28 40 Q32 44 28 48" fill="none" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <path d="M36 40 Q32 44 36 48" fill="none" stroke="hsl(43 60% 50% / 0.6)" strokeWidth="0.8"/>
                      <circle cx="32" cy="16" r="1.5" fill="hsl(43 70% 55%)"/>
                      <circle cx="24" cy="46" r="1" fill="hsl(43 60% 50% / 0.5)"/>
                      <circle cx="40" cy="46" r="1" fill="hsl(43 60% 50% / 0.5)"/>
                    </svg>
                    <span className="text-[8px] font-heading font-bold tracking-[0.25em] mt-0.5 uppercase" style={{ color: "hsl(43 60% 55%)", textShadow: "0 1px 2px hsl(25 60% 20% / 0.5)" }}>TAILS</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0z' fill='%23000' fill-opacity='0.08'/%3E%3C/svg%3E")`, backgroundSize: "4px 4px" }} />
            </div>
          </div>
          {flipping && (
            <>
              <div className="absolute -top-2 -left-2 w-2 h-2 rounded-full" style={{ background: "hsl(43 90% 70%)", animation: "sparkle1 0.8s ease-out infinite" }} />
              <div className="absolute -top-1 -right-3 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(43 80% 65%)", animation: "sparkle2 0.6s ease-out infinite 0.2s" }} />
              <div className="absolute -bottom-2 left-1 w-1 h-1 rounded-full" style={{ background: "hsl(43 85% 72%)", animation: "sparkle1 0.7s ease-out infinite 0.4s" }} />
            </>
          )}
        </div>

        <h2 className="text-2xl font-heading font-bold text-foreground mb-2 tracking-widest uppercase">The Toss</h2>
        <div className="ornate-divider w-32 mx-auto mb-4" />
        <p className="text-muted-foreground text-base mb-6 italic">Flip the coin to decide</p>

        <div className="parchment-card rounded-lg p-6 space-y-6">
          <div>
            <p className="text-xs font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-[0.2em]">⚜ Toss Victor</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-sm text-sm font-heading font-bold tracking-wider transition-all duration-200 border-2 ${
                  winner === teamA
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                }`}
                onClick={() => { setWinner(teamA); setFlipDone(false); }}
              >{teamA}</button>
              <button
                className={`flex-1 py-3 rounded-sm text-sm font-heading font-bold tracking-wider transition-all duration-200 border-2 ${
                  winner === teamB
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                }`}
                onClick={() => { setWinner(teamB); setFlipDone(false); }}
              >{teamB}</button>
            </div>
            <button
              onClick={handleFlip}
              disabled={flipping}
              className="mt-3 text-xs font-heading font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors tracking-wider uppercase"
            >
              🎲 Cast the ancient coin
            </button>
          </div>

          {flipDone && (
            <div className="text-sm text-primary font-heading font-bold bounce-in bg-primary/10 py-2 px-4 rounded-sm border border-primary/30 tracking-wider">
              ⚜ {winner} prevails! ({coinSide === "heads" ? "Heads" : "Tails"})
            </div>
          )}

          <div className="ornate-divider w-full" />

          <div>
            <p className="text-xs font-heading font-semibold text-muted-foreground mb-3 uppercase tracking-[0.2em]">⚜ Elected to</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-sm text-sm font-heading font-bold tracking-wider transition-all duration-200 border-2 ${
                  decision === "bat"
                    ? "bg-accent text-accent-foreground border-accent shadow-lg"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-accent/30"
                }`}
                onClick={() => setDecision("bat")}
              >🏏 Bat</button>
              <button
                className={`flex-1 py-3 rounded-sm text-sm font-heading font-bold tracking-wider transition-all duration-200 border-2 ${
                  decision === "bowl"
                    ? "bg-accent text-accent-foreground border-accent shadow-lg"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-accent/30"
                }`}
                onClick={() => setDecision("bowl")}
              >⚾ Bowl</button>
            </div>
          </div>

          <Button onClick={() => onSubmit(winner, decision)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-bold text-sm h-12 rounded-sm shadow-lg tracking-widest uppercase transition-all duration-200 active:scale-[0.98]">
            Let the Battle Begin ⚔
          </Button>
        </div>
      </div>
    </div>
  );
}
