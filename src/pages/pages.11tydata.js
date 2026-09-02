// Shared by every page in src/pages/. A page declares pageKey; its H1, lead and
// prose come from content/en/{pageKey}.md so no sentence lives in a template.
const ROOTCRUMB = { title: "Home", url: "/" };

module.exports = {
  eleventyComputed: {
    doc: (data) => (data.docName ? data.copy.en[data.docName] : data.copy.en[data.pageKey]),
    h1: (data) => {
      const doc = data.docName ? data.copy.en[data.docName] : data.copy.en[data.pageKey];
      return (doc && doc.data && doc.data.h1) || data.h1;
    },
    breadcrumbTrail: (data) =>
      data.crumb ? [ROOTCRUMB, { title: data.crumb, url: data.page.url }] : [ROOTCRUMB]
  }
};
