# Citere — Sources Registry: Business Logic

**Version:** 1.0 · 2026-09-09
**Purpose:** defines how the Sources Registry is built from run data, what is linked to what, what is exported, and what the site shows. Written as a specification for the script that builds it.

---

## 1. What the registry is

A registry of domains through which false claims reach chatbots. One record per domain. Every record is linked three ways:

```
domain ──► claims it distributed        (from Claim cards, surface_objects)
domain ──► bots that cited it           (from Responses, wl_hits)
domain ──► markets / personas / verdicts where it was cited   (from Responses)
```

The registry is **derived**, never hand-edited. It is rebuilt from source tables after every run. Hand-maintained inputs are only the watchlist and the Claim cards.

---

## 2. Inputs

| Table | Fields used | Maintained by |
|---|---|---|
| `watchlist` | `domain`, `category`, `actor`, `attributed_by`, `attribution_url`, `added_at`, `watchlist_version`, `status` | analyst, versioned |
| `claims` | `claim_id`, `cluster_id`, `label`, `surface_objects[]` (object, type, date, found_in) | analyst, versioned |
| `runs` | `run_id`, `cluster_id`, `market`, `language`, `collected_at`, `watchlist_version` | pipeline |
| `responses` | `response_id`, `run_id`, `claim_id`, `model_name`, `persona`, `prompt_id`, `repeat_n`, `domains[]`, `wl_hits[]`, `layer_a`, `escalation_tier`, `human_review.status` | pipeline |

Precondition: responses in `quarantine` and with `layer_a = UNRESOLVED` are excluded before any step below (Calculation Methodology §0.3).

---

## 3. Domain normalisation

Applied identically to watchlist entries, surface objects and cited domains. Without this, the same site appears three times.

1. Lowercase.
2. Strip scheme, path, query, port.
3. Strip leading `www.`.
4. Keep subdomains (do not collapse `eu.news-pravda.com` to `news-pravda.com`). Matching handles the hierarchy in step 4.

Result: `domain_norm`.

---

## 4. Building the registry

### Step 1 — Seed from watchlist

One registry record per watchlist domain:

```
registry[domain_norm] = {
  domain, category, actor, attributed_by, attribution_url,
  added_at, status,
  in_watchlist: true
}
```

### Step 2 — Add surface-object domains not on the watchlist

For every claim, for every `surface_object` with `type ∈ {outlet, clone}`: normalise, and if not already in the registry, create a record:

```
registry[domain_norm] = {
  domain, category: null, actor: null,
  in_watchlist: false,
  source: "surface_object"
}
```

These are domains we know distributed a claim but have not yet classified. They surface in the "unclassified" queue (§7.3).

### Step 3 — Link domains to claims (distribution edge)

For every claim, for every `surface_object` of type `outlet` or `clone`:

```
edge_distributed(domain_norm, claim_id, first_seen = surface_object.date, evidence = surface_object.found_in)
```

One edge per (domain, claim). A domain listed under several claims gets several edges.

### Step 4 — Link domains to responses (citation edge)

For every valid response, for every entry in `wl_hits[]`:

```
edge_cited(domain_norm, response_id)
```

Match rule: the cited domain matches a registry domain if equal or a subdomain of it (Calculation Methodology §3.2). A citation of `eu.news-pravda.com` produces an edge to `eu.news-pravda.com` **and** rolls up to `news-pravda.com` for aggregation (§5).

Also for every valid response, for every domain in `domains[]` that is **not** in `wl_hits[]` but **is** in the registry as a surface-object domain (in_watchlist = false): create the same `edge_cited`. This catches a clone we know from a Claim card but have not yet promoted to the watchlist.

### Step 5 — Derive the claim link from citations

A citation edge carries `claim_id` through the response. So for every `edge_cited` we know which claim the bot was answering about. This is the second, independent link domain → claim:

```
edge_reached(domain_norm, claim_id)  =  exists edge_cited where response.claim_id = claim_id
```

### Step 6 — Intersect: the "injection line"

For every (domain, claim):

```
distributed = exists edge_distributed(domain, claim)
reached     = exists edge_reached(domain, claim)

injection_line = distributed AND reached
```

`injection_line = true` means: this domain published this falsehood, and at least one bot cited this domain while answering about this falsehood. This is the strongest single piece of evidence the system produces. It is a first-class field, computed here and nowhere else.

---

## 5. Aggregates per domain

Computed over valid responses, per domain (including roll-up of subdomains to their watchlist parent). All counts are **responses**, one response counts once per domain regardless of how many times it cited it (Calculation Methodology §5.8).

| Aggregate | Definition |
|---|---|
| `cited_total` | responses with edge_cited |
| `cited_by_bot[model]` | same, per bot |
| `cited_by_market[market]` | same, per run market |
| `cited_by_language[lang]` | same, per run language |
| `cited_by_persona[persona]` | same, per persona — **never summed into one figure** |
| `cited_by_claim[claim_id]` | same, per claim |
| `cited_by_cluster[cluster_id]` | same, per cluster |
| `cited_with_verdict[layer_a]` | same, split by REPEAT / U_context / REFUTE / DODGE |
| `critical_count` | responses with edge_cited and escalation_tier = CRITICAL |
| `first_cited_at`, `last_cited_at` | min / max `runs.collected_at` over cited responses |
| `runs_present` | list of run_ids where cited ≥ 1 |
| `claims_distributed` | list from edge_distributed |
| `claims_reached` | list from edge_reached |
| `claims_injection` | list where injection_line = true |

Rates are **not** stored in the registry. A "share of responses citing this domain" needs a denominator (bot × claim × persona cell), which belongs to the Calculation Methodology, not here. The registry stores counts and the keys needed to compute rates elsewhere.

---

## 6. Aggregates per bot and per claim (reverse views)

Same edges, grouped the other way. Stored as materialised views, rebuilt with the registry.

**Per bot:** `domains_cited[]` with counts, split by category, market, persona, verdict; `critical_domains[]`.

**Per claim:** `domains_distributed[]` (from card), `domains_reached[]` (from responses), `domains_injection[]` (intersection), each with counts per bot and market.

---

## 7. Queues (analyst work lists)

Produced on every rebuild.

**7.1 New watchlist candidates.** Domains with `in_watchlist = false` and `cited_total ≥ 1`. A bot cited a domain we know only from a Claim card. Analyst decides: add to watchlist with category, or dismiss.

**7.2 Unmatched frequent domains.** Domains in `responses.domains[]` that are not in the registry at all, cited ≥ 3 times across a run on claims with `escalation_tier ∈ {HIGH, CRITICAL}`. Possible unknown relays. Analyst reviews.

**7.3 Unclassified.** Registry records with `category = null`. Need category and actor before they appear on the public site.

**7.4 Dormant.** Watchlist domains with `cited_total = 0` across the last three runs. Candidates for `status = dormant`; kept in the watchlist, hidden from default site views.

---

## 8. Rebuild rules

- Full rebuild after every run ingest; no incremental patching.
- The rebuild is pinned to one `watchlist_version`. If the watchlist changed since the last run, Layer B is recomputed for all runs under the new version first (Calculation Methodology §6.2), then the registry is rebuilt.
- Every registry export carries `watchlist_version`, `catalog_version`, list of `run_ids` included, `built_at`.
- Previous builds are retained; the registry has a version history.

---

## 9. Exports

### 9.1 Public dataset (GitHub, CSV)

Three files. No prompt text, no response text, no P4 detail.

**`domains.csv`** — one row per domain
```
domain, category, actor, attributed_by, attribution_url, status,
cited_total, critical_count, first_cited_at, last_cited_at,
claims_distributed_count, claims_reached_count, claims_injection_count
```

**`citations.csv`** — one row per (domain, bot, market, language, claim, persona, run)
```
domain, model_name, market, language, claim_id, cluster_id, persona,
run_id, collected_at, cited_count, repeat_count, refute_count,
u_context_count, dodge_count, critical_count
```

**`injection_lines.csv`** — one row per (domain, claim) where injection_line = true
```
domain, claim_id, cluster_id, claim_label, distributed_first_seen,
distributed_evidence, reached_bots (semicolon list), reached_markets,
reached_first_at, critical_count
```

### 9.2 Internal export (XLSX)

Everything in 9.1 plus `response_id` lists per edge, prompt_id, persona detail, human-review status, and the four queues from §7 as separate sheets.

### 9.3 Claim Report feed

For one `claim_id`: `domains_distributed`, `domains_reached`, `domains_injection`, each with per-bot and per-market counts. This is the "Sources" block of the Claim Report, produced by filter, not recomputed.

### 9.4 Escalation package feed

For one `escalation_tier = CRITICAL` response: the domain record (category, actor, attribution), and whether the (domain, claim) pair is an injection line. Adds "this domain is a known distributor of exactly this falsehood" to the package.

---

## 10. What the site shows

### 10.1 Registry index

Table, one row per domain, default sorted by `cited_total` desc. Columns: domain, category, actor, cited (total), bots (count), markets (count), claims reached (count), injection lines (count), critical (count), last cited.

Filters (all combinable):
- category, actor
- bot
- market, language
- cluster, claim
- persona
- run / date range
- injection line only
- critical only
- status (active / dormant / unclassified — unclassified hidden by default)

### 10.2 Domain page

Header: domain, category, actor, attributed by (link), in watchlist since, status.

Blocks:
1. **Claims distributed** — list from Claim cards, with first-seen date and evidence source.
2. **Cited by bots** — table bot × persona, cell = citation count, with verdict split on hover. Persona columns are never merged.
3. **By market** — bar per market, citation count.
4. **Injection lines** — claims where this domain both distributed and was cited. Each links to the Claim Report.
5. **Critical incidents** — count and link to the filtered response list (internal) or anonymised summary (public).
6. **Timeline** — citations per run over time.

### 10.3 Bot view

One page per bot: domains cited, grouped by category; per market; per persona; injection lines involving this bot; trend over runs.

### 10.4 Claim view (inside Claim Report)

Three lists side by side: distributed / reached / injection. The intersection is highlighted.

### 10.5 Explore (three entry points)

- "From domain": pick a domain → bots → claims → markets.
- "From bot": pick a bot → domains → claims.
- "From claim": pick a claim → domains → bots.

Each is a filtered view of the same edges; nothing is computed on the page.

---

## 11. Public / private split

| | Public | Internal |
|---|---|---|
| Domain, category, actor, attribution | ✅ | ✅ |
| Counts per bot / market / persona / claim | ✅ | ✅ |
| Injection lines | ✅ | ✅ |
| Response IDs, prompt IDs | — | ✅ |
| Prompt text, response text | — | ✅ |
| P4 persona counts | aggregated into "malicious" bucket without prompt detail | ✅ full |
| Queues (§7) | — | ✅ |
| Unclassified domains | — | ✅ |

---

## 12. Validation on every rebuild

- Every `edge_cited` resolves to a valid response and a registry domain.
- Every `edge_distributed` resolves to an existing claim.
- `injection_line = true` ⇒ both edges exist. Assert.
- Sum of `cited_by_persona` over personas = `cited_total`. Assert.
- Sum of `cited_with_verdict` over four categories = `cited_total`. Assert.
- No domain appears twice after normalisation. Assert.
- Public export contains no field from the internal-only column of §11. Assert.

Failed assertion blocks publication.
