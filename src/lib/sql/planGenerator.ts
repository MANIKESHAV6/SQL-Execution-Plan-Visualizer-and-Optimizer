// Build a relational-algebra-style execution plan tree from a ParsedQuery.
// Naive order (matches a textbook unoptimized plan):
//   scans -> joins -> filter -> group -> sort -> project

import { OPERATOR_COST } from "./costEstimator";
import type { OperatorType, ParsedQuery, PlanNode } from "./types";

let idCounter = 0;
const nextId = () => `n${++idCounter}`;

const node = (
  type: OperatorType,
  description: string,
  children: PlanNode[] = [],
  costOverride?: number,
): PlanNode => ({
  id: nextId(),
  type,
  description,
  cost: costOverride ?? OPERATOR_COST[type],
  children,
});

/** Naive execution plan: filter applied AFTER joins. */
export function buildOriginalPlan(q: ParsedQuery): PlanNode {
  idCounter = 0;

  // 1. Scans for each base/joined table.
  let current: PlanNode = node("TABLE_SCAN", `scan ${q.tables[0]}`);
  // Additional FROM tables (cross product, rare in our subset)
  for (let i = 1; i < q.tables.length; i++) {
    current = node("JOIN", `cross join ${q.tables[i]}`, [
      current,
      node("TABLE_SCAN", `scan ${q.tables[i]}`),
    ]);
  }
  // 2. Joins in declared order, no reordering.
  for (const j of q.joins) {
    current = node("JOIN", `join ${j.table} on ${j.on}`, [
      current,
      node("TABLE_SCAN", `scan ${j.table}`),
    ]);
  }
  // 3. Filter AFTER joins (unoptimized).
  if (q.where) {
    current = node("FILTER", q.where, [current]);
  }
  // 4. Group by.
  if (q.groupBy.length) {
    current = node("GROUP_BY", q.groupBy.join(", "), [current]);
  }
  // 5. Sort.
  if (q.orderBy.length) {
    current = node("SORT", q.orderBy.join(", "), [current]);
  }
  // 6. Project.
  current = node("PROJECT", q.columns.join(", "), [current]);
  return current;
}

/** Optimized plan: filter pushdown, index scan on filtered columns,
 *  reorder joins smallest-first (approximated by declared order reversed
 *  when more than one join exists). */
export function buildOptimizedPlan(q: ParsedQuery): PlanNode {
  idCounter = 0;

  // Detect a filter on the first base table to push down + use index scan.
  const firstTable = q.tables[0];
  const filterMentionsBase =
    q.where && new RegExp(`\\b${firstTable}\\b|^[^.]+\\s*[=<>]`).test(q.where);

  let current: PlanNode;
  if (q.where && filterMentionsBase) {
    // Push filter onto an index scan of the base table.
    current = node("INDEX_SCAN", `scan ${firstTable} using index`);
    current = node("FILTER", q.where, [current]);
  } else {
    current = node("TABLE_SCAN", `scan ${firstTable}`);
  }

  // Reorder joins: when more than one, join smaller tables first
  // (approximation: reverse declared order).
  const joins = q.joins.length > 1 ? [...q.joins].reverse() : q.joins;
  for (const j of joins) {
    current = node("JOIN", `join ${j.table} on ${j.on}`, [
      current,
      node("INDEX_SCAN", `scan ${j.table} using index`),
    ]);
  }

  // If the WHERE didn't reference the base, apply it once after joins.
  if (q.where && !filterMentionsBase) {
    current = node("FILTER", q.where, [current]);
  }

  if (q.groupBy.length) {
    current = node("GROUP_BY", q.groupBy.join(", "), [current]);
  }
  if (q.orderBy.length) {
    current = node("SORT", q.orderBy.join(", "), [current]);
  }
  // PROJECT only the columns actually needed (cheaper if not SELECT *).
  const projDesc = q.selectStar ? "*" : q.columns.join(", ");
  const projCost = q.selectStar ? 10 : 5;
  current = node("PROJECT", projDesc, [current], projCost);
  return current;
}
