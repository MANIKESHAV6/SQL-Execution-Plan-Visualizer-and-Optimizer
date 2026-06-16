import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QueryEditor } from "@/components/QueryEditor";
import { PlanTree } from "@/components/PlanTree";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { SAMPLE_QUERIES } from "@/lib/sql/samples";
import { analyze } from "@/lib/sql/optimizer";
import type { AnalysisResult } from "@/lib/sql/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SQL Execution Plan Visualizer & Optimizer" },
      {
        name: "description",
        content:
          "Parse SQL, visualize execution plans as trees, estimate cost, and get optimization suggestions.",
      },
      {
        property: "og:title",
        content: "SQL Execution Plan Visualizer & Optimizer",
      },
      {
        property: "og:description",
        content:
          "Interactive DBMS-style query planner: parse, plan, cost, and optimize SQL.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [sql, setSql] = useState(SAMPLE_QUERIES[2].sql);
  const [analyzed, setAnalyzed] = useState<AnalysisResult | null>(() => {
    try {
      return analyze(SAMPLE_QUERIES[2].sql);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    try {
      setAnalyzed(analyze(sql));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown parser error");
    }
  };

  const exportJson = () => {
    if (!analyzed) return;
    download(
      "execution-plan.json",
      JSON.stringify(
        {
          query: sql,
          original: analyzed.originalPlan,
          optimized: analyzed.optimizedPlan,
          metrics: analyzed.metrics,
        },
        null,
        2,
      ),
      "application/json",
    );
  };

  const downloadReport = () => {
    if (!analyzed) return;
    const lines = [
      "SQL OPTIMIZATION REPORT",
      "=".repeat(40),
      "",
      "QUERY:",
      sql,
      "",
      `Original cost: ${analyzed.originalCost}`,
      `Optimized cost: ${analyzed.optimizedCost}`,
      `Optimization score: ${analyzed.metrics.optimizationScore}/100`,
      "",
      "SUGGESTIONS:",
      ...analyzed.suggestions.map((s) => `  [${s.rule}] ${s.message}`),
    ];
    download("optimization-report.txt", lines.join("\n"), "text/plain");
  };

  const copyPlan = async () => {
    if (!analyzed) return;
    await navigator.clipboard.writeText(
      planToText(analyzed.optimizedPlan),
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-xs text-primary tracking-[0.3em]">
            DBMS · QUERY PLANNER
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            SQL Execution Plan{" "}
            <span className="text-primary">Visualizer</span> & Optimizer
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Parse a SQL query, build a relational-algebra execution plan,
            estimate cost per operator, and compare against a rule-based
            optimized plan.
          </p>
        </div>
        {analyzed && (
          <div className="flex gap-2">
            <ToolbarButton onClick={exportJson}>Export JSON</ToolbarButton>
            <ToolbarButton onClick={downloadReport}>Report .txt</ToolbarButton>
            <ToolbarButton onClick={copyPlan}>Copy plan</ToolbarButton>
          </div>
        )}
      </header>

      <QueryEditor value={sql} onChange={setSql} onRun={run} error={error} />

      {analyzed && (
        <>
          <MetricsDashboard
            metrics={analyzed.metrics}
            originalCost={analyzed.originalCost}
            optimizedCost={analyzed.optimizedCost}
          />

          <div className="grid lg:grid-cols-2 gap-4">
            <PlanTree
              title="Original Plan"
              subtitle="Naive execution order"
              plan={analyzed.originalPlan}
              cost={analyzed.originalCost}
            />
            <PlanTree
              title="Optimized Plan"
              subtitle="After rewrite rules"
              plan={analyzed.optimizedPlan}
              cost={analyzed.optimizedCost}
            />
          </div>

          <OptimizationPanel suggestions={analyzed.suggestions} />
        </>
      )}

      <footer className="text-xs text-muted-foreground text-center pt-4">
        Educational DBMS visualizer · simplified cost model
      </footer>
    </main>
  );
}

function ToolbarButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition"
    >
      {children}
    </button>
  );
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function planToText(
  node: import("@/lib/sql/types").PlanNode,
  depth = 0,
): string {
  const pad = "  ".repeat(depth);
  const head = `${pad}${node.type}(${node.description}) [cost ${node.cost}]`;
  const kids = node.children.map((c) => planToText(c, depth + 1)).join("\n");
  return kids ? `${head}\n${kids}` : head;
}
