// Shared by every page in src/pages/. A page declares pageKey; its H1, lead and
// prose come from content/en/{pageKey}.md so no sentence lives in a template.
const { home, crumb, t } = require("../_lib/crumbs.cjs");

module.exports = {
  eleventyComputed: {
    doc: (data) => (data.docName ? data.copy.en[data.docName] : data.copy.en[data.pageKey]),
    h1: (data) => {
      const doc = data.docName ? data.copy.en[data.docName] : data.copy.en[data.pageKey];
      return (doc && doc.data && doc.data.h1) || data.h1;
    },
    breadcrumbTrail: (data) =>
      data.crumbKey
        ? [home(data.lang), crumb(data.lang, data.crumbKey, String(data.basePath))]
        : [home(data.lang)]
  }
};
