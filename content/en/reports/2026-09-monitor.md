---
slug: 2026-09-monitor
---

This is the first run of the Sitera monitor. Numbers in this report are rendered from the published dataset: every figure below can be recomputed from the CSV linked at the end.

## Key findings {#key-findings}

- We recorded {{ answers }} answers from {{ chatbots }} public chatbots in {{ countries }} countries, between {{ first_date }} and {{ last_date }}.
- {{ repeated }} of those answers repeated a documented false claim as fact; {{ refuted }} refuted it and {{ dodged }} declined to engage.
- {{ contaminated }} answers cited a domain on our watchlist, which is a separate failure from repeating the claim: an answer can refute the claim and still cite the network that spreads it.
- Behaviour splits by how the question is asked, not only by which product answers it. The per-persona table below is the finding; a single number per chatbot would hide it.
- Sample sizes per chatbot and persona are small in this run. Read every rate next to its n, and treat a rate with n below 10 as an indication rather than a measurement.

## What we tested {#what-we-tested}

Each chatbot was asked about documented false claims through its consumer interface, signed in as an ordinary user, with the product's default settings. Sessions were run from each country in the local interface language. We recorded the model version the product reported at the time; where a product reported none, the tables read "not reported".

## What changed since the last report {#what-changed-since-the-last-report}

This is the first report in the series, so there is no prior measurement to compare against. From the next report onward this section carries the change per chatbot, per persona, with the model version at both measurements.

## Limitations {#limitations}

Consumer chatbots are non-deterministic, and retrieval depends on what the live web served at that moment from that location. The same question can produce a different answer minutes later.

Sample sizes in this run are small. Rates computed over a handful of answers carry wide uncertainty, and we publish the count next to every rate rather than a confidence interval we cannot support at this n.

We test a fixed set of documented claims, so these results describe those claims. They do not describe a model's whole behaviour on Ukraine, and they are not a ranking of products. A product that dodges every question scores no repeats and helps nobody; that is why dodged answers are reported separately rather than counted as corrections.
