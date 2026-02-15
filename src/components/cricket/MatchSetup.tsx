import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MatchSetupProps {
  onSubmit: (teamA: string, teamB: string, venue: string, overs: number) => void;
}

export default function MatchSetup({ onSubmit }: MatchSetupProps) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [venue, setVenue] = useState("");
  const [overs, setOvers] = useState("20");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamA.trim() && teamB.trim() && venue.trim() && parseInt(overs) > 0) {
      onSubmit(teamA.trim(), teamB.trim(), venue.trim(), parseInt(overs));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏏</div>
          <h1 className="text-3xl font-bold text-foreground">Cricket Scorer</h1>
          <p className="text-muted-foreground mt-2">Set up your match</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Team A</label>
            <Input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="e.g. India" className="bg-muted border-border" required />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Team B</label>
            <Input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="e.g. Australia" className="bg-muted border-border" required />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Venue</label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Wankhede Stadium" className="bg-muted border-border" required />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Overs</label>
            <Input type="number" min="1" max="50" value={overs} onChange={e => setOvers(e.target.value)} className="bg-muted border-border" required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base py-5">
            Next: Add Players →
          </Button>
        </form>
      </div>
    </div>
  );
}
