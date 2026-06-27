// Logical SQL execution-order visualization. Animated flow of stages with
// detected stages highlighted and skipped stages greyed out.

import type { ExecutionStage } from "@/lib/sql/executionOrder";

export function ExecutionOrderPanel({ stages }: { stages: ExecutionStage[] }) {
  return (
    <section className="panel p-5 flex flex-col gap-4">
      <header>
        <div className="font-mono text-xs text-primary tracking-[0.3em]">
          INTERNAL EXECUTION
        </div>
        <h3 className="text-lg font-semibold tracking-tight mt-1">
          How SQL Executes Internally
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Logical evaluation order — NOT the order you wrote the clauses.
        </p>
      </header>

      <ol className="flex flex-col gap-2">
        {stages.map((s, i) => (
          <li
            key={s.stage}
            className="node-anim"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div
              className={`panel p-4 transition relative ${
                s.detected
                  ? "ring-1 ring-primary/40"
                  : "opacity-50 hover:opacity-80"
              }`}
              style={{
                borderLeft: `3px solid ${
                  s.detected ? "var(--op-index)" : "var(--border)"
                }`,
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs w-6 h-6 grid place-items-center rounded-full border"
                    style={{
                      borderColor: s.detected
                        ? "var(--op-index)"
                        : "var(--border)",
                      color: s.detected
                        ? "var(--op-index)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <h4 className="font-mono text-sm font-semibold tracking-wide">
                    {s.stage}
                  </h4>
                  {s.detected ? (
                    <span
                      className="op-chip"
                      style={{ color: "var(--op-index)" }}
                    >
                      detected
                    </span>
                  ) : (
                    <span className="op-chip text-muted-foreground">skipped</span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {s.purpose}
                </span>
              </div>

              {s.detected && (
                <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
                  <Field title="What the DB does">{s.doing}</Field>
                  <Field title="Example">
                    <code className="font-mono text-xs">{s.example}</code>
                  </Field>
                  <Field title="Why before the next stage">{s.whyBefore}</Field>
                </div>
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                className="grid place-items-center py-1"
                aria-hidden
              >
                <span
                  className={`text-lg ${stages[i + 1].detected || s.detected ? "text-primary" : "text-muted-foreground/40"}`}
                >
                  ↓
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {title}
      </div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}
