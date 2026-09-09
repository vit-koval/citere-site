// The metrics store as the templates see it: the pre-computed cells from
// data/metrics.json, plus the only sanctioned way to combine them.
//
// The combining rules are enforced here rather than trusted to each page.
// Counts may be summed across anything. A *rate* may only be formed inside one
// persona, one market and one run — pool across any of those and the rate comes
// back null with the reason attached (CLAUDE_CODE_BRIEF §3.1-3.5).
const { readJson } = require("../_lib/markdown.cjs");
const { share, significant, LOW_N, tier } = require("../_lib/metrics.cjs");

const store = readJson("data/metrics.json") || { cells: [], dimensions: {}, totals: {} };
const cells = store.cells || [];

// Pooling across any of these produces a number nobody can interpret.
const FORBIDDEN = ["persona", "market", "run"];
const DIMS = ["run", "claim", "cluster", "chatbot", "persona", "country", "language", "market"];

const asList = (v) => (v === undefined || v === null ? null : Array.isArray(v) ? v : [v]);

// select({chatbot:"grok", persona:"P2", market:["de-de","us-en"]})
function select(where = {}) {
  const tests = Object.entries(where)
    .map(([dim, value]) => [dim, asList(value)])
    .filter(([, list]) => list && list.length);
  if (!tests.length) return cells;
  return cells.filter((c) => tests.every(([dim, list]) => list.includes(c[dim])));
}

const uniq = (xs) => [...new Set(xs)].sort();

function pool(list) {
  const counts = { repeat: 0, u_context: 0, refute: 0, dodge: 0 };
  const tiers = { critical: 0, high: 0, review: 0, low: 0, none: 0 };
  const domains = {};
  let n = 0, substantive = 0, contaminated = 0, responses = 0;

  for (const c of list) {
    n += c.n; substantive += c.substantive; contaminated += c.contaminated; responses += c.responses;
    for (const k of Object.keys(counts)) counts[k] += c.counts[k];
    for (const k of Object.keys(tiers)) tiers[k] += c.tiers[k];
    for (const [d, e] of Object.entries(c.domains || {})) {
      const acc = (domains[d] ||= { cited: 0, while_repeating: 0 });
      acc.cited += e.cited; acc.while_repeating += e.while_repeating;
    }
  }

  const dims = Object.fromEntries(DIMS.map((d) => [d, uniq(list.map((c) => c[d]))]));
  const blocked = FORBIDDEN.filter((d) => dims[d].length > 1);
  const rate = (k, d) => (blocked.length ? null : share(k, d));

  return {
    cells: list.length,
    n, substantive, contaminated, responses, counts, tiers, domains, dims, blocked,
    // Two denominators, never interchanged (brief §3.5).
    repeat_rate: rate(counts.repeat, substantive),
    contamination_rate: rate(contaminated, n),
    dodge_rate: rate(counts.dodge, n),
    low_n: substantive < LOW_N,
    listedDomains: Object.entries(domains)
      .map(([domain, e]) => ({ domain, ...e }))
      .sort((a, b) => b.cited - a.cited || a.domain.localeCompare(b.domain))
  };
}

// group({persona:"P2"}, "chatbot") -> one pooled row per chatbot, in the order
// the caller asked for or worst-first once every row is comparable.
function group(where, dim, { order = "rate" } = {}) {
  const list = select(where);
  const buckets = new Map();
  for (const c of list) {
    if (!buckets.has(c[dim])) buckets.set(c[dim], []);
    buckets.get(c[dim]).push(c);
  }
  const rows = [...buckets.entries()].map(([value, group]) => ({ dim, value, ...pool(group) }));
  if (order === "rate") {
    rows.sort((a, b) => {
      const x = a.repeat_rate && a.repeat_rate.rate, y = b.repeat_rate && b.repeat_rate.rate;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return y - x || String(a.value).localeCompare(String(b.value));
    });
  } else rows.sort((a, b) => String(a.value).localeCompare(String(b.value)));
  return rows;
}

// A ranking may not contain a cell nobody can read (brief §3.3).
const rankable = (rows, metric = "repeat_rate") =>
  rows.filter((r) => r[metric] && !r[metric].low_n);

module.exports = {
  raw: store,
  cells,
  lowN: store.low_n || LOW_N,
  totals: store.totals || {},
  dimensions: store.dimensions || {},
  select, pool, group, rankable, significant, tier,
  // pool() for a set the caller has already filtered
  poolOf: (where) => pool(select(where))
};
