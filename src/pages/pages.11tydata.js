// Shared for every page in src/pages/. Each template declares pageKey and its
// breadcrumb chain; title, description, H1 and crumbs come from the bilingual
// strings so a page cannot drift between languages.
const meta = require("../_lib/meta-strings.cjs");
const ui = require("../_data/ui.js");

const t = (lang, key) => ((ui[lang] || ui.en)[key] ?? ui.en[key]);

module.exports = {
  eleventyComputed: {
    title: (data) => (data.pageKey ? meta.page(data.pageKey, data.lang).title : data.title),
    description: (data) => (data.pageKey ? meta.page(data.pageKey, data.lang).description : data.description),
    h1: (data) => (data.pageKey ? meta.page(data.pageKey, data.lang).h1 : data.h1),
    breadcrumbTrail: (data) => [
      { title: t(data.lang, "crumb.home"), url: "/" },
      ...(data.crumbs || []).map((crumb) => ({ title: t(data.lang, crumb.key), url: crumb.url }))
    ],
    doc: (data) => {
      const name = data.docName || data.pageKey;
      const copy = data.copy || {};
      return (copy[data.lang] && copy[data.lang][name]) || copy.en[name];
    },
    translationMissing: (data) => {
      const name = data.docName || data.pageKey;
      const copy = data.copy || {};
      return !(copy[data.lang] && copy[data.lang][name]);
    }
  }
};
