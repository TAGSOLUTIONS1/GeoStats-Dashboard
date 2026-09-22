#!/usr/bin/env node
/**
 * Builds the Dubai-wide price index drawn as the "Dubai average" overlay in the
 * area chart. For every month it takes the median of the per-area monthly
 * average sale prices per m² in src/data/average_meter_price/historical_data.
 *
 * A median of area averages, equal-weighted by area: it is not weighted by the
 * number of sales, which the bundled export does not carry. The mean and the
 * number of areas with sales that month are kept alongside for reference.
 *
 *   node build-price-index.js
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'src/data/average_meter_price/historical_data');
const OUT = path.join(__dirname, 'src/data/average_meter_price/dubai_index.json');

const byMonth = new Map();
let files = 0;
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  files += 1;
  for (const r of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
    const month = String(r.instance_date).slice(0, 7);
    const v = Number(r.avg_meter_price);
    if (!/^\d{4}-\d{2}$/.test(month) || !Number.isFinite(v) || v <= 0) continue;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(v);
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const rows = [...byMonth.keys()].sort().map((month) => {
  const xs = byMonth.get(month);
  return {
    month,
    median: Math.round(median(xs)),
    mean: Math.round(xs.reduce((a, b) => a + b, 0) / xs.length),
    areas: xs.length,
  };
});

const out = {
  label: 'Dubai median of area average sale prices per m²',
  unit: 'AED/m²',
  method: 'For each month, the median across areas of that area\'s average sale price per m² (equal-weighted by area, not by sales).',
  source: 'Dubai Land Department transaction export bundled with GeoStats (src/data/average_meter_price/historical_data)',
  builtFrom: `${files} area files`,
  rows,
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`dubai_index.json: ${rows.length} months ${rows[0].month} → ${rows[rows.length - 1].month}, from ${files} area files`);
console.log(`  first ${JSON.stringify(rows[0])}\n  last  ${JSON.stringify(rows[rows.length - 1])}`);
