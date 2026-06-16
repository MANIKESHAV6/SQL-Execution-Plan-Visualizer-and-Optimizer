// Shared types for the SQL parsing / planning / optimization pipeline.

export type OperatorType =
  | "TABLE_SCAN"
  | "INDEX_SCAN"
  | "FILTER"
  | "PROJECT"
  | "JOIN"
  | "SORT"
  | "GROUP_BY";

export interface JoinClause {
  table: string;
  on: string;
}

export interface ParsedQuery {
  columns: string[];          // selected columns ("*" allowed)
  tables: string[];           // FROM tables
  joins: JoinClause[];        // INNER JOIN clauses
  where?: string;             // raw WHERE expression
  groupBy: string[];
  orderBy: string[];
  selectStar: boolean;
}

export interface PlanNode {
  id: string;
  type: OperatorType;
  description: string;
  cost: number;               // self cost for this operator
  children: PlanNode[];
}

export interface Metrics {
  tables: number;
  joins: number;
  filters: number;
  totalCost: number;
  optimizationScore: number;  // 0-100
}

export interface OptimizationSuggestion {
  rule: string;
  message: string;
  severity: "info" | "warn" | "critical";
}

export interface AnalysisResult {
  parsed: ParsedQuery;
  originalPlan: PlanNode;
  optimizedPlan: PlanNode;
  originalCost: number;
  optimizedCost: number;
  suggestions: OptimizationSuggestion[];
  metrics: Metrics;
}
