// Logical SQL execution-order analyzer. Returns one entry per stage, in the
// order the database actually evaluates them — which is NOT the order they
// appear in the source text.

export interface ExecutionStage {
  stage: string;
  detected: boolean;
  purpose: string;
  doing: string;
  example: string;
  whyBefore: string; // why this stage runs before the next one
}

const STAGES: Omit<ExecutionStage, "detected">[] = [
  {
    stage: "FROM",
    purpose: "Identify the base relations the query reads.",
    doing:
      "The database resolves table names, opens the heap, and prepares scan operators for each one.",
    example: "FROM employees",
    whyBefore:
      "Every later step needs rows to operate on — you must read the source tables first.",
  },
  {
    stage: "JOIN",
    purpose: "Combine rows from multiple relations on a matching condition.",
    doing:
      "Builds the combined tuples by Nested Loop, Hash Join, or Merge Join depending on cost.",
    example: "JOIN departments ON departments.id = employees.dept_id",
    whyBefore:
      "The JOIN result is the working set for WHERE / GROUP BY / SELECT.",
  },
  {
    stage: "WHERE",
    purpose: "Drop rows that don't satisfy row-level predicates.",
    doing: "Evaluates the predicate per row and discards non-matches.",
    example: "WHERE salary > 50000",
    whyBefore:
      "Filtering before grouping shrinks the input to the expensive aggregate.",
  },
  {
    stage: "GROUP BY",
    purpose: "Bucket the surviving rows into groups by key columns.",
    doing:
      "Builds a hash table (or sorts) so aggregates can be computed per group.",
    example: "GROUP BY dept_id",
    whyBefore:
      "HAVING needs aggregated buckets — grouping has to happen first.",
  },
  {
    stage: "HAVING",
    purpose: "Filter the aggregated GROUPS using aggregate-level conditions.",
    doing: "Re-applies a predicate, this time on the per-group output.",
    example: "HAVING AVG(salary) > 60000",
    whyBefore: "SELECT can only project from groups that survived HAVING.",
  },
  {
    stage: "SELECT",
    purpose: "Project the columns and expressions the user asked for.",
    doing:
      "Computes scalar expressions, evaluates window functions, and produces the final tuple shape.",
    example: "SELECT dept_id, AVG(salary) AS avg_pay",
    whyBefore:
      "DISTINCT / ORDER BY / LIMIT operate on the projected output, so SELECT must run before them.",
  },
  {
    stage: "DISTINCT",
    purpose: "Remove duplicate projected rows.",
    doing: "Performs a hash or sort dedup on the SELECT output.",
    example: "SELECT DISTINCT dept_id ...",
    whyBefore: "ORDER BY and LIMIT see the deduplicated set.",
  },
  {
    stage: "ORDER BY",
    purpose: "Sort the result by the requested keys.",
    doing:
      "Performs in-memory or external sort; can be skipped if input is already sorted by the key (e.g. via index).",
    example: "ORDER BY avg_pay DESC",
    whyBefore: "LIMIT picks the top N from a fully ordered result.",
  },
  {
    stage: "LIMIT",
    purpose: "Cut the result down to N rows (Top-N).",
    doing: "Stops requesting rows once the row budget is hit.",
    example: "LIMIT 10",
    whyBefore: "Final step — there is nothing after LIMIT.",
  },
];

const hasKw = (sql: string, kw: string) =>
  new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "i").test(sql);

export function executionOrder(raw: string): ExecutionStage[] {
  const sql = raw;
  return STAGES.map((s) => ({
    ...s,
    detected:
      s.stage === "SELECT" || s.stage === "FROM"
        ? /\bselect\b/i.test(sql) && (s.stage === "SELECT" || /\bfrom\b/i.test(sql))
        : hasKw(sql, s.stage),
  }));
}
