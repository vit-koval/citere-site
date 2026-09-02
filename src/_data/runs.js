// Per-run aggregates computed from the observations in data/claims. Every
// figure is broken down by persona: nothing here is averaged across personas
// (CLAUDE.md 5.3). Where Citere later exports its own aggregates into
// data/platforms.json, the templates prefer those.
const claims = require("./claims.js");
const sourcesData = require("../_lib/markdown.cjs").readJson("data/sources.json");

const WATCHLIST = new Set(sourcesData.map((s) => s.domain));
const EVASIVE = "dodged";

function blank() {
  return { n: 0, repeated: 0, contextualised: 0, refuted: 0, dodged: 0, contaminated: 0 };
}

function tally(bucket, observation) {
  bucket.n += 1;
  bucket[observation.behaviour] += 1;
  if ((observation.cited_domains || []).some((d) => WATCHLIST.has(d))) bucket.contaminated += 1;
  return bucket;
}

function finish(bucket) {
  const nonEvasive = bucket.n - bucket[EVASIVE];
  return {
    ...bucket,
    nonEvasive,
    // Repeat-rate is repeated over non-evasive answers: a refusal is not a
    // correction, so dodged answers leave the denominator (methodology).
    repeatRate: nonEvasive > 0 ? bucket.repeated / nonEvasive : null,
    contaminationRate: bucket.n > 0 ? bucket.contaminated / bucket.n : null
  };
}

const observations = claims.flatMap((claim) =>
  (claim.observations || []).map((o) => ({ ...o, claim }))
);

function group(list, keyFn) {
  const out = new Map();
  for (const o of list) {
    const key = keyFn(o);
    if (!out.has(key)) out.set(key, blank());
    tally(out.get(key), o);
  }
  return [...out.entries()].map(([key, bucket]) => ({ key, ...finish(bucket) }));
}

const runs = {};
for (const o of observations) {
  if (!runs[o.run]) runs[o.run] = [];
  runs[o.run].push(o);
}

function summarise(list) {
  const dates = list.map((o) => o.date).sort();
  return {
    answers: list.length,
    claims: [...new Set(list.map((o) => o.claim.id))].length,
    chatbots: [...new Set(list.map((o) => o.chatbot))].sort(),
    countries: [...new Set(list.map((o) => o.country))].sort(),
    languages: [...new Set(list.map((o) => o.language))].sort(),
    personas: [...new Set(list.map((o) => o.persona))].sort(),
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    contaminated: list.filter((o) => (o.cited_domains || []).some((d) => WATCHLIST.has(d))).length,
    byChatbotPersona: group(list, (o) => `${o.chatbot}|${o.persona}`)
      .map((row) => {
        const [chatbot, persona] = row.key.split("|");
        return { ...row, chatbot, persona };
      })
      .sort((a, b) => a.chatbot.localeCompare(b.chatbot) || a.persona.localeCompare(b.persona)),
    byCountryPersona: group(list, (o) => `${o.country}|${o.persona}`)
      .map((row) => {
        const [country, persona] = row.key.split("|");
        return { ...row, country, persona };
      })
      .sort((a, b) => a.country.localeCompare(b.country) || a.persona.localeCompare(b.persona)),
    byChatbot: group(list, (o) => o.chatbot)
      .map((row) => ({ ...row, chatbot: row.key }))
      .sort((a, b) => a.chatbot.localeCompare(b.chatbot))
  };
}

const summariseRuns = (runIds) =>
  summarise(observations.filter((o) => runIds.includes(o.run)));

module.exports = {
  summariseRuns,
  byRun: Object.fromEntries(Object.entries(runs).map(([run, list]) => [run, summarise(list)])),
  all: summarise(observations),
  summarise
};
