const { fitTitle, fitDescription, listOf } = require("../_lib/meta.cjs");

const VERDICT = { false: "FALSE", misleading: "MISLEADING", unsupported: "UNSUPPORTED" };
const CHATBOTS = {
  chatgpt: "ChatGPT", gemini: "Gemini", grok: "Grok", claude: "Claude",
  copilot: "Copilot", perplexity: "Perplexity", deepseek: "DeepSeek", "le-chat": "Le Chat"
};
const region = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (c) => {
  try { return region.of(c.toUpperCase()) || c.toUpperCase(); } catch { return c.toUpperCase(); }
};

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`“${data.claim.title_en}”`),
    description: (data) => {
      const claim = data.claim;
      const bots = claim.repeatedBy.map((b) => CHATBOTS[b] || b);
      return fitDescription(
        [
          `${VERDICT[claim.verdict]}.`,
          bots.length
            ? `Repeated by ${listOf(bots)} in ${claim.counts.observations} recorded answers.`
            : `Recorded in ${claim.counts.observations} chatbot answers.`,
          `Tested in ${listOf(claim.countries.map(countryName))}.`,
          "Verdict, evidence, the domains cited and every action we took.",
          `Updated ${claim.updated}.`
        ],
        `claim ${claim.id}`
      );
    },
    articleHeadline: (data) => data.claim.title_en,
    articlePublished: (data) => data.claim.verdict_date,
    articleModified: (data) => data.claim.updated,
    updated: (data) => data.claim.updated,
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Registry", url: "/registry/" },
      { title: data.claim.id, url: data.claim.url }
    ],
    pageExports: (data) => [
      { label: "JSON", url: `/registry/${data.claim.slug}.json` },
      { label: "Markdown", url: `/registry/${data.claim.slug}.md` }
    ]
  }
};
