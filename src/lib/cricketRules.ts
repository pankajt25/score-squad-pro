// ICC Cricket Rules per format

export interface FormatRules {
  id: string;
  label: string;
  playersPerTeam: number;
  oversPerInnings: number;
  maxOversPerBowler: number | null; // null = unlimited (Test)
  totalInnings: number; // 2 for limited overs, 4 for Test
  powerplayOvers: { mandatory: number; batting: number; bowling: number } | null;
  followOnMargin: number | null; // runs deficit to enforce follow-on (Test only)
  canDeclare: boolean;
  hasSuperOver: boolean;
  newBallAfterOvers: number | null; // Test: new ball available after 80 overs
  freeHitOnNoBall: boolean; // T20, ODI have free hit; Test does not
}

export const FORMAT_RULES: Record<string, FormatRules> = {
  t10: {
    id: "t10",
    label: "T10",
    playersPerTeam: 6,
    oversPerInnings: 10,
    maxOversPerBowler: 2,
    totalInnings: 2,
    powerplayOvers: { mandatory: 2, batting: 0, bowling: 0 },
    followOnMargin: null,
    canDeclare: false,
    hasSuperOver: true,
    newBallAfterOvers: null,
    freeHitOnNoBall: true,
  },
  t20: {
    id: "t20",
    label: "T20",
    playersPerTeam: 11,
    oversPerInnings: 20,
    maxOversPerBowler: 4,
    totalInnings: 2,
    powerplayOvers: { mandatory: 6, batting: 0, bowling: 0 },
    followOnMargin: null,
    canDeclare: false,
    hasSuperOver: true,
    newBallAfterOvers: null,
    freeHitOnNoBall: true,
  },
  odi: {
    id: "odi",
    label: "ODI",
    playersPerTeam: 11,
    oversPerInnings: 50,
    maxOversPerBowler: 10,
    totalInnings: 2,
    powerplayOvers: { mandatory: 10, batting: 0, bowling: 0 },
    followOnMargin: null,
    canDeclare: false,
    hasSuperOver: true,
    newBallAfterOvers: null,
    freeHitOnNoBall: true,
  },
  test: {
    id: "test",
    label: "Test",
    playersPerTeam: 11,
    oversPerInnings: 90, // per day, but unlimited in practice
    maxOversPerBowler: null,
    totalInnings: 4,
    powerplayOvers: null,
    followOnMargin: 200, // 200 runs for 5-day test
    canDeclare: true,
    hasSuperOver: false,
    newBallAfterOvers: 80,
    freeHitOnNoBall: false,
  },
  custom: {
    id: "custom",
    label: "Custom",
    playersPerTeam: 11,
    oversPerInnings: 20,
    maxOversPerBowler: null,
    totalInnings: 2,
    powerplayOvers: null,
    followOnMargin: null,
    canDeclare: false,
    hasSuperOver: true,
    newBallAfterOvers: null,
    freeHitOnNoBall: true,
  },
};

export function getFormatRules(matchMode: string): FormatRules {
  return FORMAT_RULES[matchMode] ?? FORMAT_RULES.custom;
}

export function getMaxOversPerBowler(matchMode: string, totalOvers: number): number | null {
  const rules = getFormatRules(matchMode);
  if (rules.maxOversPerBowler !== null) return rules.maxOversPerBowler;
  if (matchMode === "custom" && totalOvers > 0) {
    // For custom, cap at totalOvers / 5 (ICC-like)
    return Math.ceil(totalOvers / 5);
  }
  return null; // unlimited
}

export function isPowerplayOver(matchMode: string, overNumber: number): boolean {
  const rules = getFormatRules(matchMode);
  if (!rules.powerplayOvers) return false;
  return overNumber < rules.powerplayOvers.mandatory;
}

export function canFollowOn(
  matchMode: string,
  firstInningsRuns: number,
  secondInningsRuns: number
): boolean {
  const rules = getFormatRules(matchMode);
  if (!rules.followOnMargin) return false;
  return firstInningsRuns - secondInningsRuns >= rules.followOnMargin;
}

export function getBowlerOverLimit(matchMode: string, totalOvers: number): string {
  const max = getMaxOversPerBowler(matchMode, totalOvers);
  if (max === null) return "∞";
  return String(max);
}
