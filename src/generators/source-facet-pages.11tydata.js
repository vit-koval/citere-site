const { home, crumb } = require("../_lib/crumbs.cjs");
const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

const plain = (entry) => ({
  type: String(entry.item.type),
  label: String(entry.item.label),
  url: String(entry.item.url),
  sources: entry.item.sources,
  citations: Number(entry.item.citations),
  critical: Number(entry.item.critical)
});

const HEADING = {
  network: (f) => `Domains of the ${f.label} network cited by AI chatbots`,
  category: (f) => `Watchlisted ${f.label} domains cited by AI chatbots`,
  chatbot: (f) => `Watchlisted domains cited by ${f.label}`,
  market: (f) => `Watchlisted domains cited in ${f.label} answers`,
  flag: (f) => `Watchlisted domains ${f.label}`
};

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    activeFacet: (data) => data.entry.item,
    facetHeading: (data) => HEADING[plain(data.entry).type](plain(data.entry)),
    title: (data) => fitTitle(`${HEADING[plain(data.entry).type](plain(data.entry))} — Citere`),
    description: (data) => {
      const f = plain(data.entry);
      return fitDescription(
        [
          `${f.sources.length} watchlisted ${f.sources.length === 1 ? "domain" : "domains"} in this view, cited ${f.citations} times in recorded chatbot answers.`,
          `${f.critical} of those citations came in an answer that repeated a documented false claim.`,
          "Attribution, the claims involved and the countermeasures filed.",
          "Open data under CC BY 4.0."
        ],
        f.url
      );
    },
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.sources", "/sources/"),
      { title: String(data.entry.item.label), url: String(data.entry.item.url) }
    ]
  }
};
