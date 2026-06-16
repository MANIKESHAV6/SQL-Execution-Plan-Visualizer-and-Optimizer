// Lightweight regex-based SQL parser supporting:
// SELECT ... FROM ... [INNER JOIN ... ON ...]* [WHERE ...] [GROUP BY ...] [ORDER BY ...]
// Not a full SQL parser — purpose-built for the educational visualizer.

import type { JoinClause, ParsedQuery } from "./types";

const CLAUSE_RE =
  /\bselect\b(?<select>[\s\S]+?)\bfrom\b(?<from>[\s\S]+?)(?:\bwhere\b(?<where>[\s\S]+?))?(?:\bgroup\s+by\b(?<group>[\s\S]+?))?(?:\border\s+by\b(?<order>[\s\S]+?))?\s*;?\s*$/i;

const JOIN_RE =
  /\b(?:inner\s+)?join\b\s+([a-zA-Z_][\w]*)\s+on\s+([^]+?)(?=\b(?:inner\s+)?join\b|$)/gi;

const splitCsv = (s: string) =>
  s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

export function parseSQL(sql: string): ParsedQuery {
  const cleaned = sql.replace(/\s+/g, " ").trim();
  if (!cleaned) throw new Error("Query is empty.");

  const m = CLAUSE_RE.exec(cleaned);
  if (!m || !m.groups) {
    throw new Error("Could not parse query. Expected: SELECT ... FROM ...");
  }
  const g = m.groups;

  const columns = splitCsv(g.select);
  if (columns.length === 0) throw new Error("SELECT list is empty.");

  // Split FROM into base tables + joins.
  const fromPart = g.from.trim();
  const joins: JoinClause[] = [];
  const joinMatches = [...fromPart.matchAll(JOIN_RE)];
  let baseFrom = fromPart;
  if (joinMatches.length) {
    baseFrom = fromPart.slice(0, joinMatches[0].index).trim();
    for (const jm of joinMatches) {
      joins.push({ table: jm[1].trim(), on: jm[2].trim() });
    }
  }
  const tables = splitCsv(baseFrom).map((t) => t.replace(/\s+as\s+\w+$/i, ""));
  if (tables.length === 0) throw new Error("FROM clause must contain a table.");

  return {
    columns,
    tables,
    joins,
    where: g.where?.trim(),
    groupBy: g.group ? splitCsv(g.group) : [],
    orderBy: g.order ? splitCsv(g.order) : [],
    selectStar: columns.some((c) => c === "*"),
  };
}
