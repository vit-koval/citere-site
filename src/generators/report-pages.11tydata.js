const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    prose: (data) => data.copy.en.reports[data.report.slug],
    title: (data) => fitTitle(`${data.report.title} — Citere`),
    description: (data) => {
      const r = data.report;
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
    articleHeadline: (data) => data.report.title,
    articlePublished: (data) => data.report.date,
    articleModified: (data) => data.report.date,
    updated: (data) => data.report.date,
    dataset: (data) => ({
      name: data.report.title,
      description: `Chatbot answers recorded for the ${data.report.period || data.report.date} Citere run.`,
      keywords: ["AI chatbots", "disinformation", "Ukraine", "monitoring"]
    }),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Reports", url: "/monitor/" },
      { title: data.report.period || data.report.slug, url: data.report.url }
    ]
  }
};
