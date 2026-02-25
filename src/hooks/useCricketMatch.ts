import { useState, useCallback, useEffect } from "react";
import {
  MatchData,
  InningsData,
  ScoreInput,
  createEmptyInnings,
  getOversString,
  BallEvent,
} from "@/types/cricket";

const STORAGE_KEY = "cricket-match-data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useCricketMatch() {
  const [match, setMatch] = useState<MatchData | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [lastEvent, setLastEvent] = useState<string>("");
  const [animationType, setAnimationType] = useState<"score" | "wicket" | null>(null);

  useEffect(() => {
    if (match) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    }
  }, [match]);

  const createMatch = useCallback((teamA: string, teamB: string, venue: string, oversLimit: number) => {
    const newMatch: MatchData = {
      id: generateId(),
      teamA,
      teamB,
      venue,
      oversLimit,
      teamAPlayers: [],
      teamBPlayers: [],
      tossWinner: "",
      tossDecision: "bat",
      innings: [null, null],
      currentInnings: 0,
      matchStatus: "players",
      winner: null,
      winMargin: null,
      createdAt: new Date().toISOString(),
    };
    setMatch(newMatch);
  }, []);

  const setPlayers = useCallback((teamAPlayers: string[], teamBPlayers: string[]) => {
    setMatch(prev => prev ? { ...prev, teamAPlayers, teamBPlayers, matchStatus: "toss" } : null);
  }, []);

  const setToss = useCallback((tossWinner: string, tossDecision: "bat" | "bowl") => {
    setMatch(prev => {
      if (!prev) return null;
      const battingFirst = tossDecision === "bat" ? tossWinner : (tossWinner === prev.teamA ? prev.teamB : prev.teamA);
      const bowlingFirst = battingFirst === prev.teamA ? prev.teamB : prev.teamA;
      const battingPlayers = battingFirst === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = bowlingFirst === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const firstInnings = createEmptyInnings(battingFirst, bowlingFirst, battingPlayers, bowlingPlayers);
      return {
        ...prev,
        tossWinner,
        tossDecision,
        innings: [firstInnings, null],
        currentInnings: 0,
        matchStatus: "live",
      };
    });
  }, []);

  const recordBall = useCallback((input: ScoreInput) => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings || innings.isCompleted) return prev;

      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const striker = newInnings.batsmen[newInnings.currentBatsmanIndex];
      const bowler = newInnings.bowlers[newInnings.currentBowlerIndex];
      const runs = input.runs ?? 0;
      let isLegalBall = true;
      let desc = "";

      if (input.type === "wide") {
        isLegalBall = false;
        newInnings.totalRuns += 1 + runs;
        newInnings.extras.wides += 1 + runs;
        newInnings.extras.total += 1 + runs;
        bowler.runsConceded += 1 + runs;
        bowler.wides += 1;
        desc = runs > 0 ? `Wide + ${runs}` : "Wide";
      } else if (input.type === "noBall") {
        isLegalBall = false;
        newInnings.totalRuns += 1 + runs;
        newInnings.extras.noBalls += 1;
        newInnings.extras.total += 1;
        bowler.runsConceded += 1 + runs;
        bowler.noBalls += 1;
        if (runs > 0) {
          striker.runs += runs;
          striker.balls += 1;
          if (runs === 4) striker.fours += 1;
          if (runs === 6) striker.sixes += 1;
        }
        desc = `No Ball${runs > 0 ? ` + ${runs}` : ""}`;
      } else if (input.type === "wicket") {
        isLegalBall = true;
        striker.isOut = true;
        striker.dismissal = input.wicketType || "out";
        striker.balls += 1;
        striker.isAtCrease = false;
        striker.isOnStrike = false;
        newInnings.totalWickets += 1;
        bowler.wickets += 1;
        newInnings.fallOfWickets.push({
          wicketNumber: newInnings.totalWickets,
          score: newInnings.totalRuns,
          overs: getOversString(newInnings.totalOvers, newInnings.ballsInCurrentOver + 1),
          batsmanName: striker.name,
        });
        // find next batsman
        const nextIdx = newInnings.batsmen.findIndex(b => !b.isOut && !b.isAtCrease);
        if (nextIdx !== -1) {
          newInnings.batsmen[nextIdx].isAtCrease = true;
          newInnings.batsmen[nextIdx].isOnStrike = true;
          newInnings.currentBatsmanIndex = nextIdx;
        }
        desc = `WICKET! ${striker.name} ${input.wicketType || "out"}`;
        setAnimationType("wicket");
        setTimeout(() => setAnimationType(null), 700);
      } else {
        // normal runs
        isLegalBall = true;
        newInnings.totalRuns += runs;
        striker.runs += runs;
        striker.balls += 1;
        bowler.runsConceded += runs;
        if (runs === 4) striker.fours += 1;
        if (runs === 6) striker.sixes += 1;
        desc = runs === 0 ? "Dot ball" : `${runs} run${runs > 1 ? "s" : ""}`;
        if (runs > 0) {
          setAnimationType("score");
          setTimeout(() => setAnimationType(null), 600);
        }
      }

      // rotate strike on odd runs (legal balls only)
      if (isLegalBall && runs % 2 === 1) {
        const temp = newInnings.currentBatsmanIndex;
        newInnings.currentBatsmanIndex = newInnings.nonStrikerIndex;
        newInnings.nonStrikerIndex = temp;
        newInnings.batsmen.forEach((b, i) => {
          b.isOnStrike = i === newInnings.currentBatsmanIndex;
        });
      }

      if (isLegalBall) {
        newInnings.ballsInCurrentOver += 1;
        bowler.ballsInCurrentOver += 1;
        if (newInnings.ballsInCurrentOver === 6) {
          newInnings.totalOvers += 1;
          newInnings.ballsInCurrentOver = 0;
          bowler.overs += 1;
          bowler.ballsInCurrentOver = 0;
          // rotate strike at end of over
          const temp = newInnings.currentBatsmanIndex;
          newInnings.currentBatsmanIndex = newInnings.nonStrikerIndex;
          newInnings.nonStrikerIndex = temp;
          newInnings.batsmen.forEach((b, i) => {
            b.isOnStrike = i === newInnings.currentBatsmanIndex;
          });
        }
      }

      // ball log
      const event: BallEvent = {
        over: newInnings.totalOvers,
        ball: newInnings.ballsInCurrentOver,
        runs,
        isWide: input.type === "wide",
        isNoBall: input.type === "noBall",
        isWicket: input.type === "wicket",
        batsmanName: striker.name,
        bowlerName: bowler.name,
        description: desc,
      };
      newInnings.ballLog.push(event);
      setLastEvent(desc);

      // check all out
      if (newInnings.totalWickets >= newInnings.batsmen.length - 1) {
        newInnings.isCompleted = true;
      }
      // check overs done
      if (newInnings.totalOvers >= prev.oversLimit && newInnings.ballsInCurrentOver === 0) {
        newInnings.isCompleted = true;
      }

      // check 2nd innings chase
      if (inningsIdx === 1 && prev.innings[0]) {
        const target = prev.innings[0].totalRuns + 1;
        if (newInnings.totalRuns >= target) {
          newInnings.isCompleted = true;
        }
      }

      const newInningsArr: [InningsData | null, InningsData | null] = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;

      let status: MatchData["matchStatus"] = prev.matchStatus;
      let winner = prev.winner;
      let winMargin = prev.winMargin;

      if (newInnings.isCompleted) {
        if (inningsIdx === 0) {
          status = "innings_break" as const;
        } else {
          status = "completed" as const;
          const first = newInningsArr[0]!;
          const second = newInnings;
          if (second.totalRuns > first.totalRuns) {
            winner = second.battingTeam;
            winMargin = `${second.batsmen.length - 1 - second.totalWickets} wickets`;
          } else if (first.totalRuns > second.totalRuns) {
            winner = first.battingTeam;
            winMargin = `${first.totalRuns - second.totalRuns} runs`;
          } else {
            winner = "Tie";
            winMargin = "";
          }
        }
      }

      return {
        ...prev,
        innings: newInningsArr,
        matchStatus: status as MatchData["matchStatus"],
        winner,
        winMargin,
      };
    });
  }, []);

  const startSecondInnings = useCallback(() => {
    setMatch(prev => {
      if (!prev || !prev.innings[0]) return prev;
      const first = prev.innings[0];
      const battingPlayers = first.bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = first.battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const secondInnings = createEmptyInnings(first.bowlingTeam, first.battingTeam, battingPlayers, bowlingPlayers);
      return {
        ...prev,
        innings: [prev.innings[0], secondInnings],
        currentInnings: 1,
        matchStatus: "live",
      };
    });
  }, []);

  const selectBowler = useCallback((bowlerIndex: number) => {
    setMatch(prev => {
      if (!prev) return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;
      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      newInnings.bowlers.forEach((b, i) => { b.isBowling = i === bowlerIndex; });
      newInnings.currentBowlerIndex = bowlerIndex;
      const newInningsArr: [InningsData | null, InningsData | null] = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const swapStrike = useCallback(() => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;
      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const temp = newInnings.currentBatsmanIndex;
      newInnings.currentBatsmanIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
      newInnings.batsmen.forEach((b, i) => {
        b.isOnStrike = i === newInnings.currentBatsmanIndex;
      });
      const newInningsArr: [InningsData | null, InningsData | null] = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const changeBatsman = useCallback((position: "striker" | "nonStriker", newBatsmanIndex: number) => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;
      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const oldIdx = position === "striker" ? newInnings.currentBatsmanIndex : newInnings.nonStrikerIndex;
      // Remove old batsman from crease (but don't mark as out)
      newInnings.batsmen[oldIdx].isAtCrease = false;
      newInnings.batsmen[oldIdx].isOnStrike = false;
      // Bring new batsman to crease
      newInnings.batsmen[newBatsmanIndex].isAtCrease = true;
      newInnings.batsmen[newBatsmanIndex].isOnStrike = position === "striker";
      if (position === "striker") {
        newInnings.currentBatsmanIndex = newBatsmanIndex;
      } else {
        newInnings.nonStrikerIndex = newBatsmanIndex;
      }
      const newInningsArr: [InningsData | null, InningsData | null] = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const resetMatch = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMatch(null);
    setLastEvent("");
  }, []);

  const currentInnings = match?.innings[match.currentInnings] ?? null;

  return {
    match,
    currentInnings,
    lastEvent,
    animationType,
    createMatch,
    setPlayers,
    setToss,
    recordBall,
    startSecondInnings,
    selectBowler,
    swapStrike,
    changeBatsman,
    resetMatch,
  };
}
