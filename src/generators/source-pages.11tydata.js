const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

const NETWORKS = {
  pravda: "Pravda", doppelganger: "Doppelganger", matryoshka: "Matryoshka",
  "storm-1516": "Storm-1516", "state-media": "state media", other: "other"
};

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`${data.source.defanged} — a domain cited by AI chatbots`),
    description: (data) => {
      const s = data.source;
      return fitDescription(
        [
          `${s.defanged} is on the Sitera watchlist as part of the ${NETWORKS[s.network]} network.`,
          `Recorded in ${s.citedCount} documented ${s.citedCount === 1 ? "claim" : "claims"} since ${s.first_seen}.`,
          "Attribution, the answers that cited it, and the complaints we filed.",
          "Open data under CC BY 4.0."
        ],
        s.url
      );
    },
    updated: (data) => data.site.last_update,
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Sources", url: "/sources/" },
      { title: data.source.defanged, url: data.source.url }
    ]
  }
};
