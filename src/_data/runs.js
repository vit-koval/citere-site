// Runs. The source table in data/runs.json carries the grid shape and the
// frozen versions; the derived counts, reconciliation and comparability come
// from the metrics store, which is where they are computed (CM §1.1-1.3, §6.1).
const metrics = require("./metrics.js");

const runs = (metrics.raw.runs || []).slice();

const index = (key) => {
  const map = {};
  for (const r of runs) (map[r[key]] ||= []).push(r);
  return map;
};

const byMarket = index("market");
// The latest run in each market: unless a block says otherwise, every page
// reads the current run per market (Countries Index Business Logic §0).
const current = Object.fromEntries(
  Object.entries(byMarket).map(([market, list]) => [
    market,
    [...list].sort((a, b) => b.collected_at.localeCompare(a.collected_at))[0]
  ])
);

module.exports = {
  all: runs,
  byKey: Object.fromEntries(runs.map((r) => [r.key, r])),
  byMarket,
  byRunId: Object.fromEntries(runs.map((r) => [r.run_id, r])),
  current,
  currentKeys: Object.values(current).map((r) => r.key),
  markets: Object.keys(byMarket).sort(),
  // A market with two comparable runs is the only place a trend may be drawn.
  withTrend: Object.entries(byMarket)
    .filter(([, list]) => list.some((r) => r.comparable_with.length))
    .map(([market]) => market),
  latest: [...runs].sort((a, b) => b.collected_at.localeCompare(a.collected_at))[0] || null
};
