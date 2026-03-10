import { MatchData, InningsData } from "@/types/cricket";

const STATS_KEY = "cricket-player-stats";

export interface PlayerRecord {
  name: string;
  matches: number;
  // Batting
  innings: number;
  totalRuns: number;
  totalBallsFaced: number;
  highScore: number;
  highScoreNotOut: boolean;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  notOuts: number;
  ducks: number;
  // Bowling
  bowlingInnings: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  maidens: number;
  widesBowled: number;
  noBallsBowled: number;
  // Fielding
  catches: number;
  runOuts: number;
  stumpings: number;
}

export function getPlayerStats(): Record<string, PlayerRecord> {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function savePlayerStats(stats: Record<string, PlayerRecord>) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function clearPlayerStats() {
  localStorage.removeItem(STATS_KEY);
}

function ensurePlayer(stats: Record<string, PlayerRecord>, name: string): PlayerRecord {
  if (!stats[name]) {
    stats[name] = {
      name,
      matches: 0,
      innings: 0,
      totalRuns: 0,
      totalBallsFaced: 0,
      highScore: 0,
      highScoreNotOut: false,
      fours: 0,
      sixes: 0,
      fifties: 0,
      hundreds: 0,
      notOuts: 0,
      ducks: 0,
      bowlingInnings: 0,
      oversBowled: 0,
      ballsBowled: 0,
      runsConceded: 0,
      wickets: 0,
      bestBowlingWickets: 0,
      bestBowlingRuns: 0,
      maidens: 0,
      widesBowled: 0,
      noBallsBowled: 0,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
    };
  }
  return stats[name];
}

export function updateStatsFromMatch(match: MatchData) {
  const stats = getPlayerStats();
  const processedPlayers = new Set<string>();

  // Process all innings
  const allInnings: InningsData[] = [];
  match.innings.forEach(inn => { if (inn) allInnings.push(inn); });
  if (match.superOver) {
    match.superOver.innings.forEach(inn => { if (inn) allInnings.push(inn); });
  }

  // Track which players played this match
  const matchPlayers = new Set<string>();

  allInnings.forEach(innings => {
    // Batting stats
    innings.batsmen.forEach(bat => {
      if (bat.balls === 0 && !bat.isOut && !bat.isAtCrease) return; // didn't bat
      const player = ensurePlayer(stats, bat.name);
      matchPlayers.add(bat.name);

      player.innings += 1;
      player.totalRuns += bat.runs;
      player.totalBallsFaced += bat.balls;
      player.fours += bat.fours;
      player.sixes += bat.sixes;

      if (!bat.isOut) player.notOuts += 1;
      if (bat.runs === 0 && bat.isOut && bat.balls > 0) player.ducks += 1;
      if (bat.runs >= 50 && bat.runs < 100) player.fifties += 1;
      if (bat.runs >= 100) player.hundreds += 1;

      if (bat.runs > player.highScore || (bat.runs === player.highScore && !bat.isOut)) {
        player.highScore = bat.runs;
        player.highScoreNotOut = !bat.isOut;
      }
    });

    // Bowling stats
    innings.bowlers.forEach(bowl => {
      if (bowl.overs === 0 && bowl.ballsInCurrentOver === 0) return; // didn't bowl
      const player = ensurePlayer(stats, bowl.name);
      matchPlayers.add(bowl.name);

      player.bowlingInnings += 1;
      player.oversBowled += bowl.overs;
      player.ballsBowled += bowl.overs * 6 + bowl.ballsInCurrentOver;
      player.runsConceded += bowl.runsConceded;
      player.wickets += bowl.wickets;
      player.maidens += bowl.maidens;
      player.widesBowled += bowl.wides;
      player.noBallsBowled += bowl.noBalls;

      if (bowl.wickets > player.bestBowlingWickets ||
          (bowl.wickets === player.bestBowlingWickets && bowl.runsConceded < player.bestBowlingRuns)) {
        player.bestBowlingWickets = bowl.wickets;
        player.bestBowlingRuns = bowl.runsConceded;
      }
    });
  });

  // Increment match count for each player
  matchPlayers.forEach(name => {
    stats[name].matches += 1;
  });

  savePlayerStats(stats);
}

export function getBattingAverage(player: PlayerRecord): string {
  const dismissals = player.innings - player.notOuts;
  if (dismissals === 0) return player.totalRuns > 0 ? "∞" : "0.00";
  return (player.totalRuns / dismissals).toFixed(2);
}

export function getBattingStrikeRate(player: PlayerRecord): string {
  if (player.totalBallsFaced === 0) return "0.00";
  return ((player.totalRuns / player.totalBallsFaced) * 100).toFixed(1);
}

export function getBowlingAverage(player: PlayerRecord): string {
  if (player.wickets === 0) return "-";
  return (player.runsConceded / player.wickets).toFixed(2);
}

export function getBowlingEconomy(player: PlayerRecord): string {
  if (player.ballsBowled === 0) return "0.00";
  return ((player.runsConceded / player.ballsBowled) * 6).toFixed(2);
}

export function getBowlingStrikeRate(player: PlayerRecord): string {
  if (player.wickets === 0) return "-";
  return (player.ballsBowled / player.wickets).toFixed(1);
}

export function getBestBowling(player: PlayerRecord): string {
  if (player.bestBowlingWickets === 0 && player.runsConceded === 0) return "-";
  return `${player.bestBowlingWickets}/${player.bestBowlingRuns}`;
}

export function getHighScore(player: PlayerRecord): string {
  if (player.innings === 0) return "-";
  return `${player.highScore}${player.highScoreNotOut ? "*" : ""}`;
}

export function getAllPlayersSorted(sortBy: "runs" | "wickets" | "matches" = "runs"): PlayerRecord[] {
  const stats = getPlayerStats();
  const players = Object.values(stats);
  switch (sortBy) {
    case "runs": return players.sort((a, b) => b.totalRuns - a.totalRuns);
    case "wickets": return players.sort((a, b) => b.wickets - a.wickets);
    case "matches": return players.sort((a, b) => b.matches - a.matches);
    default: return players;
  }
}
