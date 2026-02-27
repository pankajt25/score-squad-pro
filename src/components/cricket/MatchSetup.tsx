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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-stadium">
      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4 inline-block" style={{ animation: 'float 3s ease-in-out infinite' }}>🏏</div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Cricket Scorer</h1>
          <p className="text-muted-foreground mt-2 text-sm">Ball-by-ball live scoring</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Team A</label>
              <Input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="India" className="bg-muted/50 border-border/50 h-11 rounded-xl" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Team B</label>
              <Input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="Australia" className="bg-muted/50 border-border/50 h-11 rounded-xl" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Venue</label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Wankhede Stadium, Mumbai" className="bg-muted/50 border-border/50 h-11 rounded-xl" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Overs</label>
            <div className="flex gap-2">
              {[5, 10, 20, 50].map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOvers(String(o))}
                  className={`flex-1 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                    parseInt(overs) === o
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min="1"
              max="50"
              value={overs}
              onChange={e => setOvers(e.target.value)}
              className="bg-muted/50 border-border/50 h-10 rounded-xl mt-2 text-center font-mono"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]">
            Next: Add Players →
          </Button>
        </form>
      </div>
    </div>
  );
}
