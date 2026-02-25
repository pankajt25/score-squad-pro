import { InningsData, getOversString, getRunRate, getStrikeRate, getEconomy, getBowlerOversString, MatchData, ScoreInput } from "@/types/cricket";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface LiveScorecardProps {
  match: MatchData;
  innings: InningsData;
  onRecordBall: (input: ScoreInput) => void;
  onSelectBowler: (index: number) => void;
  onSwapStrike: () => void;
  onChangeBatsman: (position: "striker" | "nonStriker", newBatsmanIndex: number) => void;
  onStartSecondInnings?: () => void;
  onResetMatch: () => void;
  lastEvent: string;
  animationType: "score" | "wicket" | null;
}

export default function LiveScorecard({
  match, innings, onRecordBall, onSelectBowler, onSwapStrike, onChangeBatsman, onStartSecondInnings, onResetMatch, lastEvent, animationType,
}: LiveScorecardProps) {
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showBatsmanSelect, setShowBatsmanSelect] = useState<"striker" | "nonStriker" | null>(null);
  const [ballAnimKey, setBallAnimKey] = useState(0);
  const [lastBallType, setLastBallType] = useState<string>("");

  // Trigger ball animation on new ball
  useEffect(() => {
    if (innings.ballLog.length > 0) {
      const last = innings.ballLog[innings.ballLog.length - 1];
      setBallAnimKey(prev => prev + 1);
      if (last.isWicket) setLastBallType("wicket");
      else if (last.runs === 6) setLastBallType("six");
      else if (last.runs === 4) setLastBallType("four");
      else setLastBallType("normal");
    }
  }, [innings.ballLog.length]);

  const oversStr = getOversString(innings.totalOvers, innings.ballsInCurrentOver);
  const runRate = getRunRate(innings.totalRuns, innings.totalOvers, innings.ballsInCurrentOver);
  const target = match.currentInnings === 1 && match.innings[0] ? match.innings[0].totalRuns + 1 : null;
  const remaining = target ? target - innings.totalRuns : null;

  const striker = innings.batsmen[innings.currentBatsmanIndex];
  const nonStriker = innings.batsmen[innings.nonStrikerIndex];
  const bowler = innings.bowlers[innings.currentBowlerIndex];

  const isInningsBreak = match.matchStatus === "innings_break";
  const isCompleted = match.matchStatus === "completed";

  const handleRuns = (runs: number) => onRecordBall({ type: "runs", runs });
  const handleWide = () => onRecordBall({ type: "wide", runs: 0 });
  const handleNoBall = () => onRecordBall({ type: "noBall", runs: 0 });
  const handleWicket = (type: string) => onRecordBall({ type: "wicket", wicketType: type });

  return (
    <div id="scorecard-export" className="min-h-screen p-3 md:p-6 max-w-4xl mx-auto space-y-4 pt-4">
      {/* Ball Animation Overlay */}
      {lastBallType && animationType && (
        <div key={ballAnimKey} className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className={`text-6xl md:text-8xl bounce-in ${
            lastBallType === "wicket" ? "text-destructive" :
            lastBallType === "six" ? "" :
            lastBallType === "four" ? "" : ""
          }`}>
            {lastBallType === "wicket" ? "🔴" :
             lastBallType === "six" ? "💥" :
             lastBallType === "four" ? "🔵" : ""}
          </div>
        </div>
      )}

      {/* Header Score */}
      <div className={`bg-card rounded-lg border border-border p-4 glow-green transition-all ${
        lastBallType === "six" && animationType ? "six-flash" :
        lastBallType === "four" && animationType ? "four-flash" : ""
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">{innings.battingTeam}</h2>
            <p className="text-xs text-muted-foreground">vs {innings.bowlingTeam} · {match.venue}</p>
          </div>
          <div className="text-xs px-2 py-1 rounded bg-primary/20 text-primary font-medium">
            {match.currentInnings === 0 ? "1st Innings" : "2nd Innings"}
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className={`text-4xl font-bold font-mono text-foreground ${animationType === "score" ? "score-pulse" : ""}`}>
            {innings.totalRuns}/{innings.totalWickets}
          </span>
          <span className="text-lg text-muted-foreground font-mono">({oversStr} ov)</span>
        </div>

        <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
          <span>CRR: <span className="text-foreground font-mono">{runRate}</span></span>
          {target && <span>Target: <span className="text-accent font-mono">{target}</span></span>}
          {remaining && remaining > 0 && (
            <span>Need: <span className="text-accent font-mono">{remaining}</span> from <span className="font-mono">{(match.oversLimit * 6 - innings.totalOvers * 6 - innings.ballsInCurrentOver)}</span> balls</span>
          )}
        </div>

        {lastEvent && (
          <div className={`mt-2 text-sm font-medium px-3 py-1 rounded inline-block ${
            animationType === "wicket" ? "bg-destructive/20 text-destructive wicket-flash" : "bg-primary/10 text-primary"
          }`}>
            {lastEvent}
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Batting</span>
          {!isInningsBreak && !isCompleted && (
            <div className="flex gap-2">
              <button onClick={onSwapStrike} className="text-xs text-primary hover:underline">Swap Strike</button>
              <button onClick={() => setShowBatsmanSelect(showBatsmanSelect ? null : "striker")} className="text-xs text-primary hover:underline">Change</button>
            </div>
          )}
        </div>
        {showBatsmanSelect && (
          <div className="p-3 border-b border-border bg-muted/30 space-y-2">
            <div className="flex gap-2 mb-1">
              <Button size="sm" variant={showBatsmanSelect === "striker" ? "default" : "outline"} onClick={() => setShowBatsmanSelect("striker")} className="text-xs">Striker</Button>
              <Button size="sm" variant={showBatsmanSelect === "nonStriker" ? "default" : "outline"} onClick={() => setShowBatsmanSelect("nonStriker")} className="text-xs">Non-Striker</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {innings.batsmen.map((b, i) => {
                const isCurrent = i === innings.currentBatsmanIndex || i === innings.nonStrikerIndex;
                if (b.isOut || isCurrent) return null;
                return (
                  <Button key={i} size="sm" variant="outline" onClick={() => { onChangeBatsman(showBatsmanSelect, i); setShowBatsmanSelect(null); }} className="text-xs">
                    {b.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left p-2 pl-4">Batter</th>
              <th className="text-right p-2">R</th>
              <th className="text-right p-2">B</th>
              <th className="text-right p-2">4s</th>
              <th className="text-right p-2">6s</th>
              <th className="text-right p-2 pr-4">SR</th>
            </tr>
          </thead>
          <tbody>
            {striker && striker.isAtCrease && (
              <tr className="border-b border-border/50">
                <td className="p-2 pl-4 text-foreground font-medium">{striker.name} <span className="text-primary">*</span></td>
                <td className="text-right p-2 font-mono font-bold text-foreground">{striker.runs}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{striker.balls}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{striker.fours}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{striker.sixes}</td>
                <td className="text-right p-2 pr-4 font-mono text-muted-foreground">{getStrikeRate(striker.runs, striker.balls)}</td>
              </tr>
            )}
            {nonStriker && nonStriker.isAtCrease && (
              <tr>
                <td className="p-2 pl-4 text-foreground">{nonStriker.name}</td>
                <td className="text-right p-2 font-mono font-bold text-foreground">{nonStriker.runs}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{nonStriker.balls}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{nonStriker.fours}</td>
                <td className="text-right p-2 font-mono text-muted-foreground">{nonStriker.sixes}</td>
                <td className="text-right p-2 pr-4 font-mono text-muted-foreground">{getStrikeRate(nonStriker.runs, nonStriker.balls)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bowler */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bowling</span>
          <button onClick={() => setShowBowlerSelect(!showBowlerSelect)} className="text-xs text-primary hover:underline">Change</button>
        </div>
        {showBowlerSelect && (
          <div className="p-3 border-b border-border bg-muted/30 flex flex-wrap gap-2">
            {innings.bowlers.map((b, i) => (
              <Button key={i} size="sm" variant={i === innings.currentBowlerIndex ? "default" : "outline"} onClick={() => { onSelectBowler(i); setShowBowlerSelect(false); }} className="text-xs">
                {b.name}
              </Button>
            ))}
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left p-2 pl-4">Bowler</th>
              <th className="text-right p-2">O</th>
              <th className="text-right p-2">R</th>
              <th className="text-right p-2">W</th>
              <th className="text-right p-2 pr-4">Econ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 pl-4 text-foreground font-medium">{bowler.name}</td>
              <td className="text-right p-2 font-mono text-muted-foreground">{getBowlerOversString(bowler.overs, bowler.ballsInCurrentOver)}</td>
              <td className="text-right p-2 font-mono text-foreground">{bowler.runsConceded}</td>
              <td className="text-right p-2 font-mono font-bold text-primary">{bowler.wickets}</td>
              <td className="text-right p-2 pr-4 font-mono text-muted-foreground">{getEconomy(bowler.runsConceded, bowler.overs, bowler.ballsInCurrentOver)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scoring Controls */}
      {!isInningsBreak && !isCompleted && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(r => (
              <Button key={r} variant="outline" onClick={() => handleRuns(r)}
                className={`font-mono font-bold text-lg h-12 transition-transform active:scale-90 ${
                  r === 4 ? "border-cricket-blue text-cricket-blue hover:bg-cricket-blue/10" :
                  r === 6 ? "border-cricket-purple text-cricket-purple hover:bg-cricket-purple/10" : ""
                }`}>
                {r}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={handleWide} className="text-sm border-accent text-accent active:scale-95 transition-transform">Wide</Button>
            <Button variant="outline" onClick={handleNoBall} className="text-sm border-accent text-accent active:scale-95 transition-transform">No Ball</Button>
            <Button variant="outline" onClick={() => handleWicket("bowled")} className="text-sm border-destructive text-destructive font-bold active:scale-95 transition-transform">Wicket</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Caught", "LBW", "Run Out", "Stumped", "Hit Wicket"].map(w => (
              <Button key={w} size="sm" variant="ghost" onClick={() => handleWicket(w.toLowerCase())}
                className="text-xs text-muted-foreground hover:text-destructive">
                {w}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Innings Break */}
      {isInningsBreak && (
        <div className="bg-card rounded-lg border border-border p-6 text-center space-y-4 bounce-in">
          <h3 className="text-xl font-bold text-foreground">Innings Break</h3>
          <p className="text-muted-foreground">
            {match.innings[0]?.battingTeam} scored <span className="text-primary font-mono font-bold">{match.innings[0]?.totalRuns}/{match.innings[0]?.totalWickets}</span>
          </p>
          <p className="text-accent font-semibold">Target: {(match.innings[0]?.totalRuns ?? 0) + 1}</p>
          <Button onClick={onStartSecondInnings} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            Start 2nd Innings →
          </Button>
        </div>
      )}

      {/* Match Completed */}
      {isCompleted && (
        <div className="bg-card rounded-lg border border-primary/50 p-6 text-center space-y-3 glow-green bounce-in">
          <div className="text-4xl">🏆</div>
          <h3 className="text-xl font-bold text-foreground">
            {match.winner === "Tie" ? "Match Tied!" : `${match.winner} Won!`}
          </h3>
          {match.winMargin && <p className="text-primary font-medium">by {match.winMargin}</p>}
          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={onResetMatch} variant="outline">New Match</Button>
          </div>
        </div>
      )}

      {/* This Over with ball-by-ball animations */}
      {innings.ballLog.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Over</p>
          <div className="flex flex-wrap gap-1.5">
            {innings.ballLog
              .filter(b => b.over === innings.totalOvers || (innings.ballsInCurrentOver === 0 && b.over === innings.totalOvers - 1))
              .slice(-8)
              .map((b, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <span key={`${ballAnimKey}-${i}`} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono font-bold border transition-all
                    ${isLast ? "ball-pop" : ""}
                    ${b.isWicket ? "bg-destructive/20 border-destructive text-destructive" :
                      b.isWide || b.isNoBall ? "bg-accent/20 border-accent text-accent" :
                      b.runs === 4 ? "bg-cricket-blue/20 border-cricket-blue text-cricket-blue" :
                      b.runs === 6 ? "bg-cricket-purple/20 border-cricket-purple text-cricket-purple" :
                      b.runs === 0 ? "bg-muted border-border text-muted-foreground" :
                      "bg-primary/10 border-primary/30 text-primary"
                    }`}>
                    {b.isWicket ? "W" : b.isWide ? "Wd" : b.isNoBall ? "NB" : b.runs}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Fall of Wickets */}
      {innings.fallOfWickets.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fall of Wickets</p>
          <div className="flex flex-wrap gap-2">
            {innings.fallOfWickets.map((fow, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                {fow.score}/{fow.wicketNumber} ({fow.overs} ov) — {fow.batsmanName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full Batting Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Batting Card</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left p-2 pl-4">Batter</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">R</th>
                <th className="text-right p-2">B</th>
                <th className="text-right p-2">4s</th>
                <th className="text-right p-2">6s</th>
                <th className="text-right p-2 pr-4">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batsmen.filter(b => b.balls > 0 || b.isAtCrease).map((b, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="p-2 pl-4 text-foreground">{b.name} {b.isOnStrike && <span className="text-primary">*</span>}</td>
                  <td className="p-2 text-xs text-muted-foreground">{b.isOut ? b.dismissal : b.isAtCrease ? "batting" : "not out"}</td>
                  <td className="text-right p-2 font-mono font-bold text-foreground">{b.runs}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{b.balls}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{b.fours}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{b.sixes}</td>
                  <td className="text-right p-2 pr-4 font-mono text-muted-foreground">{getStrikeRate(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          Extras: {innings.extras.total} (wd {innings.extras.wides}, nb {innings.extras.noBalls})
        </div>
      </div>

      {/* Full Bowling Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bowling</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left p-2 pl-4">Bowler</th>
                <th className="text-right p-2">O</th>
                <th className="text-right p-2">R</th>
                <th className="text-right p-2">W</th>
                <th className="text-right p-2">Wd</th>
                <th className="text-right p-2">NB</th>
                <th className="text-right p-2 pr-4">Econ</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.filter(b => b.overs > 0 || b.ballsInCurrentOver > 0).map((b, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="p-2 pl-4 text-foreground">{b.name} {b.isBowling && <span className="text-primary">•</span>}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{getBowlerOversString(b.overs, b.ballsInCurrentOver)}</td>
                  <td className="text-right p-2 font-mono text-foreground">{b.runsConceded}</td>
                  <td className="text-right p-2 font-mono font-bold text-primary">{b.wickets}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{b.wides}</td>
                  <td className="text-right p-2 font-mono text-muted-foreground">{b.noBalls}</td>
                  <td className="text-right p-2 pr-4 font-mono text-muted-foreground">{getEconomy(b.runsConceded, b.overs, b.ballsInCurrentOver)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset */}
      <div className="text-center pt-2 pb-8">
        <button onClick={onResetMatch} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
          Reset Match
        </button>
      </div>
    </div>
  );
}
