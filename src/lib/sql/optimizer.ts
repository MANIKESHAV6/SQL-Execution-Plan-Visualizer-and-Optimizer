// Rule-based optimization suggestions + scoring.

import { totalCost } from "./costEstimator";
import { buildOptimizedPlan, buildOriginalPlan } from "./planGenerator";
import { parseSQL } from "./parser";
import type {
  AnalysisResult,
  Metrics,
  OptimizationSuggestion,
  ParsedQuery,
} from "./types";

export function suggest(q: ParsedQuery): OptimizationSuggestion[] {
  const out: OptimizationSuggestion[] = [];

  if (q.selectStar) {
    out.push({
      rule: "R1",
      severity: "warn",
      message: "Avoid SELECT * — project only the columns you need.",
    });
  }
  if (q.where) {
    out.push({
      rule: "R2",
      severity: "info",
      message: "Consider creating an index on the columns used in WHERE.",
    });
    if (q.joins.length > 0) {
      out.push({
        rule: "R3",
        severity: "critical",
        message:
          "Apply filters before joins (predicate pushdown) to reduce intermediate rows.",
      });
    }
  }
  if (q.orderBy.length && !q.where) {
    out.push({
      rule: "R4",
      severity: "warn",
      message: "Filter rows before sorting to avoid sorting unneeded data.",
    });
  }
  if (q.joins.length > 1) {
    out.push({
      rule: "R5",
      severity: "info",
      message: "Join the smallest datasets first to keep intermediates small.",
    });
  }
  if (out.length === 0) {
    out.push({
      rule: "OK",
      severity: "info",
      message: "Query looks reasonably efficient for this cost model.",
    });
  }
  return out;
}

export function analyze(sql: string): AnalysisResult {
  const parsed = parseSQL(sql);
  const originalPlan = buildOriginalPlan(parsed);
  const optimizedPlan = buildOptimizedPlan(parsed);
  const originalCost = totalCost(originalPlan);
  const optimizedCost = totalCost(optimizedPlan);
  const suggestions = suggest(parsed);

  // Optimization score: how much cheaper is the optimized plan,
  // bounded 0..100. Identical plans => 100.
  const ratio =
    originalCost === 0 ? 1 : Math.max(0, optimizedCost / originalCost);
  const score = Math.round(Math.min(100, Math.max(0, (1 - ratio) * 100 + 50)));

  const metrics: Metrics = {
    tables: parsed.tables.length + parsed.joins.length,
    joins: parsed.joins.length,
    filters: parsed.where ? 1 : 0,
    totalCost: originalCost,
    optimizationScore: score,
  };

  return {
    parsed,
    originalPlan,
    optimizedPlan,
    originalCost,
    optimizedCost,
    suggestions,
    metrics,
  };
}
