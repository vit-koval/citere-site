// The Sources Registry: one record per domain, derived from the watchlist, the
// claim cards and the metric cells - never hand-edited
// (Citere_Sources_Registry_Business_Logic.md §1, §4-6).
//
// Counts only. A share of responses citing a domain needs a denominator that
// belongs to the metrics store, not here (SR §5).
const { readJson } = require("../_lib/markdown.cjs");
const { normaliseDomain, NETWORK_CATEGORY } = require("../_lib/metrics.cjs");
const metrics = require("./metrics.js");
const claims = require("./claims.js");

const raw = readJson("data/sources.json") || {};
const byId = new Map(claims.map((c) => [c.id, c]));

// SR §4 step 3: the distribution edge, from each claim card's surface objects.
const distributed = new Map();
for (const claim of claims) {
  for (const object of claim.surface_objects || []) {
    if (object.type !== "outlet" && object.type !== "clone") continue;
    const domain = normaliseDomain(object.object);
    if (!distributed.has(domain)) distributed.set(domain, []);
    distributed.get(domain).push({ claim, first_seen: object.date, evidence: object.found_in });
  }
}

// SR §4 step 4-5: the citation edge, and the claim it carries through the cell.
const edges = new Map();
for (const cell of metrics.cells) {
  for (const [domain, e] of Object.entries(cell.domains || {})) {
    if (!edges.has(domain)) {
      edges.set(domain, {
        domain, listed: e.listed, cited: 0, critical: 0,
        byBot: {}, byMarket: {}, byPersona: {}, byClaim: {}, byRun: {}, grid: {},
        verdicts: { repeat: 0, u_context: 0, refute: 0, dodge: 0 }
      });
    }
    const acc = edges.get(domain);
    acc.cited += e.cited;
    acc.critical += e.critical;
    acc.byBot[cell.chatbot] = (acc.byBot[cell.chatbot] || 0) + e.cited;
    acc.byMarket[cell.market] = (acc.byMarket[cell.market] || 0) + e.cited;
    acc.byPersona[cell.persona] = (acc.byPersona[cell.persona] || 0) + e.cited;
    acc.byClaim[cell.claim] = (acc.byClaim[cell.claim] || 0) + e.cited;
    acc.byRun[cell.run] = (acc.byRun[cell.run] || 0) + e.cited;
    // SR §10.2: bot x persona, and persona columns are never merged.
    acc.grid[cell.chatbot] = acc.grid[cell.chatbot] || {};
    acc.grid[cell.chatbot][cell.persona] = (acc.grid[cell.chatbot][cell.persona] || 0) + e.cited;
    for (const k of Object.keys(acc.verdicts)) acc.verdicts[k] += e[k] || 0;
  }
}

function record(domain, meta) {
  const edge = edges.get(domain) || null;
  const dist = distributed.get(domain) || [];
  const reached = edge ? Object.keys(edge.byClaim) : [];
  // SR §6: the domain published this falsehood and a bot cited it while
  // answering about that same falsehood. The strongest single piece of
  // evidence the system produces.
  const injection = dist.map((d) => d.claim.id).filter((id) => reached.includes(id));
  return {
    ...meta,
    domain,
    url: `/sources/${meta.slug}/`,
    defanged: domain.replace(/\./g, "[.]"),
    category: NETWORK_CATEGORY[meta.network] || "laundering_network",
    inWatchlist: meta.inWatchlist !== false,
    citedCount: edge ? edge.cited : 0,
    criticalCount: edge ? edge.critical : 0,
    byBot: edge ? edge.byBot : {},
    byMarket: edge ? edge.byMarket : {},
    byPersona: edge ? edge.byPersona : {},
    byClaim: edge ? edge.byClaim : {},
    byRun: edge ? edge.byRun : {},
    grid: edge ? edge.grid : {},
    verdicts: edge ? edge.verdicts : { repeat: 0, u_context: 0, refute: 0, dodge: 0 },
    citedBy: edge ? Object.keys(edge.byBot).sort() : [],
    claimsDistributed: dist.map((d) => d.claim),
    claimsReached: reached.map((id) => byId.get(id)).filter(Boolean),
    claimsInjection: injection.map((id) => byId.get(id)).filter(Boolean),
    // SR §10.4: cited on claims it is not recorded as having distributed.
    claimsReachedOnly: reached.filter((id) => !dist.some((d) => d.claim.id === id))
      .map((id) => byId.get(id)).filter(Boolean),
    claims: reached.map((id) => byId.get(id)).filter(Boolean),
    // SR §5: first and last time it was cited, and which runs it appears in.
    runs: edge ? Object.keys(edge.byRun).sort() : [],
    markets: edge ? Object.keys(edge.byMarket).sort() : [],
    injectionCount: injection.length,
    // SR §7.4: on the watchlist, cited by nobody in any run held here.
    status: (edge && edge.cited ? "active" : "dormant"),
    complaintStatus: (meta.complaints || []).map((c) => c.status).pop() || null
  };
}

const watchlisted = (raw.domains || []).map((s) =>
  record(normaliseDomain(s.domain), { ...s, inWatchlist: true })
);
const known = new Set(watchlisted.map((s) => s.domain));

// SR §4 step 2: a domain named on a claim card but not yet classified.
const unclassified = [...distributed.keys()]
  .filter((d) => !known.has(d))
  .map((d) => record(d, {
    slug: d.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    network: null, label: null, language: null, inWatchlist: false,
    attribution: [], complaints: [], article_evidence: []
  }));

// SR §11: an unclassified domain is internal. It stays out of the public
// registry and gets no page; it still appears on a claim card as a surface
// object, because the card is the claim's own record.
const registry = [...watchlisted]
  .sort((a, b) => b.citedCount - a.citedCount || a.domain.localeCompare(b.domain));

// SR §7: the analyst work lists, rebuilt with the registry.
const queues = {
  // 7.1 A bot cited a domain we know only from a claim card.
  candidates: unclassified.filter((s) => s.citedCount >= 1),
  // 7.2 Cited on flagged claims but on no list at all.
  unmatched: (metrics.raw.queues || {}).unmatched || [],
  // 7.3 On the registry with no category yet.
  unclassified: registry.filter((s) => !s.network),
  // 7.4 On the watchlist, cited by nobody in any run held here.
  dormant: watchlisted.filter((s) => s.citedCount === 0)
};

module.exports = registry;
module.exports.version = raw.version;
module.exports.updated = raw.updated;
module.exports.queues = queues;
module.exports.byDomain = Object.fromEntries([...registry, ...unclassified].map((s) => [s.domain, s]));
module.exports.lastRun = (metrics.raw.runs || [])
  .map((r) => r.collected_until || r.collected_at).sort().pop() || null;
module.exports.watchlisted = watchlisted;
