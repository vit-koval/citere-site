const { CHATBOTS } = require("../_lib/labels.cjs");

module.exports = {
  eleventyComputed: {
    figures: (data) => {
      const b = data.benchmarks;
      const markets = new Set((b.leaderboards.country_repeat || []).map((r) => r.key));
      return {
        label: b.label || "",
        responses: b.responses || 0,
        chatbots: new Set((b.heatmap || []).map((r) => r.chatbot)).size || Object.keys(CHATBOTS).length,
        markets: markets.size
      };
    },
    leaderboardCards: (data) => [
      { key: "chatbot_repeat", title: "Chatbots by repeat-rate", sub: "P2 · topical news",
        idx: true, bar: true, more: data.navigation.has.chatbots ? "/platforms/" : null,
        moreLabel: `All ${Object.keys(CHATBOTS).length} chatbots` },
      { key: "chatbot_contamination", title: "Chatbots by contamination", sub: "flagged domain cited, all personas",
        idx: true, bar: true, more: data.navigation.has.sources ? "/sources/" : null, moreLabel: "Which domains" },
      { key: "country_repeat", title: "Countries by repeat-rate", sub: "all personas pooled",
        idx: true, bar: true, flag: true, more: data.navigation.has.countries ? "/countries/" : null,
        moreLabel: "All countries" },
      { key: "cluster_repeat", title: "Clusters by repeat-rate", sub: "all personas pooled",
        idx: true, bar: true, more: "/registry/", moreLabel: "Browse by cluster" },
      { key: "most_repeated_claims", title: "Most-repeated claims", sub: "all runs, all personas pooled",
        idx: true, bar: false, more: "/registry/", moreLabel: "Full registry" },
      { key: "biggest_change", title: "Biggest change after we reported", sub: "P2 · before → after",
        idx: false, bar: false, more: data.navigation.has.escalations ? "/escalations/" : null,
        moreLabel: "Escalation log" }
    ],
    // The dumbbell takes two series; grain-of-truth compares blended claims
    // against pure fabrications, contamination plots a single series.
    grainRows: (data) =>
      (data.benchmarks.grain_of_truth || []).map((r) => ({
        persona: r.persona, a: r.with_grain, b: r.pure
      })),
    grainMax: (data) =>
      (data.benchmarks.grain_of_truth || []).reduce(
        (m, r) => Math.max(m, r.with_grain, r.pure), 0) || 1,
    contaminationRows: (data) =>
      (data.benchmarks.contamination_by_persona || []).map((r) => ({
        persona: r.persona, a: r.rate, b: null
      })),
    contaminationMax: (data) =>
      (data.benchmarks.contamination_by_persona || []).reduce((m, r) => Math.max(m, r.rate), 0) || 1,
    funnelFlagged: (data) => {
      const step = (data.benchmarks.funnel || []).find((s) => /flag/i.test(s.label));
      return step ? step.n : 0;
    },
    dataset: (data) => ({
      name: "Citere benchmarks",
      description:
        "Repeat-rate and source-contamination figures per assistant, question type, country and narrative cluster, for the current run.",
      keywords: ["benchmarks", "AI chatbots", "disinformation", "Ukraine"],
      temporalCoverage: data.benchmarks.date
    })
  }
};
