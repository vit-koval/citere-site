const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    lang: (data) => data.entry.lang,
    claim: (data) => data.entry.item,
    // Claim prose is translated per claim; until content/uk carries it, the
    // page falls back to English and says so (CLAUDE.md 2).
    prose: (data) => data.entry.item.prose[data.entry.lang] || data.entry.item.prose.en,
    translationMissing: (data) => !data.entry.item.prose[data.entry.lang],
    title: (data) => meta.claim(data.entry.item, data.entry.lang).title,
    description: (data) => meta.claim(data.entry.item, data.entry.lang).description,
    articleHeadline: (data) => data.entry.item.title_en,
    articlePublished: (data) => data.entry.item.verdict_date,
    articleModified: (data) => data.entry.item.updated,
    updated: (data) => data.entry.item.updated,
    breadcrumbTrail: (data) => [
      { title: t(data.entry.lang, "crumb.home"), url: "/" },
      { title: t(data.entry.lang, "crumb.registry"), url: "/registry/" },
      { title: data.entry.item.id, url: data.entry.item.url }
    ],
    pageExports: (data) => [
      { label: "JSON", url: `/registry/${data.entry.item.slug}.json` },
      { label: "Markdown", url: `/registry/${data.entry.item.slug}.md` }
    ]
  }
};
