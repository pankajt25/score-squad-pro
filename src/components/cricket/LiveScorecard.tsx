import { InningsData, getOversString, getRunRate, getStrikeRate, getEconomy, getBowlerOversString, MatchData, ScoreInput } from "@/types/cricket";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { playBoundaryFourSound, playSixSound, playWicketSound } from "@/lib/soundEffects";
import { getMaxOversPerBowler, isPowerplayOver, getFormatRules } from "@/lib/cricketRules";
import { calculateReducedOversTarget, DLSResult } from "@/lib/dlsMethod";

interface LiveScorecardProps {
  match: MatchData;
  innings: InningsData;
  onRecordBall: (input: ScoreInput) => void;
  onSelectBowler: (index: number) => void;
  onSwapStrike: () => void;
  onChangeBatsman: (position: "striker" | "nonStriker", newBatsmanIndex: number) => void;
  onRetireBatsman: (position: "striker" | "nonStriker") => void;
  onUnretireBatsman: (batsmanIndex: number, position: "striker" | "nonStriker") => void;
  onStartSecondInnings?: () => void;
  onResetMatch: () => void;
  onStartSuperOver?: () => void;
  onStartSuperOverSecondInnings?: () => void;
  onRecordSuperOverBall?: (input: ScoreInput) => void;
  onUndoLastBall?: () => void;
  onDeclareInnings?: () => void;
  onEnforceFollowOn?: (enforce: boolean) => void;
  onStartNextTestInnings?: () => void;
  lastEvent: string;
  animationType: "score" | "wicket" | null;
}

export default function LiveScorecard({
  match, innings, onRecordBall, onSelectBowler, onSwapStrike, onChangeBatsman, onRetireBatsman, onUnretireBatsman, onStartSecondInnings, onResetMatch, onStartSuperOver, onStartSuperOverSecondInnings, onRecordSuperOverBall, onUndoLastBall, onDeclareInnings, onEnforceFollowOn, onStartNextTestInnings, lastEvent, animationType,
}: LiveScorecardProps) {
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showBatsmanSelect, setShowBatsmanSelect] = useState<"striker" | "nonStriker" | null>(null);
  const [ballAnimKey, setBallAnimKey] = useState(0);
  const [lastBallType, setLastBallType] = useState<string>("");
  const [showViz, setShowViz] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);
  const [showRetiredHurt, setShowRetiredHurt] = useState<"striker" | "nonStriker" | null>(null);
  const [showWideExtras, setShowWideExtras] = useState(false);
  const [showNoBallExtras, setShowNoBallExtras] = useState(false);
  const [showByeExtras, setShowByeExtras] = useState(false);
  const [showLegByeExtras, setShowLegByeExtras] = useState(false);
  const [showDLS, setShowDLS] = useState(false);
  const [dlsOvers, setDlsOvers] = useState("");
  const [dlsResult, setDlsResult] = useState<DLSResult | null>(null);

  const rules = getFormatRules(match.matchMode);
  const isTest = match.matchMode === "test";
  const maxBowlerOvers = getMaxOversPerBowler(match.matchMode, match.oversLimit);

  useEffect(() => {
    if (innings.ballLog.length > 0) {
      const last = innings.ballLog[innings.ballLog.length - 1];
      setBallAnimKey(prev => prev + 1);
      if (last.isWicket) {
        setLastBallType("wicket");
        playWicketSound();
      } else if (last.runs === 6) {
        setLastBallType("six");
        playSixSound();
      } else if (last.runs === 4) {
        setLastBallType("four");
        playBoundaryFourSound();
      } else {
        setLastBallType("normal");
      }
    }
  }, [innings.ballLog.length]);

  const overData = useMemo(() => {
    const map: Record<number, { runs: number; wickets: number }> = {};
    innings.ballLog.forEach(b => {
      const overNum = b.ball === 0 && !b.isWide && !b.isNoBall ? b.over - 1 : b.over;
      const key = overNum < 0 ? 0 : overNum;
      if (!map[key]) map[key] = { runs: 0, wickets: 0 };
      map[key].runs += b.runs + (b.isWide ? 1 : 0) + (b.isNoBall ? 1 : 0);
      if (b.isWicket) map[key].wickets += 1;
    });
    if (innings.ballsInCurrentOver > 0 && !map[innings.totalOvers]) {
      map[innings.totalOvers] = { runs: 0, wickets: 0 };
    }
    return Object.entries(map)
      .map(([ov, d]) => ({ over: `${Number(ov) + 1}`, runs: d.runs, wickets: d.wickets }))
      .sort((a, b) => Number(a.over) - Number(b.over));
  }, [innings.ballLog, innings.totalOvers, innings.ballsInCurrentOver]);

  const oversStr = getOversString(innings.totalOvers, innings.ballsInCurrentOver);
  const runRate = getRunRate(innings.totalRuns, innings.totalOvers, innings.ballsInCurrentOver);
  
  let target: number | null = null;
  let remaining: number | null = null;
  
  if (isTest) {
    if (match.currentInnings === 3) {
      let battingTeamPrev = 0;
      let bowlingTeamPrev = 0;
      match.innings.forEach((inn, idx) => {
        if (!inn || idx === match.currentInnings) return;
        if (inn.battingTeam === innings.battingTeam) battingTeamPrev += inn.totalRuns;
        else bowlingTeamPrev += inn.totalRuns;
      });
      target = bowlingTeamPrev - battingTeamPrev + 1;
      remaining = target - innings.totalRuns;
    }
  } else {
    if (match.currentInnings === 1 && match.innings[0]) {
      target = match.innings[0].totalRuns + 1;
      remaining = target - innings.totalRuns;
    }
  }

  const striker = innings.batsmen[innings.currentBatsmanIndex];
  const nonStriker = innings.batsmen[innings.nonStrikerIndex];
  const bowler = innings.bowlers[innings.currentBowlerIndex];

  const isInningsBreak = match.matchStatus === "innings_break" && !match.superOver;
  const isSuperOverBreak = match.matchStatus === "super_over_break";
  const isSuperOver = match.matchStatus === "super_over";
  const isSuperOverInningsBreak = match.matchStatus === "innings_break" && !!match.superOver;
  const isCompleted = match.matchStatus === "completed";
  const isFollowOnDecision = match.matchStatus === "follow_on_decision";
  const superOverRound = match.superOver?.round ?? 0;

  const currentOverNumber = innings.totalOvers + (innings.ballsInCurrentOver > 0 ? 1 : 0);
  const inPowerplay = isPowerplayOver(match.matchMode, innings.totalOvers);

  const getInningsLabel = () => {
    if (isSuperOver) return `⚡ Super Over${superOverRound > 1 ? ` #${superOverRound}` : ""}`;
    if (isTest) {
      const ordinals = ["1st", "2nd", "3rd", "4th"];
      return `${ordinals[match.currentInnings]} Innings`;
    }
    return match.currentInnings === 0 ? "1st Innings" : "2nd Innings";
  };

  const getTestLead = () => {
    if (!isTest) return null;
    let battingTotal = 0;
    let bowlingTotal = 0;
    match.innings.forEach((inn, idx) => {
      if (!inn) return;
      if (idx === match.currentInnings) return;
      if (inn.battingTeam === innings.battingTeam) battingTotal += inn.totalRuns;
      else bowlingTotal += inn.totalRuns;
    });
    battingTotal += innings.totalRuns;
    return battingTotal - bowlingTotal;
  };
  const testLead = getTestLead();

  const handleRuns = (runs: number) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "runs", runs });
    else onRecordBall({ type: "runs", runs });
  };
  const handleWide = (extraRuns: number = 0) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "wide", runs: extraRuns });
    else onRecordBall({ type: "wide", runs: extraRuns });
    setShowWideExtras(false);
  };
  const handleNoBall = (extraRuns: number = 0) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "noBall", runs: extraRuns });
    else onRecordBall({ type: "noBall", runs: extraRuns });
    setShowNoBallExtras(false);
  };
  const handleWicket = (type: string) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "wicket", wicketType: type });
    else onRecordBall({ type: "wicket", wicketType: type });
  };
  const handleBye = (runs: number) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "bye", runs });
    else onRecordBall({ type: "bye", runs });
    setShowByeExtras(false);
  };
  const handleLegBye = (runs: number) => {
    if (isSuperOver && onRecordSuperOverBall) onRecordSuperOverBall({ type: "legBye", runs });
    else onRecordBall({ type: "legBye", runs });
    setShowLegByeExtras(false);
  };

  const isBowlerAtLimit = (bowlerIdx: number) => {
    if (maxBowlerOvers === null) return false;
    const b = innings.bowlers[bowlerIdx];
    return b.overs >= maxBowlerOvers && b.ballsInCurrentOver === 0;
  };

  return (
    <div id="scorecard-export" className="min-h-screen p-3 md:p-6 max-w-4xl mx-auto space-y-4 pt-4 bg-field stagger-in">
      {/* Ball Animation Overlay */}
      {lastBallType && animationType && (
        <div key={ballAnimKey} className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className={`text-7xl md:text-9xl bounce-in ${lastBallType === "wicket" ? "text-destructive" : ""}`}>
            {lastBallType === "wicket" ? "🔴" : lastBallType === "six" ? "💥" : lastBallType === "four" ? "🔵" : ""}
          </div>
        </div>
      )}

      {/* Header Score */}
      <div className={`parchment-card rounded-lg p-5 glow-green transition-all ${
        lastBallType === "six" && animationType ? "six-flash" :
        lastBallType === "four" && animationType ? "four-flash" : ""
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground tracking-widest uppercase">{innings.battingTeam}</h2>
            <p className="text-xs text-muted-foreground italic">vs {innings.bowlingTeam} · {match.venue}</p>
          </div>
          <div className="flex items-center gap-2">
            {inPowerplay && (
              <span className="text-[10px] px-2 py-1 rounded-sm font-heading font-bold uppercase bg-accent/20 text-accent animate-pulse tracking-wider">
                PP
              </span>
            )}
            {match.matchMode && match.matchMode !== "custom" && (
              <span className="text-[10px] px-2 py-1 rounded-sm font-heading font-bold uppercase bg-muted/50 text-muted-foreground tracking-wider">
                {match.matchMode === "t10" ? "T10" : match.matchMode === "t20" ? "T20" : match.matchMode === "odi" ? "ODI" : match.matchMode === "test" ? "TEST" : match.matchMode}
              </span>
            )}
            <div className={`text-xs px-3 py-1.5 rounded-sm font-heading font-bold tracking-wider ${isSuperOver ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
              {getInningsLabel()}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-heading font-bold text-foreground ${animationType === "score" ? "score-pulse" : ""}`}>
            {innings.totalRuns}/{innings.totalWickets}
          </span>
          <span className="text-lg text-muted-foreground font-mono">({oversStr} ov)</span>
          {innings.isDeclared && <span className="text-sm font-heading font-bold text-accent tracking-wider">dec</span>}
        </div>

        <div className="ornate-divider w-full my-2" />

        <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
          <span>CRR: <span className="text-foreground font-mono">{runRate}</span></span>
          {target && target > 0 && <span>Target: <span className="text-accent font-mono">{target}</span></span>}
          {remaining && remaining > 0 && !isTest && (
            <span>Need: <span className="text-accent font-mono">{remaining}</span> from <span className="font-mono">{(match.oversLimit * 6 - innings.totalOvers * 6 - innings.ballsInCurrentOver)}</span> balls</span>
          )}
          {remaining && remaining > 0 && isTest && (
            <span>Need: <span className="text-accent font-mono">{remaining}</span> to conquer</span>
          )}
          {isTest && testLead !== null && (
            <span>{testLead >= 0 ? "Lead" : "Trail"}: <span className="text-foreground font-mono font-bold">{Math.abs(testLead)}</span></span>
          )}
        </div>

        {isTest && match.innings.some((inn, idx) => inn && idx !== match.currentInnings) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {match.innings.map((inn, idx) => {
              if (!inn || idx === match.currentInnings) return null;
              const ordinals = ["1st", "2nd", "3rd", "4th"];
              return (
                <span key={idx} className="text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded-sm font-mono border border-border/50">
                  {inn.battingTeam} {ordinals[idx]}: {inn.totalRuns}/{inn.totalWickets}{inn.isDeclared ? "d" : ""}
                </span>
              );
            })}
          </div>
        )}

        {lastEvent && (
          <div className={`mt-2 text-sm font-medium px-3 py-1 rounded-sm inline-block ${
            animationType === "wicket" ? "bg-destructive/20 text-destructive wicket-flash" : "bg-primary/10 text-primary"
          }`}>
            {lastEvent}
          </div>
        )}
      </div>

      {/* Batting */}
      <div className="parchment-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b-2 border-border/50 bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">⚜ Batting</span>
          {!isInningsBreak && !isCompleted && !isFollowOnDecision && (
            <div className="flex gap-3">
              <button onClick={onSwapStrike} className="text-xs font-heading font-medium text-primary hover:text-primary/80 transition-colors active:scale-95 tracking-wider">⇄ Swap</button>
              <button onClick={() => setShowBatsmanSelect(showBatsmanSelect ? null : "striker")} className="text-xs font-heading font-medium text-primary hover:text-primary/80 transition-colors active:scale-95 tracking-wider">✎ Change</button>
              <button onClick={() => setShowRetiredHurt(showRetiredHurt ? null : "striker")} className="text-xs font-heading font-medium text-accent hover:text-accent/80 transition-colors active:scale-95 tracking-wider">🏥 Retire</button>
            </div>
          )}
        </div>
        {showBatsmanSelect && (
          <div className="p-3 border-b border-border/50 bg-muted/20 space-y-2">
            <div className="flex gap-2 mb-1">
              <Button size="sm" variant={showBatsmanSelect === "striker" ? "default" : "outline"} onClick={() => setShowBatsmanSelect("striker")} className="text-xs rounded-sm font-heading tracking-wider">Striker</Button>
              <Button size="sm" variant={showBatsmanSelect === "nonStriker" ? "default" : "outline"} onClick={() => setShowBatsmanSelect("nonStriker")} className="text-xs rounded-sm font-heading tracking-wider">Non-Striker</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {innings.batsmen.map((b, i) => {
                const isCurrent = i === innings.currentBatsmanIndex || i === innings.nonStrikerIndex;
                if (b.isOut || isCurrent) return null;
                return (
                  <Button key={i} size="sm" variant="outline" onClick={() => { onChangeBatsman(showBatsmanSelect, i); setShowBatsmanSelect(null); }} className="text-xs rounded-sm font-heading tracking-wider">
                    {b.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
        {showRetiredHurt && (
          <div className="p-3 border-b border-border/50 bg-accent/5 space-y-2">
            <p className="text-xs font-heading font-bold text-accent tracking-wider">Retire Hurt — Select position:</p>
            <div className="flex gap-2 mb-1">
              <Button size="sm" variant={showRetiredHurt === "striker" ? "default" : "outline"} onClick={() => setShowRetiredHurt("striker")} className="text-xs rounded-sm font-heading">Striker</Button>
              <Button size="sm" variant={showRetiredHurt === "nonStriker" ? "default" : "outline"} onClick={() => setShowRetiredHurt("nonStriker")} className="text-xs rounded-sm font-heading">Non-Striker</Button>
            </div>
            <Button size="sm" variant="destructive" onClick={() => { onRetireBatsman(showRetiredHurt); setShowRetiredHurt(null); }} className="text-xs rounded-sm font-heading">
              🏥 Retire {showRetiredHurt === "striker" ? striker?.name : nonStriker?.name}
            </Button>
          </div>
        )}
        {innings.batsmen.some(b => b.isRetiredHurt) && !isInningsBreak && !isCompleted && !isFollowOnDecision && (
          <div className="p-3 border-b border-border/50 bg-primary/5 space-y-2">
            <p className="text-xs font-heading font-bold text-primary tracking-wider">🏥 Retired Hurt — Bring back:</p>
            <div className="flex flex-wrap gap-2">
              {innings.batsmen.map((b, i) => {
                if (!b.isRetiredHurt) return null;
                return (
                  <div key={i} className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { onUnretireBatsman(i, "striker"); }} className="text-xs rounded-sm border-primary/30 font-heading">
                      {b.name} ({b.runs}*) → Striker
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { onUnretireBatsman(i, "nonStriker"); }} className="text-xs rounded-sm border-primary/30 font-heading">
                      → Non-Striker
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b-2 border-border/50 font-heading tracking-wider">
              <th className="text-left p-2.5 pl-4">Batter</th>
              <th className="text-right p-2.5">R</th>
              <th className="text-right p-2.5">B</th>
              <th className="text-right p-2.5">4s</th>
              <th className="text-right p-2.5">6s</th>
              <th className="text-right p-2.5 pr-4">SR</th>
            </tr>
          </thead>
          <tbody>
            {striker && striker.isAtCrease && (
              <tr className="border-b border-border/30">
                <td className="p-2.5 pl-4 text-foreground font-heading font-semibold tracking-wider">{striker.name} <span className="text-primary font-bold">*</span></td>
                <td className="text-right p-2.5 font-mono font-bold text-foreground text-base">{striker.runs}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{striker.balls}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{striker.fours}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{striker.sixes}</td>
                <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getStrikeRate(striker.runs, striker.balls)}</td>
              </tr>
            )}
            {nonStriker && nonStriker.isAtCrease && (
              <tr>
                <td className="p-2.5 pl-4 text-foreground font-heading tracking-wider">{nonStriker.name}</td>
                <td className="text-right p-2.5 font-mono font-bold text-foreground text-base">{nonStriker.runs}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{nonStriker.balls}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{nonStriker.fours}</td>
                <td className="text-right p-2.5 font-mono text-muted-foreground">{nonStriker.sixes}</td>
                <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getStrikeRate(nonStriker.runs, nonStriker.balls)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bowler */}
      <div className="parchment-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b-2 border-border/50 bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">
            ⚜ Bowling
            {maxBowlerOvers !== null && (
              <span className="ml-2 text-accent font-mono not-italic">max {maxBowlerOvers} ov/bowler</span>
            )}
          </span>
          <button onClick={() => setShowBowlerSelect(!showBowlerSelect)} className="text-xs font-heading font-medium text-primary hover:text-primary/80 transition-colors active:scale-95 tracking-wider">✎ Change</button>
        </div>
        {showBowlerSelect && (
          <div className="p-3 border-b border-border/50 bg-muted/20 flex flex-wrap gap-2">
            {innings.bowlers.map((b, i) => {
              const atLimit = isBowlerAtLimit(i);
              return (
                <Button key={i} size="sm"
                  variant={i === innings.currentBowlerIndex ? "default" : "outline"}
                  disabled={atLimit}
                  onClick={() => { onSelectBowler(i); setShowBowlerSelect(false); }}
                  className={`text-xs rounded-sm font-heading tracking-wider ${atLimit ? "opacity-50 line-through" : ""}`}
                >
                  {b.name} ({getBowlerOversString(b.overs, b.ballsInCurrentOver)})
                  {atLimit && " ✓"}
                </Button>
              );
            })}
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b-2 border-border/50 font-heading tracking-wider">
              <th className="text-left p-2.5 pl-4">Bowler</th>
              <th className="text-right p-2.5">O</th>
              <th className="text-right p-2.5">R</th>
              <th className="text-right p-2.5">W</th>
              <th className="text-right p-2.5 pr-4">Econ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2.5 pl-4 text-foreground font-heading font-semibold tracking-wider">
                {bowler.name}
                {maxBowlerOvers !== null && (
                  <span className={`ml-1 text-[10px] font-mono ${bowler.overs >= maxBowlerOvers ? "text-destructive" : "text-muted-foreground"}`}>
                    ({bowler.overs}/{maxBowlerOvers})
                  </span>
                )}
              </td>
              <td className="text-right p-2.5 font-mono text-muted-foreground">{getBowlerOversString(bowler.overs, bowler.ballsInCurrentOver)}</td>
              <td className="text-right p-2.5 font-mono text-foreground">{bowler.runsConceded}</td>
              <td className="text-right p-2.5 font-mono font-bold text-primary text-base">{bowler.wickets}</td>
              <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getEconomy(bowler.runsConceded, bowler.overs, bowler.ballsInCurrentOver)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scoring Controls */}
      {!isInningsBreak && !isSuperOverBreak && !isSuperOverInningsBreak && !isCompleted && !isFollowOnDecision && (match.matchStatus === "live" || isSuperOver) && (
        <div className="parchment-card rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">⚜ Score</p>
            <div className="flex gap-3">
              {isTest && onDeclareInnings && match.matchStatus === "live" && (
                <button onClick={onDeclareInnings} className="text-xs font-heading font-medium text-accent hover:text-accent/80 transition-colors active:scale-95 flex items-center gap-1 tracking-wider">
                  📋 Declare
                </button>
              )}
              {onUndoLastBall && innings.ballLog.length > 0 && (
                <button onClick={onUndoLastBall} className="text-xs font-heading font-medium text-accent hover:text-accent/80 transition-colors active:scale-95 flex items-center gap-1 tracking-wider">
                  ↩ Undo
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map(r => (
              <button key={r} onClick={() => handleRuns(r)}
                className={`font-mono font-bold text-lg h-12 rounded-sm border-2 transition-all duration-150 active:scale-90 hover:shadow-md ${
                  r === 4 ? "border-cricket-blue text-cricket-blue hover:bg-cricket-blue/10" :
                  r === 6 ? "border-cricket-purple text-cricket-purple hover:bg-cricket-purple/10" :
                  "border-border text-foreground hover:bg-muted/50"
                }`}>
                {r}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setShowWideExtras(!showWideExtras)} className={`h-10 rounded-sm border-2 text-sm font-heading font-bold active:scale-95 transition-all tracking-wider ${showWideExtras ? "border-accent bg-accent/15 text-accent" : "border-accent/50 text-accent hover:bg-accent/10"}`}>Wide</button>
            <button onClick={() => setShowNoBallExtras(!showNoBallExtras)} className={`h-10 rounded-sm border-2 text-sm font-heading font-bold active:scale-95 transition-all tracking-wider ${showNoBallExtras ? "border-accent bg-accent/15 text-accent" : "border-accent/50 text-accent hover:bg-accent/10"}`}>No Ball</button>
            <button onClick={() => handleWicket("bowled")} className="h-10 rounded-sm border-2 border-destructive/50 text-destructive text-sm font-heading font-bold active:scale-95 transition-all hover:bg-destructive/10 tracking-wider">🔴 Wicket</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowByeExtras(!showByeExtras)} className={`h-10 rounded-sm border-2 text-sm font-heading font-bold active:scale-95 transition-all tracking-wider ${showByeExtras ? "border-primary bg-primary/15 text-primary" : "border-primary/50 text-primary hover:bg-primary/10"}`}>Bye</button>
            <button onClick={() => setShowLegByeExtras(!showLegByeExtras)} className={`h-10 rounded-sm border-2 text-sm font-heading font-bold active:scale-95 transition-all tracking-wider ${showLegByeExtras ? "border-primary bg-primary/15 text-primary" : "border-primary/50 text-primary hover:bg-primary/10"}`}>Leg Bye</button>
          </div>
          {showWideExtras && (
            <div className="flex flex-wrap gap-2 p-3 rounded-sm bg-accent/5 border-2 border-accent/20">
              <span className="text-xs font-heading font-bold text-accent w-full mb-1 tracking-wider">Wide + extra runs:</span>
              {[0, 1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => handleWide(r)}
                  className="font-mono font-bold text-sm h-10 px-4 rounded-sm border-2 border-accent/40 text-accent hover:bg-accent/15 active:scale-90 transition-all">
                  {r === 0 ? "Wd" : `Wd+${r}`}
                </button>
              ))}
            </div>
          )}
          {showNoBallExtras && (
            <div className="flex flex-wrap gap-2 p-3 rounded-sm bg-accent/5 border-2 border-accent/20">
              <span className="text-xs font-heading font-bold text-accent w-full mb-1 tracking-wider">No Ball + extra runs:</span>
              {[0, 1, 2, 3, 4, 5, 6].map(r => (
                <button key={r} onClick={() => handleNoBall(r)}
                  className="font-mono font-bold text-sm h-10 px-4 rounded-sm border-2 border-accent/40 text-accent hover:bg-accent/15 active:scale-90 transition-all">
                  {r === 0 ? "NB" : `NB+${r}`}
                </button>
              ))}
            </div>
          )}
          {showByeExtras && (
            <div className="flex flex-wrap gap-2 p-3 rounded-sm bg-primary/5 border-2 border-primary/20">
              <span className="text-xs font-heading font-bold text-primary w-full mb-1 tracking-wider">Byes:</span>
              {[1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => handleBye(r)}
                  className="font-mono font-bold text-sm h-10 px-4 rounded-sm border-2 border-primary/40 text-primary hover:bg-primary/15 active:scale-90 transition-all">
                  {`B${r}`}
                </button>
              ))}
            </div>
          )}
          {showLegByeExtras && (
            <div className="flex flex-wrap gap-2 p-3 rounded-sm bg-primary/5 border-2 border-primary/20">
              <span className="text-xs font-heading font-bold text-primary w-full mb-1 tracking-wider">Leg Byes:</span>
              {[1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => handleLegBye(r)}
                  className="font-mono font-bold text-sm h-10 px-4 rounded-sm border-2 border-primary/40 text-primary hover:bg-primary/15 active:scale-90 transition-all">
                  {`LB${r}`}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {["Caught", "LBW", "Run Out", "Stumped", "Hit Wicket"].map(w => (
              <button key={w} onClick={() => handleWicket(w.toLowerCase())}
                className="text-xs font-heading font-medium text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-sm hover:bg-destructive/10 transition-all tracking-wider">
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-on Decision */}
      {isFollowOnDecision && onEnforceFollowOn && (
        <div className="parchment-card rounded-lg p-8 text-center space-y-4 bounce-in glow-gold">
          <div className="text-5xl">📜</div>
          <h3 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">Follow-on Decision</h3>
          <div className="ornate-divider w-32 mx-auto" />
          <p className="text-muted-foreground">
            {match.innings[0]?.battingTeam} amassed <span className="text-primary font-mono font-bold">{match.innings[0]?.totalRuns}</span>,
            {" "}{match.innings[1]?.battingTeam} could muster only <span className="text-primary font-mono font-bold">{match.innings[1]?.totalRuns}</span>
          </p>
          <p className="text-sm text-muted-foreground italic">
            Deficit: <span className="text-accent font-bold not-italic">{(match.innings[0]?.totalRuns ?? 0) - (match.innings[1]?.totalRuns ?? 0)} runs</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => onEnforceFollowOn(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-bold h-12 rounded-sm tracking-widest uppercase">
              Enforce Follow-on
            </Button>
            <Button onClick={() => onEnforceFollowOn(false)} variant="outline" className="font-heading font-bold h-12 rounded-sm tracking-widest uppercase">
              Bat Again
            </Button>
          </div>
        </div>
      )}

      {/* Innings Break */}
      {isInningsBreak && (
        <div className="parchment-card aged-paper-edge decorative-border rounded-lg p-8 text-center space-y-4 bounce-in">
          <h3 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">Innings Break</h3>
          <div className="ornate-divider w-32 mx-auto" />
          {isTest ? (
            <>
              <p className="text-muted-foreground">
                {innings.battingTeam} scored <span className="text-primary font-mono font-bold text-lg">{innings.totalRuns}/{innings.totalWickets}</span>
                {innings.isDeclared && <span className="text-accent ml-1 italic">(declared)</span>}
              </p>
              {match.currentInnings < 3 && onStartNextTestInnings && (
                <Button onClick={match.currentInnings === 0 ? onStartSecondInnings : onStartNextTestInnings} className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-bold h-12 rounded-sm shadow-lg tracking-widest uppercase">
                  Begin {['2nd', '3rd', '4th'][match.currentInnings]} Innings →
                </Button>
              )}
              {match.currentInnings === 3 && (
                <p className="text-accent font-heading font-bold tracking-widest">Match Complete</p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                {match.innings[0]?.battingTeam} scored <span className="text-primary font-mono font-bold text-lg">{match.innings[0]?.totalRuns}/{match.innings[0]?.totalWickets}</span>
              </p>
              <p className="text-accent font-heading font-bold text-xl tracking-widest">Target: {(match.innings[0]?.totalRuns ?? 0) + 1}</p>
              <Button onClick={onStartSecondInnings} className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-bold h-12 rounded-sm shadow-lg tracking-widest uppercase">
                Begin 2nd Innings →
              </Button>
            </>
          )}
        </div>
      )}

      {/* Super Over Break */}
      {isSuperOverBreak && (
        <div className="parchment-card aged-paper-edge decorative-border rounded-lg p-8 text-center space-y-4 bounce-in glow-gold">
          <div className="text-5xl">⚡</div>
          <h3 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">
            {superOverRound > 0 ? `Super Over #${superOverRound} Tied!` : "Scores Level!"}
          </h3>
          <div className="ornate-divider w-32 mx-auto" />
          <p className="text-muted-foreground italic">
            {superOverRound > 0
              ? "Another Super Over is required."
              : <>Both teams scored <span className="text-primary font-mono font-bold text-lg">{match.innings[0]?.totalRuns}</span> runs</>
            }
          </p>
          <Button onClick={onStartSuperOver} className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-bold h-12 rounded-sm shadow-lg tracking-widest uppercase">
            Begin Super Over ⚡
          </Button>
        </div>
      )}

      {/* Super Over Innings Break */}
      {isSuperOverInningsBreak && match.superOver?.innings[0] && (
        <div className="parchment-card aged-paper-edge decorative-border rounded-lg p-8 text-center space-y-4 bounce-in glow-gold">
          <div className="text-5xl">⚡</div>
          <h3 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">Super Over — Break</h3>
          <div className="ornate-divider w-32 mx-auto" />
          <p className="text-muted-foreground">
            {match.superOver.innings[0].battingTeam} scored <span className="text-primary font-mono font-bold text-lg">{match.superOver.innings[0].totalRuns}/{match.superOver.innings[0].totalWickets}</span>
          </p>
          <p className="text-accent font-heading font-bold text-xl tracking-widest">Target: {match.superOver.innings[0].totalRuns + 1}</p>
          <Button onClick={onStartSuperOverSecondInnings} className="bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-bold h-12 rounded-sm shadow-lg tracking-widest uppercase">
            Begin 2nd Super Over Innings →
          </Button>
        </div>
      )}

      {/* Match Completed */}
      {isCompleted && (
        <div className="parchment-card aged-paper-edge decorative-border rounded-lg p-8 text-center space-y-4 glow-green bounce-in">
          <div className="text-6xl" style={{ animation: 'float 3s ease-in-out infinite' }}>🏆</div>
          <h3 className="text-2xl font-heading font-bold text-foreground tracking-widest uppercase">
            {match.winner ? `${match.winner} Wins!` : isTest ? 'Match Drawn' : 'Match Tied'}
          </h3>
          <div className="ornate-divider w-48 mx-auto" />
          {match.winMargin && <p className="text-primary font-heading font-bold text-lg tracking-wider italic">{match.winMargin.startsWith('Super Over') ? `via ${match.winMargin} ⚡` : `by ${match.winMargin}`}</p>}
          <div className="flex gap-3 justify-center mt-4">
            <Button onClick={onResetMatch} variant="outline" className="rounded-sm font-heading font-bold h-11 px-6 tracking-widest uppercase">New Match</Button>
          </div>
        </div>
      )}

      {/* This Over */}
      {innings.ballLog.length > 0 && (
        <div className="parchment-card rounded-lg p-4">
          <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">⚜ This Over</p>
          <div className="flex flex-wrap gap-2">
            {innings.ballLog
              .filter(b => b.over === innings.totalOvers || (innings.ballsInCurrentOver === 0 && b.over === innings.totalOvers - 1))
              .slice(-8)
              .map((b, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <span key={`${ballAnimKey}-${i}`} className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-mono font-bold border-2 transition-all
                    ${isLast ? "ball-pop" : ""}
                    ${b.isWicket ? "bg-destructive/20 border-destructive text-destructive" :
                      b.isWide || b.isNoBall ? "bg-accent/20 border-accent text-accent" :
                      b.isBye || b.isLegBye ? "bg-muted border-primary/30 text-primary" :
                      b.runs === 4 ? "bg-cricket-blue/20 border-cricket-blue text-cricket-blue" :
                      b.runs === 6 ? "bg-cricket-purple/20 border-cricket-purple text-cricket-purple" :
                      b.runs === 0 ? "bg-muted border-border text-muted-foreground" :
                      "bg-primary/10 border-primary/30 text-primary"
                    }`}>
                    {b.isWicket ? "W" : b.isWide ? "Wd" : b.isNoBall ? "NB" : b.isBye ? `B${b.runs}` : b.isLegBye ? `LB${b.runs}` : b.runs}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Scoring Visualizations */}
      {innings.ballLog.length > 0 && (
        <div className="parchment-card rounded-lg overflow-hidden">
          <button
            onClick={() => setShowViz(!showViz)}
            className="w-full px-4 py-2.5 border-b-2 border-border/50 bg-muted/30 flex items-center justify-between"
          >
            <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">📊 Scoring Chart</span>
            <span className="text-xs text-muted-foreground">{showViz ? "▲" : "▼"}</span>
          </button>
          {showViz && (
            <div className="p-4 space-y-4 fade-in">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-heading tracking-wider">Runs Per Over</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="over" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                          fontFamily: 'Cinzel, Georgia, serif',
                        }}
                        formatter={(value: number, name: string) => [value, name === 'runs' ? 'Runs' : 'Wickets']}
                        labelFormatter={(label) => `Over ${label}`}
                      />
                      <Bar dataKey="runs" radius={[2, 2, 0, 0]}>
                        {overData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.wickets > 0 ? 'hsl(var(--destructive))' : entry.runs >= 10 ? 'hsl(var(--cricket-purple))' : entry.runs >= 6 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-sm bg-muted/30 border border-border/50">
                  <p className="text-2xl font-mono font-bold text-foreground">{innings.extras.total}</p>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Extras</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30 border border-border/50">
                  <p className="text-2xl font-mono font-bold text-cricket-blue">{innings.batsmen.reduce((a, b) => a + b.fours, 0)}</p>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Fours</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30 border border-border/50">
                  <p className="text-2xl font-mono font-bold text-cricket-purple">{innings.batsmen.reduce((a, b) => a + b.sixes, 0)}</p>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">Sixes</p>
                </div>
                <div className="text-center p-3 rounded-sm bg-muted/30 border border-border/50">
                  <p className="text-2xl font-mono font-bold text-foreground">{runRate}</p>
                  <p className="text-xs text-muted-foreground font-heading tracking-wider">RR</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fall of Wickets */}
      {innings.fallOfWickets.length > 0 && (
        <div className="parchment-card aged-paper-edge decorative-border rounded-lg p-4">
          <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">⚜ Fall of Wickets</p>
          <div className="flex flex-wrap gap-2">
            {innings.fallOfWickets.map((fow, i) => (
              <span key={i} className="text-xs bg-destructive/10 text-destructive/80 px-3 py-1.5 rounded-sm font-mono border border-destructive/20">
                {fow.score}/{fow.wicketNumber} ({fow.overs} ov) — {fow.batsmanName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full Batting Card */}
      <div className="parchment-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b-2 border-border/50 bg-muted/30">
          <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">⚜ Full Batting Scroll</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b-2 border-border/50 font-heading tracking-wider">
                <th className="text-left p-2.5 pl-4">Batter</th>
                <th className="text-left p-2.5">Status</th>
                <th className="text-right p-2.5">R</th>
                <th className="text-right p-2.5">B</th>
                <th className="text-right p-2.5">4s</th>
                <th className="text-right p-2.5">6s</th>
                <th className="text-right p-2.5 pr-4">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batsmen.filter(b => b.balls > 0 || b.isAtCrease).map((b, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="p-2.5 pl-4 text-foreground font-heading font-medium tracking-wider">{b.name} {b.isOnStrike && <span className="text-primary font-bold">*</span>}</td>
                  <td className="p-2.5 text-xs text-muted-foreground">{b.isOut ? <span className="text-destructive/70">{b.dismissal}</span> : b.isRetiredHurt ? <span className="text-accent italic">retired hurt</span> : b.isAtCrease ? <span className="text-primary italic">batting</span> : "not out"}</td>
                  <td className="text-right p-2.5 font-mono font-bold text-foreground">{b.runs}</td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{b.balls}</td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{b.fours}</td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{b.sixes}</td>
                  <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getStrikeRate(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t-2 border-border/50 text-xs text-muted-foreground font-medium">
          Extras: <span className="text-foreground font-mono">{innings.extras.total}</span> (wd {innings.extras.wides}, nb {innings.extras.noBalls}, b {innings.extras.byes}, lb {innings.extras.legByes})
        </div>
      </div>

      {/* Full Bowling Card */}
      <div className="parchment-card rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b-2 border-border/50 bg-muted/30">
          <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">⚜ Bowling Scroll</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b-2 border-border/50 font-heading tracking-wider">
                <th className="text-left p-2.5 pl-4">Bowler</th>
                <th className="text-right p-2.5">O</th>
                <th className="text-right p-2.5">R</th>
                <th className="text-right p-2.5">W</th>
                <th className="text-right p-2.5">Wd</th>
                <th className="text-right p-2.5">NB</th>
                <th className="text-right p-2.5 pr-4">Econ</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.filter(b => b.overs > 0 || b.ballsInCurrentOver > 0).map((b, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="p-2.5 pl-4 text-foreground font-heading font-medium tracking-wider">
                    {b.name} {b.isBowling && <span className="text-primary">●</span>}
                    {maxBowlerOvers !== null && b.overs >= maxBowlerOvers && <span className="text-[10px] text-destructive ml-1">✓</span>}
                  </td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{getBowlerOversString(b.overs, b.ballsInCurrentOver)}</td>
                  <td className="text-right p-2.5 font-mono text-foreground">{b.runsConceded}</td>
                  <td className="text-right p-2.5 font-mono font-bold text-primary">{b.wickets}</td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{b.wides}</td>
                  <td className="text-right p-2.5 font-mono text-muted-foreground">{b.noBalls}</td>
                  <td className="text-right p-2.5 pr-4 font-mono text-muted-foreground">{getEconomy(b.runsConceded, b.overs, b.ballsInCurrentOver)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commentary Log */}
      {innings.ballLog.length > 0 && (
        <div className="parchment-card rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="w-full px-4 py-2.5 border-b-2 border-border/50 bg-muted/30 flex items-center justify-between"
          >
            <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">📝 Ball-by-Ball Commentary</span>
            <span className="text-xs text-muted-foreground">{showCommentary ? "▲" : "▼"}</span>
          </button>
          {showCommentary && (
            <div className="max-h-72 overflow-y-auto divide-y divide-border/20 fade-in">
              {[...innings.ballLog].reverse().map((b, i) => {
                const time = b.timestamp ? new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                return (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-muted/10 transition-colors">
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap mt-0.5">
                      {getOversString(b.over, b.ball)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-heading font-medium tracking-wider">{b.bowlerName}</span> to <span className="font-heading font-medium tracking-wider">{b.batsmanName}</span>,{" "}
                        <span className={`font-bold ${
                          b.isWicket ? "text-destructive" :
                          b.runs === 6 ? "text-cricket-purple" :
                          b.runs === 4 ? "text-cricket-blue" :
                          b.isWide || b.isNoBall ? "text-accent" :
                          b.isBye || b.isLegBye ? "text-primary" :
                          "text-foreground"
                        }`}>
                          {b.description}
                        </span>
                      </p>
                    </div>
                    {time && <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5">{time}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DLS Calculator */}
      {!isTest && match.currentInnings === 1 && match.innings[0] && !isCompleted && (
        <div className="parchment-card rounded-lg overflow-hidden">
          <button
            onClick={() => setShowDLS(!showDLS)}
            className="w-full px-4 py-2.5 border-b-2 border-border/50 bg-muted/30 flex items-center justify-between"
          >
            <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-[0.2em]">🌧️ DLS Calculator</span>
            <span className="text-xs text-muted-foreground">{showDLS ? "▲" : "▼"}</span>
          </button>
          {showDLS && (
            <div className="p-4 space-y-3 fade-in">
              <p className="text-xs text-muted-foreground italic">If rain interrupts play, enter revised overs for the chasing team:</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max={match.oversLimit}
                  value={dlsOvers}
                  onChange={e => setDlsOvers(e.target.value)}
                  placeholder={`Max ${match.oversLimit}`}
                  className="bg-muted/50 border-2 border-border h-10 rounded-sm text-center font-mono text-sm px-3 w-32 text-foreground"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const overs = parseInt(dlsOvers);
                    if (overs > 0 && overs <= match.oversLimit && match.innings[0]) {
                      const result = calculateReducedOversTarget(match.innings[0].totalRuns, match.oversLimit, overs);
                      setDlsResult(result);
                    }
                  }}
                  className="rounded-sm text-xs font-heading font-bold tracking-wider"
                >
                  Calculate
                </Button>
              </div>
              {dlsResult && (
                <div className="bg-accent/10 border-2 border-accent/20 rounded-sm p-3 space-y-1">
                  <p className="text-sm font-heading font-bold text-accent tracking-wider">Revised Target: <span className="text-lg font-mono">{dlsResult.revisedTarget}</span></p>
                  <p className="text-xs text-muted-foreground">Par Score: <span className="font-mono text-foreground">{dlsResult.parScore}</span></p>
                  <p className="text-xs text-muted-foreground italic">{dlsResult.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      <div className="text-center pt-4 pb-10">
        <button onClick={onResetMatch} className="text-xs font-heading font-medium text-muted-foreground hover:text-destructive transition-all duration-200 px-4 py-2 rounded-sm hover:bg-destructive/10 tracking-widest uppercase">
          Reset Match
        </button>
      </div>
    </div>
  );
}
