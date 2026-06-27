// Concept → interview-question library. Detected SQL concepts drive which
// cards appear in the Interview Prep tab.

export interface InterviewCard {
  concept: string;
  difficulty: "Basic" | "Intermediate" | "Advanced";
  questions: string[];
  followups: string[];
  mistakes: string[];
  bestPractices: string[];
  performance: string[];
}

const LIBRARY: Record<string, InterviewCard> = {
  SELECT: {
    concept: "SELECT",
    difficulty: "Basic",
    questions: [
      "What is the difference between SELECT * and listing columns explicitly?",
      "Can SELECT exist without FROM? In what scenarios?",
    ],
    followups: [
      "How does the optimizer use the projection list to choose index-only scans?",
    ],
    mistakes: [
      "Using SELECT * in production code.",
      "Selecting non-aggregated columns alongside aggregates without GROUP BY.",
    ],
    bestPractices: [
      "Project only what the caller needs.",
      "Alias computed expressions for readability.",
    ],
    performance: [
      "Fewer columns = narrower tuples = more rows per page.",
    ],
  },
  WHERE: {
    concept: "WHERE",
    difficulty: "Basic",
    questions: [
      "Difference between WHERE and HAVING?",
      "Explain predicate pushdown with an example.",
      "Why does the order of AND predicates rarely matter to the optimizer?",
    ],
    followups: ["What is selectivity and how does it drive index choice?"],
    mistakes: [
      "Putting aggregate functions inside WHERE.",
      "Wrapping indexed columns in functions (kills index usage).",
    ],
    bestPractices: ["Filter as early as possible in the plan."],
    performance: [
      "Sargable predicates (column = const) can use indexes; non-sargable cannot.",
    ],
  },
  JOIN: {
    concept: "JOIN",
    difficulty: "Intermediate",
    questions: [
      "Difference between INNER JOIN and LEFT JOIN?",
      "Explain Nested Loop vs Hash Join vs Merge Join.",
      "Why does join order affect performance?",
      "Can indexes improve JOIN performance? On which columns?",
    ],
    followups: [
      "What is a Cartesian product and how do you accidentally create one?",
      "How does the optimizer decide join order?",
    ],
    mistakes: [
      "Forgetting the ON clause (Cartesian product).",
      "Joining unindexed columns on large tables.",
    ],
    bestPractices: [
      "Always index both sides of the join key.",
      "Prefer explicit JOIN syntax over comma-joins.",
    ],
    performance: ["Join smallest result set first to keep intermediates small."],
  },
  "GROUP BY": {
    concept: "GROUP BY",
    difficulty: "Intermediate",
    questions: [
      "How does GROUP BY work internally?",
      "Difference between Hash Aggregate and Sort + Group?",
      "Why must non-aggregated SELECT columns appear in GROUP BY?",
    ],
    followups: ["What is GROUPING SETS / ROLLUP / CUBE?"],
    mistakes: ["Mixing aggregated and non-aggregated columns without grouping."],
    bestPractices: [
      "Filter with WHERE before grouping, with HAVING after.",
    ],
    performance: [
      "Indexes on group keys can enable sort-free aggregation.",
    ],
  },
  HAVING: {
    concept: "HAVING",
    difficulty: "Intermediate",
    questions: [
      "Difference between WHERE and HAVING?",
      "Give an example where HAVING is required.",
    ],
    followups: ["Why is HAVING usually slower than WHERE?"],
    mistakes: ["Putting row-level predicates in HAVING instead of WHERE."],
    bestPractices: ["Only put aggregate-level conditions in HAVING."],
    performance: ["HAVING runs AFTER the expensive GROUP BY."],
  },
  "ORDER BY": {
    concept: "ORDER BY",
    difficulty: "Basic",
    questions: [
      "Can ORDER BY be eliminated by an index?",
      "What is a Top-N sort?",
    ],
    followups: ["How does work_mem affect external sorts?"],
    mistakes: ["ORDER BY without LIMIT on huge result sets."],
    bestPractices: ["Always pair ORDER BY with LIMIT when only Top-N is needed."],
    performance: ["A SORT can spill to disk — keep working sets small."],
  },
  Subquery: {
    concept: "Subquery",
    difficulty: "Intermediate",
    questions: [
      "Correlated vs uncorrelated subquery — define both.",
      "When would you choose EXISTS over IN?",
    ],
    followups: ["Can the planner rewrite IN (SELECT …) as a semi-join?"],
    mistakes: ["Correlated subqueries on large tables."],
    bestPractices: ["Lift repeated subqueries into a CTE."],
    performance: [
      "Correlated subqueries can degrade to O(N×M).",
    ],
  },
  Aggregation: {
    concept: "Aggregation",
    difficulty: "Intermediate",
    questions: [
      "List the standard aggregate functions and what they ignore (NULL?).",
      "Difference between COUNT(*) and COUNT(column)?",
    ],
    followups: ["What is FILTER (WHERE …) inside an aggregate?"],
    mistakes: ["Assuming COUNT(col) counts NULLs."],
    bestPractices: ["Use COUNT(*) for row counts unless you need NULL filtering."],
    performance: ["Aggregates collapse rows — they always sit above the data."],
  },
  "Window Function": {
    concept: "Window Function",
    difficulty: "Advanced",
    questions: [
      "RANK vs DENSE_RANK vs ROW_NUMBER — what are the differences?",
      "Solve Top-N-per-group with a window function.",
      "Explain PARTITION BY vs GROUP BY.",
    ],
    followups: ["What is a window frame (ROWS BETWEEN …)?"],
    mistakes: ["Using window functions inside WHERE (not allowed)."],
    bestPractices: [
      "Index PARTITION BY + ORDER BY to avoid sorts.",
      "Wrap window output in a CTE to filter on it.",
    ],
    performance: ["Each window may require a sort per partition."],
  },
  CTE: {
    concept: "CTE",
    difficulty: "Advanced",
    questions: [
      "What is a CTE and when is it materialized?",
      "Explain a recursive CTE with an example.",
    ],
    followups: ["CTE vs derived table vs view — when to use each?"],
    mistakes: ["Assuming a CTE is always an optimization barrier (depends on engine/version)."],
    bestPractices: ["Use CTEs to flatten nested subqueries."],
    performance: ["Modern PostgreSQL inlines non-recursive CTEs by default."],
  },
  UNION: {
    concept: "UNION",
    difficulty: "Intermediate",
    questions: ["UNION vs UNION ALL — what's the difference?"],
    followups: ["When would EXCEPT or INTERSECT be more appropriate?"],
    mistakes: ["Using UNION when UNION ALL would suffice (extra dedup cost)."],
    bestPractices: ["Prefer UNION ALL unless deduplication is required."],
    performance: ["UNION sorts and dedups; UNION ALL does not."],
  },
  DISTINCT: {
    concept: "DISTINCT",
    difficulty: "Basic",
    questions: ["When is DISTINCT a code smell?"],
    followups: ["How does DISTINCT differ from GROUP BY with no aggregates?"],
    mistakes: ["Using DISTINCT to hide a JOIN cardinality bug."],
    bestPractices: ["Find the source of duplicates before reaching for DISTINCT."],
    performance: ["DISTINCT requires a hash or sort over the result set."],
  },
  LIMIT: {
    concept: "LIMIT",
    difficulty: "Basic",
    questions: ["How does LIMIT change the cost of ORDER BY?"],
    followups: ["What is keyset pagination and why is it preferred over OFFSET?"],
    mistakes: ["High OFFSET values on large tables."],
    bestPractices: ["Pair ORDER BY with LIMIT for Top-N."],
    performance: ["Top-N sort is O(N log K) — much cheaper than full sort."],
  },
};

const GENERIC: InterviewCard = {
  concept: "Execution Plans",
  difficulty: "Basic",
  questions: [
    "What is an execution plan?",
    "Difference between TABLE_SCAN and INDEX_SCAN?",
    "What does the cost number in EXPLAIN actually represent?",
  ],
  followups: ["What does ANALYZE add on top of EXPLAIN?"],
  mistakes: ["Trusting cost estimates without ANALYZE / statistics."],
  bestPractices: ["Always read the plan bottom-up."],
  performance: ["Cost-based optimization needs fresh statistics."],
};

export function buildInterviewCards(detected: string[]): InterviewCard[] {
  const out: InterviewCard[] = [];
  for (const c of detected) {
    if (LIBRARY[c]) out.push(LIBRARY[c]);
  }
  // Always include the planner-fundamentals card.
  out.push(GENERIC);
  // Stable order: by difficulty then concept name.
  const order = { Basic: 0, Intermediate: 1, Advanced: 2 } as const;
  return out.sort(
    (a, b) =>
      order[a.difficulty] - order[b.difficulty] ||
      a.concept.localeCompare(b.concept),
  );
}
