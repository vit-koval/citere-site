// Runs, one record per run x market. The brief's Run entity carries a single
// country and a single language, so an export that collects four markets under
// one run id becomes four run records here (CLAUDE_CODE_BRIEF §2).
const { readJson } = require("../_lib/markdown.cjs");

const raw = readJson("data/runs.json") || { runs: [] };
const runs = raw.runs || [];

const index = (key) => {
  const map = {};
  for (const r of runs) (map[r[key]] ||= []).push(r);
  return map;
};

module.exports = {
  all: runs,
  byKey: Object.fromEntries(runs.map((r) => [r.key, r])),
  byMarket: index("market"),
  byRunId: index("run_id"),
  markets: [...new Set(runs.map((r) => r.market))].sort(),
  // Newest first: every page that names "the current run" means this one.
  latest: [...runs].sort((a, b) => b.collected_at.localeCompare(a.collected_at))[0] || null
};
