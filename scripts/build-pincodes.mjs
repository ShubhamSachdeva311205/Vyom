// Rebuild src/lib/pincode/pincodes.json from the GeoNames India postal
// dataset (public domain / CC-BY). Run when India Post adds new codes.
//
//   curl -L -o /tmp/IN.zip https://download.geonames.org/export/zip/IN.zip
//   cd /tmp && unzip -o IN.zip IN.txt
//   node scripts/build-pincodes.mjs /tmp/IN.txt
//
// GeoNames IN.txt is tab-separated:
//   [0] country  [1] postal_code  [2] place_name  [3] admin1 (state)
//   [4] admin1_code  [5] admin2 (district)  ...

import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2] ?? "/tmp/IN.txt";
const seen = new Map();

for (const line of readFileSync(src, "utf-8").split("\n")) {
  const p = line.split("\t");
  if (p.length < 6) continue;
  const pin = p[1].trim();
  const locality = p[2].trim();
  const state = p[3].trim();
  const district = p[5].trim();
  if (!pin || !state) continue;
  const city = district || locality;
  if (!city) continue;
  const existing = seen.get(pin);
  if (existing) {
    if (!existing[2] && district) seen.set(pin, [city, state, true]);
    continue;
  }
  seen.set(pin, [city, state, Boolean(district)]);
}

const out = {};
for (const [pin, v] of seen) out[pin] = [v[0], v[1]];
writeFileSync(
  "src/lib/pincode/pincodes.json",
  JSON.stringify(out, null, 0),
);
console.log(`Wrote ${Object.keys(out).length} pincodes.`);
