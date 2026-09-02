// The homepage blocks fill in as their data lands: the strip, metric cards,
// findings table, rankings, case study and markets grid each render only when
// the data behind them exists (CLAUDE.md 6, 11.6).
module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      claims: data.site.counters.claims,
      chatbots: data.site.counters.chatbots,
      languages: data.site.counters.languages
    }),
    quoteFigures: (data) => {
      const rows = (data.benchmarks && data.benchmarks.grain_of_truth) || [];
      const p1 = rows.find((r) => r.persona === "P1");
      return p1 ? { pure: 1 - p1.pure, grain: p1.with_grain } : null;
    },
    trustCards: (data) => [
      { key: "trust-method", href: "/methodology/", label: "Methodology", on: data.navigation.has.methodology },
      { key: "trust-data", href: "/data/", label: "Data", on: data.navigation.has.data },
      { key: "trust-actions", href: "/escalations/", label: "Escalations", on: data.navigation.has.escalations },
      { key: "trust-corrections", href: "/about/#corrections", label: "Corrections", on: data.navigation.has.about }
    ].map((c) => (c.on ? c : { ...c, href: null }))
  }
};
