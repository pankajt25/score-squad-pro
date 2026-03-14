import { useState, useCallback, useEffect } from "react";
import {
  MatchData,
  InningsData,
  ScoreInput,
  createEmptyInnings,
  getOversString,
  BallEvent,
} from "@/types/cricket";
import { getFormatRules, getMaxOversPerBowler, canFollowOn } from "@/lib/cricketRules";

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

  const createMatch = useCallback((teamA: string, teamB: string, venue: string, oversLimit: number, matchMode: string = "t20") => {
    const rules = getFormatRules(matchMode);
    const newMatch: MatchData = {
      id: generateId(),
      teamA,
      teamB,
      venue,
      oversLimit: matchMode === "custom" ? oversLimit : rules.oversPerInnings,
      matchMode,
      teamAPlayers: [],
      teamBPlayers: [],
      tossWinner: "",
      tossDecision: "bat",
      innings: matchMode === "test" ? [null, null, null, null] : [null, null],
      currentInnings: 0,
      matchStatus: "players",
      winner: null,
      winMargin: null,
      createdAt: new Date().toISOString(),
      totalInningsCount: rules.totalInnings,
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
      const newInnings = [...prev.innings];
      newInnings[0] = firstInnings;
      return {
        ...prev,
        tossWinner,
        tossDecision,
        innings: newInnings,
        currentInnings: 0,
        matchStatus: "live" as const,
      };
    });
  }, []);

  function createBallEvent(
    innings: InningsData, runs: number, input: ScoreInput, desc: string, striker: { name: string }, bowler: { name: string }
  ): BallEvent {
    return {
      over: innings.totalOvers,
      ball: innings.ballsInCurrentOver,
      runs,
      isWide: input.type === "wide",
      isNoBall: input.type === "noBall",
      isWicket: input.type === "wicket",
      isBye: input.type === "bye",
      isLegBye: input.type === "legBye",
      batsmanName: striker.name,
      bowlerName: bowler.name,
      description: desc,
      timestamp: new Date().toISOString(),
    };
  }

  function processBallLogic(newInnings: InningsData, input: ScoreInput, setAnim: typeof setAnimationType): { isLegalBall: boolean; desc: string } {
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
      const nextIdx = newInnings.batsmen.findIndex(b => !b.isOut && !b.isAtCrease && !b.isRetiredHurt);
      if (nextIdx !== -1) {
        newInnings.batsmen[nextIdx].isAtCrease = true;
        newInnings.batsmen[nextIdx].isOnStrike = true;
        newInnings.currentBatsmanIndex = nextIdx;
      }
      desc = `WICKET! ${striker.name} ${input.wicketType || "out"}`;
      setAnim("wicket");
      setTimeout(() => setAnim(null), 700);
    } else if (input.type === "bye") {
      isLegalBall = true;
      newInnings.totalRuns += runs;
      newInnings.extras.byes += runs;
      newInnings.extras.total += runs;
      striker.balls += 1;
      desc = runs > 0 ? `${runs} Bye${runs > 1 ? "s" : ""}` : "Dot ball";
      if (runs > 0) { setAnim("score"); setTimeout(() => setAnim(null), 600); }
    } else if (input.type === "legBye") {
      isLegalBall = true;
      newInnings.totalRuns += runs;
      newInnings.extras.legByes += runs;
      newInnings.extras.total += runs;
      striker.balls += 1;
      desc = runs > 0 ? `${runs} Leg Bye${runs > 1 ? "s" : ""}` : "Dot ball";
      if (runs > 0) { setAnim("score"); setTimeout(() => setAnim(null), 600); }
    } else {
      isLegalBall = true;
      newInnings.totalRuns += runs;
      striker.runs += runs;
      striker.balls += 1;
      bowler.runsConceded += runs;
      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
      desc = runs === 0 ? "Dot ball" : `${runs} run${runs > 1 ? "s" : ""}`;
      if (runs > 0) { setAnim("score"); setTimeout(() => setAnim(null), 600); }
    }

    // Rotate strike on odd runs
    if (isLegalBall && runs % 2 === 1) {
      const temp = newInnings.currentBatsmanIndex;
      newInnings.currentBatsmanIndex = newInnings.nonStrikerIndex;
      newInnings.nonStrikerIndex = temp;
      newInnings.batsmen.forEach((b, i) => { b.isOnStrike = i === newInnings.currentBatsmanIndex; });
    }

    if (isLegalBall) {
      newInnings.ballsInCurrentOver += 1;
      bowler.ballsInCurrentOver += 1;
      if (newInnings.ballsInCurrentOver === 6) {
        newInnings.totalOvers += 1;
        newInnings.ballsInCurrentOver = 0;
        bowler.overs += 1;
        bowler.ballsInCurrentOver = 0;
        const temp = newInnings.currentBatsmanIndex;
        newInnings.currentBatsmanIndex = newInnings.nonStrikerIndex;
        newInnings.nonStrikerIndex = temp;
        newInnings.batsmen.forEach((b, i) => { b.isOnStrike = i === newInnings.currentBatsmanIndex; });
      }
    }

    return { isLegalBall, desc };
  }

  const recordBall = useCallback((input: ScoreInput) => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings || innings.isCompleted) return prev;

      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const striker = newInnings.batsmen[newInnings.currentBatsmanIndex];
      const bowler = newInnings.bowlers[newInnings.currentBowlerIndex];

      const { desc } = processBallLogic(newInnings, input, setAnimationType);

      const event = createBallEvent(newInnings, input.runs ?? 0, input, desc, striker, bowler);
      newInnings.ballLog.push(event);
      setLastEvent(desc);

      // Check all out
      const availableBatsmen = newInnings.batsmen.filter(b => !b.isOut && !b.isRetiredHurt).length;
      if (availableBatsmen <= 1) {
        newInnings.isCompleted = true;
      }

      // Check overs done (for limited-overs formats & Test daily limit)
      const isTest = prev.matchMode === "test";
      if (!isTest && newInnings.totalOvers >= prev.oversLimit && newInnings.ballsInCurrentOver === 0) {
        newInnings.isCompleted = true;
      }

      // Limited-overs 2nd innings chase
      if (!isTest && inningsIdx === 1 && prev.innings[0]) {
        const target = prev.innings[0].totalRuns + 1;
        if (newInnings.totalRuns >= target) {
          newInnings.isCompleted = true;
        }
      }

      // Test match: 4th innings chase
      if (isTest && inningsIdx === 3 && prev.innings[2]) {
        // Team batting 4th needs to beat the lead
        const teamABatFirst = prev.innings[0]?.battingTeam;
        const team1Total = (prev.innings[0]?.totalRuns ?? 0) + (prev.innings[2]?.battingTeam === teamABatFirst ? prev.innings[2]?.totalRuns ?? 0 : 0);
        const team2Total = (prev.innings[1]?.totalRuns ?? 0) + (prev.innings[3]?.battingTeam !== teamABatFirst ? 0 : prev.innings[3]?.totalRuns ?? 0);
        // Simpler: just check the target set
        const inn3 = prev.innings[2]!;
        const inn4Batting = newInnings.battingTeam;
        // Calculate total for each team across their 2 innings
        let battingTeamTotal = 0;
        let bowlingTeamTotal = 0;
        prev.innings.forEach((inn, idx) => {
          if (!inn) return;
          if (idx === inningsIdx) return; // skip current, we use newInnings
          if (inn.battingTeam === inn4Batting) battingTeamTotal += inn.totalRuns;
          else bowlingTeamTotal += inn.totalRuns;
        });
        battingTeamTotal += newInnings.totalRuns;
        if (battingTeamTotal > bowlingTeamTotal) {
          newInnings.isCompleted = true;
        }
      }

      const newInningsArr = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;

      let status: MatchData["matchStatus"] = prev.matchStatus;
      let winner = prev.winner;
      let winMargin = prev.winMargin;

      if (newInnings.isCompleted) {
        if (isTest) {
          status = resolveTestInningsEnd(prev, newInningsArr, inningsIdx, newInnings);
          if (status === "completed") {
            const result = getTestResult(prev, newInningsArr);
            winner = result.winner;
            winMargin = result.winMargin;
          }
        } else {
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
              winner = null;
              winMargin = null;
              status = "super_over_break" as const;
            }
          }
        }
      }

      return { ...prev, innings: newInningsArr, matchStatus: status, winner, winMargin };
    });
  }, []);

  // Declare innings (Test match only)
  const declareInnings = useCallback(() => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live" || prev.matchMode !== "test") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;

      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      newInnings.isCompleted = true;
      newInnings.isDeclared = true;

      const newInningsArr = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;

      const status = resolveTestInningsEnd(prev, newInningsArr, inningsIdx, newInnings);
      let winner = prev.winner;
      let winMargin = prev.winMargin;
      if (status === "completed") {
        const result = getTestResult(prev, newInningsArr);
        winner = result.winner;
        winMargin = result.winMargin;
      }

      return { ...prev, innings: newInningsArr, matchStatus: status, winner, winMargin };
    });
  }, []);

  // Enforce follow-on (Test match)
  const enforceFollowOn = useCallback((enforce: boolean) => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "follow_on_decision") return prev;
      if (enforce) {
        // Team that batted 2nd bats again (innings 2 = same batting team as innings 1's opponent)
        const inn1 = prev.innings[0]!;
        const inn2 = prev.innings[1]!;
        const battingTeam = inn2.battingTeam; // Same team bats again
        const bowlingTeam = inn2.bowlingTeam;
        const battingPlayers = battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
        const bowlingPlayers = bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
        const thirdInnings = createEmptyInnings(battingTeam, bowlingTeam, battingPlayers, bowlingPlayers);
        const newInningsArr = [...prev.innings];
        newInningsArr[2] = thirdInnings;
        return { ...prev, innings: newInningsArr, currentInnings: 2, matchStatus: "live" as const, followOnEnforced: true };
      } else {
        // Normal order: team that batted 1st bats 3rd
        const inn1 = prev.innings[0]!;
        const battingTeam = inn1.battingTeam;
        const bowlingTeam = inn1.bowlingTeam;
        const battingPlayers = battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
        const bowlingPlayers = bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
        const thirdInnings = createEmptyInnings(battingTeam, bowlingTeam, battingPlayers, bowlingPlayers);
        const newInningsArr = [...prev.innings];
        newInningsArr[2] = thirdInnings;
        return { ...prev, innings: newInningsArr, currentInnings: 2, matchStatus: "live" as const, followOnEnforced: false };
      }
    });
  }, []);

  const startSecondInnings = useCallback(() => {
    setMatch(prev => {
      if (!prev || !prev.innings[0]) return prev;
      const first = prev.innings[0];
      const battingPlayers = first.bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = first.battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const secondInnings = createEmptyInnings(first.bowlingTeam, first.battingTeam, battingPlayers, bowlingPlayers);
      const newInningsArr = [...prev.innings];
      newInningsArr[1] = secondInnings;
      return { ...prev, innings: newInningsArr, currentInnings: 1, matchStatus: "live" as const };
    });
  }, []);

  // Start next Test innings (3rd or 4th)
  const startNextTestInnings = useCallback(() => {
    setMatch(prev => {
      if (!prev || prev.matchMode !== "test") return prev;
      const nextIdx = prev.currentInnings + 1;
      if (nextIdx >= 4) return prev;
      const prevInnings = prev.innings[prev.currentInnings];
      if (!prevInnings) return prev;

      let battingTeam: string, bowlingTeam: string;
      if (prev.followOnEnforced && nextIdx === 3) {
        // After follow-on 3rd innings, 4th innings: team that enforced follow-on bats
        battingTeam = prev.innings[0]!.battingTeam;
        bowlingTeam = prev.innings[0]!.bowlingTeam;
      } else {
        // Normal alternation
        battingTeam = prevInnings.bowlingTeam;
        bowlingTeam = prevInnings.battingTeam;
      }

      const battingPlayers = battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const newInn = createEmptyInnings(battingTeam, bowlingTeam, battingPlayers, bowlingPlayers);
      const newInningsArr = [...prev.innings];
      newInningsArr[nextIdx] = newInn;
      return { ...prev, innings: newInningsArr, currentInnings: nextIdx, matchStatus: "live" as const };
    });
  }, []);

  const selectBowler = useCallback((bowlerIndex: number) => {
    setMatch(prev => {
      if (!prev) return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;

      // Check bowling limit
      const maxOvers = getMaxOversPerBowler(prev.matchMode, prev.oversLimit);
      if (maxOvers !== null) {
        const bowler = innings.bowlers[bowlerIndex];
        if (bowler.overs >= maxOvers && bowler.ballsInCurrentOver === 0) {
          // Bowler has reached their limit
          return prev;
        }
      }

      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      newInnings.bowlers.forEach((b, i) => { b.isBowling = i === bowlerIndex; });
      newInnings.currentBowlerIndex = bowlerIndex;
      const newInningsArr = [...prev.innings];
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
      newInnings.batsmen.forEach((b, i) => { b.isOnStrike = i === newInnings.currentBatsmanIndex; });
      const newInningsArr = [...prev.innings];
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
      newInnings.batsmen[oldIdx].isAtCrease = false;
      newInnings.batsmen[oldIdx].isOnStrike = false;
      newInnings.batsmen[newBatsmanIndex].isAtCrease = true;
      newInnings.batsmen[newBatsmanIndex].isOnStrike = position === "striker";
      if (position === "striker") {
        newInnings.currentBatsmanIndex = newBatsmanIndex;
      } else {
        newInnings.nonStrikerIndex = newBatsmanIndex;
      }
      const newInningsArr = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const retireBatsman = useCallback((position: "striker" | "nonStriker") => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;
      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const idx = position === "striker" ? newInnings.currentBatsmanIndex : newInnings.nonStrikerIndex;
      newInnings.batsmen[idx].isRetiredHurt = true;
      newInnings.batsmen[idx].isAtCrease = false;
      newInnings.batsmen[idx].isOnStrike = false;
      newInnings.batsmen[idx].dismissal = "retired hurt";
      const nextIdx = newInnings.batsmen.findIndex(b => !b.isOut && !b.isAtCrease && !b.isRetiredHurt);
      if (nextIdx !== -1) {
        newInnings.batsmen[nextIdx].isAtCrease = true;
        newInnings.batsmen[nextIdx].isOnStrike = position === "striker";
        if (position === "striker") {
          newInnings.currentBatsmanIndex = nextIdx;
        } else {
          newInnings.nonStrikerIndex = nextIdx;
        }
      }
      const newInningsArr = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const unretireBatsman = useCallback((batsmanIndex: number, position: "striker" | "nonStriker") => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "live") return prev;
      const inningsIdx = prev.currentInnings;
      const innings = prev.innings[inningsIdx];
      if (!innings) return prev;
      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const oldIdx = position === "striker" ? newInnings.currentBatsmanIndex : newInnings.nonStrikerIndex;
      newInnings.batsmen[oldIdx].isAtCrease = false;
      newInnings.batsmen[oldIdx].isOnStrike = false;
      newInnings.batsmen[batsmanIndex].isRetiredHurt = false;
      newInnings.batsmen[batsmanIndex].dismissal = "";
      newInnings.batsmen[batsmanIndex].isAtCrease = true;
      newInnings.batsmen[batsmanIndex].isOnStrike = position === "striker";
      if (position === "striker") {
        newInnings.currentBatsmanIndex = batsmanIndex;
      } else {
        newInnings.nonStrikerIndex = batsmanIndex;
      }
      const newInningsArr = [...prev.innings];
      newInningsArr[inningsIdx] = newInnings;
      return { ...prev, innings: newInningsArr };
    });
  }, []);

  const startSuperOver = useCallback(() => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "super_over_break") return prev;
      const secondInnings = prev.innings[1]!;
      const battingFirst = secondInnings.battingTeam;
      const bowlingFirst = secondInnings.bowlingTeam;
      const battingPlayers = battingFirst === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = bowlingFirst === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const soInnings = createEmptyInnings(battingFirst, bowlingFirst, battingPlayers, bowlingPlayers);
      const round = prev.superOver ? prev.superOver.round + 1 : 1;
      return {
        ...prev,
        matchStatus: "super_over" as const,
        oversLimit: 1,
        originalOversLimit: prev.originalOversLimit ?? prev.oversLimit,
        superOver: { innings: [soInnings, null], currentInnings: 0, round },
      };
    });
  }, []);

  const startSuperOverSecondInnings = useCallback(() => {
    setMatch(prev => {
      if (!prev || !prev.superOver || !prev.superOver.innings[0]) return prev;
      const first = prev.superOver.innings[0];
      const battingPlayers = first.bowlingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const bowlingPlayers = first.battingTeam === prev.teamA ? prev.teamAPlayers : prev.teamBPlayers;
      const secondInnings = createEmptyInnings(first.bowlingTeam, first.battingTeam, battingPlayers, bowlingPlayers);
      return {
        ...prev,
        matchStatus: "super_over" as const,
        superOver: { ...prev.superOver, innings: [prev.superOver.innings[0], secondInnings], currentInnings: 1 },
      };
    });
  }, []);

  const recordSuperOverBall = useCallback((input: ScoreInput) => {
    setMatch(prev => {
      if (!prev || prev.matchStatus !== "super_over" || !prev.superOver) return prev;
      const soInningsIdx = prev.superOver.currentInnings;
      const innings = prev.superOver.innings[soInningsIdx];
      if (!innings || innings.isCompleted) return prev;

      const newInnings: InningsData = JSON.parse(JSON.stringify(innings));
      const striker = newInnings.batsmen[newInnings.currentBatsmanIndex];
      const bowler = newInnings.bowlers[newInnings.currentBowlerIndex];

      const { desc } = processBallLogic(newInnings, input, setAnimationType);

      const event = createBallEvent(newInnings, input.runs ?? 0, input, desc, striker, bowler);
      newInnings.ballLog.push(event);
      setLastEvent(desc);

      if (newInnings.totalWickets >= newInnings.batsmen.length - 1) {
        newInnings.isCompleted = true;
      }
      if (newInnings.totalOvers >= 1 && newInnings.ballsInCurrentOver === 0) {
        newInnings.isCompleted = true;
      }
      if (soInningsIdx === 1 && prev.superOver.innings[0]) {
        const target = prev.superOver.innings[0].totalRuns + 1;
        if (newInnings.totalRuns >= target) {
          newInnings.isCompleted = true;
        }
      }

      const newSOInnings: [InningsData | null, InningsData | null] = [...prev.superOver.innings];
      newSOInnings[soInningsIdx] = newInnings;

      let status: MatchData["matchStatus"] = prev.matchStatus;
      let winner = prev.winner;
      let winMargin = prev.winMargin;

      if (newInnings.isCompleted) {
        if (soInningsIdx === 0) {
          status = "innings_break" as const;
        } else {
          const first = newSOInnings[0]!;
          const second = newInnings;
          if (second.totalRuns > first.totalRuns) {
            winner = second.battingTeam;
            winMargin = `Super Over${prev.superOver.round > 1 ? ` (Round ${prev.superOver.round})` : ""}`;
            status = "completed" as const;
          } else if (first.totalRuns > second.totalRuns) {
            winner = first.battingTeam;
            winMargin = `Super Over${prev.superOver.round > 1 ? ` (Round ${prev.superOver.round})` : ""}`;
            status = "completed" as const;
          } else {
            winner = null;
            winMargin = null;
            status = "super_over_break" as const;
          }
        }
      }

      return {
        ...prev, matchStatus: status, winner, winMargin,
        superOver: { ...prev.superOver, innings: newSOInnings, currentInnings: prev.superOver.currentInnings },
      };
    });
  }, []);

  const undoLastBall = useCallback(() => {
    setMatch(prev => {
      if (!prev) return prev;
      const saved = localStorage.getItem(STORAGE_KEY + "-undo");
      if (saved) {
        try {
          const restored = JSON.parse(saved);
          setLastEvent("Undo");
          return restored;
        } catch { return prev; }
      }
      return prev;
    });
  }, []);

  const recordBallWithUndo = useCallback((input: ScoreInput) => {
    setMatch(prev => {
      if (prev) localStorage.setItem(STORAGE_KEY + "-undo", JSON.stringify(prev));
      return prev;
    });
    setTimeout(() => recordBall(input), 0);
  }, [recordBall]);

  const recordSuperOverBallWithUndo = useCallback((input: ScoreInput) => {
    setMatch(prev => {
      if (prev) localStorage.setItem(STORAGE_KEY + "-undo", JSON.stringify(prev));
      return prev;
    });
    setTimeout(() => recordSuperOverBall(input), 0);
  }, [recordSuperOverBall]);

  const resetMatch = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + "-undo");
    setMatch(null);
    setLastEvent("");
  }, []);

  const renamePlayer = useCallback((team: "teamA" | "teamB", playerIndex: number, newName: string) => {
    setMatch(prev => {
      if (!prev) return prev;
      const newMatch: MatchData = JSON.parse(JSON.stringify(prev));
      const playerList = team === "teamA" ? newMatch.teamAPlayers : newMatch.teamBPlayers;
      const oldName = playerList[playerIndex];
      if (!oldName || oldName === newName) return prev;
      playerList[playerIndex] = newName;

      // Update all innings batsmen/bowlers and ball logs
      newMatch.innings.forEach(inn => {
        if (!inn) return;
        inn.batsmen.forEach(b => { if (b.name === oldName) b.name = newName; });
        inn.bowlers.forEach(b => { if (b.name === oldName) b.name = newName; });
        inn.ballLog.forEach(e => {
          if (e.batsmanName === oldName) e.batsmanName = newName;
          if (e.bowlerName === oldName) e.bowlerName = newName;
        });
        inn.fallOfWickets.forEach(f => { if (f.batsmanName === oldName) f.batsmanName = newName; });
      });

      // Update super over innings too
      if (newMatch.superOver) {
        newMatch.superOver.innings.forEach(inn => {
          if (!inn) return;
          inn.batsmen.forEach(b => { if (b.name === oldName) b.name = newName; });
          inn.bowlers.forEach(b => { if (b.name === oldName) b.name = newName; });
          inn.ballLog.forEach(e => {
            if (e.batsmanName === oldName) e.batsmanName = newName;
            if (e.bowlerName === oldName) e.bowlerName = newName;
          });
        });
      }

      return newMatch;
    });
  }, []);

  const goBack = useCallback(() => {
    setMatch(prev => {
      if (!prev) return null;
      if (prev.matchStatus === "players") return null;
      if (prev.matchStatus === "toss") return { ...prev, matchStatus: "players" as const };
      return prev;
    });
  }, []);

  const currentInnings = match?.superOver
    ? match.superOver.innings[match.superOver.currentInnings] ?? null
    : match?.innings[match.currentInnings] ?? null;

  return {
    match, currentInnings, lastEvent, animationType,
    createMatch, setPlayers, setToss, recordBall: recordBallWithUndo,
    startSecondInnings, selectBowler, swapStrike, changeBatsman,
    retireBatsman, unretireBatsman, resetMatch,
    startSuperOver, startSuperOverSecondInnings,
    recordSuperOverBall: recordSuperOverBallWithUndo,
    undoLastBall, goBack, renamePlayer,
    declareInnings, enforceFollowOn, startNextTestInnings,
  };
}

// Helper: resolve what happens after a Test innings ends
function resolveTestInningsEnd(
  prev: MatchData,
  allInnings: (InningsData | null)[],
  completedIdx: number,
  completedInnings: InningsData
): MatchData["matchStatus"] {
  if (completedIdx === 0) {
    // 1st innings done -> innings break
    return "innings_break";
  }
  if (completedIdx === 1) {
    // 2nd innings done — check follow-on eligibility
    const firstRuns = allInnings[0]!.totalRuns;
    const secondRuns = completedInnings.totalRuns;
    if (canFollowOn(prev.matchMode, firstRuns, secondRuns)) {
      return "follow_on_decision";
    }
    return "innings_break";
  }
  if (completedIdx === 2) {
    // 3rd innings done -> innings break before 4th
    return "innings_break";
  }
  // 4th innings done — match result
  return "completed";
}

function getTestResult(prev: MatchData, allInnings: (InningsData | null)[]): { winner: string | null; winMargin: string | null } {
  // Calculate totals per team
  const teamTotals: Record<string, number> = {};
  const teamWickets: Record<string, number> = {};
  const teamPlayerCount: Record<string, number> = {};

  allInnings.forEach(inn => {
    if (!inn) return;
    teamTotals[inn.battingTeam] = (teamTotals[inn.battingTeam] ?? 0) + inn.totalRuns;
    teamWickets[inn.battingTeam] = (teamWickets[inn.battingTeam] ?? 0) + inn.totalWickets;
    teamPlayerCount[inn.battingTeam] = inn.batsmen.length;
  });

  const teams = Object.keys(teamTotals);
  if (teams.length < 2) return { winner: null, winMargin: "Draw" };

  const [t1, t2] = teams;
  if (teamTotals[t1] > teamTotals[t2]) {
    // Check if won by runs or wickets
    const lastInnings = allInnings[allInnings.length - 1];
    if (lastInnings && lastInnings.battingTeam === t1) {
      const wicketsLeft = (teamPlayerCount[t1] ?? 11) - 1 - (lastInnings.totalWickets);
      return { winner: t1, winMargin: `${wicketsLeft} wickets` };
    }
    return { winner: t1, winMargin: `${teamTotals[t1] - teamTotals[t2]} runs` };
  } else if (teamTotals[t2] > teamTotals[t1]) {
    const lastInnings = allInnings[allInnings.length - 1];
    if (lastInnings && lastInnings.battingTeam === t2) {
      const wicketsLeft = (teamPlayerCount[t2] ?? 11) - 1 - (lastInnings.totalWickets);
      return { winner: t2, winMargin: `${wicketsLeft} wickets` };
    }
    return { winner: t2, winMargin: `${teamTotals[t2] - teamTotals[t1]} runs` };
  }
  return { winner: null, winMargin: "Draw" };
}
