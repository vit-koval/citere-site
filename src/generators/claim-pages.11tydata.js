const { fitTitle, fitDescription, listOf } = require("../_lib/meta.cjs");
const { VERDICTS, CHATBOTS } = require("../_lib/labels.cjs");

const region = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (c) => {
  try { return region.of(c.toUpperCase()) || c.toUpperCase(); } catch { return c.toUpperCase(); }
};

module.exports = {
  eleventyComputed: {
    prose: (data) => data.copy.en.claims[data.claim.id],
    title: (data) => fitTitle(`“${data.claim.title_en}”`),
    description: (data) => {
      const claim = data.claim;
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
    articleHeadline: (data) => data.claim.title_en,
    articlePublished: (data) => data.claim.verdict_date,
    articleModified: (data) => data.claim.updated,
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Registry", url: "/registry/" },
      { title: data.claim.id, url: data.claim.url }
    ]
  }
};
