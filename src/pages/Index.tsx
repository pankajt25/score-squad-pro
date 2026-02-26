import { useState, useEffect } from "react";
import MatchSetup from "@/components/cricket/MatchSetup";
import PlayerEntry from "@/components/cricket/PlayerEntry";
import Toss from "@/components/cricket/Toss";
import LiveScorecard from "@/components/cricket/LiveScorecard";
import TopBar from "@/components/cricket/TopBar";
import MatchHistoryView from "@/components/cricket/MatchHistoryView";
import { useCricketMatch } from "@/hooks/useCricketMatch";
import { getMatchHistory, saveToHistory, clearHistory } from "@/lib/matchHistory";
import { exportScorecardPDF } from "@/lib/exportPdf";
import { MatchData } from "@/types/cricket";

const Index = () => {
  const {
    match, currentInnings, lastEvent, animationType,
    createMatch, setPlayers, setToss, recordBall,
    startSecondInnings, selectBowler, swapStrike, changeBatsman, resetMatch,
    startSuperOver, startSuperOverSecondInnings, recordSuperOverBall,
    undoLastBall,
  } = useCricketMatch();

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MatchData[]>([]);

  // Load history
  useEffect(() => {
    setHistory(getMatchHistory());
  }, [showHistory]);

  // Save completed match to history
  useEffect(() => {
    if (match?.matchStatus === "completed") {
      saveToHistory(match);
    }
  }, [match?.matchStatus]);

  const handleExportPDF = () => {
    const teamNames = match ? `${match.teamA}_vs_${match.teamB}` : "scorecard";
    exportScorecardPDF("scorecard-export", teamNames.replace(/\s+/g, "_"));
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  // Dark mode is handled by the TopBar's useDarkMode hook — 
  // we still need to init it, so TopBar is always rendered
  const showExport = !!(match && (match.matchStatus === "live" || match.matchStatus === "innings_break" || match.matchStatus === "completed" || match.matchStatus === "super_over_break" || match.matchStatus === "super_over"));

  if (showHistory) {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(false)} showExport={false} />
        <MatchHistoryView history={history} onBack={() => setShowHistory(false)} onClearHistory={handleClearHistory} />
      </>
    );
  }

  // No match yet
  if (!match || match.matchStatus === "setup") {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} />
        <MatchSetup onSubmit={createMatch} />
      </>
    );
  }

  if (match.matchStatus === "players") {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} />
        <PlayerEntry teamA={match.teamA} teamB={match.teamB} onSubmit={setPlayers} />
      </>
    );
  }

  if (match.matchStatus === "toss") {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} />
        <Toss teamA={match.teamA} teamB={match.teamB} onSubmit={setToss} />
      </>
    );
  }

  if (currentInnings) {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(true)} onExportPDF={handleExportPDF} showExport={showExport} />
        <LiveScorecard
          match={match}
          innings={currentInnings}
          onRecordBall={recordBall}
          onSelectBowler={selectBowler}
          onSwapStrike={swapStrike}
          onChangeBatsman={changeBatsman}
          onStartSecondInnings={startSecondInnings}
          onResetMatch={resetMatch}
          onStartSuperOver={startSuperOver}
          onStartSuperOverSecondInnings={startSuperOverSecondInnings}
          onRecordSuperOverBall={recordSuperOverBall}
          onUndoLastBall={undoLastBall}
          lastEvent={lastEvent}
          animationType={animationType}
        />
      </>
    );
  }

  return (
    <>
      <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} />
      <MatchSetup onSubmit={createMatch} />
    </>
  );
};

export default Index;
