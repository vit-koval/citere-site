# Assistant brand marks — how to add the real logos

## The legal position, briefly

Showing another company's logo to identify their product is **nominative fair use**. It is the
same principle that lets a review name the thing it reviews. It is allowed when three conditions
hold, and all three hold for Citere:

1. The product cannot reasonably be identified without the mark.
2. You use no more of the mark than needed — the mark itself, unaltered, not their fonts, layout
   or brand colours applied to your own pages.
3. Nothing suggests sponsorship, endorsement or affiliation.

Condition 3 is the one that matters most for you. Citere publishes measurements that are sometimes
unflattering to these companies. That is squarely legitimate — but it means the site must never
look like a partnership. Concretely:

- Never place vendor marks under a heading like "Our partners", "Trusted by" or "Powered by".
- Never link a mark to the vendor's site.
- Never combine a vendor mark with the Citere wordmark in a single lockup.
- Always render the trademark notice from `logos.json` in the footer of any page showing marks.

Several vendors publish binding guidelines. OpenAI's are the most explicit: don't alter the logo,
don't create your own lockup, don't pair the logomark with product or model names, and prefer the
black or white version for contrast. Read each brand page in `logos.json` before shipping.

## What I did not do, and why

I did not draw these logos. Recreating a mark from memory produces an inaccurate imitation — worse
legally than not using it, and worse visually too. Every mark must come from the vendor's own file.

## Two ways to get the real files

### A. Download them yourself (recommended)

Best for you: eight logos, a fixed list, no dependency, no attribution requirement, no API key,
nothing that can break in production.

For each assistant in `logos.json`, open its `brand_page`, download the official SVG (or PNG),
and save it to `src/assets/logos/` under exactly the `file` name given. That is the whole job —
about fifteen minutes. The template picks the file up automatically.

### B. Logo API (only if you later track many more products)

`logo.dev` is the usual Clearbit replacement: `https://img.logo.dev/openai.com?token=KEY`, with
a monogram fallback built in. The free tier requires a visible "Logos provided by Logo.dev" link
on every page that uses it; paid tiers remove that. Brandfetch is the main alternative and its
free tier does not require attribution.

For a fixed set of eight, this is unnecessary complication and adds a runtime dependency to a site
whose whole point is being static and self-contained. Use option A.

## What's in this package

| File | Goes to | What it does |
|---|---|---|
| `logos.json` | `data/logos.json` | One entry per assistant: monogram, brand colour, expected filename, brand page, and that vendor's usage rules. Also the trademark notice in EN and UK. |
| `bot-mark.njk` | `src/_includes/partials/bot-mark.njk` | Renders a mark as `<img>` when the file exists, monogram tile when it doesn't. Same dimensions either way. |
| `logos.css` | append to `src/css/site.css` | Sizing for the three mark sizes plus the white plate, stacked overlap, and the screen-reader name. |

## Install

```
cp logos.json            data/logos.json
cp bot-mark.njk          src/_includes/partials/bot-mark.njk
cat logos.css >>         src/css/site.css
mkdir -p src/assets/logos          # then drop the eight downloaded files in
```

Then tell Claude Code:

```
I added data/logos.json, partials/bot-mark.njk and logo styles. Add a `fileExists` Eleventy
filter that checks src/assets/, then replace every hardcoded monogram tile across the site with
the botMark macro — tables, rank rows, the homepage assistant strip, country cards and the
chatbot profile header. Render markNotice() in the footer on every page that shows marks. Real
logo files may not be present yet: the monogram fallback must render identically in size and
alignment, and check.mjs must not fail when src/assets/logos/ is empty.
```

## Accessibility note

`alt` text is the product name only — "Grok", not "Grok logo" and not "xAI". When the monogram
fallback renders, the tile is `aria-hidden` and the name is carried by a visually hidden span, so
a screen reader announces the same thing in both states.

## What must never get a logo

Watchlisted domains and influence networks are named in text, defanged, never linked, and never
given a mark — rendering a logo for them dignifies the infrastructure and creates a recognisable
asset for it.

Partner and attribution organisations (Viginum, DFRLab, NewsGuard, EU DisinfoLab, CPD, SPRAVDI)
are named in text with a link to the specific publication. Displaying a partner's logo implies
endorsement, so use their marks only with written permission — and if you get it, keep it on the
About page, never in the header.
