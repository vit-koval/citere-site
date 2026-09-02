#!/usr/bin/env node
// JSON Schema validation for everything under /data. Run before every build.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = new URL("..", import.meta.url).pathname;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const schema = (name) => ajv.compile(read(`schemas/${name}.schema.json`));

const errors = [];

function validate(label, validator, value) {
  if (!validator(value)) {
    for (const e of validator.errors) {
      errors.push(`${label}: ${e.instancePath || "/"} ${e.message}`);
    }
  }
}

validate("data/site.json", schema("site"), read("data/site.json"));
validate("data/sources.json", schema("sources"), read("data/sources.json"));
validate("data/platforms.json", schema("platforms"), read("data/platforms.json"));
validate("data/countries.json", schema("countries"), read("data/countries.json"));
validate("data/clusters.json", schema("clusters"), read("data/clusters.json"));
validate("data/escalations.json", schema("escalations"), read("data/escalations.json"));
validate("data/reports.json", schema("reports"), read("data/reports.json"));

const claimSchema = schema("claim");
const claimDir = join(ROOT, "data/claims");
const claimFiles = existsSync(claimDir) ? readdirSync(claimDir).filter((f) => f.endsWith(".json")) : [];
const clusters = read("data/clusters.json");
const seenSlugs = new Map();
const claimIds = new Set();

for (const file of claimFiles) {
  const claim = read(`data/claims/${file}`);
  validate(`data/claims/${file}`, claimSchema, claim);
  if (claim.id && `${claim.id}.json` !== file) {
    errors.push(`data/claims/${file}: id "${claim.id}" does not match filename`);
  }
  if (claim.slug) {
    if (seenSlugs.has(claim.slug)) {
      errors.push(`data/claims/${file}: slug "${claim.slug}" already used by ${seenSlugs.get(claim.slug)}`);
    }
    seenSlugs.set(claim.slug, file);
  }
  if (claim.cluster && !clusters[claim.cluster]) {
    errors.push(`data/claims/${file}: cluster "${claim.cluster}" has no entry in data/clusters.json`);
  }
  if (claim.id) claimIds.add(claim.id);
}

// Cross-file referential integrity.
for (const file of claimFiles) {
  const claim = read(`data/claims/${file}`);
  for (const rel of claim.related || []) {
    if (!claimIds.has(rel)) errors.push(`data/claims/${file}: related claim ${rel} does not exist`);
  }
}
for (const entry of read("data/escalations.json")) {
  if (!claimIds.has(entry.claim_id)) {
    errors.push(`data/escalations.json: claim_id ${entry.claim_id} does not exist`);
  }
}
for (const source of read("data/sources.json")) {
  for (const id of source.cited_in || []) {
    if (!claimIds.has(id)) errors.push(`data/sources.json: ${source.domain} cites unknown claim ${id}`);
  }
}

if (errors.length) {
  console.error(`validate: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`validate: ok (${claimFiles.length} claim file(s))`);
