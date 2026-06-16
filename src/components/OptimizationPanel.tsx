import type { OptimizationSuggestion } from "@/lib/sql/types";

const SEV_STYLE: Record<OptimizationSuggestion["severity"], string> = {
  info: "border-primary/40 bg-primary/5 text-foreground",
  warn: "border-[color:var(--color-op-filter)]/50 bg-[color:var(--color-op-filter)]/10",
  critical:
    "border-destructive/50 bg-destructive/10 text-destructive-foreground",
};

export function OptimizationPanel({
  suggestions,
}: {
  suggestions: OptimizationSuggestion[];
}) {
  return (
    <section className="panel p-5 flex flex-col gap-3">
      <header>
        <h3 className="font-semibold tracking-tight">Optimization Suggestions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rule-based recommendations from the optimizer.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <li
            key={i}
            className={`border rounded-md px-3 py-2 text-sm flex items-start gap-3 ${SEV_STYLE[s.severity]}`}
          >
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-background/40 border border-border">
              {s.rule}
            </span>
            <span>{s.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
