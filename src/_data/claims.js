// Claim records joined to their prose and to the metrics store. data/ holds
// every number, content/ holds every sentence; this is the only place the two
// meet (CLAUDE.md §3).
//
// Individual answers are not published - only the aggregate cell
// (Citere_Data_Demo, brief §4 "/data"). So a claim's figures are read from the
// store, and its actions from the countermeasures log, rather than from copies
// kept inside the claim card.
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../_lib/markdown.cjs");
const metrics = require("./metrics.js");
const runs = require("./runs.js");
const countermeasures = require("./countermeasures.js");

const dir = path.join(ROOT, "data/claims");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];

// The registry status chip, derived from what the countermeasures log records.
function claimStatus(actions) {
  if (actions.some((a) => a.kind === "remeasurement" && a.status === "closed")) {
    return { label: "Re-measured", cls: "ok" };
  }
  const disclosures = actions.filter((a) => a.type === "disclosure" && a.kind === "action");
  if (disclosures.some((a) => a.taken && !a.response_date && a.status !== "declined")) {
    return { label: "Awaiting response", cls: "wait" };
  }
  if (disclosures.some((a) => a.taken)) return { label: "Disclosed", cls: "" };
  if (actions.some((a) => a.type === "public" && a.taken)) return { label: "Published", cls: "" };
  if (actions.length) return { label: "Drafted", cls: "" };
  return null;
}

const claims = files
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .map((claim) => {
    const proseFile = path.join(ROOT, "content/en/claims", `${claim.id}.md`);
    const cells = metrics.select({ claim: claim.id });
    const grid = cells.filter((c) => !c.is_live);
    const all = metrics.pool(grid);
    const actions = countermeasures.actions.filter((a) => a.claims.includes(claim.id));
    const claimRuns = [...new Set(grid.map((c) => c.run))].sort();
    const personas = metrics.dimensions.personas || [];
    const bots = [...new Set(grid.map((c) => c.chatbot))].sort();

    // Claim Report Spec, Layer 3: Repeat Rate bot x persona, one table per
    // market. A single claim gives 4 variations x 3 repeats per cell, so every
    // cell here is below n = 20 and renders greyed - that is the honest
    // picture at claim level; significance is tested where cells pool across
    // the cluster (CM §5.6).
    // One table per market, on that market's current run. The earlier run of a
    // market appears under cleansing, not twice.
    const currentRuns = claimRuns.filter((key) => runs.currentKeys.includes(key));
    const tables = currentRuns.map((run) => ({
      run: runs.byKey[run],
      rows: bots.map((chatbot) => ({
        chatbot,
        cells: personas.map((persona) => {
          const cell = grid.find((c) => c.run === run && c.chatbot === chatbot && c.persona === persona);
          return { persona, cell: cell || null };
        })
      }))
    }));

    // CM §7: observed change after escalation, in the markets where a second
    // comparable run exists. Never "effect of escalation".
    const cleansing = [];
    for (const market of [...new Set(grid.map((c) => c.market))].sort()) {
      const inMarket = claimRuns
        .map((key) => runs.byKey[key])
        .filter((r) => r && r.market === market)
        .sort((a, b) => a.collected_at.localeCompare(b.collected_at));
      if (inMarket.length < 2) continue;
      const [before, after] = [inMarket[0], inMarket[inMarket.length - 1]];
      if (!before.comparable_with.includes(after.key)) continue;
      cleansing.push({
        market, before, after, persona: "P2", bots,
        rows: bots.map((chatbot) => {
          const b = metrics.poolOf({ claim: claim.id, chatbot, persona: "P2", run: before.key, is_live: false });
          const a = metrics.poolOf({ claim: claim.id, chatbot, persona: "P2", run: after.key, is_live: false });
          return { chatbot, before: b.repeat_rate, after: a.repeat_rate, change: metrics.compare(b, a) };
        })
      });
    }

    return {
      ...claim,
      raw: claim,
      url: `/registry/${claim.slug}/`,
      titles: { en: claim.title_en, uk: claim.title_uk || claim.title_en },
      hasProse: fs.existsSync(proseFile),
      tested: grid.length > 0,
      cells: grid,
      tables,
      cleansing,
      liveCells: cells.filter((c) => c.is_live),
      pooled: all,
      runs: claimRuns.map((key) => runs.byKey[key]).filter(Boolean),
      markets: [...new Set(grid.map((c) => c.market))].sort(),
      chatbots: [...new Set(grid.map((c) => c.chatbot))].sort(),
      repeatedBy: [...new Set(grid.filter((c) => c.counts.repeat > 0).map((c) => c.chatbot))].sort(),
      botsTested: new Set(grid.map((c) => c.chatbot)).size,
      citedDomains: all.listedDomains.map((d) => d.domain),
      langLabel: (claim.languages || []).map((l) => l.toUpperCase()).join(" "),
      counts: {
        observations: all.n,
        repeated: all.counts.repeat,
        critical: all.tiers.critical,
        contaminated: all.contaminated,
        actions: actions.filter((a) => a.taken).length,
        responses: actions.filter((a) => a.response_date).length
      },
      countermeasures: actions,
      remeasuredOn: actions
        .filter((a) => a.kind === "remeasurement" && a.status === "closed")
        .map((a) => a.date).sort().pop() || null,
      status: claimStatus(actions)
    };
  });

claims.sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0));

module.exports = claims;
