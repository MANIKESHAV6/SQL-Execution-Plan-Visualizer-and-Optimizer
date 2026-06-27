// Plan-tree visualizer. Each node is clickable — opens a detailed educational
// dialog. When Learning Mode is ON, a compact hover card also previews the
// operator's purpose without requiring a click.

import { useState } from "react";
import type { OperatorType, PlanNode } from "@/lib/sql/types";
import { OPERATOR_INFO, type OperatorKey } from "@/lib/sql/operatorInfo";
import { OperatorDetailsDialog } from "./OperatorDetailsDialog";
import { useLearningMode } from "./LearningMode";

const OP_COLOR: Record<OperatorType, string> = {
  TABLE_SCAN: "text-[color:var(--color-op-scan)]",
  INDEX_SCAN: "text-[color:var(--color-op-index)]",
  FILTER: "text-[color:var(--color-op-filter)]",
  PROJECT: "text-[color:var(--color-op-project)]",
  JOIN: "text-[color:var(--color-op-join)]",
  SORT: "text-[color:var(--color-op-sort)]",
  GROUP_BY: "text-[color:var(--color-op-group)]",
};

function Node({
  node,
  depth = 0,
  onSelect,
}: {
  node: PlanNode;
  depth?: number;
  onSelect: (op: OperatorKey) => void;
}) {
  const [open, setOpen] = useState(true);
  const { learning } = useLearningMode();
  const hasChildren = node.children.length > 0;
  const info = OPERATOR_INFO[node.type as OperatorKey];

  return (
    <div className="node-anim" style={{ animationDelay: `${depth * 60}ms` }}>
      <div
        className="flex items-start gap-3 py-1.5 group/row relative"
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
        <button
          type="button"
          onClick={() => onSelect(node.type as OperatorKey)}
          className="flex-1 min-w-0 text-left rounded-md px-2 py-1 -mx-2 hover:bg-muted/40 focus:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
          title="Click for details"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`op-chip ${OP_COLOR[node.type]}`}>
              {node.type}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              cost {node.cost}
            </span>
            <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover/row:opacity-100 transition">
              click for details
            </span>
          </div>
          <div className="font-mono text-sm text-foreground/90 mt-0.5 truncate">
            {node.description}
          </div>
        </button>

        {/* Learning Mode hover card */}
        {learning && info && (
          <div className="pointer-events-none absolute left-12 top-full z-20 mt-1 w-80 max-w-[90vw] panel p-3 text-xs opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 transition shadow-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="op-chip" style={{ color: "var(--op-index)" }}>
                {info.key}
              </span>
              <span className="op-chip text-muted-foreground">
                {info.complexity}
              </span>
            </div>
            <div className="font-semibold text-sm mb-1">{info.label}</div>
            <p className="text-muted-foreground mb-2">{info.purpose}</p>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Tip
            </div>
            <p>{info.tips[0]}</p>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 mb-0.5">
              Interview
            </div>
            <p className="italic">{info.interview[0]}</p>
          </div>
        )}
      </div>
      {open && hasChildren && (
        <div
          className="border-l border-border/70 ml-[18px]"
          style={{ marginLeft: depth * 18 + 18 }}
        >
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} onSelect={onSelect} />
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
  const [selected, setSelected] = useState<OperatorKey | null>(null);
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
        <Node node={plan} onSelect={setSelected} />
      </div>
      <OperatorDetailsDialog
        operator={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
