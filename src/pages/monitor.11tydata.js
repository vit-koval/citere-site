const { fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    title: "Monthly monitor: AI chatbots and Ukraine",
    description: (data) =>
      fitDescription(
        [
          "How eight public AI chatbots handled documented false claims about Ukraine, month by month:",
          "behaviour and cited sources per chatbot, country and question type.",
          `${data.reports.length} ${data.reports.length === 1 ? "report" : "reports"}, with open data.`
        ],
        "/monitor/"
      )
  }
};
