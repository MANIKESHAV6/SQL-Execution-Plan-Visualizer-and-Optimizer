// Session-level SQL skill progress tracker. Data persists in localStorage.

import { getProgress, resetProgress } from "@/lib/sql/intelligence";

export function ProgressTracker({ tick }: { tick: number }) {
  // `tick` is just a re-render trigger from the parent after a new analysis.
  void tick;
  const data = getProgress();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SQL Skill Progress</h3>
          <p className="text-xs text-muted-foreground">
            Concept coverage tracked across this session
          </p>
        </div>
        <button
          onClick={() => {
            resetProgress();
            // force re-render via location reload-free trick:
            window.dispatchEvent(new Event("storage"));
            // simplest: small DOM nudge
            window.setTimeout(() => window.location.reload(), 0);
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition"
        >
          Reset progress
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((row) => (
          <div key={row.bucket} className="panel p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">{row.bucket}</h4>
              <span className="font-mono text-xs text-muted-foreground">
                {row.used}/{row.total} · {row.percent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
              <div
                className="h-full transition-all"
                style={{
                  width: `${row.percent}%`,
                  background:
                    row.percent === 0
                      ? "var(--muted-foreground)"
                      : row.percent < 50
                        ? "var(--op-filter)"
                        : "var(--op-index)",
                }}
              />
            </div>
            {row.covered.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {row.covered.map((c) => (
                  <span
                    key={c}
                    className="op-chip"
                    style={{ color: "var(--op-scan)" }}
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Run a query that uses this concept to make progress.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
