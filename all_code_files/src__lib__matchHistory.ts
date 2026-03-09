import { MatchData } from "@/types/cricket";

const HISTORY_KEY = "cricket-match-history";

export function getMatchHistory(): MatchData[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(match: MatchData) {
  const history = getMatchHistory();
  // Avoid duplicates
  const exists = history.find(m => m.id === match.id);
  if (!exists) {
    history.unshift(match);
    // Keep last 20
    if (history.length > 20) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
