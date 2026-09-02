// Every generated page, once per language. Eleventy paginates one dimension at
// a time, so the language dimension is folded in here.
const build = require("./build.js");
const claims = require("./claims.js");
const facets = require("./facets.js");
const sources = require("./sources.js");
const profiles = require("./profiles.js");
const reports = require("./reports.js");

const expand = (items, urlOf) =>
  build.languages.flatMap((lang) =>
    items.map((item) => ({ lang, item, url: lang === "en" ? urlOf(item) : `/${lang}${urlOf(item)}` }))
  );

module.exports = {
  languages: build.languages,
  claims: expand(claims, (c) => c.url),
  facets: expand(facets, (f) => f.url),
  sources: expand(sources, (s) => s.url),
  chatbots: expand(profiles.chatbots, (p) => p.url),
  countries: expand(profiles.countries, (p) => p.url),
  reports: expand(reports, (r) => r.url)
};
