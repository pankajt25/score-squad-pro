export interface BatsmanStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isRetiredHurt: boolean;
  dismissal: string;
  isOnStrike: boolean;
  isAtCrease: boolean;
}

export interface BowlerStats {
  name: string;
  overs: number;
  ballsInCurrentOver: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  isBowling: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  batsmanName: string;
}

export interface InningsData {
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  ballsInCurrentOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number; total: number };
  batsmen: BatsmanStats[];
  bowlers: BowlerStats[];
  fallOfWickets: FallOfWicket[];
  currentBatsmanIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  isCompleted: boolean;
  isDeclared: boolean;
  ballLog: BallEvent[];
}

export interface BallEvent {
  over: number;
  ball: number;
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isWicket: boolean;
  isBye: boolean;
  isLegBye: boolean;
  batsmanName: string;
  bowlerName: string;
  description: string;
  timestamp: string;
}

export interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  venue: string;
  oversLimit: number;
  matchMode: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  tossWinner: string;
  tossDecision: "bat" | "bowl";
  // Support up to 4 innings (Test match)
  innings: (InningsData | null)[];
  currentInnings: number;
  matchStatus: "setup" | "players" | "toss" | "live" | "innings_break" | "completed" | "super_over_break" | "super_over" | "follow_on_decision";
  winner: string | null;
  winMargin: string | null;
  createdAt: string;
  superOver?: {
    innings: [InningsData | null, InningsData | null];
    currentInnings: 0 | 1;
    round: number;
  };
  originalOversLimit?: number;
  followOnEnforced?: boolean;
  totalInningsCount: number; // 2 or 4
}

export type ScoreInput = {
  type: "runs" | "wide" | "noBall" | "wicket" | "bye" | "legBye";
  runs?: number;
  wicketType?: string;
};

export function getOversString(completedOvers: number, balls: number): string {
  return `${completedOvers}.${balls}`;
}

export function getRunRate(runs: number, overs: number, balls: number): string {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return "0.00";
  return ((runs / totalBalls) * 6).toFixed(2);
}

export function getStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return "0.00";
  return ((runs / balls) * 100).toFixed(1);
}

export function getEconomy(runs: number, overs: number, balls: number): string {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return "0.00";
  return ((runs / totalBalls) * 6).toFixed(2);
}

export function getBowlerOversString(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function createEmptyInnings(
  battingTeam: string,
  bowlingTeam: string,
  battingPlayers: string[],
  bowlingPlayers: string[]
): InningsData {
  return {
    battingTeam,
    bowlingTeam,
    totalRuns: 0,
    totalWickets: 0,
    totalOvers: 0,
    ballsInCurrentOver: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
    batsmen: battingPlayers.map((name, i) => ({
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      isRetiredHurt: false,
      dismissal: "",
      isOnStrike: i === 0,
      isAtCrease: i < 2,
    })),
    bowlers: bowlingPlayers.map((name, i) => ({
      name,
      overs: 0,
      ballsInCurrentOver: 0,
      runsConceded: 0,
      wickets: 0,
      maidens: 0,
      wides: 0,
      noBalls: 0,
      isBowling: i === 0,
    })),
    fallOfWickets: [],
    currentBatsmanIndex: 0,
    nonStrikerIndex: 1,
    currentBowlerIndex: 0,
    isCompleted: false,
    isDeclared: false,
    ballLog: [],
  };
}
