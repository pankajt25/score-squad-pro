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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm slide-up text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Toss</h2>

        <div className="bg-card rounded-lg border border-border p-6 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Who won the toss?</p>
            <div className="flex gap-2">
              <Button
                variant={winner === teamA ? "default" : "outline"}
                className={winner === teamA ? "flex-1 bg-primary text-primary-foreground" : "flex-1"}
                onClick={() => setWinner(teamA)}
              >{teamA}</Button>
              <Button
                variant={winner === teamB ? "default" : "outline"}
                className={winner === teamB ? "flex-1 bg-primary text-primary-foreground" : "flex-1"}
                onClick={() => setWinner(teamB)}
              >{teamB}</Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Elected to?</p>
            <div className="flex gap-2">
              <Button
                variant={decision === "bat" ? "default" : "outline"}
                className={decision === "bat" ? "flex-1 bg-accent text-accent-foreground" : "flex-1"}
                onClick={() => setDecision("bat")}
              >🏏 Bat</Button>
              <Button
                variant={decision === "bowl" ? "default" : "outline"}
                className={decision === "bowl" ? "flex-1 bg-accent text-accent-foreground" : "flex-1"}
                onClick={() => setDecision("bowl")}
              >⚾ Bowl</Button>
            </div>
          </div>

          <Button onClick={() => onSubmit(winner, decision)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-5">
            Start Match →
          </Button>
        </div>
      </div>
    </div>
  );
}
