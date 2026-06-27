// "Why did the cost go down?" panel. Visualizes savings by rule with
// progress bars, a stacked breakdown bar, and a pie-style radial summary.

import { useEffect, useState } from "react";
import type { CostBreakdown } from "@/lib/sql/costBreakdown";

// Smooth count-up animation for headline numbers.
function useCountUp(target: number, duration = 700) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setN(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

const RULE_COLOR: Record<string, string> = {
  "Predicate Pushdown": "var(--op-index)",
  INDEX_SCAN: "var(--op-scan)",
  "Join Reordering": "var(--op-join)",
  "Projection Pruning": "var(--op-project)",
  "Plan Rewrite": "var(--op-sort)",
};

export function CostBreakdownPanel({ data }: { data: CostBreakdown }) {
  const original = useCountUp(data.original);
  const optimized = useCountUp(data.optimized);
  const saved = useCountUp(data.saved);
  const percent = useCountUp(data.percent);

  return (
    <section className="flex flex-col gap-5">
      <div className="grid md:grid-cols-4 gap-3">
        <BigStat label="Original cost" value={original} />
        <BigStat label="Optimized cost" value={optimized} accent />
        <BigStat label="Saved" value={saved} accent />
        <RadialStat label="Reduction" percent={percent} />
      </div>

      <div className="panel p-5">
        <h3 className="font-semibold tracking-tight">Why Cost Reduced</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Savings attributed to each optimization rule that fired.
        </p>

        {data.saved === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">
            The optimizer found no opportunities to improve this query — the
            original plan is already close to optimal.
          </p>
        ) : (
          <>
            <div className="flex h-2.5 rounded-full overflow-hidden mt-4 mb-5 bg-muted">
              {data.reasons
                .filter((r) => r.saved > 0)
                .map((r) => (
                  <div
                    key={r.rule}
                    title={`${r.rule}: ${r.saved}`}
                    style={{
                      width: `${(r.saved / data.saved) * 100}%`,
                      background:
                        RULE_COLOR[r.rule] ?? "var(--op-index)",
                    }}
                  />
                ))}
            </div>

            <ul className="flex flex-col gap-3">
              {data.reasons
                .filter((r) => r.saved > 0)
                .map((r) => {
                  const pct = Math.round((r.saved / data.saved) * 100);
                  const color = RULE_COLOR[r.rule] ?? "var(--op-index)";
                  return (
                    <li key={r.rule} className="panel p-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="op-chip"
                            style={{ color }}
                          >
                            ✓ {r.rule}
                          </span>
                          <span className="text-sm font-semibold">
                            {r.title}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          saved{" "}
                          <span
                            className="font-semibold"
                            style={{ color }}
                          >
                            {r.saved}
                          </span>{" "}
                          ({pct}%)
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {r.explanation}
                      </p>
                      <div className="h-1.5 rounded-full bg-muted mt-2.5 overflow-hidden">
                        <div
                          className="h-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-3xl font-mono font-semibold mt-1 ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RadialStat({ label, percent }: { label: string; percent: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="panel p-4 flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="6"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * percent) / 100}
            style={{ transition: "stroke-dashoffset 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center font-mono text-sm font-semibold">
          {percent}%
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          fewer cost units
        </div>
      </div>
    </div>
  );
}
