# CLAUDE.md — Citere public website

This file is the master instruction set for building and maintaining the Citere website. Read it fully before touching anything.

**The approved design already exists.** `design-mockup/` contains a complete, approved 21-page static mockup with a single stylesheet. It is the visual and structural source of truth: match it. Do not redesign, do not substitute a component library, do not "improve" the layout. Your job is to turn that mockup into a data-driven Eleventy site.

Companion documents in `docs/`:
- `docs/spec-pages.md` — page-by-page structure and rationale.
- `docs/content.md` — final copy, messaging rules, vocabulary, verdict/status dictionaries, pre-publish checklist.

When this file conflicts with a companion, this file wins. Where the mockup conflicts with a written spec on **visual** matters, the mockup wins. Where they conflict on **rules** (what may be published, how numbers are computed), the spec wins.

---

## 1. What this site is

Citere is a Ukrainian research company (Diia.City resident) that tests public AI chatbots — ChatGPT, Gemini, Grok, Claude, Copilot, Perplexity, DeepSeek, Le Chat — for Russian disinformation about Ukraine, reports findings to the platforms and Ukrainian institutions, publishes the evidence, and re-measures.

The website is **not a marketing site**. It is a public evidence base read by four audiences at once: AI crawlers and chatbot search layers, Google/Bing, human researchers and fact-checkers, and Ukrainian state bodies.

No commercial section. No services page. No pricing. Do not add them.

---

## 2. Stack and constraints

- **Generator:** Eleventy (11ty) v3, Nunjucks templates, Markdown content. Node 20 LTS.
- **Output:** pure static HTML. **Zero client-side JavaScript for content.** The mockup's tab/slider affordances (persona toggle, case-study tabs, registry filters) must be implemented as **static URLs**, not JS state. Optional progressive enhancement is allowed only if every state also exists as its own URL.
- **CSS:** port `design-mockup/styles.css` as-is into the build. It is hand-written, ~14 KB, no framework. Keep the custom-property names — templates and future edits depend on them.
- **Images:** none. No hero images, no stock photos, no icon fonts. The only graphics are the inline SVG side-meshes in the hero and inline SVG sparklines.
- **No trackers, no cookies, no consent banner.** Analytics comes from Cloudflare logs, outside this repo. The Privacy page states this — keep it true.
- **Hosting:** GitHub Pages via GitHub Actions on push to `main`, Cloudflare in front. `PATH_PREFIX` env var controls the base path (`/citere-site/` on Pages, `/` on the custom domain). Every internal href and asset path goes through Eleventy's `url` filter.
- **Page weight target:** HTML ≤ 60 KB per page. Lighthouse ≥ 95 in all four categories. The Lighthouse step must build into its own directory and never overwrite `_site/`.
- **Languages:** English primary at `/`, Ukrainian at `/uk/`. Build must not fail on a missing UA translation — fall back to EN with correct `lang` and a one-line notice.

---

## 3. Repository layout

```
/
├── CLAUDE.md
├── design-mockup/                 # APPROVED DESIGN — reference only, not built or deployed
├── docs/
│   ├── spec-pages.md
│   └── content.md
├── .eleventy.js
├── package.json
├── CNAME
├── .github/workflows/deploy.yml
├── data/                          # SOURCE OF TRUTH FOR ALL NUMBERS — exported from Citere, never hand-edited
│   ├── claims/                    # one JSON per claim: C1-003.json
│   ├── observations/              # one CSV per run
│   ├── sources.json
│   ├── platforms.json
│   ├── countries.json
│   ├── clusters.json
│   ├── benchmarks.json            # precomputed leaderboards, heatmap, A×B, funnel, trends
│   ├── escalations.json
│   ├── reports.json
│   └── site.json
├── content/                       # HUMAN-WRITTEN PROSE (Markdown)
│   ├── en/ (index, methodology, about, mission, manifesto, press, terms, privacy, data,
│   │        claims/{id}.md, reports/{slug}.md)
│   └── uk/ (same tree)
├── src/
│   ├── _includes/layouts/         # base, claim, report, platform, country, source, page, benchmark
│   ├── _includes/partials/        # head, nav, footer, verdict-badge, observations-table,
│   │                              # actions-table, before-after-table, heatmap, abx-matrix,
│   │                              # dumbbell, funnel, stacked-verdicts, leaderboard, cite
│   ├── _includes/jsonld/
│   ├── _data/
│   ├── css/site.css               # ported from design-mockup/styles.css
│   ├── pages/
│   ├── generators/                # claim pages, facet pages, platform/country/source pages
│   └── machine/                   # robots.txt, llms.txt, llms-full.txt, sitemaps, feeds, exports
├── scripts/ (import-citere.mjs, validate.mjs, check.mjs, guards.json)
└── schemas/
```

**Rule:** `data/` is machine-written. `content/` is prose. Templates join them. Never type a number into a template or Markdown file.

---

## 4. Page inventory and URL scheme

Every page below exists in `design-mockup/`. The mockup uses flat `.html` filenames; the real site uses directory URLs. Map them exactly:

| Mockup file | Live URL | Layout |
|---|---|---|
| index.html | `/` | home |
| registry.html | `/registry/` | registry |
| claim.html | `/registry/{slug}/` | claim |
| benchmarks.html | `/benchmarks/` | benchmark hub |
| chatbots.html | `/platforms/` | leaderboard |
| chatbot.html | `/platforms/{bot}/` | platform |
| countries.html | `/countries/` | leaderboard |
| country.html | `/countries/{iso2}/` | country |
| sources.html | `/sources/` | sources |
| source.html | `/sources/{domain-slug}/` | source |
| escalations.html | `/escalations/` | escalations |
| reports.html | `/monitor/` | reports index |
| report.html | `/monitor/{yyyy-mm}-{slug}/` | report |
| methodology.html | `/methodology/` | prose |
| data.html | `/data/` | data |
| about.html | `/about/` | prose |
| mission.html | `/mission/` | prose |
| manifesto.html | `/manifesto/` | prose |
| press.html | `/press/` | prose |
| terms.html | `/terms/` | prose |
| privacy.html | `/privacy/` | prose |

Plus generated facets (each is a real page): `/registry/cluster/{c}/`, `/registry/country/{iso2}/`, `/registry/language/{lang}/`, `/registry/chatbot/{bot}/`, `/registry/verdict/{v}/`, and benchmark persona views `/benchmarks/persona/{p1..p4}/`.

Plus machine outputs: `/registry.json`, `/registry.csv`, `/registry/{slug}.json`, `/registry/{slug}.md`, `/sources.csv`, `/sources.stix.json`, `/escalations.csv`, `/benchmarks.json`, `/sitemap.xml` (+children), `/feed.xml`, `/feed.json`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/.well-known/security.txt`.

Bots: `chatgpt, gemini, grok, claude, copilot, perplexity, deepseek, le-chat`. Slugs are lowercase ASCII, ≤ 60 chars, stored in the claim JSON, never regenerated. URL changes require a 301.

---

## 5. Data schemas

Write full JSON Schema files in `schemas/`. `npm run validate` runs them; CI fails on invalid data.

### 5.1 `data/claims/{id}.json`

```json
{
  "id": "C1-003",
  "slug": "c1-003-100m-western-aid-stolen",
  "cluster": "corruption-diverted-aid",
  "title_en": "Ukrainian officials stole $100 million of Western aid",
  "title_uk": "…",
  "verdict": "false",
  "verdict_date": "2026-09-15",
  "updated": "2026-10-24",
  "languages": ["en","de","fr","pl"],
  "countries": ["us","de","fr","pl"],
  "grain_of_truth": true,
  "origin": {"first_seen":"2025-11-02","origin_note_en":"…","network":"pravda",
             "attribution":[{"org":"Viginum","url":"…","date":"…"}]},
  "confirmations": [{"org":"CPD (RNBO)","finding_en":"…","date":"…","url":"…"}],
  "observations": [
    {"run":"run-2026-09-de","chatbot":"grok","country":"de","language":"de","persona":"P2",
     "date":"2026-09-12","model_version":"grok-4.1","behaviour":"repeated",
     "judge":{"confidence":0.94,"agreement":1.0,"reasoning_en":"…"},
     "cited_domains":["rt.com"],"quote_en":"≤25 words or empty"}
  ],
  "actions": [
    {"type":"platform_report","target":"OpenAI","date":"2026-10-09",
     "status":"acknowledged","response_date":"2026-10-14","url":""}
  ],
  "before_after": [
    {"chatbot":"grok","persona":"P2",
     "before":{"rate":0.078,"n":45,"date":"2026-09-12","model_version":"grok-4.1"},
     "after":{"rate":0.030,"n":45,"date":"2026-10-24","model_version":"grok-4.2"}}
  ],
  "changelog": [{"date":"2026-10-24","note_en":"Added re-measurement results."}],
  "related": ["C1-001","C1-004"]
}
```

Enumerations (exact lowercase strings in data; display casing in templates):
- `verdict`: false, misleading, unsupported
- `behaviour`: repeated, contextualised, refuted, dodged
- `persona`: P1, P2, P3, P4
- `action.type`: published, platform_report, domain_complaint, shared, partner_publication, authority_confirmation, remeasured
- `action.status`: submitted, acknowledged, actioned, no_response, declined, completed, live, published, receipt_confirmed
- `network`: pravda, doppelganger, matryoshka, storm-1516, state-media, laundering, other
- `tier` (A×B): critical, high, review, low, none

Claim prose lives in `content/{lang}/claims/{id}.md` with front matter `id:` and H2 sections `## Verdict`, `## What is true`, `## Where the claim comes from`. The template merges by `id`.

### 5.2 `data/benchmarks.json`
Precomputed by the import script so no page does arithmetic at build time:
```json
{
  "run":"run-2026-09","label":"September 2026","date":"2026-09-12",
  "leaderboards":{
    "chatbot_repeat":[{"key":"deepseek","value":0.112,"n":45,"ci":[0.05,0.21],"delta":0.011}],
    "chatbot_contamination":[…],"country_repeat":[…],"cluster_repeat":[…],
    "most_repeated_claims":[…],"biggest_change":[…]
  },
  "heatmap":[{"chatbot":"deepseek","persona":"P2","rate":0.112,"n":45,"low_confidence":false}],
  "abx":{"repeat":{"clean":5,"flagged":2},"u_context":{"clean":14,"flagged":3},
         "refute":{"clean":114,"flagged":18},"dodge":{"clean":11,"flagged":0}},
  "funnel":[{"label":"collected","n":698},{"label":"judged","n":698},
            {"label":"source_flagged","n":23},{"label":"critical","n":2}],
  "grain_of_truth":[{"persona":"P4","with_grain":0.071,"pure":0.50,"n":172}],
  "verdict_split":[{"persona":"P2","repeated":0.07,"contextualised":0.29,"refuted":0.56,"dodged":0.08,"n":176}],
  "contamination_by_persona":[{"persona":"P2","rate":0.050,"n":176}],
  "trend":[{"month":"2026-07","median_repeat":0.091}],
  "country_matrix":[{"chatbot":"grok","country":"de","rate":0.091,"spread":0.029}],
  "cluster_by_country":[{"cluster":"corruption-diverted-aid","country":"de","rate":0.139}]
}
```

### 5.3 Other files
- `data/sources.json` — `{domain, slug, network, first_seen, attribution[], cited_in[], citations, complaints[], article_evidence[]}`. Render domains defanged (`example[.]com`), never as links.
- `data/platforms.json` — per-bot metadata and per-run aggregates **per persona**. Never store or render a persona-averaged number.
- `data/escalations.json` — flat array, public part only. Must never contain correspondence text.
- `data/site.json` — org data, contacts, counters, `used_by[]`, watchlist/methodology versions. Counters are recomputed at build; stored values are not trusted.

---

## 6. Templates — required elements

Every page (via `base.njk`), matching `design-mockup`:
- `<html lang>`; one `<h1>`; `<main>`; breadcrumbs + `BreadcrumbList`.
- `<head>`: title ≤ 65 chars, meta description 120–160, canonical, `hreflang` en/uk/x-default, RSS link, JSON-LD.
- Update line: `Updated {date} · Data: CC BY 4.0 · How we measure`.
- Footer: the four-column footer from the mockup — brand blurb, Monitoring, Method & data, Organisation — plus bottom row with Terms, Privacy, Press & Media, security.txt.
- Skip link, focus styles, contrast ≥ 4.5:1, tables with `<caption>` and `<th scope>`, dates as `<time datetime>`.

Component partials to extract from the mockup, each driven by data:
`leaderboard` (rank card), `heatmap`, `abx-matrix`, `dumbbell`, `funnel`, `stacked-verdicts`, `trend-bars`, `metric-cards`, `bot-strip`, `country-cards`, `case-timeline`, `observations-table`, `actions-table`, `before-after-table`, `verdict-badge`, `status-chip`, `domain-row`.

Claim page block order is fixed (see `docs/spec-pages.md` §3 and the mockup):
1. H1 = claim in quotes; verdict line.
2. Verdict / What is true / Where the claim comes from (prose).
3. Who else has checked this.
4. Which chatbots repeated it — with judge confidence and agreement.
5. Sources the chatbots cited.
6. What we did — summary line, actions table, disclosure note.
7. What changed — before/after, causation note. **Section omitted entirely when `before_after` is empty. No placeholders.**
8. Changelog · Cite this page · Related claims.

Homepage block order: hero (with side meshes) → bot strip → 4 metric cards → Latest findings → Rankings → Case studies (slider shell + timeline) → Markets we monitor → Our data is used by (**renders only if `site.json.used_by` is non-empty**) → The audience is the model → How it works → Why trust this.

---

## 7. Structured data (JSON-LD in `<head>`)

- All pages: `Organization`, `WebSite`, `BreadcrumbList`.
- Claim page: exactly **one** `ClaimReview` (claimReviewed, datePublished=verdict_date, dateModified, author=Organization, reviewRating with `alternateName` FALSE/MISLEADING/UNSUPPORTED and ratingValue 1/2/3 of bestRating 5, itemReviewed=`Claim` with `appearance[]` per observation) plus `Article`. Google no longer renders ClaimReview rich results; we implement it for AI systems and other consumers.
- Report: `Article` + `Dataset` (distribution → CSV/JSON, license CC BY 4.0, temporalCoverage, spatialCoverage).
- Registry, Benchmarks, Sources, Data: `Dataset` (+ `DataCatalog` on `/data/`).
- Platform/country pages: `Article` + `Dataset`.
- About: `Organization` with `founder`/`member` → `Person` from `site.json.team`.
- Never mark up content that is not on the page. Never use `FAQPage`, `HowTo`, or `Review`.

---

## 8. Machine-readable outputs

- `robots.txt` — allow everything; explicit blocks for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, Applebot-Extended, CCBot; sitemap line. Text is in `docs/content.md`.
- `llms.txt` (≤ 4 KB, live counts substituted) and `llms-full.txt` (methodology + every claim as Markdown, regenerated each build). Draft in `docs/content.md`.
- `sitemap.xml` index → pages / registry / uk children, `lastmod` from data.
- `feed.xml` (RSS 2.0) and `feed.json` (JSON Feed 1.1) — new and updated claims plus reports, 50 items.
- Per-claim `{slug}.json` and `{slug}.md`; `registry.json`, `registry.csv` (one row per observation), `sources.csv`, `sources.stix.json` (STIX 2.1 bundle, `indicator` per domain, `pattern: [domain-name:value = '…']`, `x_citere_network`, `valid_from`), `escalations.csv`, `benchmarks.json`.
- `.well-known/security.txt` (Contact, Expires, Preferred-Languages en/uk).

---

## 9. Build, run, deploy

```
npm install
npm run validate     # JSON schema validation of /data
npm run build        # eleventy → _site/
npm run check        # pre-publish checks → §10
npm run lighthouse   # builds into _site-lighthouse/, never touches _site/
npm run serve
```

`deploy.yml`: push to `main` → Node 20 → `npm ci` → validate → build (with `PATH_PREFIX` from repo variable) → check → lighthouse → deploy `_site/`. Any failing step blocks deploy.

`scripts/import-citere.mjs`: takes a Citere export directory, validates against `schemas/`, recomputes `benchmarks.json` and `site.json.counters`, writes into `data/`, refuses to overwrite a claim whose `updated` is newer than the import, prints a diff summary. This is the only sanctioned way numbers enter the repo.

---

## 10. Pre-publish checks (`scripts/check.mjs`) — build fails on any failure

- Exactly one `<h1>`; title ≤ 65; meta description 120–160; canonical present; `lang` matches served path; every hreflang alternate resolves; no inline `<script>` except JSON-LD; HTML ≤ 60 KB.
- Claim pages: exactly one `ClaimReview`; verdict badge matches data; `before_after` section absent when data empty.
- **Persona-averaging guard**: no rendered rate may exist without an attached persona, anywhere on the site.
- **Stop-word guard**: none of the words in `docs/content.md` §B appear in output (fight, combat, defeat, war on disinformation, revolutionary, AI-powered, cutting-edge, comprehensive, unique, holistic, empower, innovative).
- No domain from `sources.json` appears inside an `<a href>`.
- No string from `scripts/guards.json` (P4 prompt fragments) appears in output.
- All internal links resolve; every page has breadcrumbs; sitemap covers every HTML page; feeds validate; `robots.txt` and `llms.txt` list only existing paths.
- Lighthouse CI ≥ 95 on homepage, benchmarks, a claim page, registry, one report.

---

## 11. Rules for Claude when maintaining this site

1. **Numbers only via `data/`.** Never type a statistic into a template or Markdown.
2. **New claim** = import JSON via `import-citere.mjs` + write `content/en/claims/{id}.md` (+ optional UA) → validate, build, check → **open a PR**, never push claim content directly to `main`.
3. **New report** = `content/en/reports/{yyyy-mm}-{slug}.md` (front matter: title, period, countries, languages, chatbots, n_responses, dataset_url, doi, pdf_url) + entry in `data/reports.json`. Key findings first; Limitations section mandatory.
4. **Escalation / sources updates** = data-only, direct commit to `main` allowed.
5. **Prose style** = `docs/content.md` §A–B: first paragraph self-sufficient; every judgement next to a number, date or link; sentences ≤ 20 words; buttons name outcomes.
6. **Never publish**: P4 prompt text, full chatbot responses (quotes ≤ 25 words), platform correspondence, names of platform staff, hyperlinks to watchlisted domains, placeholder or "coming soon" blocks.
7. **Corrections**: fix the page, add a dated changelog entry, bump `updated`. Never silently.
8. **Ukrainian**: translate meaning, keep identical structure and IDs; ISO dates in data, localised in display.
9. Commit messages: `claim: add C1-003`, `claim: update C1-003 re-measure`, `report: 2026-09 monitor`, `sources: watchlist v14`, `escalation: C1-003 OpenAI acknowledged`, `site: …`.

---

## 12. Design

Match `design-mockup/` exactly. For reference, the system is:

- Typography-first, Inter / system stack, base 15.5px/1.62, tabular numerals for all figures.
- Colour: `--ink #0c1220` on `--bg #f5f6f8`; accent `#2457e0`; verdicts FALSE `#c4291d`, MISLEADING `#96591a`, UNSUPPORTED `#5a6472`, success `#127a4a`. Each has a matching soft background token for badges.
- Cards: white, 1px `--line` border, 14px radius, two-layer soft shadow. No heavy shadows, no gradients except the four country cards and the hero mesh.
- Tables are real `<table>`, zebra on hover, sticky header on desktop, horizontal scroll on mobile.
- Badges and chips are text-only, uppercase for verdicts, no icons.
- Hero has two monochrome SVG meshes left and right with a slow scan line and lock-on markers; opacity 0.5, hidden below 1180px, frozen under `prefers-reduced-motion`.
- No hero image, no illustrations, no marketing layout. Reference feel: a source, not a product.
- Dark mode is **not** in scope for v1.

---

## 13. Build order

1. Scaffold: Eleventy config, layouts, port `styles.css`, base partials, `deploy.yml`, schemas, scripts. Build passes with empty data.
2. Home, Methodology, About, Mission, Manifesto, Press, Terms, Privacy, Data (trust and static prose first — they need no live data).
3. Claim template + registry + facets + per-claim JSON/MD, using one fully populated sample claim.
4. Benchmarks hub + all data-driven components (leaderboards, heatmap, A×B, dumbbell, funnel, stacked verdicts, trend).
5. Platforms and countries (index + detail, generated).
6. Sources + source detail + Escalations.
7. Reports index + report template.
8. Machine outputs: robots, llms, sitemaps, feeds, STIX, security.txt.
9. Ukrainian mirror.
10. Lighthouse CI and full `check.mjs`.

Ship 1–4 before polishing anything else.

---

## 14. Open values to fill (owner: Vit)

- `CNAME` / `site.json.domain` — default `citere.ai` until confirmed.
- `site.json.org` — legal name, city (Chernivtsi in the mockup), founding date, team list with roles.
- Funding line in `content/en/about.md` — currently "self-funded".
- Sample claim C1-003 prose: real case name, investigating body, document link. Mockup text is illustrative.
- Attribution URLs for Viginum, NewsGuard, DFRLab, EU DisinfoLab (named in the mockup, unlinked).
- Watchlist attributions for every domain in `sources.json` — `check.mjs` warns on any domain without one.
