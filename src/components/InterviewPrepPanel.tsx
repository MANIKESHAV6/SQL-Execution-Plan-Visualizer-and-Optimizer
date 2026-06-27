// Interview-prep tab. Cards generated from the concepts the analyzer detected
// in the current query.

import type { InterviewCard } from "@/lib/sql/interviewPrep";

const DIFF_COLOR: Record<InterviewCard["difficulty"], string> = {
  Basic: "var(--op-scan)",
  Intermediate: "var(--op-filter)",
  Advanced: "var(--op-join)",
};

export function InterviewPrepPanel({ cards }: { cards: InterviewCard[] }) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-lg font-semibold tracking-tight">
          Interview Preparation
        </h3>
        <p className="text-xs text-muted-foreground">
          Questions automatically generated from the concepts your query touches.
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {cards.map((c) => (
          <article
            key={c.concept}
            className="panel p-5 flex flex-col gap-3 hover:translate-y-[-1px] transition"
          >
            <header className="flex items-center justify-between">
              <h4 className="font-semibold tracking-tight">{c.concept}</h4>
              <span
                className="op-chip"
                style={{ color: DIFF_COLOR[c.difficulty] }}
              >
                {c.difficulty}
              </span>
            </header>

            <Group title="Top Interview Questions" items={c.questions} bullet="Q" />
            <Group
              title="Expected Follow-ups"
              items={c.followups}
              bullet="↳"
              dim
            />
            <Group
              title="Common Mistakes"
              items={c.mistakes}
              bullet="✗"
              color="var(--op-filter)"
            />
            <Group
              title="Best Practices"
              items={c.bestPractices}
              bullet="✓"
              color="var(--op-index)"
            />
            <Group
              title="Performance Tips"
              items={c.performance}
              bullet="⚡"
              color="var(--op-scan)"
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function Group({
  title,
  items,
  bullet,
  color,
  dim,
}: {
  title: string;
  items: string[];
  bullet: string;
  color?: string;
  dim?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
        {title}
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((q, i) => (
          <li
            key={i}
            className={`text-sm flex gap-2 ${dim ? "text-muted-foreground" : ""}`}
          >
            <span
              className="font-mono text-xs mt-0.5"
              style={{ color: color ?? "var(--primary)" }}
            >
              {bullet}
            </span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
