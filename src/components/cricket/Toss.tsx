import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TossProps {
  teamA: string;
  teamB: string;
  onSubmit: (winner: string, decision: "bat" | "bowl") => void;
}

export default function Toss({ teamA, teamB, onSubmit }: TossProps) {
  const [winner, setWinner] = useState(teamA);
  const [decision, setDecision] = useState<"bat" | "bowl">("bat");
  const [flipping, setFlipping] = useState(false);
  const [flipDone, setFlipDone] = useState(false);

  const handleFlip = () => {
    setFlipping(true);
    setFlipDone(false);
    const randomWinner = Math.random() > 0.5 ? teamA : teamB;
    setTimeout(() => {
      setWinner(randomWinner);
      setFlipping(false);
      setFlipDone(true);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-stadium overflow-y-auto">
      <div className="w-full max-w-sm slide-up text-center py-4">
        {/* Coin */}
        <div className="relative inline-block mb-6">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-3xl font-bold text-yellow-900 shadow-lg shadow-amber-500/30 ${flipping ? "coin-flip" : flipDone ? "bounce-in" : ""}`} style={{ perspective: "1000px" }}>
            ₹
          </div>
          {flipping && (
            <div className="absolute inset-0 rounded-full" style={{ animation: 'pulse-ring 1s infinite' }} />
          )}
        </div>

        <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">The Toss</h2>
        <p className="text-muted-foreground text-sm mb-6">Who calls it right?</p>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {/* Winner selection */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Toss Winner</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  winner === teamA
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => { setWinner(teamA); setFlipDone(false); }}
              >{teamA}</button>
              <button
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  winner === teamB
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => { setWinner(teamB); setFlipDone(false); }}
              >{teamB}</button>
            </div>
            <button
              onClick={handleFlip}
              disabled={flipping}
              className="mt-3 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              🎲 Flip coin randomly
            </button>
          </div>

          {flipDone && (
            <div className="text-sm text-primary font-bold bounce-in bg-primary/10 py-2 px-4 rounded-xl">
              🎉 {winner} won the toss!
            </div>
          )}

          {/* Decision */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Elected to</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  decision === "bat"
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setDecision("bat")}
              >🏏 Bat</button>
              <button
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  decision === "bowl"
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setDecision("bowl")}
              >⚾ Bowl</button>
            </div>
          </div>

          <Button onClick={() => onSubmit(winner, decision)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]">
            Start Match 🔥
          </Button>
        </div>
      </div>
    </div>
  );
}
