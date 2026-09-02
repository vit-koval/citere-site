const { fitTitle, fitDescription } = require("../_lib/meta.cjs");
const { NETWORK_NAMES } = require("../_lib/labels.cjs");

module.exports = {
  eleventyComputed: {
    title: (data) => fitTitle(`${data.source.defanged} — a domain cited by AI chatbots`),
    description: (data) => {
      const s = data.source;
      return fitDescription(
        [
          `${s.defanged} is on the Citere watchlist as part of the ${NETWORK_NAMES[s.network] || s.network} network.`,
          `Cited ${s.citedCount} times in recorded chatbot answers since ${s.first_seen}.`,
          "Attribution, the claims involved and the complaints we filed.",
          "Open data under CC BY 4.0."
        ],
        s.url
      );
    },
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Sources", url: "/sources/" },
      { title: data.source.defanged, url: data.source.url }
    ]
  }
};
