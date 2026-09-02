const { readJson } = require("../_lib/markdown.cjs");

module.exports = readJson("data/platforms.json").platforms || {};
