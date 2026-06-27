// Educational metadata for every execution-plan operator the visualizer can
// emit, plus a few extras (WINDOW, SUBQUERY, HAVING) used by the Learning Mode
// tooltips. Pure data — no React, no parsing.

export type OperatorKey =
  | "TABLE_SCAN"
  | "INDEX_SCAN"
  | "FILTER"
  | "PROJECT"
  | "JOIN"
  | "SORT"
  | "GROUP_BY"
  | "HAVING"
  | "WINDOW"
  | "SUBQUERY";

export interface OperatorInfo {
  key: OperatorKey;
  label: string;
  category: "Scan" | "Transform" | "Combine" | "Aggregate" | "Window" | "Misc";
  complexity: "Basic" | "Intermediate" | "Advanced";
  purpose: string;
  description: string;
  example: string;
  advantages: string[];
  disadvantages: string[];
  tips: string[];
  realWorld: string;
  interview: string[];
}

export const OPERATOR_INFO: Record<OperatorKey, OperatorInfo> = {
  TABLE_SCAN: {
    key: "TABLE_SCAN",
    label: "Table Scan",
    category: "Scan",
    complexity: "Basic",
    purpose: "Read every row of a table from disk.",
    description:
      "A sequential scan walks the full heap of a relation. The optimizer chooses it when no usable index exists, statistics say most rows match, or the table is small enough that random I/O of an index lookup would cost more than a streaming read.",
    example: "SELECT name FROM users  -- no WHERE, no usable index",
    advantages: [
      "Simple — no index maintenance required.",
      "Predictable sequential I/O, very fast per row.",
      "Often cheapest when reading most of the table.",
    ],
    disadvantages: [
      "Cost grows linearly with table size.",
      "Wastes I/O when only a few rows are needed.",
      "Cannot exploit sorted access for ORDER BY.",
    ],
    tips: [
      "Add an index on filter columns to enable INDEX_SCAN.",
      "Avoid SELECT * — narrower projections allow index-only scans.",
      "Check planner statistics (ANALYZE) so cardinality estimates are accurate.",
    ],
    realWorld:
      "PostgreSQL calls this 'Seq Scan'. It is preferred whenever the planner thinks >5–10% of rows will match. MySQL calls it 'ALL' in EXPLAIN.",
    interview: [
      "When is a full table scan faster than an index scan?",
      "How does the optimizer choose between a Seq Scan and an Index Scan?",
      "What is the I/O complexity of a sequential scan?",
    ],
  },
  INDEX_SCAN: {
    key: "INDEX_SCAN",
    label: "Index Scan",
    category: "Scan",
    complexity: "Intermediate",
    purpose: "Use a secondary structure (B-tree, hash) to fetch matching rows.",
    description:
      "An index scan traverses an index to find row pointers, then fetches the matching tuples. When all needed columns live in the index itself, the table heap is skipped entirely (index-only scan).",
    example: "SELECT id FROM users WHERE email = 'a@b.com'  -- idx(email)",
    advantages: [
      "O(log N) lookup for selective predicates.",
      "Returns data already sorted on the index key.",
      "Enables index-only scans when projections fit.",
    ],
    disadvantages: [
      "Index maintenance cost on INSERT / UPDATE / DELETE.",
      "Random I/O when fetching rows from the heap.",
      "Useless if predicate is non-selective (>~20% rows).",
    ],
    tips: [
      "Index the columns most often used in WHERE and JOIN.",
      "Composite index column order matters — leftmost prefix wins.",
      "Covering indexes can eliminate the heap fetch entirely.",
    ],
    realWorld:
      "PostgreSQL: 'Index Scan', 'Index Only Scan', 'Bitmap Index Scan'. MySQL chooses indexes based on cardinality from ANALYZE TABLE.",
    interview: [
      "What's the difference between Index Scan and Index-Only Scan?",
      "Why might the planner ignore an index that exists?",
      "Explain the leftmost-prefix rule for composite indexes.",
    ],
  },
  FILTER: {
    key: "FILTER",
    label: "Filter",
    category: "Transform",
    complexity: "Basic",
    purpose: "Drop rows that don't satisfy a predicate.",
    description:
      "Implements the σ (sigma) operator from relational algebra. A pure filter does not change the schema, only the cardinality. Pushing FILTERs as close to the scan as possible — predicate pushdown — is one of the most effective optimizations.",
    example: "WHERE salary > 50000",
    advantages: [
      "Cheap to apply.",
      "Reduces row count for every downstream operator.",
    ],
    disadvantages: [
      "Applying after JOIN wastes work on rows that get discarded.",
      "Cannot use indexes by itself.",
    ],
    tips: [
      "Push filters BELOW joins whenever possible.",
      "Combine multiple ANDs to allow a single index scan.",
      "Use HAVING only for aggregate-level predicates.",
    ],
    realWorld:
      "PostgreSQL annotates this as 'Filter: ...' under the producing node. MySQL exposes it as 'Using where'.",
    interview: [
      "What is predicate pushdown?",
      "Difference between WHERE and HAVING?",
      "Why is filter ordering by selectivity important?",
    ],
  },
  PROJECT: {
    key: "PROJECT",
    label: "Project",
    category: "Transform",
    complexity: "Basic",
    purpose: "Choose which columns make it to the result.",
    description:
      "Implements π (pi) from relational algebra. Narrows the tuple width so downstream operators move less data. A projection that lists every column is the same as SELECT *, which prevents index-only scans.",
    example: "SELECT id, email FROM users",
    advantages: [
      "Reduces memory and network bandwidth.",
      "Enables covering / index-only scans.",
    ],
    disadvantages: ["No effect on row count."],
    tips: [
      "Avoid SELECT * in production code.",
      "Project early to drop unused columns from the pipeline.",
    ],
    realWorld:
      "Real planners fold projections into the producing operator (no standalone PROJECT node in EXPLAIN output).",
    interview: [
      "Why is SELECT * discouraged?",
      "What is an index-only scan and when can the planner use one?",
    ],
  },
  JOIN: {
    key: "JOIN",
    label: "Join",
    category: "Combine",
    complexity: "Intermediate",
    purpose: "Combine rows from two relations on a matching condition.",
    description:
      "Joins implement the ⋈ operator. Real systems pick between Nested Loop, Hash Join, and Merge Join based on table size, indexes, and sort orders. Join order matters a lot — bad ordering can blow up intermediate result sizes.",
    example: "FROM orders o JOIN customers c ON c.id = o.customer_id",
    advantages: ["Lets you query across normalized tables."],
    disadvantages: [
      "Can be the most expensive operator in the plan.",
      "A missing or wrong ON clause produces a Cartesian product.",
    ],
    tips: [
      "Always index both sides of the join key.",
      "Join the smallest dataset first.",
      "Prefer INNER JOIN when LEFT JOIN semantics aren't needed.",
    ],
    realWorld:
      "PostgreSQL: 'Hash Join', 'Merge Join', 'Nested Loop'. MySQL primarily uses Nested Loop with Block Nested Loop optimization, plus Hash Join from 8.0.18+.",
    interview: [
      "Difference between INNER JOIN and LEFT JOIN?",
      "When does the planner choose Hash Join over Nested Loop?",
      "Explain join reordering.",
    ],
  },
  SORT: {
    key: "SORT",
    label: "Sort",
    category: "Transform",
    complexity: "Intermediate",
    purpose: "Order rows by one or more keys.",
    description:
      "Required by ORDER BY (when no useful index exists), DISTINCT, GROUP BY (sort-based), and Merge Join. In-memory sort is fast; a spill to disk (external sort) is much slower.",
    example: "ORDER BY created_at DESC",
    advantages: ["Necessary for deterministic output and Top-N."],
    disadvantages: [
      "O(N log N) CPU cost.",
      "Sorting the entire result before LIMIT is wasteful.",
    ],
    tips: [
      "Pair ORDER BY with LIMIT whenever possible.",
      "Indexes on the sort key can eliminate the SORT entirely.",
      "Watch work_mem — spilling to disk is dramatically slower.",
    ],
    realWorld:
      "PostgreSQL exposes 'Sort Method: quicksort / external merge'. MySQL uses filesort.",
    interview: [
      "How does Top-N LIMIT change the cost of a SORT?",
      "When can a SORT be eliminated by an index?",
    ],
  },
  GROUP_BY: {
    key: "GROUP_BY",
    label: "Group By / Aggregate",
    category: "Aggregate",
    complexity: "Intermediate",
    purpose: "Bucket rows by key columns and compute aggregates per bucket.",
    description:
      "Implemented as Hash Aggregate (build hash table of groups) or Sort + Group (when input is already sorted on the group key, or when memory is tight).",
    example: "SELECT dept, AVG(salary) FROM emp GROUP BY dept",
    advantages: ["Single pass when Hash Aggregate fits in memory."],
    disadvantages: [
      "High-cardinality groupings can blow memory.",
      "Sort-based grouping pays the sort cost.",
    ],
    tips: [
      "Filter before grouping (WHERE), filter aggregates with HAVING.",
      "Index group-by columns for sort-based aggregation.",
      "Watch out for SELECTed columns that aren't aggregated or grouped.",
    ],
    realWorld:
      "PostgreSQL: 'HashAggregate' vs 'GroupAggregate'. MySQL uses 'Using temporary; Using filesort' when it falls back to sort-based grouping.",
    interview: [
      "Hash Aggregate vs Sort + Group — when does each win?",
      "Why must non-aggregated SELECT columns appear in GROUP BY?",
    ],
  },
  HAVING: {
    key: "HAVING",
    label: "Having",
    category: "Transform",
    complexity: "Intermediate",
    purpose: "Filter the OUTPUT of an aggregation.",
    description:
      "HAVING is a FILTER applied AFTER GROUP BY. The condition can reference aggregate functions like COUNT(*) or SUM(x), which WHERE cannot.",
    example: "GROUP BY dept HAVING AVG(salary) > 60000",
    advantages: ["The only way to filter on aggregate results."],
    disadvantages: [
      "Runs AFTER the expensive aggregation — cannot reduce input.",
    ],
    tips: [
      "Move row-level conditions to WHERE so they run first.",
      "Only put aggregate-level conditions in HAVING.",
    ],
    realWorld:
      "Real planners typically push WHERE below GROUP BY and HAVING above it automatically.",
    interview: [
      "WHERE vs HAVING — give an example where each is required.",
      "Why is HAVING usually more expensive than WHERE?",
    ],
  },
  WINDOW: {
    key: "WINDOW",
    label: "Window Function",
    category: "Window",
    complexity: "Advanced",
    purpose: "Compute per-row values over a window of related rows.",
    description:
      "Unlike GROUP BY, window functions (ROW_NUMBER, RANK, LAG, SUM OVER) do not collapse rows. They are the cleanest way to express Top-N-per-group, running totals, and moving averages.",
    example:
      "SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) FROM emp",
    advantages: [
      "Avoids self-joins and correlated subqueries.",
      "Often more efficient and far more readable.",
    ],
    disadvantages: [
      "Requires sorting per partition (can be expensive).",
      "Cannot be used in WHERE — wrap in a subquery / CTE.",
    ],
    tips: [
      "Index PARTITION BY + ORDER BY columns to avoid a sort.",
      "Use DENSE_RANK to handle ties correctly.",
    ],
    realWorld:
      "PostgreSQL 'WindowAgg' node. MySQL 8+ implements the same SQL:2003 spec.",
    interview: [
      "RANK vs DENSE_RANK vs ROW_NUMBER — differences?",
      "Top-N per group with and without window functions.",
    ],
  },
  SUBQUERY: {
    key: "SUBQUERY",
    label: "Subquery",
    category: "Misc",
    complexity: "Intermediate",
    purpose: "Nest one SELECT inside another expression.",
    description:
      "A subquery in FROM is a derived table; in SELECT/WHERE it can be scalar or correlated. Correlated subqueries re-execute for every outer row unless the optimizer rewrites them as semi-joins.",
    example: "WHERE id IN (SELECT user_id FROM orders WHERE total > 100)",
    advantages: ["Composable, expressive, often the most readable form."],
    disadvantages: [
      "Correlated subqueries can degrade to O(N×M).",
      "Harder for the optimizer to reason about than a JOIN.",
    ],
    tips: [
      "Rewrite IN (SELECT …) as EXISTS or JOIN when results are large.",
      "Lift repeated subqueries into a CTE.",
    ],
    realWorld:
      "PostgreSQL turns most IN/EXISTS subqueries into semi-joins. MySQL is improving but still benefits from manual rewrites.",
    interview: [
      "Correlated vs uncorrelated subquery — what's the cost difference?",
      "When would you prefer EXISTS over IN?",
    ],
  },
};

// Aliases used by the logical execution-order panel & learning-mode tooltips.
// Maps SQL-keyword stages to operator entries for tooltip reuse.
export const STAGE_TO_OPERATOR: Record<string, OperatorKey> = {
  SELECT: "PROJECT",
  PROJECT: "PROJECT",
  WHERE: "FILTER",
  FILTER: "FILTER",
  "GROUP BY": "GROUP_BY",
  GROUP_BY: "GROUP_BY",
  HAVING: "HAVING",
  "ORDER BY": "SORT",
  SORT: "SORT",
  JOIN: "JOIN",
  TABLE_SCAN: "TABLE_SCAN",
  INDEX_SCAN: "INDEX_SCAN",
  WINDOW: "WINDOW",
  SUBQUERY: "SUBQUERY",
};
