# Demo dataset for the Citere site

Populates every page of the site so the design can be reviewed fully populated.

## ⚠ This is demonstration data

**Every figure in this package is generated. None of it is a real measurement.**

`data/site.json` carries `"demo": true` and a banner string. The site must render a
persistent, visible banner on every page while that flag is set, and must not deploy to a
public domain with the flag on. Delete or overwrite this data with a real Citere export via
`scripts/import-citere.mjs` before launch.

The narratives themselves are real, publicly documented Russian disinformation claims, and the
debunk prose is written to be factually sound at a general level. But the *numbers* — repeat-rates,
which assistant said what, judge confidences, escalation statuses, dates — are synthetic. Publishing
them as findings would be exactly the kind of unfalsifiable claim the methodology exists to avoid.

## What's inside

```
data/
  claims/C1-001.json … C5-002.json     18 claims, 4 clusters, 4 markets
  observations/run-2026-09.csv         1,600 rows, one per recorded answer
  benchmarks.json                      all leaderboards, heatmap, A×B, funnel, trends
  sources.json                         12 domains, 5 networks, article evidence
  platforms.json                       8 assistants, per-persona and per-country
  countries.json                       4 markets with local partners and notes
  clusters.json                        cluster labels
  escalations.json                     84 actions, 24 answered
  reports.json                         3 reports
  site.json                            org data, counters, demo flag
content/en/
  claims/C1-001.md … C5-002.md         verdict / what is true / where it comes from
  reports/*.md                          3 reports with key findings and limitations
```

## Everything is internally consistent

`benchmarks.json` is **computed** from the 1,600 observations, not written by hand. So the
homepage metric cards, the leaderboards, the heatmap, the A×B matrix, the funnel and each claim
page's own table all agree with each other. If you change an observation and re-run the generator,
every downstream figure moves with it.

Current totals: 1,600 observations · 33 source-flagged · 6 critical · 18 claims · 84 escalation
actions · 24 answered.

The dataset also reproduces the two findings the site is built around:

- **Grain of truth matters.** Under the hostile persona, claims spliced onto a real fact were
  repeated 18.6% of the time; pure fabrications, 0%.
- **Contamination peaks on the innocent question.** Source contamination is highest on P2 (topical
  news, 3.0%) and lowest on P3 (leading, 0.7%) — the neutral question triggers live search.

## How to install

Copy `data/` and `content/en/` into the repository root, merging with what is there:

```
cp -r seed-data/data/* data/
cp -r seed-data/content/en/* content/en/
npm run validate && npm run build && npm run check
```

Then tell Claude Code:

```
I added a demo dataset (seed-data/README.md explains it). site.json has demo:true —
add a site-wide demo banner that renders on every page whenever that flag is set, in both
languages, using demo_banner_en / demo_banner_uk. It must be impossible to miss and must not
be dismissible. Then run validate, build and check, and fix anything the checks catch.
```

## Regenerating

`generate_seed.py` is deterministic (seeded). Re-running produces the same dataset. Edit the
`CLAIMS`, `BOTS`, `COUNTRIES` or `PROSE` tables at the top and re-run to reshape it.

## Known placeholders

- `site.json.org.legal_name` and the team list are `{{TODO}}` — real values are yours to supply.
- Attribution URLs point at organisation homepages, not specific reports. Replace with the exact
  report URLs before launch.
- Domains use `.example` (an IANA-reserved TLD) so nothing here can resolve to a live site.
  `rt.com` is the one real domain, because it is a sanctioned state broadcaster and naming it is
  the point.
