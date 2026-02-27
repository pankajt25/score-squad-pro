import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlayerEntryProps {
  teamA: string;
  teamB: string;
  onSubmit: (teamAPlayers: string[], teamBPlayers: string[]) => void;
  onBack?: () => void;
}

export default function PlayerEntry({ teamA, teamB, onSubmit, onBack }: PlayerEntryProps) {
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(Array(11).fill(""));
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(Array(11).fill(""));
  const [activeTeam, setActiveTeam] = useState<"A" | "B">("A");

  const updatePlayer = (team: "A" | "B", index: number, value: string) => {
    if (team === "A") {
      const arr = [...teamAPlayers];
      arr[index] = value;
      setTeamAPlayers(arr);
    } else {
      const arr = [...teamBPlayers];
      arr[index] = value;
      setTeamBPlayers(arr);
    }
  };

  const handleSubmit = () => {
    const a = teamAPlayers.map((p, i) => p.trim() || `${teamA} Player ${i + 1}`);
    const b = teamBPlayers.map((p, i) => p.trim() || `${teamB} Player ${i + 1}`);
    onSubmit(a, b);
  };

  const currentPlayers = activeTeam === "A" ? teamAPlayers : teamBPlayers;
  const currentTeam = activeTeam === "A" ? teamA : teamB;
  const filledCount = currentPlayers.filter(p => p.trim()).length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-field relative">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-6">
          {onBack && (
            <button onClick={onBack} className="absolute left-4 top-4 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all">
              ← Back
            </button>
          )}
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Squad Selection</h2>
          <p className="text-muted-foreground text-sm mt-1">Enter player names — empty slots get defaults</p>
        </div>

        {/* Team tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-xl">
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTeam === "A"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTeam("A")}
          >
            {teamA}
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTeam === "B"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTeam("B")}
          >
            {teamB}
          </button>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{currentTeam}</p>
            <span className="text-xs font-mono text-primary font-bold">{filledCount}/11</span>
          </div>
          <div className="stagger-in space-y-1.5">
            {currentPlayers.map((player, i) => (
              <div key={i} className="flex items-center gap-2.5 group">
                <span className={`text-xs w-6 text-right font-mono font-bold transition-colors ${player.trim() ? "text-primary" : "text-muted-foreground/50"}`}>
                  {i + 1}.
                </span>
                <Input
                  value={player}
                  onChange={e => updatePlayer(activeTeam, i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="bg-muted/30 border-border/30 text-sm h-10 rounded-xl focus:border-primary/50 focus:bg-muted/50 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]">
          Next: Toss →
        </Button>
      </div>
    </div>
  );
}
