// Precomputed benchmark figures. Nothing here is derived at build time beyond
// presentation helpers: the import script does the arithmetic (CLAUDE.md 5.2).
const { readJson } = require("../_lib/markdown.cjs");
const { CHATBOTS } = require("../_lib/labels.cjs");
const clusters = require("./clusters.js");

const raw = readJson("data/benchmarks.json");
const region = new Intl.DisplayNames(["en"], { type: "region" });
const safeRegion = (v) => { try { return region.of(v.toUpperCase()) || v; } catch { return v; } };

// Heatmap tints, matched to the mockup's lv0..lv4 buckets.
const level = (rate) => {
  if (!rate) return "lv0";
  if (rate < 0.085) return "lv1";
  if (rate < 0.12) return "lv2";
  if (rate < 0.18) return "lv3";
  return "lv4";
};

const label = (type, key, given) => {
  if (CHATBOTS[key]) return CHATBOTS[key].name;
  if (type === "country_repeat") return safeRegion(key);
  if (clusters[key] && clusters[key].name_en) return clusters[key].name_en;
  if (given && given !== key) return given;
  return key;
};

const leaderboards = {};
for (const [name, rows] of Object.entries(raw.leaderboards || {})) {
  const max = rows.reduce((m, r) => Math.max(m, Math.abs(r.value)), 0);
  leaderboards[name] = rows.map((row) => ({
    ...row,
    label: label(name, row.key, row.label),
    width: max ? Math.max(2, Math.round((Math.abs(row.value) / max) * 100)) : 0
  }));
}

const personas = ["P1", "P2", "P3", "P4"];
const byBot = new Map();
for (const cell of raw.heatmap || []) {
  if (!byBot.has(cell.chatbot)) byBot.set(cell.chatbot, {});
  byBot.get(cell.chatbot)[cell.persona] = { ...cell, level: level(cell.rate) };
}
const heatmapRows = [...byBot.entries()].map(([chatbot, cells]) => ({
  chatbot,
  cells: personas.map((p) => cells[p]).filter(Boolean)
}));

module.exports = {
  ...raw,
  // "run 2" in the mockup caption; taken from the label the import writes.
  stripCaption: raw.completed_run_label || raw.label || "",
  countries: raw.in_progress_countries || [],
  leaderboards,
  heatmapRows,
  personas,
  // The strip across the top of the homepage: every assistant we test.
  strip: (leaderboards.chatbot_repeat || []).slice().sort(
    (a, b) => Object.keys(CHATBOTS).indexOf(a.key) - Object.keys(CHATBOTS).indexOf(b.key)
  )
};
