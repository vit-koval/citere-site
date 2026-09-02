const { fitTitle, fitDescription } = require("../_lib/meta.cjs");
const { home, crumb } = require("../_lib/crumbs.cjs");

const HEADING = {
  en: {
    cluster: (f) => `False claims about Ukraine: ${f.label}`,
    country: (f) => `Russian disinformation in AI chatbot answers: ${f.label}`,
    language: (f) => `False claims found in AI chatbot answers in ${f.label}`,
    chatbot: (f) => `False claims about Ukraine repeated by ${f.label}`,
    verdict: (f) => `Claims we rated ${f.label}`
  },
  uk: {
    cluster: (f) => `Неправдиві твердження про Україну: ${f.label}`,
    country: (f) => `Російська дезінформація у відповідях чат-ботів: ${f.label}`,
    language: (f) => `Неправдиві твердження у відповідях чат-ботів (${f.label})`,
    chatbot: (f) => `Неправдиві твердження про Україну, які повторив ${f.label}`,
    verdict: (f) => `Твердження з вердиктом ${f.label}`
  }
};

const LEAD = {
  en: {
    cluster: (f) => `This cluster groups the claims that share one narrative: ${f.label}.`,
    country: (f) => `These are the claims we recorded in chatbot answers served to users in ${f.label}.`,
    language: (f) => `These are the claims we recorded in chatbot answers given in ${f.label}.`,
    chatbot: (f) => `These are the claims ${f.label} handled in our runs.`,
    verdict: (f) => `These are the claims we rated ${f.label}.`
  },
  uk: {
    cluster: (f) => `Цей кластер об'єднує твердження одного наративу: ${f.label}.`,
    country: (f) => `Це твердження, які ми зафіксували у відповідях чат-ботів для користувачів у країні ${f.label}.`,
    language: (f) => `Це твердження, які ми зафіксували у відповідях чат-ботів цією мовою: ${f.label}.`,
    chatbot: (f) => `Це твердження, з якими ${f.label} мав справу в наших прогонах.`,
    verdict: (f) => `Це твердження, яким ми дали вердикт ${f.label}.`
  }
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// Values reach eleventyComputed proxy-wrapped for dependency tracking, so a
// facet is copied into plain values before anything is used as an object key.
const plainFacet = (entry) => ({
  type: String(entry.item.type),
  label: String(entry.item.label),
  url: String(entry.item.url),
  claims: entry.item.claims,
  observations: Number(entry.item.observations),
  repeatedIn: Number(entry.item.repeatedIn),
  updated: String(entry.item.updated)
});

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    facet: (data) => data.entry.item,
    facetHeading: (data) => {
      const f = plainFacet(data.entry);
      return (HEADING[data.entry.lang] || HEADING.en)[f.type](f);
    },
    title: (data) => {
      const f = plainFacet(data.entry);
      return fitTitle(`${(HEADING[data.entry.lang] || HEADING.en)[f.type](f)} — Citere`);
    },
    facetIntro: (data) => {
      const f = plainFacet(data.entry);
      const lead = (LEAD[data.entry.lang] || LEAD.en)[f.type](f);
      if (data.entry.lang === "uk") {
        return `${lead} ${plural(f.claims.length, "твердження", "тверджень")}, ${plural(f.observations, "зафіксована відповідь", "зафіксованих відповідей")}, з них ${f.repeatedIn} повторив щонайменше один асистент.`;
      }
      return `${lead} ${plural(f.claims.length, "claim", "claims")}, ${plural(f.observations, "recorded answer", "recorded answers")}, and ${f.repeatedIn} of them repeated by at least one assistant. Each claim page carries the evidence, the sources cited and every action we took.`;
    },
    description: (data) => {
      const f = plainFacet(data.entry);
      const parts = data.entry.lang === "uk"
        ? [
            `${plural(f.claims.length, "задокументоване неправдиве твердження", "задокументованих неправдивих тверджень")} про Україну в цьому зрізі,`,
            `зафіксовано у ${plural(f.observations, "відповіді чат-бота", "відповідях чат-ботів")}.`,
            "Вердикт, докази, процитовані джерела і всі наші дії.",
            "Відкриті дані за ліцензією CC BY 4.0."
          ]
        : [
            `${plural(f.claims.length, "documented false claim", "documented false claims")} about Ukraine in this view,`,
            `recorded in ${plural(f.observations, "chatbot answer", "chatbot answers")}.`,
            "Verdict, evidence, the sources cited and every action we took.",
            "Open data under CC BY 4.0."
          ];
      return fitDescription(parts, `${f.url} (${data.entry.lang})`);
    },
    collectionItems: (data) => data.entry.item.claims.map((c) => ({ url: c.url, title: c.title_en })),
    breadcrumbTrail: (data) => [
      home(data.entry.lang),
      crumb(data.entry.lang, "crumb.registry", "/registry/"),
      { title: String(data.entry.item.label), url: String(data.entry.item.url) }
    ]
  }
};
