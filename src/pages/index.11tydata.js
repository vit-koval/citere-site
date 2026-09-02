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
    // The cluster tiles and country cards on the homepage, from the claims
    // that actually exist. Countries link out only once /countries/ is built.
    clusterTiles: (data) => {
      const counts = new Map();
      for (const claim of data.claims) {
        counts.set(claim.cluster, (counts.get(claim.cluster) || 0) + 1);
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          name: (data.clusters[key] && data.clusters[key].name_en) || key,
          count,
          url: `/registry/cluster/${key}/`
        }));
    },
    countryCards: (data) => {
      if (!data.navigation.has.countries) return [];
      const rows = new Map();
      for (const claim of data.claims) {
        for (const iso of claim.countries) {
          if (!rows.has(iso)) rows.set(iso, { iso, claims: 0, answers: 0, bots: new Set(), langs: new Set() });
          const row = rows.get(iso);
          row.claims += 1;
          for (const o of claim.observations || []) {
            if (o.country !== iso) continue;
            row.answers += 1;
            row.bots.add(o.chatbot);
            row.langs.add(o.language);
          }
        }
      }
      return [...rows.values()].sort((a, b) => b.claims - a.claims).slice(0, 4);
    },
    trustCards: (data) => [
      { key: "trust-method", href: "/methodology/", label: "Methodology", on: data.navigation.has.methodology },
      { key: "trust-data", href: "/data/", label: "Data", on: data.navigation.has.data },
      { key: "trust-actions", href: "/escalations/", label: "Escalations", on: data.navigation.has.escalations },
      { key: "trust-corrections", href: "/about/#corrections", label: "Corrections", on: data.navigation.has.about }
    ].map((c) => (c.on ? c : { ...c, href: null }))
  }
};
