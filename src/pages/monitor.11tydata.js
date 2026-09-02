module.exports = {
  eleventyComputed: {
    // First key finding of each report, as its card summary. Prose, from
    // content/, never retyped here.
    reportLead: (data) => {
      const out = {};
      for (const r of data.reports) {
        const doc = data.copy.en.reports[r.slug];
        const findings = doc && doc.sections && doc.sections["key-findings"];
        if (!findings) continue;
        const first = (findings.text || "").split("\n").find((l) => l.trim().startsWith("-"));
        if (first) out[r.slug] = first.replace(/^[-\s]+/, "").replace(/\*\*/g, "");
      }
      return out;
    }
  }
};
