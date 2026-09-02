// security.txt must carry an expiry in the future; RFC 9116 recommends under a
// year. Recomputed on every build from the build date.
module.exports = {
  eleventyComputed: {
    securityExpires: () => {
      const d = new Date();
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      d.setUTCHours(0, 0, 0, 0);
      return d.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
  }
};
