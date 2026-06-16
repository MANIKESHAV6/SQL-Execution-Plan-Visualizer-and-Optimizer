// Rule-based SQL learning & query intelligence engine.
// Pure heuristics — no LLMs, no external APIs. Operates on the raw SQL
// string so it works even when the strict parser would reject the query.

export type Severity = "info" | "warn" | "critical";

export interface SyntaxIssue {
  type: string;
  explanation: string;
  fix?: string;
  severity: Severity;
}

export interface ComplexityReport {
  tables: number;
  joins: number;
  filters: number;
  aggregations: number;
  subqueries: number;
  sorts: number;
  groupings: number;
  ctes: number;
  windowFunctions: number;
  unions: number;
  score: number; // 0-100
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  detected: string[];
  notUsed: string[];
}

export interface LearningHint {
  title: string;
  body: string;
  tone: Severity;
}

export interface ApproachGuide {
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  approaches: { name: string; outline: string }[];
  concepts: string[];
}

export interface SimplificationTip {
  pattern: string;
  problem: string;
  suggestion: string;
}

export interface ConceptInfo {
  name: string;
  category: "Basic" | "Intermediate" | "Advanced";
  explanation: string;
  why: string;
}

export interface IntelligenceReport {
  syntax: SyntaxIssue[];
  complexity: ComplexityReport;
  hints: LearningHint[];
  approaches: ApproachGuide[];
  simplifications: SimplificationTip[];
  concepts: ConceptInfo[];
}

// ---------- helpers ----------

const stripStrings = (sql: string) =>
  sql.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""');

const hasKw = (sql: string, kw: string) =>
  new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "i").test(sql);

const countKw = (sql: string, kw: string) =>
  (sql.match(new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "gi")) || [])
    .length;

const AGG_RE = /\b(avg|sum|count|min|max)\s*\(/gi;

// ---------- 1. Syntax advisor ----------

export function analyzeSyntax(raw: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const sql = stripStrings(raw);

  // Unmatched parentheses
  const opens = (sql.match(/\(/g) || []).length;
  const closes = (sql.match(/\)/g) || []).length;
  if (opens !== closes) {
    issues.push({
      type: "Unmatched parentheses",
      explanation: `Found ${opens} '(' but ${closes} ')'. Every opening parenthesis needs a matching closing one.`,
      severity: "critical",
    });
  }

  // SELECT without FROM (ignore SELECT 1, SELECT NOW() style scalar queries)
  if (/\bselect\b/i.test(sql) && !/\bfrom\b/i.test(sql)) {
    issues.push({
      type: "SELECT without FROM",
      explanation:
        "Most SELECT statements need a FROM clause to specify the source table.",
      fix: "Add: FROM <table_name>",
      severity: "warn",
    });
  }

  // Missing comma in SELECT list: two bare identifiers in a row
  const selMatch = sql.match(/\bselect\b([\s\S]*?)\bfrom\b/i);
  if (selMatch) {
    const list = selMatch[1].trim();
    // collapse function calls (..) so we don't false-flag "count (*)"
    const flat = list.replace(/\([^)]*\)/g, "()");
    if (/[A-Za-z_]\w*\s+[A-Za-z_]\w*(?!\s*(\.|\())/.test(flat) &&
        !/\bas\b/i.test(flat) && !flat.includes(",")) {
      issues.push({
        type: "Missing comma between columns",
        explanation:
          "Adjacent column names in the SELECT list must be separated by commas.",
        fix: `SELECT ${list.split(/\s+/).join(", ")} FROM ...`,
        severity: "critical",
      });
    }
  }

  // Aggregation without GROUP BY when non-aggregated columns are also selected
  if (selMatch) {
    const list = selMatch[1];
    const hasAgg = AGG_RE.test(list);
    AGG_RE.lastIndex = 0;
    const cols = list
      .split(",")
      .map((c) => c.trim())
      .filter((c) => !/\b(avg|sum|count|min|max)\s*\(/i.test(c) && c !== "*");
    if (hasAgg && cols.length > 0 && !hasKw(sql, "group by")) {
      issues.push({
        type: "Missing GROUP BY",
        explanation: `Aggregate function detected alongside non-aggregated column(s): ${cols.join(", ")}. SQL requires GROUP BY for non-aggregated columns when aggregating.`,
        fix: `Add: GROUP BY ${cols.join(", ")}`,
        severity: "critical",
      });
    }
  }

  // ORDER BY before WHERE / GROUP BY
  const ob = sql.search(/\border\s+by\b/i);
  const wh = sql.search(/\bwhere\b/i);
  const gb = sql.search(/\bgroup\s+by\b/i);
  if (ob !== -1 && wh !== -1 && ob < wh) {
    issues.push({
      type: "ORDER BY before WHERE",
      explanation:
        "ORDER BY must come after WHERE (and GROUP BY / HAVING) in the SQL clause order.",
      severity: "warn",
    });
  }
  if (ob !== -1 && gb !== -1 && ob < gb) {
    issues.push({
      type: "ORDER BY before GROUP BY",
      explanation:
        "ORDER BY belongs after GROUP BY in the standard clause order.",
      severity: "warn",
    });
  }

  // JOIN without ON
  const joinCount = countKw(sql, "join");
  const onCount = countKw(sql, "on");
  if (joinCount > 0 && onCount < joinCount && !/\bnatural\s+join\b/i.test(sql)
      && !/\bcross\s+join\b/i.test(sql)) {
    issues.push({
      type: "JOIN without ON condition",
      explanation:
        "Each JOIN should specify an ON condition (or be a CROSS/NATURAL JOIN). Missing it creates a Cartesian product.",
      fix: "JOIN <table> ON <left>.<col> = <right>.<col>",
      severity: "critical",
    });
  }

  // WHERE on aggregate (should be HAVING)
  if (hasKw(sql, "where")) {
    const whereTail = sql.split(/\bwhere\b/i)[1] || "";
    const stop = whereTail.search(/\b(group\s+by|order\s+by|limit|having)\b/i);
    const wherePart = stop >= 0 ? whereTail.slice(0, stop) : whereTail;
    if (/\b(avg|sum|count|min|max)\s*\(/i.test(wherePart)) {
      issues.push({
        type: "Aggregate inside WHERE",
        explanation:
          "Aggregate functions cannot appear in WHERE. Filter aggregated rows with HAVING instead.",
        fix: "Replace WHERE <agg>(...) ... with HAVING <agg>(...) ...",
        severity: "critical",
      });
    }
  }

  return issues;
}

// ---------- 2. Complexity analyzer ----------

const ALL_CONCEPTS = [
  "SELECT",
  "WHERE",
  "JOIN",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "Subquery",
  "Aggregation",
  "Window Function",
  "CTE",
  "UNION",
  "DISTINCT",
  "LIMIT",
];

export function analyzeComplexity(raw: string): ComplexityReport {
  const sql = stripStrings(raw);

  const joins = countKw(sql, "join");
  const tables = Math.max(1, joins + 1);
  const filters = countKw(sql, "where") +
    (sql.match(/\b(and|or)\b/gi)?.length ?? 0) * 0; // base on WHERE presence
  const aggregations = (sql.match(AGG_RE) || []).length;
  AGG_RE.lastIndex = 0;
  const subqueries = Math.max(
    0,
    (sql.match(/\(\s*select\b/gi) || []).length,
  );
  const sorts = hasKw(sql, "order by") ? 1 : 0;
  const groupings = hasKw(sql, "group by") ? 1 : 0;
  const ctes = hasKw(sql, "with") && /\bwith\b[\s\S]*\bas\s*\(/i.test(sql)
    ? (sql.match(/\bwith\b|\),\s*[a-z_]\w*\s+as\s*\(/gi)?.length ?? 1)
    : 0;
  const windowFunctions = (sql.match(/\bover\s*\(/gi) || []).length;
  const unions = countKw(sql, "union");

  const detected: string[] = [];
  if (hasKw(sql, "select")) detected.push("SELECT");
  if (hasKw(sql, "where")) detected.push("WHERE");
  if (joins) detected.push("JOIN");
  if (groupings) detected.push("GROUP BY");
  if (hasKw(sql, "having")) detected.push("HAVING");
  if (sorts) detected.push("ORDER BY");
  if (subqueries) detected.push("Subquery");
  if (aggregations) detected.push("Aggregation");
  if (windowFunctions) detected.push("Window Function");
  if (ctes) detected.push("CTE");
  if (unions) detected.push("UNION");
  if (hasKw(sql, "distinct")) detected.push("DISTINCT");
  if (hasKw(sql, "limit")) detected.push("LIMIT");

  const notUsed = ALL_CONCEPTS.filter((c) => !detected.includes(c));

  // Weighted score (capped at 100)
  const score = Math.min(
    100,
    joins * 10 +
      aggregations * 6 +
      subqueries * 12 +
      groupings * 8 +
      sorts * 4 +
      windowFunctions * 18 +
      ctes * 15 +
      unions * 10 +
      (hasKw(sql, "having") ? 8 : 0) +
      (filters ? 5 : 0),
  );

  let level: ComplexityReport["level"] = "Beginner";
  if (score >= 70) level = "Expert";
  else if (score >= 45) level = "Advanced";
  else if (score >= 20) level = "Intermediate";

  return {
    tables,
    joins,
    filters,
    aggregations,
    subqueries,
    sorts,
    groupings,
    ctes,
    windowFunctions,
    unions,
    score,
    level,
    detected,
    notUsed,
  };
}

// ---------- 3. Learning hints ----------

export function generateHints(raw: string): LearningHint[] {
  const sql = stripStrings(raw);
  const hints: LearningHint[] = [];

  if (AGG_RE.test(sql)) {
    AGG_RE.lastIndex = 0;
    if (!hasKw(sql, "group by")) {
      hints.push({
        title: "Aggregation detected",
        body:
          "Functions like AVG/SUM/COUNT collapse rows. If you also select non-aggregated columns, you'll need GROUP BY.",
        tone: "warn",
      });
    }
  }

  if (AGG_RE.test(sql) && !hasKw(sql, "having") && hasKw(sql, "where")) {
    AGG_RE.lastIndex = 0;
    hints.push({
      title: "WHERE vs HAVING",
      body:
        "WHERE filters rows before aggregation. To filter aggregated results (e.g. AVG(salary) > 50000) use HAVING.",
      tone: "info",
    });
  }

  if (countKw(sql, "join") >= 2) {
    hints.push({
      title: "Multiple joins",
      body:
        "Join order can affect performance — the planner usually picks the smallest intermediate result first. Always join on indexed keys when possible.",
      tone: "info",
    });
  }

  if (/\(\s*select\b/i.test(sql)) {
    hints.push({
      title: "Subquery present",
      body:
        "A correlated subquery can often be rewritten as a JOIN or CTE for better readability and sometimes better performance.",
      tone: "info",
    });
  }

  if (/\bselect\s+\*/i.test(sql)) {
    hints.push({
      title: "SELECT * usage",
      body:
        "Selecting every column hides intent and can prevent index-only scans. Prefer naming just the columns you need.",
      tone: "warn",
    });
  }

  if (hasKw(sql, "order by") && !hasKw(sql, "limit")) {
    hints.push({
      title: "Sorting without LIMIT",
      body:
        "ORDER BY sorts the entire result set. Pair it with LIMIT when you only need the top N rows.",
      tone: "info",
    });
  }

  if (/\bover\s*\(/i.test(sql)) {
    hints.push({
      title: "Window function",
      body:
        "Window functions (ROW_NUMBER, RANK, LAG…) compute over a partition without collapsing rows. Great for top-N-per-group problems.",
      tone: "info",
    });
  }

  return hints;
}

// ---------- 4. Approach guide ----------

const APPROACHES: ApproachGuide[] = [
  {
    pattern: "Second / Nth highest value",
    difficulty: "Medium",
    approaches: [
      {
        name: "ORDER BY + LIMIT/OFFSET",
        outline: "Sort descending and skip N-1 rows.",
      },
      {
        name: "Subquery with MAX",
        outline:
          "SELECT MAX(col) WHERE col < (SELECT MAX(col) FROM t).",
      },
      {
        name: "DENSE_RANK() window",
        outline:
          "Rank rows and filter where rank = N. Handles ties correctly.",
      },
    ],
    concepts: ["Aggregation", "Subquery", "Window Function"],
  },
  {
    pattern: "Top N records per group",
    difficulty: "Hard",
    approaches: [
      {
        name: "ROW_NUMBER() OVER (PARTITION BY …)",
        outline: "Number rows within each group, keep rows where rn ≤ N.",
      },
      {
        name: "RANK() / DENSE_RANK()",
        outline: "Use when ties should be kept together.",
      },
      {
        name: "Correlated subquery with COUNT",
        outline: "Pre-window-function approach; less efficient on large data.",
      },
    ],
    concepts: ["Window Function", "Partitioning"],
  },
  {
    pattern: "Running total / cumulative sum",
    difficulty: "Medium",
    approaches: [
      {
        name: "SUM() OVER (ORDER BY …)",
        outline: "Window aggregate with an ORDER BY frame.",
      },
      {
        name: "Self-join on ordered key",
        outline: "Pre-window legacy approach — O(n²) without indexes.",
      },
    ],
    concepts: ["Window Function", "JOIN"],
  },
  {
    pattern: "Find duplicates",
    difficulty: "Easy",
    approaches: [
      {
        name: "GROUP BY + HAVING COUNT(*) > 1",
        outline: "Group by candidate-key columns and filter the buckets.",
      },
      {
        name: "ROW_NUMBER() partitioned by key",
        outline: "Tag duplicates so you can also delete them in place.",
      },
    ],
    concepts: ["GROUP BY", "HAVING", "Window Function"],
  },
  {
    pattern: "Rows present in one table but not another",
    difficulty: "Easy",
    approaches: [
      { name: "LEFT JOIN ... WHERE other.id IS NULL", outline: "Anti-join idiom." },
      { name: "NOT EXISTS (correlated subquery)", outline: "Often optimized the same way as anti-join." },
      { name: "EXCEPT", outline: "Set-operator when full-row comparison is desired." },
    ],
    concepts: ["JOIN", "Subquery", "Set Operations"],
  },
];

// Pick approach cards relevant to what the query already shows.
export function suggestApproaches(raw: string): ApproachGuide[] {
  const sql = stripStrings(raw).toLowerCase();
  const picks: ApproachGuide[] = [];
  const has = (s: string) => sql.includes(s);

  if (/max\s*\(/.test(sql) || /order\s+by[\s\S]*desc[\s\S]*limit/.test(sql))
    picks.push(APPROACHES[0]);
  if (/over\s*\(\s*partition\s+by/.test(sql) || (has("rank") && has("over")))
    picks.push(APPROACHES[1]);
  if (/sum\s*\(/.test(sql) && /over\s*\(/.test(sql))
    picks.push(APPROACHES[2]);
  if (/group\s+by/.test(sql) && /having/.test(sql))
    picks.push(APPROACHES[3]);
  if (/left\s+join/.test(sql) || /not\s+exists/.test(sql) || /except/.test(sql))
    picks.push(APPROACHES[4]);

  // Always offer at least 2 educational cards.
  if (picks.length < 2) {
    for (const a of APPROACHES) {
      if (!picks.includes(a)) picks.push(a);
      if (picks.length >= 2) break;
    }
  }
  return picks;
}

// ---------- 5. Simplification advisor ----------

export function simplificationTips(raw: string): SimplificationTip[] {
  const sql = stripStrings(raw);
  const tips: SimplificationTip[] = [];

  if (/\bin\s*\(\s*select\b/i.test(sql)) {
    tips.push({
      pattern: "IN (SELECT …) subquery",
      problem:
        "IN-subqueries can be opaque to readers and sometimes slower than joins.",
      suggestion:
        "Rewrite as an INNER JOIN with the inner table when you only need its keys.",
    });
  }

  const nested = (sql.match(/\(\s*select\b/gi) || []).length;
  if (nested >= 2) {
    tips.push({
      pattern: "Nested subqueries",
      problem:
        "Multiple levels of nested SELECTs are hard to read and harder to debug.",
      suggestion:
        "Lift them into Common Table Expressions (WITH x AS (...), y AS (...)).",
    });
  }

  if (/\bselect\s+\*/i.test(sql)) {
    tips.push({
      pattern: "SELECT *",
      problem:
        "Selecting all columns hides intent, breaks index-only scans, and silently changes when the schema evolves.",
      suggestion: "List only the columns the consumer actually needs.",
    });
  }

  const ands = (sql.match(/\band\b/gi) || []).length;
  if (ands >= 4) {
    tips.push({
      pattern: "Long WHERE chain",
      problem:
        "Many ANDed predicates on different columns hint at a missing lookup table or denormalized data.",
      suggestion:
        "Consider normalization, a composite index, or pushing some predicates into a CTE.",
    });
  }

  if (/\bdistinct\b/i.test(sql) && /\bjoin\b/i.test(sql)) {
    tips.push({
      pattern: "DISTINCT after JOIN",
      problem:
        "DISTINCT is often a band-aid for a JOIN that fans out rows. It hides the real cardinality problem.",
      suggestion:
        "Check the JOIN keys / use EXISTS or GROUP BY to dedupe at the source instead.",
    });
  }

  return tips;
}

// ---------- 6. Concept detector ----------

const CONCEPT_LIBRARY: Record<string, Omit<ConceptInfo, "name">> = {
  SELECT: {
    category: "Basic",
    explanation: "Projects (chooses) columns from rows.",
    why: "The starting point of every read query.",
  },
  WHERE: {
    category: "Basic",
    explanation: "Filters rows before grouping.",
    why: "Reduce row count early — usually the cheapest place to filter.",
  },
  JOIN: {
    category: "Intermediate",
    explanation: "Combines rows from two tables on a matching condition.",
    why: "Lets you query across normalized tables.",
  },
  "GROUP BY": {
    category: "Intermediate",
    explanation: "Buckets rows by one or more columns for aggregation.",
    why: "Required whenever you mix aggregates with non-aggregated columns.",
  },
  HAVING: {
    category: "Intermediate",
    explanation: "Filters rows AFTER grouping/aggregation.",
    why: "Use it to filter on aggregate results (e.g. COUNT(*) > 10).",
  },
  "ORDER BY": {
    category: "Basic",
    explanation: "Sorts the result set.",
    why: "Required for deterministic output and Top-N queries.",
  },
  Subquery: {
    category: "Intermediate",
    explanation: "A SELECT nested inside another statement.",
    why: "Useful for derived tables and correlated lookups.",
  },
  Aggregation: {
    category: "Intermediate",
    explanation: "Functions like SUM/COUNT/AVG collapse many rows into one.",
    why: "The building block of reporting queries.",
  },
  "Window Function": {
    category: "Advanced",
    explanation: "Computes per-row values over a window of related rows without collapsing them.",
    why: "Cleanest tool for ranks, running totals, top-N-per-group.",
  },
  CTE: {
    category: "Advanced",
    explanation: "Named query (WITH x AS (...)) referenced later in the statement.",
    why: "Improves readability and enables recursive queries.",
  },
  UNION: {
    category: "Intermediate",
    explanation: "Stacks the result sets of two compatible SELECTs.",
    why: "Combine results from different sources of the same shape.",
  },
  DISTINCT: {
    category: "Basic",
    explanation: "Removes duplicate rows from the result.",
    why: "Quick dedupe — but often signals a JOIN cardinality issue.",
  },
  LIMIT: {
    category: "Basic",
    explanation: "Caps the number of returned rows.",
    why: "Essential for pagination and Top-N queries.",
  },
};

export function detectConcepts(detected: string[]): ConceptInfo[] {
  return detected
    .filter((d) => CONCEPT_LIBRARY[d])
    .map((d) => ({ name: d, ...CONCEPT_LIBRARY[d] }));
}

// ---------- 7. Progress tracker ----------

const PROGRESS_KEY = "sql-viz-progress-v1";

export type ProgressBuckets = {
  "Basic SQL": Set<string>;
  JOINs: Set<string>;
  Aggregation: Set<string>;
  Subqueries: Set<string>;
  "Window Functions": Set<string>;
  CTEs: Set<string>;
  Sets: Set<string>;
};

const BUCKETS: Record<keyof ProgressBuckets, string[]> = {
  "Basic SQL": ["SELECT", "WHERE", "ORDER BY", "DISTINCT", "LIMIT"],
  JOINs: ["JOIN"],
  Aggregation: ["GROUP BY", "HAVING", "Aggregation"],
  Subqueries: ["Subquery"],
  "Window Functions": ["Window Function"],
  CTEs: ["CTE"],
  Sets: ["UNION"],
};

export interface ProgressSnapshot {
  bucket: keyof ProgressBuckets;
  used: number;
  total: number;
  percent: number;
  covered: string[];
}

function loadRaw(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function recordConcepts(detected: string[]) {
  if (typeof window === "undefined") return;
  const raw = loadRaw();
  for (const [bucket, items] of Object.entries(BUCKETS)) {
    const cur = new Set(raw[bucket] || []);
    for (const c of detected) if (items.includes(c)) cur.add(c);
    raw[bucket] = [...cur];
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(raw));
}

export function getProgress(): ProgressSnapshot[] {
  const raw = loadRaw();
  return (Object.keys(BUCKETS) as (keyof ProgressBuckets)[]).map((bucket) => {
    const total = BUCKETS[bucket].length;
    const covered = (raw[bucket] || []).filter((c) =>
      BUCKETS[bucket].includes(c),
    );
    return {
      bucket,
      used: covered.length,
      total,
      percent: Math.round((covered.length / total) * 100),
      covered,
    };
  });
}

export function resetProgress() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}

// ---------- Aggregate ----------

export function buildIntelligence(raw: string): IntelligenceReport {
  const complexity = analyzeComplexity(raw);
  return {
    syntax: analyzeSyntax(raw),
    complexity,
    hints: generateHints(raw),
    approaches: suggestApproaches(raw),
    simplifications: simplificationTips(raw),
    concepts: detectConcepts(complexity.detected),
  };
}
