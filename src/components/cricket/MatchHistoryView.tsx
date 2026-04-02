import { MatchData, getOversString } from "@/types/cricket";
import { Button } from "@/components/ui/button";

interface MatchHistoryProps {
  history: MatchData[];
  onBack: () => void;
  onClearHistory: () => void;
}

export default function MatchHistory({ history, onBack, onClearHistory }: MatchHistoryProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto bg-field">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display text-foreground tracking-tight">Match History</h2>
          <p className="text-sm text-muted-foreground mt-1">{history.length} match{history.length !== 1 ? "es" : ""} recorded</p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearHistory} className="text-xs text-muted-foreground hover:text-destructive">
              Clear All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs rounded-lg">← Back</Button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted-foreground text-lg">No matches recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((m) => {
            const first = m.innings[0];
            const second = m.innings[1];
            return (
              <div key={m.id} className="glass-card rounded-xl p-4 slide-up hover:border-primary/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()} · {m.venue}</span>
                  <span className="text-xs text-muted-foreground font-mono">{m.oversLimit} ov</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-foreground ${m.winner === first?.battingTeam ? "text-primary" : ""}`}>
                      {first?.battingTeam || m.teamA}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {first ? `${first.totalRuns}/${first.totalWickets}` : "-"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({first ? getOversString(first.totalOvers, first.ballsInCurrentOver) : "-"} ov)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-foreground ${m.winner === second?.battingTeam ? "text-primary" : ""}`}>
                      {second?.battingTeam || m.teamB}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {second ? `${second.totalRuns}/${second.totalWickets}` : "-"}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({second ? getOversString(second.totalOvers, second.ballsInCurrentOver) : "-"} ov)
                      </span>
                    </span>
                  </div>
                </div>

                {m.winner && (
                  <div className="mt-2 text-xs font-medium text-primary">
                    🏆 {m.winner === "Tie" ? "Match Tied" : `${m.winner} won by ${m.winMargin}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
