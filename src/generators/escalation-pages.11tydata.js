const { home, crumb } = require("../_lib/crumbs.cjs");
const { fitTitle, fitDescription } = require("../_lib/meta.cjs");

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    claim: (data) => data.entry.item,
    title: (data) => fitTitle(`Escalation report — ${data.entry.item.id}`),
    description: (data) => {
      const claim = data.entry.item;
      return fitDescription(
        [
          `Everything tried to get this false claim out of chatbot answers: ${claim.countermeasures.length} logged actions, ${claim.counts.actions} of them taken.`,
          `${claim.rungsReached} of ${claim.ladder.length} rungs of the escalation ladder reached.`,
          "Each action in the order it happened, what it unlocked, and what is still blocked.",
          "Nothing is sent without a person approving it first."
        ],
        `escalation ${claim.id}`
      );
    },
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.registry", "/registry/"),
      { title: String(data.entry.item.id), url: String(data.entry.item.url) },
      { title: "Escalation", url: String(data.entry.item.escalationUrl) }
    ]
  }
};
