// Complexity analysis panel: numeric breakdown + difficulty score.

import type { ComplexityReport } from "@/lib/sql/intelligence";

const levelColor: Record<ComplexityReport["level"], string> = {
  Beginner: "var(--op-scan)",
  Intermediate: "var(--op-index)",
  Advanced: "var(--op-filter)",
  Expert: "var(--op-join)",
};

export function ComplexityAnalysis({ data }: { data: ComplexityReport }) {
  const stats: [string, number][] = [
    ["Tables", data.tables],
    ["Joins", data.joins],
    ["Filters", data.filters],
    ["Aggregations", data.aggregations],
    ["Subqueries", data.subqueries],
    ["Sorts", data.sorts],
    ["Groupings", data.groupings],
    ["CTEs", data.ctes],
    ["Window fns", data.windowFunctions],
    ["Unions", data.unions],
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground tracking-widest">
              DIFFICULTY
            </div>
            <h3 className="text-2xl font-semibold mt-0.5">
              {data.level}{" "}
              <span className="text-muted-foreground text-lg font-normal">
                · {data.score}/100
              </span>
            </h3>
          </div>
          <span
            className="op-chip"
            style={{ color: levelColor[data.level] }}
          >
            {data.level}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${data.score}%`,
              background: `linear-gradient(90deg, var(--op-scan), ${levelColor[data.level]})`,
            }}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(([label, n]) => (
          <div key={label} className="panel p-3 text-center">
            <div className="text-2xl font-mono font-semibold">{n}</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </div>
          </div>
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-3">
        <div className="panel p-4">
          <h4 className="text-sm font-semibold mb-2">Detected concepts</h4>
          {data.detected.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.detected.map((c) => (
                <span
                  key={c}
                  className="op-chip"
                  style={{ color: "var(--op-index)" }}
                >
                  ✓ {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="panel p-4">
          <h4 className="text-sm font-semibold mb-2">Not yet used</h4>
          {data.notUsed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You've touched every tracked concept — nice.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {data.notUsed.map((c) => (
                <span
                  key={c}
                  className="op-chip text-muted-foreground"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  • {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
