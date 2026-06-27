import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QueryEditor } from "@/components/QueryEditor";
import { PlanTree } from "@/components/PlanTree";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { LearningAssistant } from "@/components/LearningAssistant";
import { ComplexityAnalysis } from "@/components/ComplexityAnalysis";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ExecutionOrderPanel } from "@/components/ExecutionOrderPanel";
import { CostBreakdownPanel } from "@/components/CostBreakdownPanel";
import { PlanComparisonTable } from "@/components/PlanComparisonTable";
import { DbmsInsightsPanel } from "@/components/DbmsInsightsPanel";
import { InterviewPrepPanel } from "@/components/InterviewPrepPanel";
import {
  LearningModeProvider,
  LearningModeToggle,
} from "@/components/LearningMode";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SAMPLE_QUERIES } from "@/lib/sql/samples";
import { analyze } from "@/lib/sql/optimizer";
import {
  buildIntelligence,
  recordConcepts,
  type IntelligenceReport,
} from "@/lib/sql/intelligence";
import { executionOrder } from "@/lib/sql/executionOrder";
import { buildCostBreakdown, comparePlans } from "@/lib/sql/costBreakdown";
import { buildInterviewCards } from "@/lib/sql/interviewPrep";
import type { AnalysisResult } from "@/lib/sql/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SQL Query Intelligence Platform" },
      {
        name: "description",
        content:
          "Parse SQL, visualize execution plans, compare with an optimized plan, learn how databases execute queries, and prep for SQL interviews — all in one DBMS-style educational platform.",
      },
      {
        property: "og:title",
        content: "SQL Query Intelligence Platform",
      },
      {
        property: "og:description",
        content:
          "Interactive DBMS query planner, learning center, and interview prep — built on a rule-based SQL engine.",
      },
    ],
  }),
  component: () => (
    <LearningModeProvider>
      <Index />
    </LearningModeProvider>
  ),
});

function Index() {
  const initialSql = SAMPLE_QUERIES[2].sql;
  const [sql, setSql] = useState(initialSql);
  const [analyzed, setAnalyzed] = useState<AnalysisResult | null>(() => {
    try {
      return analyze(initialSql);
    } catch {
      return null;
    }
  });
  const [intel, setIntel] = useState<IntelligenceReport>(() =>
    buildIntelligence(initialSql),
  );
  const [progressTick, setProgressTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Record concepts for the initial sample on mount.
  useStateOnce(() => recordConcepts(intel.complexity.detected));

  // Derived analyses — recomputed when query or analysis changes.
  const stages = useMemo(() => executionOrder(sql), [sql]);
  const breakdown = useMemo(
    () =>
      analyzed
        ? buildCostBreakdown(
            analyzed.parsed,
            analyzed.originalPlan,
            analyzed.optimizedPlan,
            analyzed.originalCost,
            analyzed.optimizedCost,
          )
        : null,
    [analyzed],
  );
  const planDelta = useMemo(
    () =>
      analyzed
        ? comparePlans(analyzed.originalPlan, analyzed.optimizedPlan)
        : [],
    [analyzed],
  );
  const interviewCards = useMemo(
    () => buildInterviewCards(intel.complexity.detected),
    [intel],
  );

  const run = () => {
    const report = buildIntelligence(sql);
    setIntel(report);
    recordConcepts(report.complexity.detected);
    setProgressTick((t) => t + 1);

    try {
      setAnalyzed(analyze(sql));
      setError(null);
    } catch (e) {
      setAnalyzed(null);
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
          intelligence: intel,
          executionOrder: stages,
          costBreakdown: breakdown,
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
      `Difficulty: ${intel.complexity.level} (${intel.complexity.score}/100)`,
      "",
      "SUGGESTIONS:",
      ...analyzed.suggestions.map((s) => `  [${s.rule}] ${s.message}`),
      "",
      "SYNTAX ISSUES:",
      ...intel.syntax.map(
        (s) => `  [${s.severity}] ${s.type} — ${s.explanation}`,
      ),
      "",
      "COST BREAKDOWN:",
      ...(breakdown?.reasons.map(
        (r) => `  [${r.rule}] saved ${r.saved} — ${r.explanation}`,
      ) ?? []),
    ];
    download("optimization-report.txt", lines.join("\n"), "text/plain");
  };

  const copyPlan = async () => {
    if (!analyzed) return;
    await navigator.clipboard.writeText(planToText(analyzed.optimizedPlan));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-xs text-primary tracking-[0.3em]">
            DBMS · SQL INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            SQL Query{" "}
            <span className="text-primary">Intelligence</span> Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Parse a SQL query, build a relational-algebra execution plan,
            compare it with a rule-based optimized plan, learn how databases
            execute queries internally, and prep for SQL interviews.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <LearningModeToggle />
          {analyzed && (
            <>
              <ToolbarButton onClick={exportJson}>Export JSON</ToolbarButton>
              <ToolbarButton onClick={downloadReport}>Report .txt</ToolbarButton>
              <ToolbarButton onClick={copyPlan}>Copy plan</ToolbarButton>
            </>
          )}
        </div>
      </header>

      <QueryEditor value={sql} onChange={setSql} onRun={run} error={error} />

      <Tabs defaultValue="plans" className="w-full">
        <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsList className="h-auto flex-wrap gap-1 bg-card border border-border p-1">
            <TabsTrigger value="plans">Execution Plans</TabsTrigger>
            <TabsTrigger value="execution-order">Execution Order</TabsTrigger>
            <TabsTrigger value="optimization">Query Optimizer</TabsTrigger>
            <TabsTrigger value="cost">Why Cost Changed</TabsTrigger>
            <TabsTrigger value="comparison">Plan Comparison</TabsTrigger>
            <TabsTrigger value="dbms">Real DBMS Insights</TabsTrigger>
            <TabsTrigger value="learning">SQL Intelligence</TabsTrigger>
            <TabsTrigger value="complexity">Complexity</TabsTrigger>
            <TabsTrigger value="interview">Interview Prep</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracker</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="mt-5">
          {analyzed ? (
            <div className="flex flex-col gap-5">
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
            </div>
          ) : (
            <UnavailableNotice />
          )}
        </TabsContent>

        <TabsContent value="execution-order" className="mt-5">
          <ExecutionOrderPanel stages={stages} />
        </TabsContent>

        <TabsContent value="optimization" className="mt-5">
          {analyzed ? (
            <OptimizationPanel suggestions={analyzed.suggestions} />
          ) : (
            <UnavailableNotice />
          )}
        </TabsContent>

        <TabsContent value="cost" className="mt-5">
          {breakdown ? (
            <CostBreakdownPanel data={breakdown} />
          ) : (
            <UnavailableNotice />
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-5">
          {analyzed ? (
            <PlanComparisonTable
              rows={planDelta}
              originalCost={analyzed.originalCost}
              optimizedCost={analyzed.optimizedCost}
            />
          ) : (
            <UnavailableNotice />
          )}
        </TabsContent>

        <TabsContent value="dbms" className="mt-5">
          <DbmsInsightsPanel />
        </TabsContent>

        <TabsContent value="learning" className="mt-5">
          <LearningAssistant
            syntax={intel.syntax}
            hints={intel.hints}
            approaches={intel.approaches}
            simplifications={intel.simplifications}
            concepts={intel.concepts}
          />
        </TabsContent>

        <TabsContent value="complexity" className="mt-5">
          <ComplexityAnalysis data={intel.complexity} />
        </TabsContent>

        <TabsContent value="interview" className="mt-5">
          <InterviewPrepPanel cards={interviewCards} />
        </TabsContent>

        <TabsContent value="progress" className="mt-5">
          <ProgressTracker tick={progressTick} />
        </TabsContent>
      </Tabs>

      <footer className="text-xs text-muted-foreground text-center pt-4">
        Educational DBMS platform · rule-based parser, optimizer & learning engine
      </footer>
    </main>
  );
}

// Tiny once-on-mount helper that avoids pulling useEffect just for one call.
function useStateOnce(fn: () => void) {
  useState(() => {
    fn();
    return null;
  });
}

function UnavailableNotice() {
  return (
    <div className="panel p-5 text-sm text-muted-foreground">
      Execution plan unavailable — fix the parser error shown above, or open
      the <span className="text-primary">SQL Intelligence</span> tab to see
      what the rule-based analyzer found.
    </div>
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
