// How real DBMSs implement each optimizer rule we apply. Static reference data.

export interface DbmsBehaviour {
  project: string; // "This Project" | "PostgreSQL" | ...
  behaviour: string;
}

export interface DbmsRuleInsight {
  rule: string;
  purpose: string;
  advantages: string[];
  limitations: string[];
  behaviours: DbmsBehaviour[];
}

export const DBMS_INSIGHTS: DbmsRuleInsight[] = [
  {
    rule: "Predicate Pushdown",
    purpose:
      "Move WHERE evaluation as close to the scan as possible so joins and aggregates process fewer rows.",
    advantages: [
      "Smaller intermediate row counts.",
      "Lower memory pressure and CPU usage.",
    ],
    limitations: [
      "Only safe when the predicate references columns from a single side of the join.",
    ],
    behaviours: [
      {
        project: "This Project",
        behaviour: "Implemented as a rule when the WHERE mentions the base table.",
      },
      {
        project: "PostgreSQL",
        behaviour: "Cost-based optimizer pushes predicates automatically.",
      },
      {
        project: "MySQL",
        behaviour: "Applies condition pushdown when the storage engine supports it.",
      },
      {
        project: "SQLite",
        behaviour: "Simple but effective predicate pushdown in its query planner.",
      },
    ],
  },
  {
    rule: "Index Scan Substitution",
    purpose:
      "Replace a full table scan with an index lookup when a selective predicate exists.",
    advantages: ["O(log N) lookup.", "Enables index-only scans for covering indexes."],
    limitations: [
      "Useless for non-selective predicates (>~20% rows).",
      "Indexes cost storage and slow down writes.",
    ],
    behaviours: [
      {
        project: "This Project",
        behaviour: "Rule based — picks INDEX_SCAN whenever the WHERE references the base table.",
      },
      {
        project: "PostgreSQL",
        behaviour: "Uses statistics + cost model; can also combine indexes with Bitmap Index Scan.",
      },
      {
        project: "MySQL",
        behaviour: "Picks indexes from index cardinality statistics.",
      },
      {
        project: "SQLite",
        behaviour: "Picks from available indexes via a cost-based planner.",
      },
    ],
  },
  {
    rule: "Join Reordering",
    purpose: "Pick a join order that keeps intermediate results small.",
    advantages: ["Quadratic or worse plans can become linear.", "Cheaper aggregates downstream."],
    limitations: [
      "Search space is exponential — large queries use heuristics or genetic search.",
    ],
    behaviours: [
      {
        project: "This Project",
        behaviour: "Heuristic — reverses the user's join order when >1 join is present.",
      },
      {
        project: "PostgreSQL",
        behaviour: "Dynamic programming up to geqo_threshold (default 12), then genetic search.",
      },
      {
        project: "MySQL",
        behaviour: "Greedy search with cost-based pruning.",
      },
      {
        project: "SQLite",
        behaviour: "N-way nearest-neighbor heuristic.",
      },
    ],
  },
  {
    rule: "Projection Pruning",
    purpose: "Drop columns the consumer never reads.",
    advantages: ["Less memory.", "Enables index-only scans."],
    limitations: ["SELECT * defeats it."],
    behaviours: [
      {
        project: "This Project",
        behaviour: "Cheaper PROJECT cost when the SELECT list is explicit.",
      },
      {
        project: "PostgreSQL",
        behaviour: "Projection folded into producing operator at plan-time.",
      },
      {
        project: "MySQL",
        behaviour: "Covering indexes drive the same effect.",
      },
      {
        project: "SQLite",
        behaviour: "Computes only the columns it needs for the result.",
      },
    ],
  },
];
