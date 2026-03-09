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
    startSecondInnings, selectBowler, swapStrike, changeBatsman,
    retireBatsman, unretireBatsman, resetMatch,
    startSuperOver, startSuperOverSecondInnings, recordSuperOverBall,
    undoLastBall, goBack,
    declareInnings, enforceFollowOn, startNextTestInnings,
  } = useCricketMatch();

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MatchData[]>([]);

  useEffect(() => {
    setHistory(getMatchHistory());
  }, [showHistory]);

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

  const showExport = !!(match && (match.matchStatus === "live" || match.matchStatus === "innings_break" || match.matchStatus === "completed" || match.matchStatus === "super_over_break" || match.matchStatus === "super_over" || match.matchStatus === "follow_on_decision"));

  if (showHistory) {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(false)} showExport={false} />
        <MatchHistoryView history={history} onBack={() => setShowHistory(false)} onClearHistory={handleClearHistory} />
      </>
    );
  }

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
        <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} onBack={goBack} />
        <PlayerEntry teamA={match.teamA} teamB={match.teamB} matchMode={match.matchMode} onSubmit={setPlayers} />
      </>
    );
  }

  if (match.matchStatus === "toss") {
    return (
      <>
        <TopBar onShowHistory={() => setShowHistory(true)} showExport={false} onBack={goBack} />
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
          onRetireBatsman={retireBatsman}
          onUnretireBatsman={unretireBatsman}
          onStartSecondInnings={startSecondInnings}
          onResetMatch={resetMatch}
          onStartSuperOver={startSuperOver}
          onStartSuperOverSecondInnings={startSuperOverSecondInnings}
          onRecordSuperOverBall={recordSuperOverBall}
          onUndoLastBall={undoLastBall}
          onDeclareInnings={declareInnings}
          onEnforceFollowOn={enforceFollowOn}
          onStartNextTestInnings={startNextTestInnings}
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
