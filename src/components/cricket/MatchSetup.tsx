import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MatchSetupProps {
  onSubmit: (teamA: string, teamB: string, venue: string, overs: number, matchMode: string) => void;
}

const MATCH_MODES = [
  { id: "t10", label: "T10", overs: 10, icon: "⚡", desc: "10 overs per side", color: "from-purple-500/20 to-purple-600/10 border-purple-500/40" },
  { id: "t20", label: "T20", overs: 20, icon: "🔥", desc: "20 overs per side", color: "from-orange-500/20 to-orange-600/10 border-orange-500/40" },
  { id: "odi", label: "ODI", overs: 50, icon: "🏏", desc: "50 overs per side", color: "from-blue-500/20 to-blue-600/10 border-blue-500/40" },
  { id: "test", label: "Test", overs: 90, icon: "🏛️", desc: "Unlimited overs (90/day)", color: "from-red-500/20 to-red-600/10 border-red-500/40" },
  { id: "custom", label: "Custom", overs: 0, icon: "⚙️", desc: "Set your own overs", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/40" },
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
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Cricket Scorer</h1>
          <p className="text-muted-foreground mt-2 text-sm">Ball-by-ball live scoring</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">
          {/* Match Mode Selection */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2.5 block uppercase tracking-wider">Match Format</label>
            <div className="grid grid-cols-5 gap-1.5">
              {MATCH_MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`relative flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl border text-center transition-all duration-200 ${
                    selectedMode === mode.id
                      ? `bg-gradient-to-b ${mode.color} border-current shadow-lg scale-[1.02]`
                      : "bg-muted/30 border-border/30 hover:bg-muted/50 hover:border-border/50"
                  }`}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <span className={`text-xs font-bold ${selectedMode === mode.id ? "text-foreground" : "text-muted-foreground"}`}>
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
                    className={`flex-1 h-9 rounded-xl text-sm font-bold transition-all duration-200 ${
                      parseInt(customOvers) === o
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
                max="100"
                value={customOvers}
                onChange={e => setCustomOvers(e.target.value)}
                className="bg-muted/50 border-border/50 h-10 rounded-xl mt-2 text-center font-mono"
                required
              />
            </div>
          )}

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

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base h-12 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]">
            Next: Add Players →
          </Button>
        </form>
      </div>
    </div>
  );
}
