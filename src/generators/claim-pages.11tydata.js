const { home, crumb } = require("../_lib/crumbs.cjs");
const crumbLabel = (data) => String(data.entry.item.id);
const { fitTitle, fitDescription, listOf } = require("../_lib/meta.cjs");
const { VERDICTS, CHATBOTS } = require("../_lib/labels.cjs");

const region = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (c) => {
  try { return region.of(c.toUpperCase()) || c.toUpperCase(); } catch { return c.toUpperCase(); }
};

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    claim: (data) => data.entry.item,
    prose: (data) => data.copy.en.claims[data.entry.item.id],
    title: (data) => fitTitle(`“${data.entry.item.title_en}”`),
    description: (data) => {
      const claim = data.entry.item;
      // Values reach eleventyComputed proxy-wrapped for dependency tracking,
      // so coerce before using one as an object key.
      const bots = [...claim.repeatedBy].map((b) => (CHATBOTS[String(b)] || {}).name || String(b));
      return fitDescription(
        [
          `${VERDICTS[claim.verdict]}.`,
          bots.length
            ? `Repeated by ${listOf(bots)} in ${claim.counts.observations} recorded answers.`
            : `Recorded in ${claim.counts.observations} chatbot answers.`,
          `Tested in ${listOf([...claim.countries].map((c) => countryName(String(c))))}.`,
          "Verdict, evidence, the domains cited and every action we took.",
          `Updated ${claim.updated}.`
        ],
        `claim ${claim.id}`
      );
    },
    articleHeadline: (data) => data.entry.item.title_en,
    articlePublished: (data) => data.entry.item.verdict_date,
    articleModified: (data) => data.entry.item.updated,
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.registry", "/registry/"),
      { title: crumbLabel(data), url: String(data.entry.item.url || data.entry.url) }
    ]
  }
};
