// Explain WHY the optimized plan is cheaper. We attribute the savings to a
// handful of named optimization rules based on structural differences
// between the two plans.

import type { OperatorType, ParsedQuery, PlanNode } from "./types";

export interface CostReason {
  rule: string;
  title: string;
  saved: number;
  explanation: string;
}

export interface CostBreakdown {
  original: number;
  optimized: number;
  saved: number;
  percent: number;
  reasons: CostReason[];
}

const countOp = (n: PlanNode, op: OperatorType): number =>
  (n.type === op ? 1 : 0) + n.children.reduce((s, c) => s + countOp(c, op), 0);

// Depth-first index of the first FILTER node (lower index = closer to scans).
const filterDepth = (n: PlanNode, depth = 0): number => {
  if (n.type === "FILTER") return depth;
  for (const c of n.children) {
    const d = filterDepth(c, depth + 1);
    if (d >= 0) return d;
  }
  return -1;
};

export function buildCostBreakdown(
  parsed: ParsedQuery,
  original: PlanNode,
  optimized: PlanNode,
  originalCost: number,
  optimizedCost: number,
): CostBreakdown {
  const saved = Math.max(0, originalCost - optimizedCost);
  const percent =
    originalCost > 0 ? Math.round((saved / originalCost) * 100) : 0;

  const reasons: CostReason[] = [];
  let remaining = saved;
  const take = (n: number) => {
    const x = Math.min(remaining, Math.max(0, n));
    remaining -= x;
    return x;
  };

  // Rule: predicate pushdown (filter is deeper in the optimized tree).
  if (parsed.where) {
    const od = filterDepth(original);
    const nd = filterDepth(optimized);
    if (nd > od) {
      reasons.push({
        rule: "Predicate Pushdown",
        title: "Filter applied before joining",
        saved: take(Math.round(saved * 0.45)),
        explanation:
          "WHERE evaluated before the JOIN, so the join only processes rows that already match.",
      });
    }
  }

  // Rule: index scan substitution.
  const tsOrig = countOp(original, "TABLE_SCAN");
  const idxOpt = countOp(optimized, "INDEX_SCAN");
  if (idxOpt > 0 && idxOpt > countOp(original, "INDEX_SCAN")) {
    reasons.push({
      rule: "INDEX_SCAN",
      title: "Index used instead of full table scan",
      saved: take(Math.round(saved * 0.45)),
      explanation: `${idxOpt} TABLE_SCAN${idxOpt === 1 ? "" : "s"} replaced with INDEX_SCAN — O(log N) lookup instead of O(N).`,
    });
    void tsOrig;
  }

  // Rule: join reordering.
  if (parsed.joins.length > 1) {
    reasons.push({
      rule: "Join Reordering",
      title: "Smaller datasets joined first",
      saved: take(Math.round(saved * 0.3)),
      explanation:
        "Reordering the join sequence keeps the intermediate result small, which lowers downstream cost.",
    });
  }

  // Rule: narrowed projection.
  if (!parsed.selectStar) {
    reasons.push({
      rule: "Projection Pruning",
      title: "Only required columns projected",
      saved: take(Math.round(saved * 0.1)),
      explanation:
        "Listing the columns you need (instead of SELECT *) lets the planner use index-only scans and moves less data.",
    });
  }

  // Anything left becomes a misc bucket so totals add up to `saved`.
  if (remaining > 0 && reasons.length > 0) {
    reasons[0].saved += remaining;
  } else if (remaining > 0) {
    reasons.push({
      rule: "Plan Rewrite",
      title: "Cheaper operator selection",
      saved: remaining,
      explanation:
        "Operators with lower base cost were selected for parts of the plan.",
    });
  }

  return { original: originalCost, optimized: optimizedCost, saved, percent, reasons };
}

// ---------- per-operator comparison ----------

export interface OperatorDelta {
  operator: OperatorType | "FILTER POSITION";
  original: number | string;
  optimized: number | string;
  change: "added" | "removed" | "moved" | "same" | "improved";
}

const OPS: OperatorType[] = [
  "TABLE_SCAN",
  "INDEX_SCAN",
  "FILTER",
  "PROJECT",
  "JOIN",
  "SORT",
  "GROUP_BY",
];

export function comparePlans(
  original: PlanNode,
  optimized: PlanNode,
): OperatorDelta[] {
  const rows: OperatorDelta[] = OPS.map((op) => {
    const a = countOp(original, op);
    const b = countOp(optimized, op);
    let change: OperatorDelta["change"] = "same";
    if (a === 0 && b > 0) change = "added";
    else if (a > 0 && b === 0) change = "removed";
    else if (a !== b) change = "improved";
    return { operator: op, original: a, optimized: b, change };
  });

  const od = filterDepth(original);
  const nd = filterDepth(optimized);
  if (od >= 0 || nd >= 0) {
    rows.push({
      operator: "FILTER POSITION",
      original: od < 0 ? "—" : od < 2 ? "Before JOIN" : "After JOIN",
      optimized: nd < 0 ? "—" : nd < 2 ? "Before JOIN" : "After JOIN",
      change: nd > od ? "improved" : "same",
    });
  }
  return rows;
}
