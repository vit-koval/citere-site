# CLAUDE.md — Sitera public website

This file is the master instruction set for building and maintaining the Sitera website. Read it fully before touching anything. Companion documents live in `docs/`:

- `docs/spec-pages.md` — page-by-page structure (what goes on each page, in what order).
- `docs/content.md` — final copy, messaging rules, vocabulary, verdict/status dictionaries, pre-publish checklist.

When this file and a companion conflict, this file wins. When something is unspecified, prefer the simplest option that keeps the site static, fast and machine-readable.

---

## 1. What this site is

Sitera is an independent Ukrainian research team (Diia.City resident) that tests public AI chatbots — ChatGPT, Gemini, Grok, Claude, Copilot, Perplexity, DeepSeek, Le Chat — for Russian disinformation about Ukraine, reports findings to the platforms and Ukrainian institutions, publishes the evidence, and re-measures.

The website is **not a marketing site**. It is a public evidence base read by four audiences at once: AI crawlers and chatbot search layers, Google/Bing, human researchers and fact-checkers, and Ukrainian state bodies. Every design and code decision serves those readers.

No commercial section. No services page. No pricing. Do not add them.

Core insight the site must express: Russian influence networks now publish for AI models, not people; a chatbot answer has no feed or moderator, so nobody sees the contamination; Sitera measures it, traces sources, gets it corrected, and measures again.

---

## 2. Stack and constraints

- **Generator:** Eleventy (11ty) v3, Nunjucks templates, Markdown content. Node 20 LTS.
- **Output:** pure static HTML. **Zero client-side JavaScript for content.** The only permitted JS is an optional progressive enhancement for registry filtering that must fully degrade: every filter combination must also exist as a static URL.
- **CSS:** one hand-written stylesheet, ≤ 12 KB, no framework, no build step beyond minification. System font stack. No web fonts. No icon fonts.
- **Images:** none required. If used later, native `<img>` with width/height, lazy loading, WebP. No hero images. No stock photos. Ever.
- **No trackers, no cookies, no consent banner.** Analytics comes from Cloudflare logs, outside this repo.
- **Hosting:** GitHub Pages via GitHub Actions on push to `main`. Cloudflare in front (DNS, cache, HTTPS, logs). Custom domain via `CNAME` file.
- **Page weight target:** HTML ≤ 60 KB per page. Lighthouse ≥ 95 in all four categories.
- **Languages:** English primary at `/`, Ukrainian at `/uk/`. Same structure. Build must not fail if a UA translation is missing — fall back to EN with `lang` set correctly and a one-line notice.

---

## 3. Repository layout

```
/
├── CLAUDE.md
├── docs/
│   ├── spec-pages.md
│   └── content.md
├── .eleventy.js
├── package.json
├── CNAME                         # domain, e.g. sitera.ai
├── .github/workflows/deploy.yml
├── data/                         # SOURCE OF TRUTH FOR ALL NUMBERS — exported from Citere, never hand-edited
│   ├── claims/                   # one JSON per claim: C1-003.json
│   ├── observations/             # one CSV per run: run-2026-09-us.csv
│   ├── sources.json              # domain watchlist (public subset)
│   ├── platforms.json            # chatbot metadata + per-run aggregates
│   ├── countries.json
│   ├── escalations.json          # public part of escalation log
│   ├── reports.json              # report index (metadata)
│   └── site.json                 # site-wide counters, last_update, org data
├── content/                      # HUMAN-WRITTEN TEXT (Markdown, edited by Claude + reviewed by human)
│   ├── en/
│   │   ├── index.md              # homepage copy blocks
│   │   ├── methodology.md
│   │   ├── about.md
│   │   ├── data.md
│   │   ├── claims/C1-003.md      # verdict text, what-is-true, origin — prose parts of a claim
│   │   └── reports/2026-09-monitor.md
│   └── uk/                       # same tree
├── src/
│   ├── _includes/
│   │   ├── layouts/base.njk
│   │   ├── layouts/claim.njk
│   │   ├── layouts/report.njk
│   │   ├── layouts/platform.njk
│   │   ├── layouts/country.njk
│   │   ├── layouts/source.njk
│   │   ├── layouts/page.njk
│   │   ├── partials/head.njk     # meta, canonical, hreflang, JSON-LD
│   │   ├── partials/nav.njk
│   │   ├── partials/footer.njk
│   │   ├── partials/verdict-badge.njk
│   │   ├── partials/observations-table.njk
│   │   ├── partials/actions-table.njk
│   │   ├── partials/before-after-table.njk
│   │   ├── partials/cite.njk
│   │   └── jsonld/               # one file per schema type
│   ├── _data/                    # 11ty global data loaders that read /data and /content
│   ├── css/site.css
│   ├── pages/                    # index, registry, monitor, platforms, countries, sources, escalations, methodology, data, about
│   ├── generators/               # paginated templates: claim pages, facet pages, platform pages, source pages
│   └── machine/                  # robots.txt, llms.txt, llms-full.txt, sitemap, feeds, JSON/MD exports
├── scripts/
│   ├── import-citere.mjs         # validates + copies exports into /data
│   ├── validate.mjs              # JSON schema validation for /data
│   └── check.mjs                 # pre-publish checks (see §10)
└── schemas/                      # JSON Schema for every file type in /data
```

**Rule:** `data/` is machine-written. `content/` is human/Claude-written prose. Templates join them. Never put numbers in `content/`; never put prose in `data/`.

---

## 4. URL scheme (permanent — never change without a 301 in `_redirects`)

```
/                                   homepage
/registry/                          all claims
/registry/{slug}/                   claim page            e.g. /registry/c1-003-100m-western-aid-stolen/
/registry/{slug}.json               claim as JSON
/registry/{slug}.md                 claim as Markdown
/registry/cluster/{cluster}/        facet
/registry/country/{iso2}/           facet
/registry/language/{lang}/          facet
/registry/chatbot/{bot}/            facet
/registry/verdict/{verdict}/        facet
/monitor/                           reports index
/monitor/{yyyy-mm}-{slug}/          report
/platforms/                         chatbots index
/platforms/{bot}/                   chatbot profile        bots: chatgpt, gemini, grok, claude, copilot, perplexity, deepseek, le-chat
/countries/{iso2}/                  country profile
/sources/                           domain list
/sources/{domain-slug}/             domain page            slug: dots → dashes
/escalations/                       escalation log
/methodology/
/data/
/about/
/uk/...                             Ukrainian mirror of everything above
/registry.json  /registry.csv  /sources.csv  /sources.stix.json  /escalations.csv
/sitemap.xml  /sitemap-registry.xml  /feed.xml  /feed.json  /robots.txt  /llms.txt  /llms-full.txt
/.well-known/security.txt
```

Slugs: lowercase, ASCII, hyphens, ≤ 60 chars, derived from claim ID + short title. Stored in the claim JSON; never regenerated.

---

## 5. Data schemas

Write full JSON Schema files in `schemas/`. Validation runs in `npm run validate` and in CI; build fails on invalid data.

### 5.1 `data/claims/{id}.json`

```json
{
  "id": "C1-003",
  "slug": "c1-003-100m-western-aid-stolen",
  "cluster": "corruption-diverted-aid",
  "title_en": "Ukrainian officials stole $100 million of Western aid",
  "title_uk": "…",
  "verdict": "false",                          // false | misleading | unsupported
  "verdict_date": "2026-09-15",
  "updated": "2026-10-24",
  "languages": ["en","de","fr","pl"],
  "countries": ["us","de","fr","pl"],
  "grain_of_truth": true,
  "origin": { "first_seen": "2025-11-02", "origin_note_en": "…", "network": "pravda", "attribution": [{"org":"Viginum","url":"…","date":"…"}] },
  "confirmations": [ {"org":"CPD (RNBO)","finding_en":"…","date":"…","url":"…"} ],
  "observations": [
    { "run": "run-2026-09-us", "chatbot": "grok", "country": "us", "language": "en",
      "persona": "P2", "date": "2026-09-10", "model_version": "…",
      "behaviour": "repeated",                 // repeated | contextualised | refuted | dodged
      "cited_domains": ["example[.]com"], "quote_en": "≤25 words or empty" }
  ],
  "actions": [
    { "type": "published", "target": "sitera.ai", "date": "2026-09-22", "status": "live", "url": "" },
    { "type": "platform_report", "target": "OpenAI", "date": "2026-10-09", "status": "acknowledged", "response_date": "2026-10-14" },
    { "type": "domain_complaint", "target": "Registrar of …", "date": "…", "status": "submitted" },
    { "type": "shared", "target": "CPD (RNBO)", "date": "…", "status": "receipt_confirmed" },
    { "type": "partner_publication", "target": "VoxCheck", "date": "…", "status": "published", "url": "…" },
    { "type": "remeasured", "target": "8 chatbots", "date": "…", "status": "completed" }
  ],
  "before_after": [
    { "chatbot": "grok", "before": {"rate": 0.23, "n": 30, "date": "2026-09-10", "model_version": "…"},
                         "after":  {"rate": 0.07, "n": 30, "date": "2026-10-24", "model_version": "…"} }
  ],
  "changelog": [ {"date":"2026-10-24","note_en":"Added re-measurement results."} ],
  "related": ["C1-001","C1-004"]
}
```

Enumerations (exact strings, lowercase in data; display casing handled in templates):
- `verdict`: false, misleading, unsupported
- `behaviour`: repeated, contextualised, refuted, dodged
- `persona`: P1, P2, P3, P4
- `action.type`: published, platform_report, domain_complaint, shared, partner_publication, authority_confirmation, remeasured
- `action.status`: submitted, acknowledged, actioned, no_response, declined, completed, live, published, receipt_confirmed
- `network`: pravda, doppelganger, matryoshka, storm-1516, state-media, other

Prose for a claim (verdict text, what-is-true, origin narrative) lives in `content/{lang}/claims/{id}.md` with front matter `id: C1-003` and sections marked by H2s: `## Verdict`, `## What is true`, `## Where the claim comes from`. The template merges by `id`.

### 5.2 `data/sources.json`
Array of `{ "domain": "example.com", "slug": "example-com", "network": "pravda", "first_seen": "…", "attribution": [{"org","url","date"}], "cited_in": ["C1-003"], "complaints": [{"target","date","status"}] }`.
Render domains defanged (`example[.]com`) and never as links.

### 5.3 `data/platforms.json`
`{ "grok": { "name": "Grok", "company": "xAI", "runs": [ { "run": "run-2026-09-us", "country":"us", "date":"…", "model_version":"…", "by_persona": { "P1": {"repeat_rate":0.028,"n":…,"ci":[…]}, … }, "contamination_rate": …, "n": … } ], "escalations": ["C1-003"] } }`.
**Never store or render a persona-averaged number.**

### 5.4 `data/escalations.json`
Flat array: `{ "date", "type", "target", "claim_id", "status", "response_date", "url" }`. This is the public log; it must never contain correspondence text.

### 5.5 `data/site.json`
`{ "domain", "org": { "name","legal_name","city","country","founded","diia_city_since","email":{"research","platforms","press","corrections"},"sameAs":[…] }, "counters": { "claims","responses","escalations_sent","escalations_answered","escalations_actioned" }, "last_update", "watchlist_version", "methodology_version" }`.
Counters are computed at build time from `data/` — `site.json` values are overwritten by the build, not trusted.

---

## 6. Page templates — required elements

Every page (via `base.njk`):
- `<html lang>` correct; one `<h1>`; `<main>`; breadcrumbs (`<nav aria-label="Breadcrumb">`) + `BreadcrumbList`.
- `<head>`: title, meta description, canonical, `hreflang` en/uk/x-default, `<link rel="alternate" type="application/rss+xml">`, JSON-LD block(s).
- Update line under H1 area: `Updated {date} · Data: CC BY 4.0 · How we measure`.
- Footer: full link set per `docs/content.md` §C, plus links to this page's JSON/MD/CSV where they exist.
- Skip link, focus styles, colour contrast ≥ 4.5:1. Tables get `<caption>`, `<th scope>`.
- All dates as `<time datetime="YYYY-MM-DD">`.

Claim page (`claim.njk`) — block order is fixed, see `docs/spec-pages.md` §3 and `docs/content.md` §F:
1. H1 = claim in quotes; verdict line (badge, dates, ID, cluster, languages).
2. `## The verdict` (prose) · `## What is true` (prose) · `## Where the claim comes from` (prose + attribution).
3. `## Who else has checked this` (table from `confirmations`).
4. `## Which chatbots repeated it` (observations table; persona note under it).
5. `## Sources the chatbots cited` (defanged domains → source pages).
6. `## What we did` (summary line + actions table + disclosure note).
7. `## What changed` (before/after table + causation note). Hidden entirely if `before_after` is empty — no placeholders.
8. `## Changelog` · `## Cite this page` (citation string + BibTeX + JSON/MD/CSV links) · `## Related claims`.

Homepage: six blocks in the order given in `docs/content.md` §D. The "Where our data is used" block renders only if `data/site.json.used_by` is non-empty.

Registry: intro paragraph with live counts; "how to read" block; facet links; table sorted by `updated` desc; footer exports.

Facet pages: own H1 and a generated 2–3 sentence intro with counts for that facet; then the filtered table. Every facet with ≥ 1 claim gets a page.

Platform / country / source / escalations / report pages: per `docs/spec-pages.md` §4–8 and intros in `docs/content.md` §G.

---

## 7. Structured data (JSON-LD in `<head>`)

Implement as Nunjucks partials in `src/_includes/jsonld/`; one `<script type="application/ld+json">` per type; validate output with a schema check in `scripts/check.mjs`.

- All pages: `Organization` (name, legalName, url, logo, foundingDate, address, email, sameAs), `WebSite` (with `SearchAction` pointing to `/registry/?q={search_term_string}` — implemented as a static page that explains search via facets), `BreadcrumbList`.
- Claim page: exactly one `ClaimReview` — `claimReviewed`, `datePublished` (verdict_date), `dateModified`, `author` (Organization), `reviewRating` (`ratingValue` 1–5 mapped: false=1, misleading=2, unsupported=3; `alternateName` = FALSE/MISLEADING/UNSUPPORTED; `bestRating` 5, `worstRating` 1), `itemReviewed` = `Claim` with `appearance` = array of `CreativeWork` entries (one per observation: name = "{Chatbot} answer, {country}, {date}", `datePublished`). Plus `Article` (headline, datePublished, dateModified, author, publisher, inLanguage). Note: Google no longer shows ClaimReview rich results; we implement it for AI systems and other consumers, and keep it strictly one per page.
- Report page: `Article` + `Dataset` (distribution → CSV/JSON URLs, license CC BY 4.0, temporalCoverage, spatialCoverage).
- Registry, Sources, Data pages: `Dataset` (+ `DataCatalog` on `/data/`).
- Platform/country pages: `Article` + `Dataset`.
- About: `Organization` extended with `founder`/`member` → `Person` entries (name, jobTitle, sameAs) from `data/site.json.team`.
- Never mark up content that is not on the page. Never use `FAQPage`, `HowTo`, `Review` outside the above.

---

## 8. Machine-readable outputs (built every time)

- `robots.txt` — exact text from `docs/content.md` §12 (allow everything, explicit AI user-agents, sitemap line).
- `llms.txt` — from `docs/content.md` §11, with live counts substituted; ≤ 4 KB.
- `llms-full.txt` — methodology + every claim page rendered as Markdown, concatenated with `---` separators and a header per claim. Regenerated on every build.
- `sitemap.xml` (index) → `sitemap-pages.xml`, `sitemap-registry.xml`, `sitemap-uk.xml`; `lastmod` from data.
- `feed.xml` (RSS 2.0) and `feed.json` (JSON Feed 1.1): claims (new + updated) and reports, newest first, 50 items.
- Per-claim `{slug}.json` (the raw data file) and `{slug}.md` (rendered Markdown of the full page, same block order).
- `registry.json`, `registry.csv` (one row per observation), `sources.csv`, `sources.stix.json` (STIX 2.1 bundle: `indicator` per domain with `pattern: [domain-name:value = '…']`, `x_sitera_network`, `valid_from`), `escalations.csv`.
- `.well-known/security.txt` (Contact, Expires, Preferred-Languages en/uk).

---

## 9. Build, run, deploy

```
npm install
npm run validate     # JSON schema validation of /data
npm run build        # eleventy → _site/
npm run check        # pre-publish checks (§10) against _site/
npm run serve        # local preview
```

`deploy.yml`: on push to `main` → Node 20 → `npm ci` → `validate` → `build` → `check` → deploy `_site/` to GitHub Pages. Any failing step blocks deploy. PRs get a preview build artifact.

`scripts/import-citere.mjs`: takes a Citere export directory, validates each file against `schemas/`, writes into `data/`, refuses to overwrite a claim whose `updated` is newer than the import, prints a diff summary. This is the only sanctioned way numbers enter the repo.

---

## 10. Pre-publish checks (`scripts/check.mjs`) — build fails if any fail

- Every HTML page: exactly one `<h1>`; `<title>` ≤ 65 chars; meta description 120–160 chars; canonical present; `lang` set; no inline `<script>` except JSON-LD; HTML ≤ 60 KB.
- Every claim page: exactly one `ClaimReview`; verdict badge matches data; no persona-averaged figure anywhere in the page text (regex guard against "average across personas" and any repeat-rate not attached to a persona in observations tables); `before_after` section absent when data empty.
- No occurrence of stop-words from `docs/content.md` §B in any rendered page: fight, combat, defeat, war on disinformation, revolutionary, AI-powered, cutting-edge, comprehensive, unique, holistic, empower, innovative.
- No domain from `sources.json` appears as an `<a href>`.
- No string matching persona P4 prompt text (guard list in `scripts/guards.json`) appears in output.
- All internal links resolve; no page without a breadcrumb; sitemap covers every HTML page; feeds valid.
- `robots.txt` and `llms.txt` list only paths that exist.
- Lighthouse CI: performance, accessibility, best practices, SEO all ≥ 95 on homepage, one claim page, registry, one report.

---

## 11. Content rules for Claude when editing this site

You will be asked to add claims, reports, sources and escalations. Follow this exactly:

1. **Numbers only via `data/`.** Never type a statistic into a template or Markdown. If a number is needed in prose, reference it as a template variable from `data/`.
2. **New claim** = (a) `data/claims/{id}.json` from Citere export via `import-citere.mjs`, (b) `content/en/claims/{id}.md` with the three prose sections, (c) optional `content/uk/claims/{id}.md`. Run `validate`, `build`, `check`. Open a PR; never push claim content directly to `main`.
3. **New report** = `content/en/reports/{yyyy-mm}-{slug}.md` (front matter: title, period, countries, languages, chatbots, n_responses, dataset_url, doi, pdf_url) + entry in `data/reports.json`. Key findings section first; Limitations section mandatory.
4. **Escalation update** = append to `data/escalations.json` and to the claim's `actions[]`. Direct commit to `main` is allowed for data-only changes.
5. **Sources update** = `data/sources.json` via import script. Direct commit allowed.
6. **Prose style** = `docs/content.md` §A and §B: first paragraph self-sufficient; every judgement next to a number/date/link; sentences ≤ 20 words; no stop-words; buttons name outcomes.
7. **Never** publish: P4 prompt text, full chatbot responses (quotes ≤ 25 words), platform correspondence, names of platform staff, hyperlinks to watchlisted domains, placeholders or "coming soon" blocks.
8. **Corrections**: fix the page, add a dated changelog entry, bump `updated`. Never silently.
9. **Ukrainian**: translate meaning, not words; keep identical structure and IDs; dates in ISO in data, localised in display.
10. Commit messages: `claim: add C1-003`, `claim: update C1-003 re-measure`, `report: 2026-09 monitor`, `sources: watchlist v14`, `escalation: C1-003 OpenAI acknowledged`, `site: …`.

---

## 12. Design

- Typography-first. System font stack. Base 17px/1.55, max line length 70ch, generous whitespace. Headings sized by hierarchy, not decoration.
- Colour: near-black text on white; one accent for links; verdict colours — FALSE `#B3261E`, MISLEADING `#B26A00`, UNSUPPORTED `#5F6368`; behaviour badges use the same three plus neutral grey for Dodged. Dark mode via `prefers-color-scheme`, same contrast rules.
- Tables: full-width, zebra rows, sticky header on desktop, horizontal scroll on mobile with a visible edge shadow. Numbers right-aligned, tabular figures.
- Badges: uppercase, small, high-contrast, text-only (no icons).
- No hero image, no illustrations, no cards-with-shadows, no marketing layout. Reference feel: EUvsDisinfo database pages, DFRLab, Bellingcat — a source, not a product.
- Mobile first; navigation collapses to a plain list under a `<details>` element (no JS).

---

## 13. Initial build order

1. Scaffold: Eleventy config, layouts, CSS, base partials, `deploy.yml`, schemas, scripts. Build passes with empty data.
2. Homepage, Methodology, About, Data (trust must exist before content).
3. Claim template + registry + facets + per-claim JSON/MD, using one fully populated sample claim `C1-003` with placeholder prose marked `{{TODO}}` in `content/` (TODO markers must be flagged by `check.mjs` as warnings, not errors, until launch).
4. Sources + Escalations pages and exports.
5. Reports index + report template.
6. Platform and country profiles (generated from `platforms.json`, `countries.json`).
7. Machine outputs: robots, llms, sitemaps, feeds, STIX, security.txt.
8. Ukrainian mirror.
9. Lighthouse CI and full `check.mjs`.

Ship steps 1–4 before anything else is polished.

---

## 14. Open values to fill (owner: Vit)

- `CNAME` / `data/site.json.domain` — default `sitera.ai` until confirmed.
- `data/site.json.org` — legal name, city, founding date, team list with roles.
- Funding line in `content/en/about.md` — currently "self-funded".
- Sample claim `C1-003` prose: real case, investigating body, document link.
- Homepage H1 confirmed as the question form.
