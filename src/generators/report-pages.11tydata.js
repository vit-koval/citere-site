const { fitTitle, fitDescription } = require("../_lib/meta.cjs");
const { home, crumb } = require("../_lib/crumbs.cjs");

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    report: (data) => data.entry.item,
    prose: (data) => data.copy.en.reports[data.entry.item.slug],
    title: (data) => fitTitle(`${data.entry.item.title} — Citere`),
    description: (data) => {
      const r = data.entry.item;
      return fitDescription(
        [
          `${r.title}:`,
          `${r.n_responses} responses from ${r.chatbots.length} public AI assistants in ${r.countries.length} markets,`,
          "scored per persona against documented false claims about Ukraine.",
          "Findings, results by assistant, limitations.",
          "Open data."
        ],
        r.url
      );
    },
    articleHeadline: (data) => data.entry.item.title,
    articlePublished: (data) => data.entry.item.date,
    articleModified: (data) => data.entry.item.date,
    updated: (data) => data.entry.item.date,
    dataset: (data) => ({
      name: data.entry.item.title,
      description: `Chatbot answers recorded for the ${data.entry.item.period || data.entry.item.date} Citere run.`,
      keywords: ["AI chatbots", "disinformation", "Ukraine", "monitoring"]
    }),
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.reports", "/monitor/"),
      { title: data.entry.item.period || data.entry.item.slug, url: data.entry.item.url }
    ]
  }
};
