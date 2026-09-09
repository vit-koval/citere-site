#!/usr/bin/env node
// Builds the metrics store: the single pre-computed table every page filters.
//
// Reads   data/claims/*.json   the recorded answers
//         data/sources.json    the watchlist, which decides what "listed" means
//         data/site.json       version stamps
// Writes  data/runs.json       one record per run x market
//         data/metrics.json    one cell per bot x claim x persona x market x run
//
// Nothing downstream divides: pages filter and arrange these cells
// (CLAUDE_CODE_BRIEF §2 "Metrics store", §3 rules 1-5). The store is derived,
// so scripts/validate.mjs rebuilds it and fails if the committed file is stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { share, tier, market, LOW_N, COUNT_KEY, BEHAVIOURS } = require(path.join(ROOT, "src/_lib/metrics.cjs"));

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const zeroCounts = () => ({ repeat: 0, u_context: 0, refute: 0, dodge: 0 });
const zeroTiers = () => ({ critical: 0, high: 0, review: 0, low: 0, none: 0 });
const uniq = (xs) => [...new Set(xs)].sort();
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function build() {
  const claims = fs.readdirSync(path.join(ROOT, "data/claims"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => read(`data/claims/${f}`));
  const sources = read("data/sources.json");
  const site = read("data/site.json");
  const listed = new Set((sources.domains || []).map((d) => d.domain));

  const cells = new Map();
  const runs = new Map();
  const unlisted = new Set();

  for (const claim of claims) {
    for (const o of claim.observations || []) {
      const mk = market(o.country, o.language);
      const key = [o.run, claim.id, o.chatbot, o.persona, mk].join("|");
      let cell = cells.get(key);
      if (!cell) {
        cell = {
          key, run: o.run, claim: claim.id, cluster: claim.cluster,
          chatbot: o.chatbot, persona: o.persona,
          country: o.country, language: o.language, market: mk,
          splice: claim.splice || null,          // brief §2, not yet in the export
          grain_of_truth: claim.grain_of_truth === true,
          is_live: false,                        // Prompt.is_live, not yet in the export
          first_seen: o.date, last_seen: o.date,
          model_versions: [],
          n: 0, substantive: 0, contaminated: 0, responses: 0,
          counts: zeroCounts(), tiers: zeroTiers(),
          dodge_types: {},                       // VerdictA.dodge_type, not yet in the export
          acknowledged_grain: null,              // VerdictA.acknowledged_grain, ditto
          flagged_truth_as_false: null,          // never populated by design
          judgeConfidence: [], judgeAgreement: [],
          domains: {}
        };
        cells.set(key, cell);
      }

      if (!BEHAVIOURS.includes(o.behaviour)) throw new Error(`${claim.id}: unknown behaviour ${o.behaviour}`);
      const cited = (o.cited_domains || []).filter(Boolean);
      for (const d of cited) if (!listed.has(d)) unlisted.add(d);
      // Contamination is "cited at least one listed source", once per answer.
      const contaminated = cited.some((d) => listed.has(d));

      cell.responses += 1;
      cell.n += 1;
      if (o.behaviour !== "dodged") cell.substantive += 1;
      cell.counts[COUNT_KEY[o.behaviour]] += 1;
      cell.tiers[tier(o.behaviour, contaminated)] += 1;
      if (contaminated) cell.contaminated += 1;
      if (o.date < cell.first_seen) cell.first_seen = o.date;
      if (o.date > cell.last_seen) cell.last_seen = o.date;
      if (o.model_version && !cell.model_versions.includes(o.model_version)) cell.model_versions.push(o.model_version);
      if (o.judge && typeof o.judge.confidence === "number") cell.judgeConfidence.push(o.judge.confidence);
      if (o.judge && typeof o.judge.agreement === "number") cell.judgeAgreement.push(o.judge.agreement);
      for (const d of cited) {
        const e = (cell.domains[d] ||= { cited: 0, while_repeating: 0 });
        e.cited += 1;
        if (o.behaviour === "repeated") e.while_repeating += 1;
      }

      const rkey = `${o.run}|${mk}`;
      let run = runs.get(rkey);
      if (!run) {
        run = {
          key: rkey, run_id: o.run, market: mk, country: o.country, language: o.language,
          collected_at: o.date, collected_until: o.date,
          clusters: [], claims: [], models: [], model_versions: [], personas: [],
          responses: 0,
          // No prompt table in the export yet, so the grid shape is unknown
          // rather than one. Brief §2: read it, tolerate null.
          prompts: null, repeats: null,
          versions: { catalog: null, grid: null, judge: null, watchlist: site.watchlist_version || null }
        };
        runs.set(rkey, run);
      }
      run.responses += 1;
      if (o.date < run.collected_at) run.collected_at = o.date;
      if (o.date > run.collected_until) run.collected_until = o.date;
      if (!run.clusters.includes(claim.cluster)) run.clusters.push(claim.cluster);
      if (!run.claims.includes(claim.id)) run.claims.push(claim.id);
      if (!run.models.includes(o.chatbot)) run.models.push(o.chatbot);
      if (o.model_version && !run.model_versions.includes(o.model_version)) run.model_versions.push(o.model_version);
      if (!run.personas.includes(o.persona)) run.personas.push(o.persona);
    }
  }

  for (const cell of cells.values()) {
    // Two denominators, never interchanged (brief §3.5): Repeat Rate divides by
    // substantive answers, everything else by all valid answers.
    cell.repeat_rate = share(cell.counts.repeat, cell.substantive);
    cell.contamination_rate = share(cell.contaminated, cell.n);
    cell.dodge_rate = share(cell.counts.dodge, cell.n);
    cell.judge = { confidence: mean(cell.judgeConfidence), agreement: mean(cell.judgeAgreement) };
    delete cell.judgeConfidence;
    delete cell.judgeAgreement;
    cell.model_versions.sort();
  }

  const list = [...cells.values()].sort((a, b) => a.key.localeCompare(b.key));
  const runList = [...runs.values()].sort((a, b) => a.key.localeCompare(b.key)).map((r) => {
    r.clusters.sort(); r.claims.sort(); r.models.sort(); r.model_versions.sort(); r.personas.sort();
    return r;
  });

  const header = {
    demo: site.demo === true,
    generated_from: "data/claims/*.json",
    low_n: LOW_N,
    totals: {
      cells: list.length,
      responses: list.reduce((n, c) => n + c.n, 0),
      contaminated: list.reduce((n, c) => n + c.contaminated, 0),
      critical: list.reduce((n, c) => n + c.tiers.critical, 0)
    },
    dimensions: {
      runs: uniq(list.map((c) => c.run)),
      markets: uniq(list.map((c) => c.market)),
      countries: uniq(list.map((c) => c.country)),
      languages: uniq(list.map((c) => c.language)),
      chatbots: uniq(list.map((c) => c.chatbot)),
      personas: uniq(list.map((c) => c.persona)),
      clusters: uniq(list.map((c) => c.cluster)),
      claims: uniq(list.map((c) => c.claim))
    }
  };

  return { header, cells: list, runs: runList, unlisted: [...unlisted] };
}

// One row per line: a 1,600-row table has to stay reviewable in a diff.
export function serialise(header, listKey, rows) {
  const head = JSON.stringify(header, null, 2).replace(/\n\}\s*$/, "");
  const body = rows.map((r) => "    " + JSON.stringify(r)).join(",\n");
  return `${head},\n  "${listKey}": [\n${body}\n  ]\n}\n`;
}

export function files() {
  const { header, cells, runs, unlisted } = build();
  return {
    unlisted,
    header,
    cellCount: cells.length,
    "data/metrics.json": serialise(header, "cells", cells),
    "data/runs.json": serialise({ demo: header.demo, low_n: header.low_n }, "runs", runs)
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = files();
  for (const name of ["data/metrics.json", "data/runs.json"]) {
    fs.writeFileSync(path.join(ROOT, name), out[name]);
  }
  const t = out.header.totals;
  console.log(`metrics: ${t.cells} cells, ${t.responses} responses, ${t.contaminated} contaminated, ${t.critical} critical`);
  if (out.unlisted.length) console.log(`warning: cited domains not on the watchlist: ${out.unlisted.join(", ")}`);
}
