const { home, crumb } = require("../_lib/crumbs.cjs");
const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

const plain = (entry) => ({
  type: String(entry.item.type),
  label: String(entry.item.label),
  url: String(entry.item.url),
  actions: entry.item.actions,
  taken: Number(entry.item.taken),
  awaiting: Number(entry.item.awaiting)
});

const HEADING = {
  type: (f) => `Countermeasures: ${f.label}`,
  status: (f) => `Countermeasures currently ${f.label.toLowerCase()}`,
  target: (f) => `Countermeasures addressed to ${f.label}`,
  market: (f) => `Countermeasures for ${f.label}`,
  claim: (f) => `Countermeasures on claim ${f.label}`
};

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    activeFacet: (data) => data.entry.item,
    facetHeading: (data) => HEADING[plain(data.entry).type](plain(data.entry)),
    title: (data) => fitTitle(`${HEADING[plain(data.entry).type](plain(data.entry))} — Citere`),
    description: (data) => {
      const f = plain(data.entry);
      return fitDescription(
        [
          `${f.actions.length} logged ${f.actions.length === 1 ? "action" : "actions"} in this view, of which ${f.taken} have been taken.`,
          `${f.awaiting} are drafted and waiting for a person to approve them; nothing is sent without that.`,
          "The fact, the date, the target and the status of each countermeasure.",
          "Submission content and proof are never published."
        ],
        f.url
      );
    },
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.countermeasures", "/countermeasures/"),
      { title: String(data.entry.item.label), url: String(data.entry.item.url) }
    ]
  }
};
