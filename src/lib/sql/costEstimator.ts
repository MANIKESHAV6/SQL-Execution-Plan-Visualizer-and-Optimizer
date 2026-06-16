// Toy DBMS cost model. Per-operator base costs are deliberately simple
// so the visualization is easy to reason about.

import type { OperatorType, PlanNode } from "./types";

export const OPERATOR_COST: Record<OperatorType, number> = {
  TABLE_SCAN: 100,
  INDEX_SCAN: 10,
  FILTER: 20,
  PROJECT: 5,
  JOIN: 150,
  SORT: 50,
  GROUP_BY: 40,
};

export function totalCost(node: PlanNode): number {
  return node.cost + node.children.reduce((s, c) => s + totalCost(c), 0);
}
