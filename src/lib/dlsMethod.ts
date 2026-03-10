// Simplified Duckworth-Lewis-Stern (DLS) Method
// Uses the standard DLS resource table (simplified version)

// Resource percentage remaining based on overs left and wickets lost
// This is a simplified version of the ICC DLS resource table
const DLS_RESOURCES: Record<number, number[]> = {
  // overs remaining: [0w, 1w, 2w, 3w, 4w, 5w, 6w, 7w, 8w, 9w]
  50: [100.0, 93.4, 85.1, 74.9, 62.7, 49.0, 34.9, 22.0, 11.9, 4.7],
  45: [95.0, 89.2, 81.8, 72.5, 61.1, 48.1, 34.5, 21.8, 11.8, 4.7],
  40: [89.3, 84.2, 77.8, 69.5, 59.0, 46.8, 33.8, 21.5, 11.7, 4.7],
  35: [82.7, 78.5, 73.0, 65.7, 56.3, 45.1, 32.8, 21.1, 11.6, 4.7],
  30: [75.1, 71.8, 67.3, 61.1, 53.0, 42.9, 31.6, 20.6, 11.4, 4.7],
  25: [66.5, 64.0, 60.5, 55.5, 48.8, 40.0, 29.8, 19.7, 11.1, 4.7],
  20: [56.6, 54.8, 52.4, 48.6, 43.4, 36.2, 27.5, 18.6, 10.6, 4.6],
  15: [45.2, 44.1, 42.6, 40.0, 36.4, 31.0, 24.2, 16.8, 10.0, 4.5],
  10: [32.1, 31.6, 30.8, 29.5, 27.5, 24.2, 19.6, 14.3, 8.9, 4.3],
  5:  [17.2, 17.0, 16.8, 16.5, 15.8, 14.5, 12.5, 9.9, 6.8, 3.8],
  3:  [10.9, 10.8, 10.7, 10.5, 10.2, 9.5, 8.4, 6.9, 5.0, 3.0],
  1:  [3.9, 3.9, 3.9, 3.8, 3.8, 3.6, 3.3, 2.9, 2.2, 1.5],
  0:  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
};

// Interpolate resource percentage for any overs remaining
function getResourcePercentage(oversRemaining: number, wicketsLost: number): number {
  if (wicketsLost >= 10) return 0;
  if (oversRemaining <= 0) return 0;

  const wicketIdx = Math.min(wicketsLost, 9);
  const keys = Object.keys(DLS_RESOURCES).map(Number).sort((a, b) => a - b);

  // Find bracketing values
  let lower = 0;
  let upper = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= oversRemaining) lower = k;
    if (k >= oversRemaining && upper >= k) upper = k;
  }

  if (lower === upper) return DLS_RESOURCES[lower][wicketIdx];

  // Linear interpolation
  const lowerVal = DLS_RESOURCES[lower]?.[wicketIdx] ?? 0;
  const upperVal = DLS_RESOURCES[upper]?.[wicketIdx] ?? 0;
  const fraction = (oversRemaining - lower) / (upper - lower);
  return lowerVal + fraction * (upperVal - lowerVal);
}

export interface DLSResult {
  revisedTarget: number;
  parScore: number;
  team1Resources: number;
  team2Resources: number;
  description: string;
}

/**
 * Calculate DLS revised target
 * @param team1Score - First innings total
 * @param totalOvers - Original overs per innings
 * @param team2OversAvailable - Overs available for team 2 (after interruption)
 * @param team2OversUsed - Overs already bowled in team 2's innings before interruption
 * @param team2Wickets - Wickets lost by team 2 at interruption
 * @param team1OversUsed - If team 1 innings was also shortened (default: full)
 * @param team1Wickets - Wickets lost when team 1 innings ended (default: 10)
 */
export function calculateDLS(
  team1Score: number,
  totalOvers: number,
  team2OversAvailable: number,
  team2OversUsed: number = 0,
  team2Wickets: number = 0,
  team1OversUsed: number = totalOvers,
  team1Wickets: number = 10,
): DLSResult {
  // Team 1 resources used
  const team1ResourcesAtStart = getResourcePercentage(totalOvers, 0);
  const team1ResourcesAtEnd = team1OversUsed >= totalOvers
    ? 0
    : getResourcePercentage(totalOvers - team1OversUsed, team1Wickets);
  const team1Resources = team1ResourcesAtStart - team1ResourcesAtEnd;

  // Team 2 resources
  const team2ResourcesAtInterruption = getResourcePercentage(
    team2OversAvailable - team2OversUsed,
    team2Wickets
  );
  const team2ResourcesAfterInterruption = getResourcePercentage(
    team2OversAvailable - team2OversUsed,
    team2Wickets
  );
  const team2Resources = team2ResourcesAfterInterruption;

  // Par score and revised target
  let revisedTarget: number;
  if (team2Resources >= team1Resources) {
    // Team 2 has more/equal resources — add runs
    revisedTarget = Math.round(
      team1Score * (team2Resources / team1Resources)
    ) + 1;
  } else {
    // Team 2 has fewer resources — reduce target
    revisedTarget = Math.round(
      team1Score * (team2Resources / team1Resources)
    ) + 1;
  }

  const parScore = revisedTarget - 1;

  const description = `Team 1 used ${team1Resources.toFixed(1)}% resources (scored ${team1Score}). ` +
    `Team 2 has ${team2Resources.toFixed(1)}% resources available. ` +
    `Revised target: ${revisedTarget} (Par: ${parScore})`;

  return {
    revisedTarget,
    parScore,
    team1Resources,
    team2Resources,
    description,
  };
}

/**
 * Quick DLS for reduced overs scenario (no mid-innings interruption)
 */
export function calculateReducedOversTarget(
  team1Score: number,
  originalOvers: number,
  reducedOvers: number,
): DLSResult {
  return calculateDLS(team1Score, originalOvers, reducedOvers);
}
