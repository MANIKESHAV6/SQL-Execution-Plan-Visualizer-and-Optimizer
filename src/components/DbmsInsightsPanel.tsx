// Real DBMS Insights — how PostgreSQL, MySQL, and SQLite handle each
// optimizer rule that this educational tool implements.

import { DBMS_INSIGHTS } from "@/lib/sql/dbmsInsights";

const PROJECT_COLOR: Record<string, string> = {
  "This Project": "var(--op-scan)",
  PostgreSQL: "var(--op-index)",
  MySQL: "var(--op-join)",
  SQLite: "var(--op-project)",
};

export function DbmsInsightsPanel() {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-lg font-semibold tracking-tight">
          Real DBMS Insights
        </h3>
        <p className="text-xs text-muted-foreground">
          Compare this educational implementation to real-world database engines.
        </p>
      </section>

      <div className="grid gap-4">
        {DBMS_INSIGHTS.map((rule) => (
          <details
            key={rule.rule}
            className="panel p-0 overflow-hidden group"
            open
          >
            <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition">
              <div className="flex items-center gap-3">
                <span className="op-chip" style={{ color: "var(--op-index)" }}>
                  rule
                </span>
                <h4 className="font-semibold tracking-tight">{rule.rule}</h4>
              </div>
              <span className="text-muted-foreground text-sm group-open:rotate-180 transition">
                ▾
              </span>
            </summary>
            <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border">
              <p className="text-sm text-muted-foreground mt-3">
                <span className="text-foreground/80 font-medium">Purpose:</span>{" "}
                {rule.purpose}
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <MiniList
                  title="Advantages"
                  items={rule.advantages}
                  color="var(--op-index)"
                />
                <MiniList
                  title="Limitations"
                  items={rule.limitations}
                  color="var(--op-filter)"
                />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {rule.behaviours.map((b) => (
                  <div
                    key={b.project}
                    className="rounded-md border p-3"
                    style={{
                      borderColor: `color-mix(in oklab, ${
                        PROJECT_COLOR[b.project] ?? "var(--border)"
                      } 35%, transparent)`,
                      background: `color-mix(in oklab, ${
                        PROJECT_COLOR[b.project] ?? "var(--border)"
                      } 8%, transparent)`,
                    }}
                  >
                    <div
                      className="font-mono text-xs uppercase tracking-widest mb-1"
                      style={{ color: PROJECT_COLOR[b.project] }}
                    >
                      {b.project}
                    </div>
                    <div className="text-sm">{b.behaviour}</div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function MiniList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted/20 p-3">
      <div
        className="text-[10px] font-mono uppercase tracking-widest mb-1.5"
        style={{ color }}
      >
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span style={{ color }}>›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
