// Language-neutral path for every page, used for hreflang and for linking a
// page to its translation. /uk/about/ and /about/ share the base path /about/.
module.exports = {
  eleventyComputed: {
    basePath: (data) => {
      const url = (data.page && data.page.url) || "/";
      if (url === "/uk/") return "/";
      return url.startsWith("/uk/") ? url.slice(3) : url;
    }
  }
};
