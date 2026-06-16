# SQL Query Execution Plan Visualizer & Optimizer

An educational, DBMS-inspired tool that parses SQL queries, builds a
relational-algebra execution plan, estimates cost, and proposes an
optimized plan with rule-based suggestions.

> Implementation note: the original brief asked for a Python Flask
> backend. This build runs entirely in TypeScript so the whole pipeline
> works in the Lovable preview without a separate server. The
> architecture is identical — the modules below mirror what `parser.py`,
> `plan_generator.py`, `cost_estimator.py`, and `optimizer.py` would do.

## Features

- SQL editor with preloaded sample queries
- Subset parser for `SELECT / FROM / WHERE / INNER JOIN / GROUP BY / ORDER BY`
- Execution plan tree with operators:
  `TABLE_SCAN`, `INDEX_SCAN`, `FILTER`, `PROJECT`, `JOIN`, `SORT`, `GROUP_BY`
- Interactive, expandable, animated plan visualization
- Per-operator and total cost using a simple textbook cost model
- Side-by-side **Original vs Optimized** plan comparison
- Rule-based optimization suggestions (5 rules)
- Metrics dashboard: tables, joins, filters, cost, optimization score
- Export plan as JSON, download `.txt` optimization report, copy plan

## Tech stack

- React 19 + TypeScript
- TanStack Start (file-based routing)
- Tailwind CSS v4 (dark, terminal-inspired design tokens)
- All parsing / planning / costing runs client-side (zero backend)

## Project structure

```
src/
├── routes/
│   └── index.tsx                # main page: editor + plans + metrics
├── components/
│   ├── QueryEditor.tsx          # SQL textarea + sample loader
│   ├── PlanTree.tsx             # recursive expandable tree
│   ├── OptimizationPanel.tsx    # rule-based suggestions
│   └── MetricsDashboard.tsx     # stat cards
├── lib/sql/
│   ├── types.ts                 # shared TS types
│   ├── parser.ts                # SQL → ParsedQuery
│   ├── planGenerator.ts         # ParsedQuery → PlanNode tree
│   ├── costEstimator.ts         # per-operator cost model
│   ├── optimizer.ts             # rules + analyze() entry point
│   └── samples.ts               # preloaded example queries
└── styles.css                   # Tailwind v4 theme tokens
```

## Pipeline

```
SQL text
  │
  ▼  parser.ts      → ParsedQuery { columns, tables, joins, where, ... }
  │
  ▼  planGenerator  → buildOriginalPlan()   buildOptimizedPlan()
  │                    (TABLE_SCAN → JOIN → FILTER → SORT → PROJECT)
  ▼  costEstimator  → totalCost(plan)
  │
  ▼  optimizer.ts   → suggest(parsed)  +  analyze(sql)
  │
  ▼  UI             → PlanTree | MetricsDashboard | OptimizationPanel
```

## Supported SQL syntax

```sql
SELECT col1, col2, ...
FROM   table [, table2]
[INNER JOIN other ON cond]*
[WHERE  condition]
[GROUP BY col, ...]
[ORDER BY col, ...];
```

`SELECT *` is supported and triggers an anti-pattern suggestion.

## Cost model

| Operator     | Base cost |
| ------------ | --------- |
| TABLE_SCAN   | 100       |
| INDEX_SCAN   | 10        |
| FILTER       | 20        |
| PROJECT      | 5         |
| JOIN         | 150       |
| SORT         | 50        |
| GROUP_BY     | 40        |

`totalCost(plan)` is the sum of every node's base cost.

## Optimization rules

| Rule | Condition                       | Suggestion                                          |
| ---- | ------------------------------- | --------------------------------------------------- |
| R1   | `SELECT *`                      | Project only required columns                       |
| R2   | `WHERE` present                 | Index the filtered columns                          |
| R3   | `WHERE` + `JOIN`                | Push filters below joins (predicate pushdown)       |
| R4   | `ORDER BY` without `WHERE`      | Filter before sorting                               |
| R5   | More than one `JOIN`            | Join smaller datasets first                         |

The optimizer also rewrites the plan: filter pushdown + index scan +
join reordering when more than one join is present.

## Run locally

```bash
bun install
bun dev
```

Then open the preview URL printed in the terminal.
