import MatchSetup from "@/components/cricket/MatchSetup";
import PlayerEntry from "@/components/cricket/PlayerEntry";
import Toss from "@/components/cricket/Toss";
import LiveScorecard from "@/components/cricket/LiveScorecard";
import { useCricketMatch } from "@/hooks/useCricketMatch";

const Index = () => {
  const {
    match, currentInnings, lastEvent, animationType,
    createMatch, setPlayers, setToss, recordBall,
    startSecondInnings, selectBowler, resetMatch,
  } = useCricketMatch();

  // No match yet
  if (!match || match.matchStatus === "setup") {
    return <MatchSetup onSubmit={createMatch} />;
  }

  // Player entry
  if (match.matchStatus === "players") {
    return <PlayerEntry teamA={match.teamA} teamB={match.teamB} onSubmit={setPlayers} />;
  }

  // Toss
  if (match.matchStatus === "toss") {
    return <Toss teamA={match.teamA} teamB={match.teamB} onSubmit={setToss} />;
  }

  // Live / innings break / completed
  if (currentInnings) {
    return (
      <LiveScorecard
        match={match}
        innings={currentInnings}
        onRecordBall={recordBall}
        onSelectBowler={selectBowler}
        onStartSecondInnings={startSecondInnings}
        onResetMatch={resetMatch}
        lastEvent={lastEvent}
        animationType={animationType}
      />
    );
  }

  return <MatchSetup onSubmit={createMatch} />;
};

export default Index;
