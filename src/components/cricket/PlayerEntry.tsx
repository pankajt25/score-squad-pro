import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlayerEntryProps {
  teamA: string;
  teamB: string;
  onSubmit: (teamAPlayers: string[], teamBPlayers: string[]) => void;
}

export default function PlayerEntry({ teamA, teamB, onSubmit }: PlayerEntryProps) {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Add Players</h2>
          <p className="text-muted-foreground text-sm mt-1">Enter player names (empty slots get default names)</p>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTeam === "A" ? "default" : "outline"}
            className={activeTeam === "A" ? "flex-1 bg-primary text-primary-foreground" : "flex-1"}
            onClick={() => setActiveTeam("A")}
          >
            {teamA}
          </Button>
          <Button
            variant={activeTeam === "B" ? "default" : "outline"}
            className={activeTeam === "B" ? "flex-1 bg-primary text-primary-foreground" : "flex-1"}
            onClick={() => setActiveTeam("B")}
          >
            {teamB}
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">{currentTeam} — {filledCount}/11 entered</p>
          {currentPlayers.map((player, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 text-right font-mono">{i + 1}.</span>
              <Input
                value={player}
                onChange={e => updatePlayer(activeTeam, i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="bg-muted border-border text-sm h-9"
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit} className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-5">
          Next: Toss →
        </Button>
      </div>
    </div>
  );
}
