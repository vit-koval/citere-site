# Citere — Claim Report Specification

**Version:** 2.0 · 2026-09-09
**Unit:** one Claim, across all Runs in which it was tested.
**Supersedes:** v1.0 (section order and content changed after review).
**Reference build:** `Citere_Claim_Report_Demo.html`

The report answers, in this order: *Why is this false? What did the chatbots do with it? Show me. Where did it come from? What are the numbers? What have we done?*

Three layers. Layer 1 is one screen. Layer 2 is the story. Layer 3 is everything a platform, a regulator or a journalist would need to verify it.

Nothing is computed inside the report. Every element below names the table it is read from. Terms: `claims`, `runs`, `responses`, `verdicts`, `registry`, `countermeasures` are the source tables; Calculation Methodology (CM) and Sources Registry Business Logic (SR) are the documents that define them.

---

## Layer 1 — first screen

### Headline
The finding in one sentence. Analyst-written, the only free text on this screen. Must name what happened, not the topic. Pattern: *[who] told users [the fake] and cited [source]*.

### Lede
Four sentences, fixed order, each generated from data:
1. The real event. — `claims.grain_of_truth[0]`
2. The fake attached to it. — `claims.false_claim`, reworded by template: "The claim that [swapped element] is a fabrication attached to it."
3. Which bots repeated it and cited a listed source. — bots with ≥ 1 CRITICAL, from `verdicts`.
4. Which bots repeated from memory, and which did not repeat. — bots with HIGH but no CRITICAL; bots with 0 REPEAT.

### Tags
`claim_id` · cluster name · splice letter · claim status · countermeasure status (not started / in progress / re-check scheduled / re-checked). From `claims` and `countermeasures`.

### Meta box
| Line | Source |
|---|---|
| Countries: count and list | distinct `runs.market` for this claim |
| Runs: run_ids | `runs` |
| Bots: list | distinct `responses.model_name` |
| Per run: prompts × bots × repeats = responses | `runs` config |
| Versions: catalog, grid, judge, watchlist | `runs` |
| Judge validation: confirmed (α) / pending | CM §8 |
| Built | timestamp |

### Number strip — six tiles
| Tile | Definition | Source |
|---|---|---|
| Chatbots tested | distinct bots | `responses` |
| Answers, N countries | valid responses; N = distinct markets | CM §1.5 |
| Repeated the fake | responses with `layer_a = REPEAT` | `verdicts` |
| Critical | `escalation_tier = CRITICAL` (REPEAT + listed source) | CM §4 |
| Disinformation sources identified | count of domains in `distributed ∪ reached` for this claim | SR §6 |
| Countermeasures taken | count of rows in `countermeasures` with status ≠ pending/scheduled | `countermeasures` |

Tiles 5 and 6 link to their sections. Tile 4 is red.

### TOC
Fixed order, matching the sections below.

---

## Layer 2 — the story

### Why this is false
*Block description:* What the fake claims, what is actually true, and the evidence for each point.

| Element | Source |
|---|---|
| The real event, one paragraph | `claims.grain_of_truth` rendered as prose + `canonical_debunk` context |
| Table: fake says / what is true / evidence | `claims.debunk_argument[]` — one row per false assertion (assertion, refutation, source). **New field**, see "Schema additions". |
| Why the fake works | template from `claims.splice` + `removed_element`: "Most of it is true: [grain items]. One [attribute/inference/scale/object] is [swapped/leaped/shifted/invented] — [removed_element] — and that turns [true story] into [false story]." |
| How it moved — chain with dates | `claims.surface_objects` of type outlet/clone ordered by `date`, plus the terminal node "chatbot search results" with the run date. Domains on the injection line highlighted. |

### What the chatbots did with it
*Block description:* Each bot's behaviour on this claim in plain terms, worst first, with the actual exchanges for the bots that failed.

Opening paragraph: fixed template describing the four personas in plain words and the two checks.

One block per bot, ordered by CRITICAL count desc, then REPEAT count desc. Bots with identical stories may share a block (rule: same tier profile — e.g. both "HIGH only" or both "no REPEAT").

| Element | Source |
|---|---|
| Heading: "[Bot] — [k] repeats out of [n] answers, [c] with [a listed source / Pravda / …] cited" | `verdicts` counts; source name from `registry` category of the cited domain |
| Pattern paragraph | template selected by dominant persona of REPEATs: P2-dominant → "search" story; P3-dominant → "accepted the premise" story; no listed sources → "from memory" story; 0 REPEAT → "held up" story. Market mentioned if one market carries > 60% of REPEATs. |
| Exchange (only for bots with ≥ 1 CRITICAL): question / bot answered / what is true / cited | `responses.prompt_text` (P4 paraphrased), `verdicts.layer_a_quote` + 1 sentence context, matching sentence from `claims.canonical_debunk`, `responses.domains[]` with registry badges |
| Edge colour | red if ≥ 1 REPEAT, green if 0 |

Counts only, never rates, in this section.

### What this shows
Two paragraphs, template-generated:
1. Injection line: "[Listed] pages were cited in [x] of [N] answers. In [c] of the [c] answers that both repeated the fake and named a source, that source was [list]. The [m] domains involved are the same that carried the fake when it first appeared on [date]." — SR §6, `claims.surface_objects.date`.
2. Failure modes: bots grouped by CRITICAL / HIGH-only / none, with the sentence for each group.

---

## Layer 3 — evidence and figures

### Evidence — all flagged answers
*Block description:* Every answer in which a bot repeated the fake: question, what the bot said, what is true. Critical first.

One block per response with `escalation_tier ∈ {CRITICAL, HIGH}`, CRITICAL first. Public variant: all CRITICAL, first 10 HIGH. Internal: all.

| Field | Source |
|---|---|
| Bot · market · persona · date · repeat n · tier · review status | `responses`, `verdicts.human_review` |
| Question | `responses.prompt_text` |
| Bot said / what is true | `verdicts.layer_a_quote`, `claims.canonical_debunk` |
| Judge rationale | `verdicts.layer_a_reasoning` |
| Sources cited | `responses.domains[]`, badges from `registry.category` |

### The claim card
*Block description:* The reference record the judge compares every answer against.

Rendered from `claims` without edits: false claim, grain of truth with sources, canonical debunk, debunk sources table, splice with `removed_element`, surface objects table.

### Disinformation sources identified
*Block description:* N sources identified spreading this fake — how many traced from origin, how many found through chatbot citations, how many did both.

| Element | Source |
|---|---|
| Description with counts | `distributed` count, `reached − distributed` count, `injection` count — SR §6 |
| Table 1 "Sources traced from the fake's origin (k)": domain, network, attributed by, published the fake (date), cited on this claim, of which while repeating, injection line | `claims.surface_objects` joined to `registry`; citation counts from SR edges filtered to this claim and `layer_a = REPEAT` |
| Table 2 "Sources found through chatbot citations (m) — not yet on the Claim card": domain, network, cited, while repeating, note | `reached − distributed`; note is analyst text, defaults to "candidate for Claim card" |
| Table 3 "Which bots cited which source": domain × bot, domain × market | SR §5 aggregates filtered to claim |
| Footnote on bots that cited only while refuting | `cited_with_verdict` per bot |

Every domain links to its registry page.

### Results by bot — full tables
*Block description:* How often each bot repeated the fake and cited a watchlisted source, by phrasing and country, with intervals.

| Sub-block | Definition |
|---|---|
| Repeat Rate bot × persona, one table per market | CM §5.3, Wilson CI, `low_n` greyed, sorted by P2 |
| Contamination Rate, same layout | CM §5.4 |
| Verdict distribution, stacked bars, one panel per persona | CM §5.5 |
| Stability per bot | CM §5.11 |
| Grain acknowledgement bot × persona (P4 excluded) | `verdicts.acknowledged_grain` — **new field** |
| Inverse error per bot | `verdicts.flagged_truth_as_false` — exists, unpopulated |
| Market comparison, P2, significance by non-overlap | CM §6.3 logic applied across markets |

### A×B matrix
*Block description:* Every answer placed by what the bot did and whether it cited a listed source.

CM §5.9. Counts, whole claim. UNRESOLVED as a separate line. Three one-sentence definitions for CRITICAL / HIGH / REVIEW.

### Live formulations vs constructed grid
*Block description:* A check on our own method.

RR per bot on `prompts.is_live = true` vs grid, with CI; agreement flag. **`is_live` is a new field.** Never pooled.

### Trend
*Block description:* Change from one run to the next.

CM §6. Empty state if only one comparable run per market.

### Countermeasures taken
*Block description:* Everything done to counter this fake.

Log table from `countermeasures` filtered to claim: date, countermeasure type, target, what was sent/done, reference, response, status.

Types (DISARM-aligned): disclosure to platform · data shared with fact-checkers · partner notification · catalog update · public report · re-measurement.

Then "Cleansing — observed change after escalation": CM §7, only if `run_after` exists; otherwise the scheduled date. Mandatory sentence on the missing control group.

### Limitations
Generated from run metadata: `low_n` cells count, UNRESOLVED count, quarantined and missing, judge validation status, repeats per prompt, stability warnings, collection window, live n.

### Method summary
Fixed half-page, versioned. Links to CM, Entity Model, SR.

---

## Terminology rules

- Domains bots cited are "listed sources" or "watchlisted sources". Never "Kremlin-linked sources" — the watchlist will contain outlets that relayed a fake without being state-linked.
- "Disinformation sources identified" = `distributed ∪ reached`. "Disinformation source" is a domain that published this fake or was cited on it; attribution to an actor is a separate field shown in the network column.
- "Countermeasures" for what we did. "Disclosure" for reports to platforms.
- "Repeated the fake" in prose; "REPEAT" only in tables.

## Public vs internal

| Element | Public | Internal |
|---|---|---|
| Layers 1–2 | full | full |
| Prompt text P1–P3 / P4 | verbatim / paraphrased | verbatim |
| Response text | judge quote + context | full |
| Evidence blocks | CRITICAL all, HIGH ≤ 10 | all |
| Response / prompt IDs, reviewer names | — | ✓ |
| Sources table 2 "not yet on the card" | shown as "also cited" | shown as queue |
| Countermeasures: references, correspondence | reference IDs only | full |

## Rendering rules

- Layer 2 uses counts. Layer 3 uses rates with CI and n. No bare percentages.
- No figure aggregated across personas, markets or runs.
- Empty sections show their empty state; they are not removed.
- Free text allowed only in: headline, Sources table 2 notes, an analyst note at the end of Evidence, countermeasure "what was sent" cells.
- Every domain links to its registry page. Every countermeasure links to its record.

## Schema additions required

| Field | Where | Feeds |
|---|---|---|
| `claims.debunk_argument[]` — {assertion, refutation, source} | Claim card | "Why this is false" table |
| `verdicts.acknowledged_grain` — yes/no | judge output | Grain acknowledgement |
| `verdicts.flagged_truth_as_false` — populate | judge output | Inverse error |
| `prompts.is_live` — bool | prompt grid | Live vs grid |
| `countermeasures` — {claim_id, date, type, target, sent, reference, response, status} | new table, replaces Escalation as an entity | Tile 6, Countermeasures section |

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-09 | Initial: ten numbered sections |
| 2.0 | 2026-09-09 | Three-layer structure; debunk before bot findings; evidence before tables; claim card before sources; Sources reframed around "disinformation sources identified"; Escalation replaced by Countermeasures with typed log; six-tile strip; terminology rules; block descriptions; countries in meta box |
