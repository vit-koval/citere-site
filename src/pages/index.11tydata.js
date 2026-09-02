// The homepage blocks fill in as their data lands: the strip, metric cards,
// findings table, rankings, case study and markets grid each render only when
// the data behind them exists (CLAUDE.md 6, 11.6).
module.exports = {
  eleventyComputed: {
    figures: (data) => ({
      claims: `${data.site.counters.claims} documented false ${data.site.counters.claims === 1 ? "claim" : "claims"}`,
      chatbots: data.site.counters.chatbots,
      languages: data.site.counters.languages
    }),
    quoteFigures: (data) => data.benchmarks.headline || null,
    // The four metric cards. A card appears only once its counter has a
    // source: domains and reports arrive with sources and escalations.
    metricCards: (data) => {
      const c = data.site.counters;
      const b = data.benchmarks;
      const cards = [];
      if (c.claims) {
        cards.push({ value: c.claims, label: `false ${c.claims === 1 ? "claim" : "claims"} documented`,
          sub: `${c.clusters} ${c.clusters === 1 ? "cluster" : "clusters"}` });
      }
      if (b.responses || c.responses) {
        cards.push({ value: b.responses || c.responses, label: "chatbot answers analysed",
          sub: `${c.chatbots} assistants · ${c.personas} personas` });
      }
      if (c.domains) {
        cards.push({ value: c.domains, label: "Kremlin-linked domains seen",
          sub: `watchlist ${data.site.watchlist_version}` });
      }
      if (c.escalations_sent) {
        cards.push({ value: c.escalations_sent, label: "reports sent to platforms",
          sub: `${c.escalations_answered} answered · ${c.escalations_actioned} actioned` });
      }
      return cards;
    },
    rankingCards: (data) => {
      const lb = data.benchmarks.leaderboards || {};
      const cards = [];
      if ((lb.chatbot_repeat || []).length) {
        cards.push({ rows: lb.chatbot_repeat, title: "Chatbots by repeat-rate", sub: "P2 · topical news",
          idx: true, bar: true, more: data.navigation.has.chatbots ? "/platforms/" : "/benchmarks/",
          moreLabel: "All chatbots" });
      }
      if ((lb.most_repeated_claims || []).length) {
        cards.push({ rows: lb.most_repeated_claims, title: "Most-repeated claims", sub: "all runs",
          idx: true, bar: false, more: "/registry/", moreLabel: "Full registry" });
      }
      if ((lb.biggest_change || []).length) {
        cards.push({ rows: lb.biggest_change, title: "Before / after", sub: "after we reported",
          idx: false, bar: false, more: "/methodology/", moreLabel: "How we measure change" });
      }
      const contamination = (data.benchmarks.contamination_by_persona || []).map((r) => ({
        key: r.persona, label: `${r.persona} · ${{ P1: "verification", P2: "topical news", P3: "leading question", P4: "hostile request" }[r.persona]}`,
        value: r.rate, persona: r.persona
      }));
      if (contamination.length) {
        const max = contamination.reduce((m, r) => Math.max(m, r.value), 0);
        cards.push({
          rows: contamination.map((r) => ({ ...r, width: Math.max(2, Math.round((r.value / max) * 100)) })),
          title: "Where contamination enters", sub: "by question type",
          idx: true, bar: true, more: "/methodology/", moreLabel: "Why this matters"
        });
      }
      return cards;
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
