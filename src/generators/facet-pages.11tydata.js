const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

const HEADING = {
  cluster: (f) => `False claims about Ukraine: ${f.label}`,
  country: (f) => `Russian disinformation in AI chatbot answers: ${f.label}`,
  language: (f) => `False claims found in AI chatbot answers in ${f.label}`,
  chatbot: (f) => `False claims about Ukraine repeated by ${f.label}`,
  verdict: (f) => `Claims we rated ${f.label}`
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

module.exports = {
  eleventyComputed: {
    facetHeading: (data) => HEADING[data.facet.type](data.facet),
    title: (data) => fitTitle(HEADING[data.facet.type](data.facet)),
    description: (data) => {
      const f = data.facet;
      return fitDescription(
        [
          `${plural(f.claims.length, "documented false claim", "documented false claims")} about Ukraine in this view,`,
          `recorded in ${plural(f.observations, "chatbot answer", "chatbot answers")}.`,
          "Verdict, evidence, the sources cited and every action we took.",
          "Open data under CC BY 4.0."
        ],
        f.url
      );
    },
    facetIntro: (data) => {
      const f = data.facet;
      const lead = {
        cluster: `This cluster groups the claims that share one narrative: ${f.label}.`,
        country: `These are the claims we recorded in chatbot answers served to users in ${f.label}.`,
        language: `These are the claims we recorded in chatbot answers given in ${f.label}.`,
        chatbot: `These are the claims ${f.label} handled in our runs.`,
        verdict: `These are the claims we rated ${f.label}.`
      }[f.type];
      return `${lead} ${plural(f.claims.length, "claim", "claims")}, ${plural(f.observations, "recorded answer", "recorded answers")}, and ${f.repeatedIn} of them repeated by at least one chatbot. Each claim page carries the evidence, the sources cited and every action we took.`;
    },
    updated: (data) => data.facet.updated,
    collectionItems: (data) => data.facet.claims.map((c) => ({ url: c.url, title: c.title_en })),
    breadcrumbTrail: (data) => [
      { title: "Home", url: "/" },
      { title: "Registry", url: "/registry/" },
      { title: data.facet.label, url: data.facet.url }
    ]
  }
};
