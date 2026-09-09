# Citere — Site Restructure Brief

**For:** Claude Code, working on the existing Citere site repository
**Date:** 2026-09-09
**Goal:** restructure the site to the information architecture defined below, replacing the current page set.

---

## 0. Read this first

This brief is the task. The other files in this folder are:

**Reference designs (HTML, self-contained, synthetic data).** These are working prototypes of each page — layout, block order, and what every number means. Open them, match the structure and the logic. They are not production code: they inline their own CSS and generate fake data in a script tag. Take the structure, not the implementation.

| File | Page it prototypes |
|---|---|
| `Citere_Registry_Index_Demo.html` | Registry index |
| `Citere_Claim_Report_Demo.html` | Claim Report (the core page) |
| `Citere_Claim_Escalation_Demo.html` | Escalation report for one claim |
| `Citere_Sources_Registry_Demo.html` | Disinformation Sources index + domain detail panel |
| `Citere_Bot_Perplexity_Demo.html` | Chatbot page |
| `Citere_Countries_Index_Demo.html` | Countries index |
| `Citere_Countries_FullData_Demo.html` | Countries → full analytical view (secondary page) |
| `Citere_Country_Germany_Demo.html` | Single country page |
| `Citere_Countermeasures_Demo.html` | Countermeasures log |
| `Citere_Data_Demo.html` | Data / open exports |

**Specifications (Markdown).** These define the data model and the rules behind every figure. Where a demo and a spec disagree, the spec wins.

| File | Defines |
|---|---|
| `Citere_Entity_Model_and_Field_Instructions.md` | All entities and fields; how a Claim card is built |
| `Citere_Calculation_Methodology.md` | Every metric: units, denominators, confidence intervals, what is never aggregated |
| `Citere_Sources_Registry_Business_Logic.md` | How the sources registry is derived and exported |
| `Citere_Countries_Index_Business_Logic.md` | Every comparative block on the Countries page |
| `Citere_Claim_Report_Spec.md` | Section-by-section spec of the Claim Report |
| `Citere_Countries_Pages_Description.md` | Countries index + country page in prose |
| `Citere_Countermeasures_Catalogue.md` | The 12 countermeasure types and their lifecycle |

---

## 1. Target site map

```
/                       Home
/registry               Registry — all claims, filterable
/registry/{claim_id}    Claim Report
/registry/{claim_id}/escalation   Escalation report for that claim
/sources                Disinformation Sources — domain index
/sources/{domain}       Domain page
/chatbots               Chatbots index
/chatbots/{bot}         Bot page
/countries              Countries index
/countries/full         Countries — full analytical view
/countries/{market}     Country page  (market = country-language, e.g. de-de)
/benchmarks             Benchmarks index      ← NOT YET SPECIFIED, build shell only
/benchmarks/{issue}     Benchmark issue       ← NOT YET SPECIFIED, build shell only
/countermeasures        Countermeasures log
/data                   Open data exports
/mission /manifesto /press /terms /privacy    (existing shell pages, keep)
```

### Changes from the current site

**Remove entirely:**
- Any Clusters section and cluster pages. Cluster survives only as a *field* on a claim (`cluster_id`) used for filtering and for grouping in Benchmarks. It is not navigation.
- The `Escalations` page as currently named — replaced by `/countermeasures` (see §4).
- Any Methodology page that publishes full specification documents. Method may be explained in prose on an About/Method page if one exists, but the specification Markdown files are **not** published.

**Rename:**
- `Escalations` → `Countermeasures` everywhere (nav, headings, copy).
- `Reports` → `Benchmarks`, with a defined unit: one cluster × one month.

**Add:**
- `/registry/{claim_id}/escalation` — per-claim escalation report.
- `/chatbots/{bot}` — bot pages.
- `/countries/{market}` — country pages.
- `/countries/full` — the 13-block analytical view.
- `/data` restructured by entity with CSV and JSON per entity.

---

## 2. Data model

Implement the entities in `Citere_Entity_Model_and_Field_Instructions.md`. Summary of what the site reads:

```
Cluster        cluster_id, name, status
Claim          claim_id, cluster_id, label, false_claim, grain_of_truth[],
               canonical_debunk, debunk_sources[], debunk_argument[],
               splice (A|B|C|D), surface_objects[], status, version
Run            run_id, cluster_id, country, language, collected_at,
               models[], prompts, repeats, versions{catalog,grid,judge,watchlist}
Response       response_id, run_id, prompt_id, claim_id, model_name, persona,
               repeat_n, text_clean, domains[], collected_at
VerdictA       layer_a (REPEAT|U_context|REFUTE|DODGE), quote, reasoning,
               confidence, agreement, acknowledged_grain, flagged_truth_as_false
VerdictB       layer_b, wl_hits[], layer_b_cat, watchlist_version
Escalation     escalation_tier (CRITICAL|HIGH|REVIEW|LOW|none)
Countermeasure claim_ids[], market, type, subtype, target, status,
               submission_content, proof{}, response, follow_up_due, public
Registry       domain, category, actor, attributed_by, domain_language,
               edges: distributed / reached / injection_line
```

**Schema additions not yet in the pipeline** — build the site to read them, tolerate null:
- `Claim.debunk_argument[]` — `{assertion, refutation, source}`, feeds "Why this is false"
- `VerdictA.acknowledged_grain` — bool
- `VerdictA.flagged_truth_as_false` — bool (field exists, never populated)
- `VerdictA.dodge_type` — `empty|refusal|evasion`
- `Prompt.is_live` — bool
- `Registry.domain_language` — ISO 639-1
- `Run.country` and `Run.language` as separate fields (currently combined as `market`)

**Metrics store.** Do not compute metrics in page components. Build one pre-computed store keyed by `bot × claim × persona × market × run`, holding counts and Wilson bounds, per `Citere_Calculation_Methodology.md`. Every page filters and arranges this store. Rates are never stored in the sources registry — only counts and keys.

---

## 3. Rules that apply to every page

These are not stylistic. Violating them produces wrong numbers.

1. **Never aggregate across personas.** Four personas are always shown separately. There is no "all personas" option anywhere.
2. **Never aggregate across markets or runs.** Markets and runs are compared side by side, never pooled.
3. **Every percentage carries its confidence interval and n.** No bare percentages. Cells with n < 20 render greyed and are excluded from rankings and significance claims.
4. **Significance = Wilson intervals do not overlap.** No other test. If they overlap, the copy says "directional", not "higher".
5. **Two denominators, never interchanged.** Repeat Rate divides by substantive answers (DODGE removed). Contamination Rate and verdict distribution divide by all valid answers.
6. **Empty sections render their empty state.** Never hide a section because it has no data — the reader must see that escalation has not happened, not wonder whether it was omitted.
7. **Terminology.** Domains bots cite are "listed sources" or "watchlisted sources", never "Kremlin-linked sources" — the watchlist will include outlets that relayed a fake without being state-linked. Actions are "countermeasures"; a report to a platform is a "disclosure". In prose use "repeated the fake"; `REPEAT` appears only in tables.
8. **Every entity links to its own record.** Claim → domain → bot → country → back to claim. No dead ends.

---

## 4. Page-by-page

### `/registry`
Reference: `Citere_Registry_Index_Demo.html`

Five KPI tiles, then one table of all claims across all clusters. Columns: claim (id + text), cluster, splice badge, status pill, markets tested, repeats with CI, critical count. Filters: cluster, splice, status, market, "has critical incidents", free-text search. Sorted by critical desc, then repeats desc. Row → Claim Report.

### `/registry/{claim_id}`
Reference: `Citere_Claim_Report_Demo.html` · Spec: `Citere_Claim_Report_Spec.md`

Three layers, in this order:

**Layer 1** — headline (the finding, not the topic), four-sentence lede, tags, metadata box (must include a **Countries** line: count and list), six KPI tiles: chatbots tested · answers across N countries · repeated the fake · critical · disinformation sources identified · countermeasures taken. Tiles 5 and 6 link to their sections.

**Layer 2** — `Why this is false` (real event, then a fake-says / what-is-true / evidence table from `debunk_argument`, then why the fake works derived from `splice`, then the dated distribution chain with injection-line domains highlighted). Then `What the chatbots did with it` — one block per bot, worst first, red or green edge, with the actual exchange (question / what the bot said / what is true / what it cited) for bots with critical incidents. Counts only in this layer, no rates.

**Layer 3** — Evidence (all flagged answers, critical first, mandatory side-by-side "bot said / what is true") → Claim card → Disinformation sources identified → Results by bot (full tables with CI) → A×B matrix → Live formulations → Trend → Countermeasures taken → Limitations → Method summary.

Every section has a one-or-two-sentence plain-language description under its heading explaining what it shows.

### `/registry/{claim_id}/escalation`
Reference: `Citere_Claim_Escalation_Demo.html`

Six tiles including "rungs reached". The escalation ladder — seven grouped rungs, each computed from actual logged actions, each clickable to expand the actions under it with a "why it matters / what it unlocks" line. The DSA rung stays locked until a re-measurement exists showing no remediation, and the lock reason is stated. Then a chronological log for this claim only, then an effect table (RR before / after / re-check date) with the no-control-group caveat.

### `/sources` and `/sources/{domain}`
Reference: `Citere_Sources_Registry_Demo.html` · Spec: `Citere_Sources_Registry_Business_Logic.md`

Index: domain table sorted by citations, with filters for category, actor, bot, market, cluster, claim, persona, "injection lines only", "critical only". Domain page: claims it distributed, cited-by-bot heatmap (bot × persona, never merged), by market, injection lines, critical incidents, timeline.

The registry is **derived, never hand-edited** — rebuilt from source tables after every run. Implement the four analyst queues from the spec (§7).

### `/chatbots/{bot}`
Reference: `Citere_Bot_Perplexity_Demo.html`

Six tiles. Verdict distribution by persona (stacked). Retrieval and contamination by persona, with the note that contamination peaks on news-style questions, not hostile ones. Claims this bot repeats. Sources this bot cites. **Citation drift** — the share of cited domains that changes month to month (industry baseline: Perplexity ~40%, ChatGPT ~54%, Copilot ~53%, Google AI Overviews ~59%), clearly labelled as an external figure, used to caveat the trend section. By market with significance. Countermeasures involving this platform, with its own ladder. Trend, read against the drift baseline.

### `/countries`, `/countries/full`, `/countries/{market}`
References: `Citere_Countries_Index_Demo.html`, `Citere_Countries_FullData_Demo.html`, `Citere_Country_Germany_Demo.html` · Specs: `Citere_Countries_Index_Business_Logic.md`, `Citere_Countries_Pages_Description.md`

Index: generated headline from the largest significant cross-market gap → five tiles → heatmap (market × bot, P2) → four visual data stories (same bot different country / language vs border / where bots go silent / fabrications don't travel) → full-width country blocks (key finding, bots, claims, sources) → countermeasures by country table → horizontal country card rail linking to country pages.

Stories render **only if the comparison clears significance**; otherwise state "no significant difference" explicitly. Never invent a story to fill the slot.

`/countries/full` holds the 13 analytical blocks for anyone who needs the breakdown.

Country page: header + six tiles → three generated narrative paragraphs → bots on this market (RR per persona, plus CR, DODGE, searched) → claims on this market → sources cited here with locality → compared with other markets → countermeasures on this market → trend → downloads (country dossier PDF + CSVs).

**No map.** No choropleth. Countries are not scored; bots are.

### `/countermeasures`
Reference: `Citere_Countermeasures_Demo.html` · Spec: `Citere_Countermeasures_Catalogue.md`

Flat filterable log across all claims and markets. Six tiles, one of which is **"awaiting your confirmation"** — the count of drafted actions needing human approval. Filters: type, status, target, country, claim, search. Row expands to evidence package, ticket/reference, and proof — with an honest difference between "draft only, not yet confirmed" and a captured submission screenshot.

Implement all 12 countermeasure types from the catalogue with the status lifecycle `drafted → pending_confirmation → submitted → acknowledged → responded → closed → declined`.

**Agent boundary:** the agent drafts, assembles evidence, and captures proof. A human confirms before anything is sent, submitted, filed, or published. Build the UI around that: a draft is visibly not an action taken.

### `/data`
Reference: `Citere_Data_Demo.html`

By entity — Claims, Runs, Metric cells, Sources Registry, Countermeasures — each with a working CSV / JSON format toggle showing a real sample of the schema, and download buttons. Plus the GitHub repository block, CC BY 4.0.

**Published:** claim cards (short debunk), run metadata, aggregated metric cells, all three registry exports, public countermeasure slice (date, type, target, market, status).

**Not published:** prompt grid text, response text and quotes, P4 detail, judge prompts and rubric, countermeasure `submission_content` and `proof`.

### `/benchmarks`
Not yet specified. Build the shell and routing only. When specified, its unit is one cluster × one month, and it will absorb the grain-of-truth split and coverage matrix that were removed with the cluster page.

---

## 5. Design

The existing approved direction (light theme, cards, data-product aesthetic) stays. The demos use a neutral system: `#F3F5F7` background, white panels, `#E3E6EB` borders, `#B42318` for critical, `#D9822B` high, `#1B7F4B` refute/good, `#6B7280` dodge, Inter. Map these onto the existing design tokens rather than introducing a second system.

Consistent across pages: KPI tile row, section heading + one-line description, tables with `n` and CI in small grey text under the value, `low_n` at reduced opacity, status pills, network category badges, red/orange/green left border to signal severity on cards.

---

## 6. Order of work

1. Data model and metrics store — everything else depends on it.
2. `/registry` and `/registry/{claim_id}` — the core.
3. `/sources` — feeds the Claim Report's sources section.
4. `/countermeasures` and `/registry/{claim_id}/escalation`.
5. `/chatbots/{bot}` and `/countries/*` — both are re-arrangements of the same store.
6. `/data`.
7. `/benchmarks` shell.

Remove the cluster pages and rename Escalations → Countermeasures at step 1, so nothing is built against the old structure.

---

## 7. Demo data

The current site has a demo dataset with a mandatory `demo: true` banner. Keep that behaviour: every page must be able to render from demo data with the banner visible, and switch to real data without structural change. The reference HTML files show the banner style.
