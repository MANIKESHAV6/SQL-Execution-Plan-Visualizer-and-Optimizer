// Learning Assistant tab: syntax advisor, hints, approach guide,
// simplification tips, and concept detector. Pure presentation — all data
// comes from src/lib/sql/intelligence.ts.

import type {
  ApproachGuide,
  ConceptInfo,
  LearningHint,
  SimplificationTip,
  SyntaxIssue,
} from "@/lib/sql/intelligence";

interface Props {
  syntax: SyntaxIssue[];
  hints: LearningHint[];
  approaches: ApproachGuide[];
  simplifications: SimplificationTip[];
  concepts: ConceptInfo[];
}

const toneColor: Record<string, string> = {
  info: "var(--op-scan)",
  warn: "var(--op-filter)",
  critical: "var(--destructive)",
};

export function LearningAssistant({
  syntax,
  hints,
  approaches,
  simplifications,
  concepts,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="SQL Syntax Advisor" subtitle="Rule-based static checks">
        {syntax.length === 0 ? (
          <Empty>No obvious syntax or logic issues detected.</Empty>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {syntax.map((s, i) => (
              <div
                key={i}
                className="panel p-4 flex flex-col gap-2"
                style={{ borderLeft: `3px solid ${toneColor[s.severity]}` }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-sm font-semibold">{s.type}</h4>
                  <span
                    className="op-chip"
                    style={{ color: toneColor[s.severity] }}
                  >
                    {s.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{s.explanation}</p>
                {s.fix && (
                  <pre className="font-mono text-xs bg-muted/40 rounded-md p-2 whitespace-pre-wrap">
                    {s.fix}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Learning Hints" subtitle="Concept-aware tips">
        {hints.length === 0 ? (
          <Empty>No hints — your query covers its concepts cleanly.</Empty>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hints.map((h, i) => (
              <div key={i} className="panel p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-semibold">{h.title}</h4>
                  <span
                    className="op-chip"
                    style={{ color: toneColor[h.tone] }}
                  >
                    hint
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{h.body}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Query Approach Guide"
        subtitle="Common patterns and the standard ways to solve them"
      >
        <div className="grid md:grid-cols-2 gap-3">
          {approaches.map((a, i) => (
            <div key={i} className="panel p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-sm font-semibold">{a.pattern}</h4>
                <span className="op-chip" style={{ color: "var(--op-join)" }}>
                  {a.difficulty}
                </span>
              </div>
              <ol className="flex flex-col gap-2">
                {a.approaches.map((ap, j) => (
                  <li
                    key={j}
                    className="rounded-md bg-muted/30 p-2.5 text-sm"
                  >
                    <div className="font-mono text-xs text-primary mb-0.5">
                      Approach {j + 1} · {ap.name}
                    </div>
                    <div className="text-muted-foreground">{ap.outline}</div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-1.5">
                {a.concepts.map((c) => (
                  <span
                    key={c}
                    className="op-chip"
                    style={{ color: "var(--op-project)" }}
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Query Simplification Advisor"
        subtitle="Readability and maintainability"
      >
        {simplifications.length === 0 ? (
          <Empty>Query reads cleanly — no simplification suggestions.</Empty>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {simplifications.map((t, i) => (
              <div key={i} className="panel p-4">
                <h4 className="font-mono text-sm font-semibold mb-1">
                  {t.pattern}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{t.problem}</p>
                <div className="text-sm">
                  <span className="text-primary font-medium">Suggested:</span>{" "}
                  {t.suggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Concept Detector"
        subtitle="What this query is teaching you"
      >
        {concepts.length === 0 ? (
          <Empty>No concepts detected yet.</Empty>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {concepts.map((c) => (
              <div key={c.name} className="panel p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-mono text-sm font-semibold">{c.name}</h4>
                  <span
                    className="op-chip"
                    style={{
                      color:
                        c.category === "Advanced"
                          ? "var(--op-join)"
                          : c.category === "Intermediate"
                            ? "var(--op-filter)"
                            : "var(--op-scan)",
                    }}
                  >
                    {c.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {c.explanation}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  <span className="text-foreground/80">Why:</span> {c.why}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel p-4 text-sm text-muted-foreground">{children}</div>
  );
}
