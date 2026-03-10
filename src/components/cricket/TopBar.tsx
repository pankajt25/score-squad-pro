import { useDarkMode } from "@/hooks/useDarkMode";

export default function TopBar({
  onShowHistory,
  onExportPDF,
  showExport,
  onBack,
  onShowStats,
}: {
  onShowHistory: () => void;
  onExportPDF?: () => void;
  showExport: boolean;
  onBack?: () => void;
  onShowStats?: () => void;
}) {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-50 bg-card/60 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 active:scale-95"
              title="Go back"
            >
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <span className="text-lg">🏏</span>
          </div>
          <span className="font-bold text-foreground tracking-tight">Cricket Scorer</span>
        </div>
        <div className="flex items-center gap-1">
          {showExport && onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 active:scale-95"
              title="Export PDF"
            >
              📄 PDF
            </button>
          )}
          {onShowStats && (
            <button
              onClick={onShowStats}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 active:scale-95"
              title="Player Stats"
            >
              📊 Stats
            </button>
          )}
          <button
            onClick={onShowHistory}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 active:scale-95"
            title="Match History"
          >
            📋 History
          </button>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-all duration-200 active:scale-95"
            title="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
