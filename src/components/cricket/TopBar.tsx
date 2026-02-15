import { useDarkMode } from "@/hooks/useDarkMode";

export default function TopBar({
  onShowHistory,
  onExportPDF,
  showExport,
}: {
  onShowHistory: () => void;
  onExportPDF?: () => void;
  showExport: boolean;
}) {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏏</span>
          <span className="font-bold text-foreground text-sm">Cricket Scorer</span>
        </div>
        <div className="flex items-center gap-1">
          {showExport && onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              title="Export PDF"
            >
              📄 PDF
            </button>
          )}
          <button
            onClick={onShowHistory}
            className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            title="Match History"
          >
            📋 History
          </button>
          <button
            onClick={toggle}
            className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            title="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
