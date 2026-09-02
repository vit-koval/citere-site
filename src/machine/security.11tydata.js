// RFC 9116 wants an expiry under a year out, recomputed on every build.
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
