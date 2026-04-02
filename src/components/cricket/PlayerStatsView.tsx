import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getAllPlayersSorted,
  PlayerRecord,
  getBattingAverage,
  getBattingStrikeRate,
  getBowlingAverage,
  getBowlingEconomy,
  getBestBowling,
  getHighScore,
  clearPlayerStats,
} from "@/lib/playerStats";

interface PlayerStatsViewProps {
  onBack: () => void;
}

export default function PlayerStatsView({ onBack }: PlayerStatsViewProps) {
  const [sortBy, setSortBy] = useState<"runs" | "wickets" | "matches">("runs");
  const [view, setView] = useState<"batting" | "bowling">("batting");
  const players = getAllPlayersSorted(sortBy);

  const handleClear = () => {
    if (confirm("Clear all player statistics? This cannot be undone.")) {
      clearPlayerStats();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] p-4 max-w-4xl mx-auto space-y-4 pt-4 bg-field">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground tracking-tight">Player Statistics</h2>
          <p className="text-sm text-muted-foreground mt-1">Career stats across all matches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10">
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs rounded-lg">
            ← Back
          </Button>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-display text-foreground mb-2">No Records Yet</h3>
          <p className="text-muted-foreground text-sm">Complete a match to start tracking player statistics.</p>
        </div>
      ) : (
        <>
          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg border border-border">
            <button
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${view === "batting" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setView("batting"); setSortBy("runs"); }}
            >
              🏏 Batting
            </button>
            <button
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${view === "bowling" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => { setView("bowling"); setSortBy("wickets"); }}
            >
              🎯 Bowling
            </button>
          </div>

          {/* Sort options */}
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sort by:</span>
            {(view === "batting" ? ["runs", "matches"] : ["wickets", "matches"]).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border ${sortBy === s ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground hover:bg-muted/50 border-transparent"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Stats table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {view === "batting" ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                      <th className="text-left p-2.5 pl-4">#</th>
                      <th className="text-left p-2.5">Player</th>
                      <th className="text-right p-2.5">M</th>
                      <th className="text-right p-2.5">Inn</th>
                      <th className="text-right p-2.5">Runs</th>
                      <th className="text-right p-2.5">HS</th>
                      <th className="text-right p-2.5">Avg</th>
                      <th className="text-right p-2.5">SR</th>
                      <th className="text-right p-2.5">4s</th>
                      <th className="text-right p-2.5">6s</th>
                      <th className="text-right p-2.5 pr-4">50/100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.filter(p => p.innings > 0).map((p, i) => (
                      <tr key={p.name} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 pl-4 text-muted-foreground text-xs font-mono">{i + 1}</td>
                        <td className="p-2.5 text-foreground font-semibold">{p.name}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.matches}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.innings}</td>
                        <td className="text-right p-2.5 font-mono font-bold text-foreground">{p.totalRuns}</td>
                        <td className="text-right p-2.5 font-mono text-foreground">{getHighScore(p)}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{getBattingAverage(p)}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{getBattingStrikeRate(p)}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.fours}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.sixes}</td>
                        <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{p.fifties}/{p.hundreds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                      <th className="text-left p-2.5 pl-4">#</th>
                      <th className="text-left p-2.5">Player</th>
                      <th className="text-right p-2.5">M</th>
                      <th className="text-right p-2.5">Inn</th>
                      <th className="text-right p-2.5">O</th>
                      <th className="text-right p-2.5">R</th>
                      <th className="text-right p-2.5">W</th>
                      <th className="text-right p-2.5">Best</th>
                      <th className="text-right p-2.5">Avg</th>
                      <th className="text-right p-2.5 pr-4">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.filter(p => p.bowlingInnings > 0).map((p, i) => (
                      <tr key={p.name} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 pl-4 text-muted-foreground text-xs font-mono">{i + 1}</td>
                        <td className="p-2.5 text-foreground font-semibold">{p.name}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.matches}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.bowlingInnings}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{p.oversBowled}</td>
                        <td className="text-right p-2.5 font-mono text-foreground">{p.runsConceded}</td>
                        <td className="text-right p-2.5 font-mono font-bold text-primary">{p.wickets}</td>
                        <td className="text-right p-2.5 font-mono text-foreground">{getBestBowling(p)}</td>
                        <td className="text-right p-2.5 font-mono text-muted-foreground">{getBowlingAverage(p)}</td>
                        <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getBowlingEconomy(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Top performers */}
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const topRunScorer = [...players].sort((a, b) => b.totalRuns - a.totalRuns)[0];
              const topWicketTaker = [...players].sort((a, b) => b.wickets - a.wickets)[0];
              return (
                <>
                  {topRunScorer && topRunScorer.totalRuns > 0 && (
                    <div className="glass-card rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">🏏 Top Run Scorer</p>
                      <p className="text-lg font-display text-foreground">{topRunScorer.name}</p>
                      <p className="text-2xl font-mono font-extrabold text-primary">{topRunScorer.totalRuns}</p>
                      <p className="text-xs text-muted-foreground">runs in {topRunScorer.matches} matches</p>
                    </div>
                  )}
                  {topWicketTaker && topWicketTaker.wickets > 0 && (
                    <div className="glass-card rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">🎯 Top Wicket Taker</p>
                      <p className="text-lg font-display text-foreground">{topWicketTaker.name}</p>
                      <p className="text-2xl font-mono font-extrabold text-primary">{topWicketTaker.wickets}</p>
                      <p className="text-xs text-muted-foreground">wickets in {topWicketTaker.matches} matches</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
