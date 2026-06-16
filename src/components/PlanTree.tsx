import { useState } from "react";
import type { OperatorType, PlanNode } from "@/lib/sql/types";

const OP_COLOR: Record<OperatorType, string> = {
  TABLE_SCAN: "text-[color:var(--color-op-scan)]",
  INDEX_SCAN: "text-[color:var(--color-op-index)]",
  FILTER: "text-[color:var(--color-op-filter)]",
  PROJECT: "text-[color:var(--color-op-project)]",
  JOIN: "text-[color:var(--color-op-join)]",
  SORT: "text-[color:var(--color-op-sort)]",
  GROUP_BY: "text-[color:var(--color-op-group)]",
};

function Node({ node, depth = 0 }: { node: PlanNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <div className="node-anim" style={{ animationDelay: `${depth * 60}ms` }}>
      <div
        className="flex items-start gap-3 py-1.5"
        style={{ paddingLeft: depth * 18 }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={!hasChildren}
          aria-label={open ? "collapse" : "expand"}
          className="mt-1 w-4 h-4 grid place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          {hasChildren ? (open ? "▾" : "▸") : "•"}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`op-chip ${OP_COLOR[node.type]}`}>
              {node.type}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              cost {node.cost}
            </span>
          </div>
          <div className="font-mono text-sm text-foreground/90 mt-0.5 truncate">
            {node.description}
          </div>
        </div>
      </div>
      {open && hasChildren && (
        <div
          className="border-l border-border/70 ml-[18px]"
          style={{ marginLeft: depth * 18 + 18 }}
        >
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  title: string;
  subtitle?: string;
  plan: PlanNode;
  cost: number;
  actions?: React.ReactNode;
}

export function PlanTree({ title, subtitle, plan, cost, actions }: Props) {
  return (
    <section className="panel p-5 flex flex-col gap-4 h-full">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
            Σ cost <span className="text-primary font-semibold">{cost}</span>
          </div>
          {actions}
        </div>
      </header>
      <div className="overflow-auto -mx-2 px-2">
        <Node node={plan} />
      </div>
    </section>
  );
}
