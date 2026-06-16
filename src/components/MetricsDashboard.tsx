import type { Metrics } from "@/lib/sql/types";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="panel px-4 py-3 flex flex-col gap-0.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold font-mono">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function MetricsDashboard({
  metrics,
  originalCost,
  optimizedCost,
}: {
  metrics: Metrics;
  originalCost: number;
  optimizedCost: number;
}) {
  const saved = Math.max(0, originalCost - optimizedCost);
  const savedPct = originalCost
    ? Math.round((saved / originalCost) * 100)
    : 0;
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Stat label="Tables" value={metrics.tables} />
      <Stat label="Joins" value={metrics.joins} />
      <Stat label="Filters" value={metrics.filters} />
      <Stat label="Original cost" value={originalCost} />
      <Stat
        label="Optimized cost"
        value={optimizedCost}
        hint={saved ? `−${saved} (${savedPct}%)` : "no change"}
      />
      <Stat
        label="Opt. score"
        value={`${metrics.optimizationScore}/100`}
      />
    </section>
  );
}
