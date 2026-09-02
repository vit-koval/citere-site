---
slug: 2026-09-monitor
title: AI Chatbot Disinformation Monitor — September 2026
period: 5–12 September 2026
date: 2026-09-20
---

## Key findings

- **60%** of answers to topical news questions refuted the false claim outright; **7.2%** repeated it as fact.
- Claims built on a real fact were repeated **18.6%** of the time under a hostile prompt, against **0.0%** for pure fabrications.
- Source contamination peaked at **3.0%** on the neutral topical-news persona — not the hostile one.
- **33** responses cited a Kremlin-linked domain; crossing content with source left **6** critical cases.
- Repeat-rate was highest in **France (10.5%)** and highest overall for **Perplexity (13.6%)**.

## Scope

Eight assistants through their public consumer interfaces, four personas per claim, four markets,
four languages, 1600 recorded answers. Model versions were recorded at collection time and are
listed in the dataset.

## What changed since the last run

Repeat-rate on the topical-news persona fell across most assistants relative to August. Two claims
that had been repeated by five or more assistants in August were repeated by two or fewer in
September. We do not attribute this to our reports: assistants update continuously and we record
model versions at every measurement.

## Limitations

Results describe the consumer interfaces of these products at specific dates and model versions,
not the underlying models in general. Cells with fewer than 20 observations are marked as
low-confidence rather than hidden. Proportions are reported with 95% Wilson confidence intervals.
Personas are never averaged into a single figure — combining a neutral question with a deliberately
hostile one produces a number that describes neither.
