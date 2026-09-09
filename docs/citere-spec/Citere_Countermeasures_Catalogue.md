# Citere — Countermeasures: Catalogue, Integration, Automation

**Version:** 1.0 · 2026-09-09
**Purpose:** for every countermeasure type Citere can take, define what it is, what triggers it, what data feeds the report, how an agent automates it, what proof is captured, and how it appears in the `countermeasures` table and on-site.
**Supersedes:** the six-type list used in the Claim Report demo (`disclosure to platform · data shared with fact-checkers · partner notification · catalog update · public report · re-measurement`), which becomes a subset of the full type enum below.

---

## 0. Design principle

The agent's job is to **prepare, draft, and capture** — not to act unsupervised on anything irreversible or externally visible. For every countermeasure:

1. **Trigger** — a rule over Claim Report / Sources Registry data that flags a candidate action (e.g. "CRITICAL incident with no disclosure to this platform in the last 30 days").
2. **Draft** — the agent assembles the evidence package and the exact submission content (form fields, email body, filed report).
3. **Confirm** — a human reviews the draft and approves. This step is mandatory for every action that leaves Citere's own systems: sending a message, submitting a form, filing a complaint. Nothing is sent, filed, or posted without this click.
4. **Submit** — the agent performs the mechanical act of submission once approved, and immediately captures proof.
5. **Track** — the agent polls or is notified for a response, updates status, and closes the loop when a re-check is due.

This mirrors how the rest of Citere's tooling already draws the line between read/prepare (automatic) and send/submit (confirmed): the agent removes the drafting labour, the person keeps the decision to act.

---

## 1. `countermeasures` — unified schema

Every action of every type below is one row.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `claim_id` | string | one countermeasure can cover several claims — use `claim_ids[]` |
| `claim_ids` | list | |
| `market` | string or null | null if the action is global (e.g. GitHub publication) |
| `type` | enum | see §2, full list |
| `subtype` | string | e.g. `type=infrastructure`, `subtype=domain_takedown` |
| `target` | string | platform / registrar / authority / journalist / partner name |
| `target_contact` | string | form URL, email, ticket portal |
| `status` | enum | `drafted → pending_confirmation → submitted → acknowledged → responded → closed → declined` |
| `drafted_at`, `confirmed_by`, `confirmed_at`, `submitted_at` | timestamps / user | audit trail |
| `evidence_package_id` | string | link to the frozen evidence bundle (§3) |
| `submission_content` | text | exact text/form data sent — frozen at submission time |
| `proof` | object | `{screenshot_url, ticket_id, confirmation_email_id, timestamp}` |
| `response` | text | what came back, if anything |
| `response_at` | timestamp | |
| `follow_up_due` | date | when to re-check or escalate |
| `public` | bool | whether this row (or a redacted version) appears in the public countermeasures log |

`status` lifecycle is the same for every type; only `type`, `target`, and the shape of `submission_content` change.

---

## 2. Countermeasure types

### 2.1 Disclosure to platform

**What.** Reporting a CRITICAL or HIGH incident to the bot's developer through their safety/support channel.

**Trigger.** New `escalation_tier ∈ {CRITICAL, HIGH}` incident, no open or recent (< 30 days) disclosure to that platform for the same claim.

**Data required.** Claim Report evidence block for the incident(s): prompt, response, judge quote, `canonical_debunk`, `debunk_sources`, cited domains with registry category, injection-line status.

**Draft.** Agent fills the platform's own report form (or drafts an email if no form) using a fixed template: incident summary, evidence table, debunk with sources, ask (correct the response / down-rank the source / review training data).

**Confirm.** Human reviews the filled form/email before submission — this is the "send message on the user's behalf" boundary; always confirmed.

**Submit + proof.** Agent submits, captures a screenshot of the confirmation screen, extracts any ticket number, stores the exact text sent.

**Track.** Agent checks the support portal or inbox on a schedule; updates `response` and `status` when something arrives; sets `follow_up_due` = submission date + 14 days for a re-measurement (feeds Claim Report §7 cleansing).

**Report line.** Claim Report "Countermeasures taken" table, type = *Disclosure to platform*.

---

### 2.2 Data shared with fact-checkers (ecosystem engagement)

**What.** Sending findings to the fact-checking ecosystem that either already covers this claim or maintains a domain watchlist: EUvsDisinfo, NewsGuard, EDMO hubs, IFCN members, joint-investigation partners (DFRLab, CheckFirst, VoxCheck, StopFake).

**Trigger.** A new injection line (domain confirmed both distributing and being cited while a bot repeats) not yet reflected in the target organisation's public database; or a new claim variant not in their catalogue.

**Data required.** SR "Disinformation sources identified" table for the claim, with citation counts and dates; the Claim card.

**Draft.** Agent prepares a structured submission in the recipient's preferred format where one exists (EUvsDisinfo intake form; NewsGuard's contact channel; EDMO hub submission). Content: domain, category, evidence of distribution, evidence of chatbot citation — framed as a contribution, not a request.

**Confirm.** Human approves before sending (this is give-first outreach with a named organisation; always confirmed).

**Automation note.** This is the highest-value, lowest-friction type to automate fully up to the confirm step: it never asks anything of the recipient, so drafts can be batched weekly.

**Proof.** Submission confirmation, any acknowledgement, and — the strongest proof available — the domain later appearing in the partner's own public database with attribution to Citere's data, tracked as a follow-up check rather than an immediate response.

**Report line.** Countermeasures table, type = *Data shared with fact-checkers*; the Sources Registry domain page gets a "flagged to: EUvsDisinfo (2026-09-05)" line.

---

### 2.3 Partner notification (institutional)

**What.** Sending a country dossier or Claim Report to a government-adjacent monitor: ЦПД, SPRAVDI, a national CERT, an EDMO hub's national desk.

**Trigger.** New country dossier generated, or a CRITICAL incident on a claim relevant to that partner's mandate.

**Data required.** Country page export (§8 of the Countries Pages spec) or the Claim Report PDF.

**Draft + confirm + submit.** Same pattern; typically email with an attached export, drafted by the agent, sent after confirmation.

**Proof.** Delivery confirmation, any acknowledgement email — this acknowledgement is the evidence used for критичність (Ministry of Digital Transformation, criterion 14): a dated record that a state-adjacent body received and used Citere's output.

**Report line.** Countermeasures table, type = *Partner notification*; Country page "Countermeasures on this market" section.

---

### 2.4 Catalog update

**What.** Internal action: adding a newly discovered domain to `surface_objects` on a Claim card, or promoting a domain from the Registry's "found through citation" queue to the watchlist.

**Trigger.** Sources Registry queue 7.1/7.2 (new watchlist candidate, unmatched frequent domain) — see Sources Registry Business Logic.

**Automation.** Fully automatable through the confirm step: the agent proposes the addition with its evidence (citation count, verdict split), a human approves the classification (category, actor), the agent writes it to the catalog and bumps the version.

**Proof.** The catalog version diff itself; no external submission, so no confirm-before-send is needed, only confirm-before-write to a versioned record.

**Report line.** Countermeasures table, type = *Catalog update*; also appears in the Entity Model changelog.

---

### 2.5 Public report

**What.** Publishing the Claim Report, a Benchmark, or a country dossier on the Citere site, and distributing it — the "publication + social media distribution" and "press pitching" actions belong here as two subtypes.

**Subtype: publication.** Agent prepares the public-variant document (Claim Report Spec §"Public vs internal") and a set of social posts (one headline finding per post, in the plain-language register from the summary layer). Human confirms before anything goes live or is posted, since this is public-facing content attributed to Citere.

**Subtype: press pitch.** Agent drafts a pitch email per finding, tailored to a named outlet/journalist (subject line = the finding, one paragraph, link to the full report). Human confirms and sends; this is cold outreach to a real person and is never auto-sent.

**Proof.** Publication timestamp and URL; for press, the sent pitch and any published coverage (tracked via a follow-up search, logged as `response`).

**Report line.** Countermeasures table, type = *Public report*, subtype `publication` or `press_pitch`.

---

### 2.6 GitHub dataset publication

**What.** Publishing the Sources Registry CSV exports (§9.1 of the Sources Registry spec) to the public repository.

**Trigger.** Scheduled (e.g. after every registry rebuild) or on-demand when a Benchmark ships.

**Automation.** The export itself is fully mechanical (already specified in SR §9.1) and can run unattended; the confirm step here is lighter — a human approves the release, not each row — because the content is already governed by the public/internal split validated in SR §12.

**Proof.** Commit hash and timestamp; this is the most durable, hardest-to-dispute proof type Citere produces, since it's independently verifiable by anyone.

**Report line.** Countermeasures table, type = *Dataset publication*; linked from the Data page.

---

### 2.7 Sources list distribution via partners

**What.** Handing the Sources Registry export, filtered to one partner's remit (a market, a cluster), directly to that partner as a standing feed rather than a one-off notification.

**Difference from 2.3.** Partner notification is a one-time or periodic push tied to a finding; this is a standing arrangement — the agent's job becomes scheduled re-delivery, not drafting each time.

**Automation.** Once the arrangement exists (confirmed once, at setup), delivery of each update can be automatic; the confirm step moves from "every delivery" to "the initial agreement and any change to its scope."

**Proof.** Delivery log per cycle; partner's periodic acknowledgement.

**Report line.** Countermeasures table, type = *Standing data feed*; Country page shows the feed as an ongoing relationship, not a dated one-off row.

---

### 2.8 Infrastructure notifications

One category, several subtypes, all following the same mechanical pattern: identify the controller of a piece of infrastructure, file a report through their existing abuse channel.

| Subtype | Controller identified via | Filed through |
|---|---|---|
| Search engine bug report | domain ranking in the response | Google Search Console spam report / Bing Webmaster |
| Domain takedown | WHOIS registrar lookup | registrar's abuse form |
| Hosting provider notification | IP → ASN → hosting company | provider's abuse@ or abuse form |
| Common Crawl flagging | — | Common Crawl's URL exclusion request |
| robots.txt / de-indexing campaign | — | direct outreach to the domain's own operator (rarely fruitful for hostile actors; mainly used for compromised legitimate sites carrying the fake) |
| Advertiser network notification | ad tags on the page | Google Ads / ad network abuse form |

**Trigger.** A domain crosses a citation or severity threshold in the Sources Registry (e.g. ≥ 1 injection line, or a new clone of a legitimate brand).

**Automation.** This is the category best suited to full agent handling up to confirm: WHOIS/ASN lookup, form-filling, and evidence packaging are mechanical and repetitive across many domains. The agent can process the entire "new watchlist candidates" queue from the Sources Registry in one pass, producing one draft per applicable subtype per domain.

**Confirm.** Always required before submission — these are external filings under Citere's name.

**Proof.** Submission confirmation/ticket per channel; for takedowns, the strongest proof is the domain later returning NXDOMAIN or a parked-page status, checked on a schedule.

**Report line.** Countermeasures table, one row per subtype per domain; Sources Registry domain page gets an "Infrastructure actions" sub-list.

---

### 2.9 Report on infected social media posts

**What.** Reporting individual posts on Reddit, Facebook, X, Telegram that are themselves carrying the fake and are also acting as a `surface_object` / relay feeding chatbot retrieval.

**Trigger.** A social post identified as a `surface_object` of type `artifact` on a Claim card, or found during live-formulation research (Entity Model Part V.7).

**Draft.** Agent identifies the platform's report flow for the post (misinformation / impersonation / coordinated inauthentic behaviour categories, where offered) and drafts the report content: which claim it repeats, link to the debunk.

**Confirm + submit.** Same pattern.

**Proof.** Screenshot of the report submission; the post's later removal or a "disputed" label, checked on a schedule.

**Report line.** Countermeasures table, type = *Social platform report*; the post itself becomes a `surface_object` cross-reference on the Claim card if not already recorded.

**Note.** Lower priority for automation than the others above: volume is high and per-post impact on chatbot behaviour is harder to trace than a domain-level takedown, so this is best triggered selectively (posts already implicated in an injection line) rather than run at scale.

---

### 2.10 FIMI registry report (EEAS)

**What.** A formal submission to the EEAS FIMI incident registry — the EU's structured database of foreign information manipulation and interference incidents (feeding the FIMI Galaxy Explorer / STIX-based reporting).

**Trigger.** A confirmed injection line with clear actor attribution (Pravda/Portal Kombat, Doppelganger, Storm-1516, Matryoshka) — the registry expects narrative + actor + channel + evidence, which the Claim card and Sources Registry already hold in that shape.

**Data required.** Claim card (`false_claim`, `splice`, `canonical_debunk`), Sources Registry entry for the domain (`actor`, `attributed_by`), the specific chatbot incident as the "channel" evidence — this last part is Citere's distinctive contribution, since FIMI incidents are typically sourced from social media and traditional media, not chatbots.

**Draft.** Agent maps Citere's fields onto the FIMI/DISARM incident schema (narrative, TTPs, channel, date, evidence) and prepares the structured submission.

**Confirm.** Required — this is a formal filing with an EU body under Citere's name; always human-reviewed before submission.

**Proof.** The registry's own incident ID once accepted — this is the "external, unforgeable" proof the plan for критичність specifically needs, because it is issued by an EU institution, not written by Citere.

**Report line.** Countermeasures table, type = *FIMI registry report*, `proof.ticket_id` = the FIMI incident ID; this ID is the single most valuable field in the whole countermeasures log for institutional purposes.

---

### 2.11 National authority complaint (Viginum, CPD/SPRAVDI, equivalents)

**What.** A formal signal or complaint filed through a national authority's official intake channel — distinct from partner notification (2.3) because it invokes the authority's mandate rather than simply sharing data with a peer organisation.

**Trigger.** A confirmed injection line affecting that authority's jurisdiction, or a pattern (repeated CRITICALs on the same claim/market) that rises to the level worth a formal signal rather than routine data sharing.

**Data required.** Same evidence package as the FIMI report, formatted to the specific authority's intake requirements (Viginum has its own reporting channel; ЦПД/SPRAVDI operate through the channels already used for give-first data sharing, but a *formal* complaint is a distinct, heavier submission than the routine feed).

**Draft + confirm + submit.** Same pattern; this is the most "official" document type Citere produces and should carry the fullest evidence package by default (full Claim Report internal variant attached).

**Proof.** The authority's case/reference number if one is issued; acknowledgement of receipt at minimum.

**Report line.** Countermeasures table, type = *National authority complaint*, target = the specific authority.

---

### 2.12 DSA / AI Act complaint to the European Commission

**What.** A formal complaint escalated to the Commission (via a national Digital Services Coordinator, e.g. Bundesnetzagentur for Germany) about systemic risk under DSA Article 34/35, or under AI Act Article 55 for a general-purpose AI provider's risk-mitigation obligations.

**Trigger.** A platform has been disclosed to (2.1) and shown no meaningful remediation across two or more re-measurement cycles (i.e. cleansing shows no significant `ΔRR`), and the incident pattern meets a severity bar (repeated CRITICALs, confirmed injection lines, affecting an EU market).

**Data required.** The full escalation history for that platform/claim/market: original disclosure, dates, responses (or absence of them), before/after cleansing figures with the "no control group" caveat intact, and the underlying evidence blocks.

**Draft.** Agent assembles the complaint package mapped to the coordinator's submission format, explicitly built as an escalation: "disclosed on [date], no remediation observed after [N] re-measurements, systemic risk under [article]."

**Confirm.** Always required and should default to a higher bar of review than other types — this is the most consequential document Citere can file, and it presupposes the disclosure step was already exhausted in good faith.

**Proof.** The Commission/coordinator's case reference; this sits at the top of the escalation ladder and should only exist for claims that already have a 2.1 disclosure and a 2.5 public report on record — the countermeasures log itself is the evidence that lower-tier steps were tried first.

**Report line.** Countermeasures table, type = *Regulatory complaint*; Claim Report and Country page both surface this prominently since it is the terminal action in the countermeasure ladder.

---

## 3. Evidence package (shared building block)

Every countermeasure type above attaches to the same underlying object rather than assembling evidence ad hoc:

```
evidence_package = {
  claim_card: {false_claim, grain_of_truth, canonical_debunk, debunk_sources, splice, surface_objects},
  incidents: [ {response_id, bot, market, persona, prompt_text, layer_a_quote, domains_cited, escalation_tier} ],
  registry_entries: [ {domain, category, actor, attributed_by, injection_line} ],
  metrics_snapshot: {rr_before, cr_before, ci, n, run_id}
}
```

Built once per claim/incident set, frozen at draft time, and referenced by `evidence_package_id` from every countermeasure row that uses it. This is what makes it possible to show, in one place, the full ladder of what was tried for a given claim — from a domain takedown request up to a Commission complaint — all pointing at the same underlying facts.

---

## 4. Escalation ladder (how the types relate)

Not every countermeasure is equally weighty, and several are natural prerequisites for others:

```
Catalog update, Dataset publication          ← always available, no external party
        ↓
Data shared with fact-checkers               ← give-first, no ask
Infrastructure notifications                 ← mechanical, per-domain
        ↓
Disclosure to platform                       ← the primary ask
Partner notification                         ← institutional, ongoing relationship
Social platform report                       ← per-artifact
        ↓
Public report / press pitch                  ← pressure, after or alongside disclosure
        ↓
FIMI registry report                         ← formal record, needs attribution
National authority complaint                 ← formal record, needs jurisdiction
        ↓
DSA / AI Act complaint to the Commission      ← terminal escalation, needs prior disclosure + no remediation
```

A Claim Report or Country page can show this as a ladder rather than a flat log: which rungs have been reached for this claim, and what the next available rung is given what's already on record.

---

## 5. What this means for the schema and pages

- `countermeasures.type` enum expands from 6 to 12 top-level types (§2.1–2.12), several with subtypes.
- Every row keeps the confirm/submit/proof lifecycle from §1 regardless of type — the automation differs in how much of the draft the agent can produce unattended, not in whether confirmation is required.
- The Claim Report "Countermeasures taken" section (spec v2.0, §"Countermeasures") gains the ladder view (§4) alongside the existing chronological log.
- The Sources Registry domain page gains an "Actions on this domain" list, populated from types 2.2, 2.4, and 2.8.
- The Countries index "Countermeasures by country" table (Countries Index Business Logic §12) gains columns for the new types; FIMI and national-authority rows are the ones most relevant to институциональной readiness (критерій 14) and should be visually distinguished from routine disclosures.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-09 | Full countermeasure catalogue: 12 types, escalation ladder, shared evidence package, unified schema, automation/confirm split per type |
