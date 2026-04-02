import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFormatRules } from "@/lib/cricketRules";

interface MatchSetupProps {
  onSubmit: (teamA: string, teamB: string, venue: string, overs: number, matchMode: string) => void;
}

const MATCH_MODES = [
  { id: "t10", label: "T10", overs: 10, icon: "⚡", desc: "10 overs · 6 players" },
  { id: "t20", label: "T20", overs: 20, icon: "🔥", desc: "20 overs · 11 players" },
  { id: "odi", label: "ODI", overs: 50, icon: "🏏", desc: "50 overs · 11 players" },
  { id: "test", label: "Test", overs: 90, icon: "🏛️", desc: "4 innings · 11 players" },
  { id: "custom", label: "Custom", overs: 0, icon: "⚙️", desc: "Set your own overs" },
];

export default function MatchSetup({ onSubmit }: MatchSetupProps) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [venue, setVenue] = useState("");
  const [selectedMode, setSelectedMode] = useState("t20");
  const [customOvers, setCustomOvers] = useState("20");

  const currentMode = MATCH_MODES.find(m => m.id === selectedMode)!;
  const effectiveOvers = selectedMode === "custom" ? parseInt(customOvers) || 20 : currentMode.overs;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamA.trim() && teamB.trim() && venue.trim() && effectiveOvers > 0) {
      onSubmit(teamA.trim(), teamB.trim(), venue.trim(), effectiveOvers, selectedMode);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-stadium overflow-y-auto">
      <div className="w-full max-w-md slide-up py-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 inline-block" style={{ animation: 'float 3s ease-in-out infinite' }}>🏏</div>
          <h1 className="text-3xl font-display text-foreground tracking-tight">Cricket Scorer</h1>
          <p className="text-muted-foreground mt-2 text-sm">Score every ball, track every match</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
          {/* Match Mode Selection */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2.5 block uppercase tracking-wider">Match Format</label>
            <div className="grid grid-cols-5 gap-1.5">
              {MATCH_MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`relative flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg border text-center transition-all duration-200 ${
                    selectedMode === mode.id
                      ? "border-primary bg-primary/15 shadow-md ring-1 ring-primary/30"
                      : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <span className={`text-xs font-bold ${selectedMode === mode.id ? "text-primary" : "text-muted-foreground"}`}>
                    {mode.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {currentMode.desc}
              {selectedMode !== "custom" && selectedMode !== "test" && (
                <span className="text-foreground font-mono font-bold ml-1">({currentMode.overs} ov)</span>
              )}
            </p>
          </div>

          {/* Custom overs input */}
          {selectedMode === "custom" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Overs</label>
              <div className="flex gap-2">
                {[5, 10, 15, 30].map(o => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setCustomOvers(String(o))}
                    className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all duration-200 border ${
                      parseInt(customOvers) === o
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                max="100"
                value={customOvers}
                onChange={e => setCustomOvers(e.target.value)}
                className="bg-muted/50 border-border h-10 rounded-lg mt-2 text-center font-mono"
                required
              />
            </div>
          )}

          <div className="h-px bg-border/50" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Team A</label>
              <Input value={teamA} onChange={e => setTeamA(e.target.value)} placeholder="India" className="bg-muted/30 border-border h-11 rounded-lg" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Team B</label>
              <Input value={teamB} onChange={e => setTeamB(e.target.value)} placeholder="Australia" className="bg-muted/30 border-border h-11 rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Venue</label>
            <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Wankhede Stadium, Mumbai" className="bg-muted/30 border-border h-11 rounded-lg" required />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm h-12 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98]">
            Enter Players →
          </Button>
        </form>
      </div>
    </div>
  );
}
