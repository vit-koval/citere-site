# Citere — Countries Pages: Description

**Version:** 1.0 · 2026-09-09
**Pages:** Countries index (overview) and Country page (one market, full detail)
**Reference builds:** `Citere_Countries_Demo_v6.html` (index), `Citere_Country_Germany_Demo.html` (country page)
**Depends on:** Calculation Methodology v1.0, Sources Registry Business Logic v1.0, Countries Index Business Logic v1.0

Nothing on either page is computed on the page. Every element reads pre-computed cells from the metrics store and the Sources Registry, filtered and arranged for the reader. The two pages share one rule: a market is a country × language pair, and figures are never merged across markets, personas, or runs.

---

## Countries index

**Question the page answers.** Does the same chatbot tell people different things in different countries — and where is it worst?

**Audience.** Anyone landing on the Registry without a specific country or bot in mind: journalists, the general public, a platform trust & safety team scanning for their own exposure, a new institutional contact deciding whether Citere is relevant to their country.

### Structure, top to bottom

**1. Headline and standfirst.** One sentence, generated from the single largest statistically significant gap between two markets for the same bot and persona: "[Bot] repeats Kremlin fakes to users in [country] [N]× more often than to users in [country] — same questions, same month." Below it, one sentence of context naming the cluster, the number of countries, bots, and the testing method in plain words.

**2. Five headline numbers.** Countries tested, chatbots tested, the biggest cross-country gap (the number behind the headline), local disinformation mirrors found, critical incidents across all countries. These are the only numbers on the page shown without a persona or bot attached, because each is a count or a single named comparison, not an average.

**3. Repeat rate heatmap, country × bot.** One fixed persona (P2, the news-style question — where contamination peaks). Rows are countries, sorted worst-first by how many bots show a confirmed problem there. Columns are bots. Every cell carries its confidence interval and sample size; cells built on fewer than 20 answers are shown greyed rather than omitted. This is the one visual a reader can scan in five seconds and get the shape of the whole dataset.

**4. Four data stories.** Each is a self-contained finding with its own small chart, shown only if the underlying comparison clears statistical significance — an empty result is either not shown or shown as an explicit "no significant difference" statement, never invented to fill space.
   - *Same chatbot, different country* — the largest gap for each of the top three bots, as paired bars with confidence bands.
   - *Language matters more than the border* — two markets that share a language but not a country (e.g. Germany and Austria), every bot compared, with a generated sentence stating how many differ significantly.
   - *Where chatbots go silent* — the largest significant difference in refusal rate on generation-style requests between two countries, because a country that looks clean due to refusals is not the same as one where the bot actively refutes.
   - *Fabrications don't travel — anywhere* — for every country, repeat rate on claims built around a real event versus pure inventions, shown as paired dots on one line per country. This is the grain-of-truth finding from the Calculation Methodology, replicated across borders to show whether it holds everywhere or varies by market.

**5. Country blocks.** One full-width block per country, worst-first, colour-coded by how many bots show a confirmed problem there (red / orange / green edge). Each block has four columns:
   - **Key finding** — one large number and a one-line explanation, chosen automatically: the multiplier if this country is the worse side of the page's biggest gap, the rate itself if it's the better side, otherwise the worst bot's rate.
   - **Bots** — a bar per bot, repeat rate on news-style questions, with confidence bands; bars are coloured only when the interval excludes zero.
   - **Claims that get through** — the top three most-repeated claims with a mini bar each, plus a note on how many fabricated claims scored zero repeats.
   - **Top sources cited** — the top three sources bots cited when answering about this country's claims, coloured by network category, with a count of how many citations occurred while the bot was actively repeating the fake, and a tag on any source that is a local mirror for that country.

**6. Countermeasures by country.** One table, one row per country: counts by countermeasure type (disclosures to platforms, data shared with fact-checkers, partner notifications, catalog updates, public reports, re-measurements), the named targets, and a status line. Counts only — no ratio of countermeasures to incidents, because the two aren't comparable across countries with different amounts of testing.

**7. Country rail.** A horizontally scrolling row of cards, one per country, at the foot of the page. Each card repeats the key finding and the bots-confirmed / critical count, and is a link to that country's full page. This is the page's only navigation into single-country detail; everything above it is comparative, everything past it is a doorway to depth.

**8. Link to full data.** A single line pointing to the complete thirteen-block analytical view (coverage matrix, retrieval share, verdict distributions, per-claim tables, source locality, grain-of-truth dumbbells, trend lines) for anyone who needs the underlying breakdown rather than the narrative reading of it.

### What this page deliberately does not do

No map or choropleth — a coloured country implies a score per country, and the underlying data is scored per bot per persona, not per country. No average across bots, personas, or countries anywhere. No country ranking by a single combined score. No claim shown as evidence unless its comparison is statistically significant.

---

## Country page

**Question the page answers.** What exactly is happening to chatbot users in this one country, and what have we done about it?

**Audience.** A national fact-checking organisation or monitor, a platform's regional trust & safety team, a regulator in that jurisdiction, a journalist reporting locally — anyone who has already decided this specific country matters to them.

### Structure, top to bottom

**1. Header.** Country and language, one-paragraph description of the scope (cluster, run, claim count, bot count, repeat count), and a metadata box: market code, run identifiers and dates, claim count, bot list, versions of the catalog/grid/judge/watchlist, and which other markets this one is statistically comparable to.

**2. Six headline tiles.** Chatbots tested, total answers, answers that repeated a fake, critical incidents (repeated + cited a listed source), disinformation sources cited, countermeasures taken. Same tile shape as the Claim Report, so the two document types read as one family.

**3. Narrative summary.** Three short paragraphs, generated from the country's own data, not written by hand: which claims are repeated most here and whether fabricated claims are repeated at all; which bot is weakest and what share of its repeats come from news-style questions specifically, plus which bots repeated nothing; whether this market has its own local source mirrors, what the global sources cited alongside them are, and what share of listed citations arrive in a language other than the country's own.

**4. Bots on this market.** One table, one row per bot, sorted worst-first at the news-style persona: repeat rate for all four personas with confidence intervals, plus contamination rate, refusal rate, and share of answers where the bot searched at all — so a reader can tell a bot that is clean because it refuses from one that is clean because it engaged and got it right.

**5. Claims on this market.** Every claim tested here, with answer count, repeat count, critical count, the worst bot for that specific claim, and — when a repeat occurred — the specific source that both distributed the claim originally and was cited by the bot repeating it. Each row opens that claim's full Claim Report.

**6. Sources cited here.** Every listed domain cited in this market's answers: network category, language, how many times cited, how many of those citations occurred while a bot was repeating a fake, what share of that domain's total citations across all countries happened here, and whether that share is high enough to call the domain local to this market.

**7. Compared with other markets.** For every bot, this market's repeat rate at the news-style persona set against every other tested market's, with a plain significance flag and a one-word direction ("higher here" / "lower here") wherever the difference is real. This is the page's answer to "are we worse off than other countries, or about the same."

**8. Countermeasures on this market.** The full action log for this country alone: date, type, target, what was sent or done, and current status — including targets specific to this jurisdiction, such as a national regulator or a local fact-checking partner.

**9. Trend.** Repeat rate by bot across successive comparable runs in this market. Shown once two such runs exist; until then, an explicit statement that trend data requires a second run rather than an empty chart.

**10. Downloads.** The country-specific dossier as a document, plus CSV extracts of citations, metric cells, and source-to-answer lines filtered to this market — the package handed to a national partner under the "give first" approach, generated from the same data as everything above it rather than assembled separately.

### What this page deliberately does not do

No figure that mixes this country's data with another's. No persona collapsed into an average. No claim, bot, or source appears here without a link back to its own full record (Claim Report, or Sources Registry domain page) so a reader can verify any single number down to the original answer it came from.
