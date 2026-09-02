# Citere website — handoff package

Everything Claude Code needs to build the real site. Nothing here is a draft: the design is approved,
the copy is written, the rules are decided.

## What's in this package

| Path | What it is | Status |
|---|---|---|
| `CLAUDE.md` | Master build instructions — stack, data schemas, URL map, checks, build order | **Read first** |
| `design-mockup/` | Approved 21-page static mockup, one shared `styles.css` | **Visual source of truth** |
| `docs/spec-pages.md` | Page-by-page structure and the reasoning behind each block | Reference |
| `docs/content.md` | Final copy, messaging rules, stop-word list, verdict/status dictionaries | Reference |

Open `design-mockup/index.html` in a browser to walk the whole site before writing any code.

## How to use it

1. Copy the four items above into the root of the `citere-site` repository.
2. Open Claude Code in that repository.
3. Give it this instruction:

```
Read CLAUDE.md fully, then open design-mockup/index.html and click through every page.
The mockup is the approved design — match it exactly; do not redesign.
Build steps 1 through 4 of section 13. Commit after each step and push to main.
Do not invent numbers: every figure must come from data/ per section 5.
```

4. When it finishes steps 1–4, review the local preview, then tell it to continue with 5–10.

## What already exists in the repo

The repository currently holds an earlier Eleventy build made from a previous version of these
instructions. That build predates the approved design and the Benchmarks section. Tell Claude Code
to treat `design-mockup/` and this `CLAUDE.md` as authoritative and to replace conflicting
templates and styles rather than merging them.

## The 21 pages

Home · Registry · Claim · **Benchmarks** · Chatbots (leaderboard) · Chatbot profile ·
Countries (leaderboard) · Country profile · Sources · Domain · Escalations · Reports · Report ·
Methodology · Data · About · Mission · Manifesto · Press & Media · Terms · Privacy

## Things that are easy to get wrong

- **Persona averaging.** No rate may ever be rendered without an attached persona. `check.mjs`
  enforces this and the build must fail if it is violated.
- **Path prefix.** GitHub Pages serves from a subpath. Every href and asset goes through Eleventy's
  `url` filter, and the Lighthouse step must build into its own directory so it cannot overwrite
  `_site/` with an unprefixed copy.
- **Empty blocks.** Sections with no data are omitted entirely — never rendered as placeholders.
  This applies to "What changed" on claim pages and "Our data is used by" on the homepage.
- **Blacklisted domains** appear defanged (`example[.]com`) and are never inside an `<a href>`.
- **Numbers in the mockup are illustrative.** They demonstrate layout, not findings. Real values come
  from the Citere export via `scripts/import-citere.mjs`.

## Still needed from Vit

Listed in `CLAUDE.md` §14: domain confirmation, legal entity details, team list, funding line,
the real facts for sample claim C1-003, and attribution URLs for Viginum / NewsGuard / DFRLab.
None of these block steps 1–4.
