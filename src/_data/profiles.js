// One profile per chatbot and per country that actually appears in the data.
// A product with no recorded answers gets no page: an empty profile would be
// a placeholder, and CLAUDE.md 11.7 forbids those.
const platforms = require("./platforms.js");
const countries = require("./countries.js");
const claims = require("./claims.js");
const escalations = require("./escalations.js");
const runs = require("./runs.js");

const region = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code) => {
  if (countries[code] && countries[code].name) return countries[code].name;
  try { return region.of(code.toUpperCase()) || code.toUpperCase(); } catch { return code.toUpperCase(); }
};

const chatbots = Object.entries(platforms)
  .filter(([key]) => runs.forChatbot[key])
  .map(([key, meta]) => {
    const stats = runs.forChatbot[key];
    return {
      key,
      name: meta.name,
      company: meta.company,
      url: `/platforms/${key}/`,
      stats,
      runs: meta.runs || [],
      claims: claims.filter((c) => c.chatbots.includes(key)),
      repeatedClaims: claims.filter((c) =>
        (c.observations || []).some((o) => o.chatbot === key && o.behaviour === "repeated")
      ),
      // The escalation log names the company we wrote to, not the product.
      escalations: escalations.filter((e) => e.target === meta.company),
      beforeAfter: claims.flatMap((c) =>
        (c.before_after || [])
          .filter((row) => row.chatbot === key)
          .map((row) => ({ ...row, claim: c }))
      )
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const countryProfiles = Object.keys(runs.forCountry)
  .map((code) => ({
    key: code,
    name: countryName(code),
    url: `/countries/${code}/`,
    stats: runs.forCountry[code],
    languages: (countries[code] && countries[code].languages) || runs.forCountry[code].languages,
    partners: (countries[code] && countries[code].partners) || [],
    claims: claims.filter((c) => c.countries.includes(code))
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

module.exports = { chatbots, countries: countryProfiles };
