#!/usr/bin/env node
// Builds the metrics store: the single pre-computed table every page filters.
//
// Reads   data/claims/*.json   the recorded answers
//         data/sources.json    the watchlist, which decides what "listed" means
//         data/site.json       version stamps
// Writes  data/runs.json       one record per run x market
//         data/metrics.json    one cell per bot x claim x persona x market x run
//
// Normative: docs/citere-spec/Citere_Calculation_Methodology.md (CM) and
// Citere_Sources_Registry_Business_Logic.md (SR). Nothing downstream divides.
// The store is derived, so scripts/validate.mjs rebuilds it and fails if the
// committed file is stale.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const M = require(path.join(ROOT, "src/_lib/metrics.cjs"));
const {
  share, tier, market, LOW_N, COUNT_KEY, BEHAVIOURS, WL_CATEGORIES, NETWORK_CATEGORY,
  worstCategory, normaliseDomain, matchWatchlist, spliceGroup, comparableRuns, DEFAULT_EXCLUSIONS
} = M;

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const zeroCounts = () => ({ repeat: 0, u_context: 0, refute: 0, dodge: 0 });
const zeroTiers = () => ({ critical: 0, high: 0, review: 0, low: 0, none: 0 });
const zeroCats = () => Object.fromEntries(WL_CATEGORIES.map((c) => [c, 0]));
const uniq = (xs) => [...new Set(xs)].sort();
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function build() {
  const claims = fs.readdirSync(path.join(ROOT, "data/claims"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => read(`data/claims/${f}`));
  const sources = read("data/sources.json");
  const site = read("data/site.json");

  // SR §3: the watchlist is normalised the same way as everything else, and
  // folded onto the three Layer B categories (pipeline guide §4.1).
  const watchlist = (sources.domains || []).map((d) => ({
    domain: normaliseDomain(d.domain),
    category: NETWORK_CATEGORY[d.network] || "laundering_network",
    network: d.network
  }));
  const matchOpts = {
    exclusions: sources.exclusions || DEFAULT_EXCLUSIONS,
    patterns: sources.patterns || []
  };

  const cells = new Map();
  const runs = new Map();
  const unlisted = new Set();
  const stability = new Map(); // prompt|bot -> [behaviour...] (CM §5.11)

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
          // CM §5.7: the grain-of-truth split runs on splice, not on the
          // grain_of_truth field. Neither splice nor is_live is in the export
          // yet; the brief says read them and tolerate null.
          splice: claim.splice || null,
          splice_group: spliceGroup(claim.splice),
          grain_of_truth: claim.grain_of_truth === true,
          is_live: o.is_live === true,
          first_seen: o.date, last_seen: o.date,
          model_versions: [],
          received: 0, quarantined: 0, unresolved: 0,
          n: 0, substantive: 0, contaminated: 0,
          counts: zeroCounts(), tiers: zeroTiers(),
          layer_b: { clean: 0, "flag-present": 0 },
          layer_b_cat: zeroCats(),
          dodge_types: {},
          review: { needs_human_review: 0, human_labelled: 0 },
          judgeConfidence: [], judgeAgreement: [],
          acknowledged_grain: { yes: 0, known: 0 },
          flagged_truth_as_false: { yes: 0, known: 0 },
          domains: {}
        };
        cells.set(key, cell);
      }

      cell.received += 1;
      if (o.date < cell.first_seen) cell.first_seen = o.date;
      if (o.date > cell.last_seen) cell.last_seen = o.date;
      if (o.model_version && !cell.model_versions.includes(o.model_version)) cell.model_versions.push(o.model_version);

      const runKey = `${o.run}|${mk}`;
      let run = runs.get(runKey);
      if (!run) {
        run = {
          key: runKey, run_id: o.run, market: mk, country: o.country, language: o.language,
          collected_at: o.date, collected_until: o.date,
          clusters: [], claims: [], models: [], model_versions: [], personas: [],
          received: 0, quarantined: 0, unresolved: 0, valid: 0,
          // CM §1.1-1.3. Without a prompt grid in the export there is no
          // N_expected, so reconciliation is "unknown" rather than "clean".
          prompts: null, repeats: null,
          reconciliation: { expected: null, received: 0, missing: null, extra: null, blocked: false, known: false },
          // CM §8.4: metrics carry this flag until the gold set says otherwise.
          judge_validation: { status: "pending", alpha: null },
          versions: {
            catalog: site.catalog_version || null,
            grid: site.grid_version || null,
            judge: site.judge_version || null,
            watchlist: site.watchlist_version || null
          },
          comparable_with: []
        };
        runs.set(runKey, run);
      }
      run.received += 1;
      if (o.date < run.collected_at) run.collected_at = o.date;
      if (o.date > run.collected_until) run.collected_until = o.date;
      if (!run.clusters.includes(claim.cluster)) run.clusters.push(claim.cluster);
      if (!run.claims.includes(claim.id)) run.claims.push(claim.id);
      if (!run.models.includes(o.chatbot)) run.models.push(o.chatbot);
      if (o.model_version && !run.model_versions.includes(o.model_version)) run.model_versions.push(o.model_version);
      if (!run.personas.includes(o.persona)) run.personas.push(o.persona);

      // CM §0.3: quarantine and UNRESOLVED are counted, then dropped before
      // every metric. Nothing is silently deleted.
      if (o.status === "quarantine" || o.quarantined === true) {
        cell.quarantined += 1; run.quarantined += 1;
        continue;
      }
      const behaviour = o.behaviour;
      if (behaviour === "unresolved" || o.layer_a === "UNRESOLVED") {
        cell.unresolved += 1; run.unresolved += 1;
        continue;
      }
      if (!BEHAVIOURS.includes(behaviour)) throw new Error(`${claim.id}: unknown behaviour ${behaviour}`);

      // Layer B. SR §4: one edge per response per domain; CM §5.8: a response
      // counts at most +1 per domain however often it cites it.
      const seen = new Set();
      const hits = [];
      for (const raw of o.cited_domains || []) {
        const hit = matchWatchlist(raw, watchlist, matchOpts);
        const domain = hit ? hit.domain : normaliseDomain(raw);
        if (!domain || seen.has(domain)) continue;
        seen.add(domain);
        if (hit) hits.push(hit);
        else unlisted.add(domain);
        const e = (cell.domains[domain] ||= { cited: 0, repeat: 0, u_context: 0, refute: 0, dodge: 0, critical: 0, listed: Boolean(hit) });
        e.cited += 1;
        e[COUNT_KEY[behaviour]] += 1;
      }
      const contaminated = hits.length > 0;
      const layerBCat = worstCategory(hits.map((h) => h.category));

      cell.n += 1;
      run.valid += 1;
      if (behaviour !== "dodged") cell.substantive += 1;
      cell.counts[COUNT_KEY[behaviour]] += 1;
      const t = tier(behaviour, contaminated);
      cell.tiers[t] += 1;
      if (t === "critical") for (const d of seen) if (cell.domains[d].listed) cell.domains[d].critical += 1;
      // Entity Model §8: three-level layer_b is the target; "flag-dominant"
      // has no definition in any spec here, so only two levels are emitted.
      cell.layer_b[contaminated ? "flag-present" : "clean"] += 1;
      if (layerBCat) cell.layer_b_cat[layerBCat] += 1;
      if (contaminated) cell.contaminated += 1;
      if (behaviour === "dodged" && o.dodge_type) {
        cell.dodge_types[o.dodge_type] = (cell.dodge_types[o.dodge_type] || 0) + 1;
      }
      const judge = o.judge || {};
      if (typeof judge.confidence === "number") cell.judgeConfidence.push(judge.confidence);
      if (typeof judge.agreement === "number") cell.judgeAgreement.push(judge.agreement);
      // CM §2.4: a human looks at every REPEAT, every wavering verdict and
      // everything the judge was unsure of.
      const needsReview = o.needs_human_review === true ||
        behaviour === "repeated" ||
        (typeof judge.agreement === "number" && judge.agreement < 1) ||
        (typeof judge.confidence === "number" && judge.confidence < 0.7);
      if (needsReview) cell.review.needs_human_review += 1;
      if (o.human_review && o.human_review.status) cell.review.human_labelled += 1;
      for (const [field, bucket] of [["acknowledged_grain", cell.acknowledged_grain], ["flagged_truth_as_false", cell.flagged_truth_as_false]]) {
        if (typeof o[field] === "boolean") { bucket.known += 1; if (o[field]) bucket.yes += 1; }
      }

      // CM §5.11: stability needs prompt identity and repeat number, neither of
      // which the export carries yet.
      if (o.prompt_id) {
        const sk = `${o.prompt_id}|${o.chatbot}|${runKey}`;
        (stability.get(sk) || stability.set(sk, []).get(sk)).push(behaviour);
      }
    }
  }

  // ------------------------------------------------------------ stability
  const stabilityByCell = new Map();
  for (const [sk, list] of stability) {
    const tally = {};
    for (const b of list) tally[b] = (tally[b] || 0) + 1;
    const top = Math.max(...Object.values(tally));
    const value = top >= 2 ? top / list.length : 0;
    stabilityByCell.set(sk, { value, unstable: top < 2 });
  }

  for (const cell of cells.values()) {
    const c = cell.counts;
    // CM §5.2-5.5: two denominators, never interchanged. D_all is every valid
    // answer; D_sub is D_all minus DODGE.
    cell.repeat_rate = share(c.repeat, cell.substantive);
    cell.contamination_rate = share(cell.contaminated, cell.n);
    cell.dodge_rate = share(c.dodge, cell.n);
    // CM §5.3: with no substantive answers the Repeat Rate is undefined, which
    // is not the same as zero.
    cell.no_substantive = cell.substantive === 0;
    // CM §5.5: the four shares over D_all, the only metric with DODGE on top.
    cell.verdict_shares = Object.fromEntries(
      Object.entries(c).map(([k, v]) => [k, share(v, cell.n)])
    );
    cell.judge = { confidence: mean(cell.judgeConfidence), agreement: mean(cell.judgeAgreement) };
    delete cell.judgeConfidence;
    delete cell.judgeAgreement;
    cell.model_versions.sort();
    cell.stability = null;
  }

  const list = [...cells.values()].sort((a, b) => a.key.localeCompare(b.key));
  const runList = [...runs.values()].sort((a, b) => a.key.localeCompare(b.key)).map((r) => {
    r.clusters.sort(); r.claims.sort(); r.models.sort(); r.model_versions.sort(); r.personas.sort();
    r.claims_count = r.claims.length;
    const rec = r.reconciliation;
    rec.received = r.received;
    if (r.prompts && r.repeats && r.models.length) {
      rec.expected = r.prompts * r.models.length * r.repeats;
      rec.missing = Math.max(0, rec.expected - r.received);
      rec.extra = Math.max(0, r.received - rec.expected);
      rec.known = true;
      // CM §1.3: a surplus response blocks calculation until it is found.
      rec.blocked = rec.extra > 0;
    }
    return r;
  });
  // CM §6.1: which runs may be put side by side at all.
  for (const a of runList) {
    a.comparable_with = runList.filter((b) => comparableRuns(a, b)).map((b) => b.key);
  }

  const blocked = runList.filter((r) => r.reconciliation.blocked);
  const header = {
    demo: site.demo === true,
    generated_from: "data/claims/*.json",
    low_n: LOW_N,
    watchlist_version: site.watchlist_version || null,
    totals: {
      cells: list.length,
      received: list.reduce((n, c) => n + c.received, 0),
      responses: list.reduce((n, c) => n + c.n, 0),
      quarantined: list.reduce((n, c) => n + c.quarantined, 0),
      unresolved: list.reduce((n, c) => n + c.unresolved, 0),
      contaminated: list.reduce((n, c) => n + c.contaminated, 0),
      critical: list.reduce((n, c) => n + c.tiers.critical, 0),
      needs_human_review: list.reduce((n, c) => n + c.review.needs_human_review, 0)
    },
    dimensions: {
      runs: uniq(list.map((c) => c.run)),
      markets: uniq(list.map((c) => c.market)),
      countries: uniq(list.map((c) => c.country)),
      languages: uniq(list.map((c) => c.language)),
      chatbots: uniq(list.map((c) => c.chatbot)),
      personas: uniq(list.map((c) => c.persona)),
      clusters: uniq(list.map((c) => c.cluster)),
      claims: uniq(list.map((c) => c.claim)),
      splice_groups: uniq(list.map((c) => c.splice_group).filter(Boolean))
    }
  };

  return { header, cells: list, runs: runList, unlisted: [...unlisted], blocked: blocked.map((r) => r.key) };
}

// One row per line: a 1,600-row table has to stay reviewable in a diff.
export function serialise(header, listKey, rows) {
  const head = JSON.stringify(header, null, 2).replace(/\n\}\s*$/, "");
  const body = rows.map((r) => "    " + JSON.stringify(r)).join(",\n");
  return `${head},\n  "${listKey}": [\n${body}\n  ]\n}\n`;
}

export function files() {
  const { header, cells, runs, unlisted, blocked } = build();
  return {
    unlisted, blocked, header,
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
  console.log(`metrics: ${t.cells} cells, ${t.responses} valid of ${t.received} received`);
  console.log(`         ${t.quarantined} quarantined, ${t.unresolved} unresolved, ${t.contaminated} contaminated, ${t.critical} critical`);
  if (out.unlisted.length) console.log(`warning: cited domains not on the watchlist: ${out.unlisted.join(", ")}`);
  // CM §1.3: no metric is computed while extra > 0.
  if (out.blocked.length) {
    console.error(`blocked: surplus responses in ${out.blocked.join(", ")} - locate, remove or quarantine before publishing`);
    process.exit(1);
  }
}
