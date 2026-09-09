// Per-assistant and per-market profiles: filtered and arranged views of the
// metrics store, never arithmetic on a page (brief §2 "Metrics store").
//
// Every figure here names one persona and one market. A bot's headline number
// is its worst market at P2, with that market printed next to it - there is no
// figure for "this bot overall", because pooling markets is not permitted
// (Calculation Methodology §5.1).
const platforms = require("./platforms.js");
const countriesData = require("./countries.js");
const claims = require("./claims.js");
const countermeasures = require("./countermeasures.js");
const metrics = require("./metrics.js");
const runs = require("./runs.js");
const { CHATBOTS } = require("../_lib/labels.cjs");

const HEADLINE = "P2"; // the news-style question, where contamination peaks
const personas = metrics.dimensions.personas || [];
const marketKeys = runs.markets;

const marketMeta = (market) => {
  const run = runs.current[market];
  const country = countriesData[run.country] || {};
  return { market, run, country: run.country, language: run.language, name: country.name || run.country };
};

function botMarkets(key) {
  return marketKeys.map((market) => {
    const info = marketMeta(market);
    const where = { chatbot: key, run: info.run.key, is_live: false };
    const rows = personas.map((persona) => ({
      persona,
      ...metrics.poolOf({ ...where, persona })
    }));
    return { ...info, personas: rows, headline: rows.find((r) => r.persona === HEADLINE) };
  });
}

const chatbots = Object.entries(platforms).map(([key, meta]) => {
  const markets = botMarkets(key);
  const ranked = markets
    .filter((m) => m.headline && m.headline.repeat_rate && !m.headline.repeat_rate.low_n)
    .sort((a, b) => b.headline.repeat_rate.rate - a.headline.repeat_rate.rate);
  const worst = ranked[0] || null;
  const repeatedClaims = claims.filter((c) =>
    c.cells.some((cell) => cell.chatbot === key && cell.counts.repeat > 0));
  // A trend needs two comparable runs in one market (CM §6.1).
  const trend = marketKeys.flatMap((market) => {
    const list = (runs.byMarket[market] || [])
      .filter((r) => r.comparable_with.length)
      .sort((a, b) => a.collected_at.localeCompare(b.collected_at));
    if (list.length < 2) return [];
    const points = list.map((run) => ({
      run, ...metrics.poolOf({ chatbot: key, run: run.key, persona: HEADLINE, is_live: false })
    }));
    return [{
      market, points,
      change: metrics.compare(points[0], points[points.length - 1])
    }];
  });
  return {
    key,
    name: meta.name || (CHATBOTS[key] || {}).name || key,
    company: meta.company,
    url: `/platforms/${key}/`,
    modelVersions: meta.model_versions || [],
    persona: HEADLINE,
    markets,
    worst,
    repeatedClaims,
    claimsRepeated: repeatedClaims.length,
    // The countermeasures log names the company we wrote to.
    countermeasures: countermeasures.actions.filter((e) => e.target && e.target.includes(meta.company)),
    trend
  };
}).sort((a, b) => {
  const x = a.worst && a.worst.headline.repeat_rate.rate;
  const y = b.worst && b.worst.headline.repeat_rate.rate;
  return (y === undefined || y === null ? -1 : y) - (x === undefined || x === null ? -1 : x);
});

const countries = marketKeys.map((market) => {
  const info = marketMeta(market);
  const meta = countriesData[info.country] || {};
  const bots = chatbots.map((bot) => {
    const row = bot.markets.find((m) => m.market === market);
    return { key: bot.key, name: bot.name, url: bot.url, ...row.headline };
  }).sort((a, b) => (b.repeat_rate.rate || 0) - (a.repeat_rate.rate || 0));
  return {
    key: info.country,
    market,
    name: meta.name || info.country,
    url: `/countries/${info.country}/`,
    language: info.language,
    partners: meta.partners || [],
    note: meta.note_en,
    run: info.run,
    persona: HEADLINE,
    // The number of bots whose interval excludes zero here: a count, not a
    // score for the country (Countries Index Business Logic §2).
    confirmed: bots.filter((b) => b.repeat_rate.ci && b.repeat_rate.ci[0] > 0 && !b.repeat_rate.low_n).length,
    critical: metrics.poolOf({ run: info.run.key, is_live: false }).tiers.critical,
    bots,
    worst: bots[0] || null,
    claims: claims.filter((c) => c.markets.includes(market))
  };
}).sort((a, b) => b.confirmed - a.confirmed || (b.worst.repeat_rate.rate || 0) - (a.worst.repeat_rate.rate || 0));

// bot x market grid at one persona, for the countries index heatmap.
const matrix = {
  persona: HEADLINE,
  chatbots: chatbots.map((c) => c.key),
  markets: countries.map((c) => c.market),
  rows: chatbots.map((bot) => ({
    chatbot: bot.key,
    name: bot.name,
    cells: countries.map((country) => bot.markets.find((m) => m.market === country.market).headline)
  }))
};

module.exports = { chatbots, countries, matrix, persona: HEADLINE };
