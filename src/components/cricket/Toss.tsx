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
        {/* Coin */}
        <div className="relative inline-block mb-8">
          <div className={`absolute -inset-4 rounded-full opacity-30 ${flipping ? "animate-spin" : ""}`}
            style={{
              background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.5), transparent, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.5))",
              filter: "blur(10px)",
            }}
          />
          <div
            className={`relative w-28 h-28 ${flipping ? "ancient-coin-flip" : flipDone ? "bounce-in" : ""}`}
            style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
          >
            <div
              className="w-28 h-28 rounded-full relative"
              style={{
                background: `linear-gradient(145deg, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.6) 50%, hsl(var(--primary) / 0.4) 100%)`,
                boxShadow: `inset 0 2px 6px hsl(var(--primary) / 0.4), 0 4px 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)`,
              }}
            >
              <div className="absolute inset-2 rounded-full border border-primary-foreground/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display text-primary-foreground/90">
                  {coinSide === "heads" || !flipDone ? "H" : "T"}
                </span>
                <span className="text-[9px] font-bold tracking-widest uppercase text-primary-foreground/60 mt-0.5">
                  {coinSide === "heads" || !flipDone ? "HEADS" : "TAILS"}
                </span>
              </div>
            </div>
          </div>
          {flipping && (
            <>
              <div className="absolute -top-2 -left-2 w-2 h-2 rounded-full bg-primary" style={{ animation: "sparkle1 0.8s ease-out infinite" }} />
              <div className="absolute -top-1 -right-3 w-1.5 h-1.5 rounded-full bg-primary/80" style={{ animation: "sparkle2 0.6s ease-out infinite 0.2s" }} />
            </>
          )}
        </div>

        <h2 className="text-2xl font-display text-foreground mb-1 tracking-tight">Toss</h2>
        <p className="text-muted-foreground text-sm mb-6">Flip the coin to decide</p>

        <div className="glass-card rounded-xl p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Toss Winner</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  winner === teamA
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                }`}
                onClick={() => { setWinner(teamA); setFlipDone(false); }}
              >{teamA}</button>
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  winner === teamB
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/30"
                }`}
                onClick={() => { setWinner(teamB); setFlipDone(false); }}
              >{teamB}</button>
            </div>
            <button
              onClick={handleFlip}
              disabled={flipping}
              className="mt-3 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              🎲 Flip Coin
            </button>
          </div>

          {flipDone && (
            <div className="text-sm text-primary font-bold bounce-in bg-primary/10 py-2 px-4 rounded-lg border border-primary/30">
              {winner} won the toss ({coinSide === "heads" ? "Heads" : "Tails"})
            </div>
          )}

          <div className="h-px bg-border/50" />

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Elected to</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  decision === "bat"
                    ? "bg-accent text-accent-foreground border-accent shadow-md"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-accent/30"
                }`}
                onClick={() => setDecision("bat")}
              >🏏 Bat</button>
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all duration-200 border ${
                  decision === "bowl"
                    ? "bg-accent text-accent-foreground border-accent shadow-md"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-accent/30"
                }`}
                onClick={() => setDecision("bowl")}
              >⚾ Bowl</button>
            </div>
          </div>

          <Button onClick={() => onSubmit(winner, decision)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm h-12 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]">
            Start Match →
          </Button>
        </div>
      </div>
    </div>
  );
}
