// Side-by-side operator comparison table between original and optimized plans.

import type { OperatorDelta } from "@/lib/sql/costBreakdown";

const CHANGE_STYLE: Record<OperatorDelta["change"], { label: string; color: string }> = {
  added: { label: "Added", color: "var(--op-index)" },
  removed: { label: "Removed", color: "var(--op-filter)" },
  moved: { label: "Moved", color: "var(--op-project)" },
  improved: { label: "Improved", color: "var(--op-scan)" },
  same: { label: "—", color: "var(--muted-foreground)" },
};

export function PlanComparisonTable({
  rows,
  originalCost,
  optimizedCost,
}: {
  rows: OperatorDelta[];
  originalCost: number;
  optimizedCost: number;
}) {
  return (
    <section className="panel p-5">
      <header className="mb-4">
        <h3 className="font-semibold tracking-tight">
          Execution Plan Comparison
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Operator counts and position differences between the two plans.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="py-2 pr-4">Operator</th>
              <th className="py-2 pr-4">Original</th>
              <th className="py-2 pr-4">Optimized</th>
              <th className="py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const style = CHANGE_STYLE[r.change];
              return (
                <tr
                  key={String(r.operator)}
                  className="border-b border-border/40 hover:bg-muted/20 transition"
                >
                  <td className="py-2.5 pr-4 font-mono">{r.operator}</td>
                  <td className="py-2.5 pr-4 font-mono">{r.original}</td>
                  <td className="py-2.5 pr-4 font-mono">{r.optimized}</td>
                  <td className="py-2.5">
                    <span className="op-chip" style={{ color: style.color }}>
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border">
              <td className="py-3 pr-4 font-mono font-semibold">Estimated Cost</td>
              <td className="py-3 pr-4 font-mono font-semibold">
                {originalCost}
              </td>
              <td className="py-3 pr-4 font-mono font-semibold text-primary">
                {optimizedCost}
              </td>
              <td className="py-3">
                <span
                  className="op-chip"
                  style={{
                    color:
                      optimizedCost < originalCost
                        ? "var(--op-index)"
                        : "var(--muted-foreground)",
                  }}
                >
                  {optimizedCost < originalCost
                    ? `−${originalCost - optimizedCost}`
                    : "no change"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
