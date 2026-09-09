# Citere — Countries Index: Business Logic

**Version:** 1.0 · 2026-09-09
**Scope:** the Countries index page (all markets side by side). The single-market page is a filter over the same data and is not covered here.
**Depends on:** Calculation Methodology v1.0 (CM), Sources Registry Business Logic v1.0 (SR), Entity Model v0.7.

Nothing on this page is computed on the page. Every block reads pre-computed cells from the metrics store and the registry, then filters and arranges them. This document defines each block: what it shows, which cells it reads, how it arranges them, and what it is forbidden to do.

---

## 0. Definitions used throughout

**Market** = country × language. `DE/DE` and `AT/DE` are two markets. `CH/DE` and `CH/FR` are two markets. A market is identified by `runs.market` + `runs.language`.

**Cell** = bot × claim × persona × market × run (CM §5.1). This is the atom. Every number on the page is a cell or a permitted pooling of cells.

**Permitted pooling** (CM §5.1): across claims within a cluster; across bots. **Forbidden**: across personas; across markets; across runs. The Countries page compares markets — it never merges them.

**Current run** for a market = the latest run for the selected cluster in that market. Unless a block says otherwise, all blocks use the current run per market.

**Comparability** (CM §6.1): two markets are compared only if their current runs share cluster, `prompt_grid_version`, repeats, and the bots being compared. Markets failing this are shown but flagged "not comparable"; they are excluded from significance tests.

**Significance** = Wilson 95% intervals do not overlap (CM §5.6). Conservative by design.

**low_n** = cell with n < 20 (CM §5.6). Shown greyed, excluded from rankings and significance.

**Page-level filters** (apply to every block): cluster (required, default = latest cluster with ≥ 2 markets), bot set (default = all bots present in every selected market), date range (default = current runs).

---

## 1. Heatmap — market × bot

**Shows.** Repeat Rate for one persona at a time, markets as rows, bots as columns.

**Reads.** For the selected persona `p`, selected cluster `c`, each market `m`, each bot `b`: the pooled cell over all claims in `c`:

```
RR(b, m, p) = Σ_claims REPEAT / Σ_claims D_sub
```

with Wilson CI and n. Pooling across claims is permitted (CM §5.1).

**Arranges.** Rows sorted by count of bots with `RR > 0` and not low_n, descending; ties by max RR. Columns in a fixed bot order across the whole site. Cell colour by RR bucket (<10 / 10–20 / 20–35 / >35); low_n cells greyed regardless of value.

**Controls.** Persona switch P1 / P2 / P3 / P4. Default P2. Metric switch RR / CR (Contamination Rate, same pooling, denominator D_all).

**Forbidden.** No "all personas" option. No row or column totals.

---

## 2. Market vulnerability table

**Shows.** Per market, how many bots have a confirmed problem here — not an average.

**Reads.** For each market `m` and the selected cluster, at persona P2 (fixed; the persona where contamination peaks and where the comparison is most meaningful):

| Column | Computation |
|---|---|
| Bots tested | count of bots with ≥ 1 valid response in `m` |
| Bots with confirmed repeats | count of bots where `RR(b,m,P2)` CI lower bound > 0 and not low_n |
| CRITICAL | Σ responses with `escalation_tier = CRITICAL` in `m`, all personas |
| HIGH | same for HIGH |
| Injection lines | count of (domain, claim) pairs with `injection_line = true` where at least one `edge_cited` response is in `m` (SR §4 step 6, filtered to market) |
| Listed domains cited | distinct domains with `edge_cited` in `m` |
| Worst bot | bot with max `RR(b,m,P2)` among non-low_n; shown with RR and CI |
| Last run | `runs.collected_at` of current run |

**Arranges.** Sorted by "Bots with confirmed repeats" desc, then CRITICAL desc.

**Forbidden.** No single "vulnerability score". The columns stay separate.

---

## 3. Coverage matrix — market × cluster

**Shows.** What has actually been tested where, so the reader can see gaps before reading comparisons.

**Reads.** For each market `m`, each cluster `c`: count of distinct `claim_id` tested, number of runs, date of latest run, `prompt_grid_version`.

**Arranges.** Rows markets, columns clusters. Empty cell = never tested. Cell with a grid version different from the majority = flagged "different grid".

**Purpose in logic.** This block also feeds the comparability check: any two markets compared in blocks 5, 6, 12 must share the grid version shown here.

---

## 4. Silence map — DODGE by market

**Shows.** Where bots refuse or fail to answer instead of engaging. A market that looks clean because bots don't answer is not clean.

**Reads.** For each bot `b`, market `m`, persona `p`, selected cluster: DODGE share from the verdict distribution (CM §5.5):

```
DODGE(b, m, p) = Σ_claims DODGE / Σ_claims D_all
```

with Wilson CI and n.

**Arranges.** Same layout as block 1 (markets × bots), persona switch, default P1 (refusals on neutral questions are the most telling). Colour scale separate from block 1: grey buckets, not red.

**Companion figure.** Next to each market row: the share of DODGE responses that are empty/failed (`text_clean` length < 50 after quarantine rules, i.e. bot returned nothing usable) vs explicit refusals. Read from `verdicts.layer_a_reasoning` containing the judge's "empty" flag — **requires the judge to output a `dodge_type` field: `empty | refusal | evasion`.** Until that field exists the companion figure is hidden.

**Forbidden.** Do not subtract DODGE from RR or present "adjusted" rates. RR already excludes DODGE by definition (D_sub); this block exists so the reader sees what was excluded.

---

## 5. Retrieval share — answers with citations, by market

**Shows.** How often the bot actually searched. Distinguishes "clean because it never looked" from "looked and stayed clean".

**Reads.** For each bot `b`, market `m`, persona `p`:

```
RET(b, m, p) = responses with |domains[]| ≥ 1 / D_all
```

`domains[]` is the normalised list from SR §3 (all cited domains, listed or not). Wilson CI, n.

**Arranges.** Markets × bots, persona switch, default P2 (the retrieval persona). Shown as a table, not a heatmap: this is context, not a finding.

**Derived line per market.** Below the table, for each market: "Among answers with citations, share that cited a listed domain" =

```
CR_given_retrieval(b, m, p) = contaminated / responses with |domains[]| ≥ 1
```

This is the conditional contamination rate. It is shown only here and only with this explicit label; it is never used elsewhere as "the contamination rate" (CM §5.4 defines CR over D_all).

**Forbidden.** Do not rank markets by RET. High retrieval is neither good nor bad on its own.

---

## 6. Citation language vs market language

**Shows.** Whether a bot answering in German cites German sources, English sources, or Russian sources. Catches bots that leave the local web and pull global (often English-language Pravda) results.

**Reads.** Every `edge_cited` response in market `m` (SR §4 step 4, extended to all cited domains, not only listed ones). For each cited domain, the domain's language from a new registry field `registry.domain_language` (see Schema additions). Then per bot `b`, market `m`:

```
share_lang(b, m, L) = citations whose domain_language = L / all citations in (b, m)
```

Citations counted per response-domain pair (one response citing the same domain twice counts once — SR §5 rule).

**Arranges.** One stacked bar per bot per market: market language / English / Russian / other. Markets grouped, bots inside. Listed domains hatched within their language segment so the reader sees, e.g., that the Russian segment in DE is mostly listed.

**Derived figure.** "Cross-language leakage" per bot per market = share of *listed* citations whose `domain_language ≠ market language`. Shown as a number under each bar. This is the figure the block exists for: a listed English-language Pravda mirror cited in a German answer.

**Forbidden.** No pooling across personas — persona switch applies, default P2. No inference about *why* the bot left the local web.

---

## 7. One bot — all markets

**Shows.** Interactive: pick a bot, see its RR and CR in every market, per persona, with significance flags between markets.

**Reads.** For selected bot `b`, each market `m`, each persona `p`: `RR(b, m, p)` and `CR(b, m, p)` pooled over the cluster's claims, with CI.

**Arranges.** Four small panels (one per persona), markets on the x-axis, RR with error bars. Below each panel a pairwise significance matrix: markets × markets, cell = "sig" if intervals do not overlap and both non-low_n and comparable (block 3), else blank.

**Generated sentence.** Template: "[Bot] repeats this cluster's claims significantly more in [m1] than in [m2] at [persona]" — one sentence per significant pair, max 3, ordered by gap size. If none: "No significant differences between markets for [bot] at n = [min n]."

---

## 8. One claim — all markets

**Shows.** Same as block 7 for a single claim instead of a bot: where this specific lie passes through and where it doesn't.

**Reads.** For selected `claim_id`, each market `m`, each bot `b`, persona P2 (fixed for this block; persona switch available): the cell `RR(b, claim, P2, m)`. Not pooled — this is the atomic cell, so most values will be low_n at 3 repeats.

**Arranges.** Markets × bots table for this claim, CI and n in every cell, low_n greyed. Plus the claim's injection-line domains per market from SR (which of the claim's distributing domains were cited in each market).

**Note in the block.** "At 3 repeats, per-claim cells are below n = 20. This table shows direction; significance is tested at cluster level in block 7." (This is the same limitation recorded in the Claim Report spec.)

---

## 9. Source locality

**Shows.** Which listed domains are global, which are local to one market, which are regional.

**Reads.** SR aggregate `cited_by_market[m]` per domain, restricted to the selected cluster's claims and current runs.

```
locality(domain) =
  local(m)   if cited_by_market[m] / cited_total ≥ 0.70
  global     if cited in ≥ 3 markets and no market ≥ 0.50
  regional   otherwise
```

Thresholds are constants in config, not hard-coded.

**Arranges.** Table: domain, network, locality label, citations per market (columns), total. Sorted local-first, then by total. Local domains link to the market page they belong to.

**Purpose.** Shows where a language-specific mirror exists and works (pravda-de.com cited only in DE) versus where a global source reaches everywhere (rt.com).

---

## 10. Grain-of-truth differential by market

**Shows.** Whether the gap between splice-A/B/C claims and splice-D claims (CM §5.7) is the same everywhere. Same gap everywhere → property of the bots. Different gap → property of the market.

**Reads.** For each market `m`, bot `b`, persona `p`: `RR_GT(b, m, p)` and `RR_F(b, m, p)` per CM §5.7 (pooled over splice groups within the cluster), with CIs and the non-overlap significance flag.

**Arranges.** Dumbbell per bot per market: two dots (F, GT) on one line, markets stacked. Persona switch, default P2.

**Forbidden.** No pooling of the differential across markets.

---

## 11. Language vs country

**Shows.** When two markets share a language but not a country (DE/DE vs AT/DE), or a country but not a language (CH/DE vs CH/FR), which factor moves the numbers.

**Reads.** Pairs are detected automatically from `runs`: same `language` ≠ `market` → language pair; same country prefix, different `language` → country pair. For each pair and each bot and persona: the two RR cells and their significance flag.

**Arranges.** One row per pair: pair type, bot, persona, RR₁ (CI), RR₂ (CI), significant y/n. Grouped by pair type.

**Generated sentence.** Per pair type, template: "Across [k] bot×persona comparisons, [j] differ significantly when only the [country / language] changes." If both pair types exist, a closing line compares the two counts. No causal wording.

**Empty state.** "No market pairs sharing a language or a country have been tested yet." Shown, not hidden — this block is a stated goal of the programme.

---

## 12. Countermeasures by market

**Shows.** What has been done on each market, and with whom.

**Reads.** `countermeasures` table joined to claims tested in `m`. Per market: count by type (disclosure to platform / data shared with fact-checkers / partner notification / catalog update / public report / re-measurement), list of distinct targets, count with status = done, latest date.

**Arranges.** Table, one row per market, one column per countermeasure type, plus "partners" (targets of type fact-checker or partner) as a list.

**Forbidden.** No ratio "countermeasures per critical". Counts only.

---

## 13. Trend by market

**Shows.** How RR at P2 moves across runs, one line per market, one bot at a time.

**Reads.** For selected bot `b`, each market `m`, each run `r` in the selected cluster (not only current): `RR(b, m, P2, r)` pooled over claims, CI. Only runs satisfying CM §6.1 relative to each other within the same market are connected by a line; a run with a different grid version starts a new segment.

**Arranges.** Line chart, x = run date, y = RR, band = CI. Significance marker on a step when consecutive intervals do not overlap.

**Empty state.** Requires ≥ 2 comparable runs in ≥ 1 market. Until then: "Trend appears after the second comparable run."

---

## 14. Rebuild and caching

- All blocks read from the metrics store, which is rebuilt after every run ingest (CM) and after every registry rebuild (SR §8).
- The page is regenerated on rebuild; nothing is computed on request except the interactive selections in blocks 7, 8, 11, 13, which switch between pre-computed cells.
- Every block footer carries: cluster, run_ids used, `watchlist_version`, `judge_prompt_version`, built_at.

---

## 15. Validation on every rebuild

- For every market, Σ verdict shares over four categories = 1.00 (block 4 consistency with CM §5.5). Assert.
- For every (bot, market, persona), `RET ≥ CR` (you cannot cite a listed domain without citing something). Assert.
- For every (bot, market, persona), `CR_given_retrieval ≥ CR`. Assert.
- Block 6 language shares per (bot, market) sum to 1.00. Assert.
- No block emits a figure pooled across personas or markets. Assert by construction: the store has no such keys.
- Every market shown in blocks 7, 10, 11, 13 passes comparability (block 3). Assert.

Failed assertion blocks publication of the page.

---

## Schema additions required

| Field | Where | Feeds |
|---|---|---|
| `registry.domain_language` — ISO 639-1, analyst-set at watchlist entry, auto-suggested from TLD and content language | Sources Registry | block 6 |
| `verdicts.dodge_type` — `empty / refusal / evasion` | judge output | block 4 companion figure |
| `runs.country`, `runs.language` as separate fields (currently combined in `market`) | Runs | block 11 pair detection |
| Config constants: locality thresholds (0.70 / 0.50 / 3 markets) | config | block 9 |

---

## What this page does not do

- No map with countries coloured by "contamination level".
- No single score per country.
- No average across bots, personas, or markets.
- No structural overlays (HDI, regulation, press freedom) — decided against 2026-09-09.
- No "debunk availability" cross — decided against 2026-09-09.
