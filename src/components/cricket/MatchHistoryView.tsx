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
          <h2 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">Match History</h2>
          <div className="ornate-divider w-24 mt-1" />
          <p className="text-sm text-muted-foreground italic mt-1">{history.length} match{history.length !== 1 ? "es" : ""} recorded</p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearHistory} className="text-xs text-muted-foreground hover:text-destructive font-heading tracking-wider uppercase">
              Erase All
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onBack} className="font-heading tracking-wider uppercase text-xs rounded-sm">← Back</Button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="parchment-card rounded-lg p-10 text-center">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-muted-foreground italic font-medieval text-lg">No tales have been written yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((m) => {
            const first = m.innings[0];
            const second = m.innings[1];
            return (
              <div key={m.id} className="parchment-card rounded-lg p-4 slide-up hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground italic">{new Date(m.createdAt).toLocaleDateString()} · {m.venue}</span>
                  <span className="text-xs text-muted-foreground font-mono">{m.oversLimit} overs</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-heading font-medium text-foreground tracking-wider ${m.winner === first?.battingTeam ? "text-primary" : ""}`}>
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
                    <span className={`font-heading font-medium text-foreground tracking-wider ${m.winner === second?.battingTeam ? "text-primary" : ""}`}>
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
                  <div className="mt-2 text-xs font-heading font-medium text-primary tracking-wider">
                    🏆 {m.winner === "Tie" ? "A Drawn Battle" : `${m.winner} triumphed by ${m.winMargin}`}
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
