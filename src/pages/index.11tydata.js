// ItemList is emitted only when there are claims to list: never mark up
// content that is not on the page (CLAUDE.md section 7).
module.exports = {
  eleventyComputed: {
    listedClaims: (data) => (data.claims || []).slice(0, 5),
    schemas: (data) => ((data.claims || []).length ? ["itemlist"] : [])
  }
};
