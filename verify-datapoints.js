#!/usr/bin/env node
/**
 * Independent verification of every ungated data point.
 * Run:  node verify-datapoints.js
 * Exits non-zero if any check fails.
 */
const fs = require('fs');
const path = require('path');

let failures = 0;
const ok = (m) => console.log('  \x1b[32mPASS\x1b[0m ' + m);
const bad = (m) => { failures++; console.log('  \x1b[31mFAIL\x1b[0m ' + m); };

const read = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8'));
const src = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

// ---- 1. which data points are ungated -------------------------------------
const sidebar = src('src/data/sidebarData.js');
const blocks = sidebar.split('\n  {\n');
const points = {};
blocks.forEach((b) => {
  const m = b.match(/id:\s*["']([a-z0-9-]+)["']/);
  if (!m) return;
  const g = (k) => {
    const r = b.match(new RegExp(k + ':\\s*([^,\\n]+)'));
    return r ? r[1].trim().replace(/^["']|["']$/g, '') : null;
  };
  points[m[1]] = { isPremium: g('isPremium'), Upcoming: g('Upcoming'), source: g('source') };
});
const ungated = Object.keys(points).filter((id) => points[id].isPremium === 'false');

console.log(`\n=== 1. Ungated data points: ${ungated.length} ===`);
const stillUpcoming = ungated.filter((id) => points[id].Upcoming !== 'false');
stillUpcoming.length ? bad(`inconsistent Upcoming flag: ${stillUpcoming.join(', ')}`)
                     : ok('all ungated points have Upcoming:false');

// visible in a sidebar section?
const secPart = sidebar.slice(sidebar.indexOf('export const dataSections'));
const inSection = new Set([...secPart.matchAll(/getDataPointById\(["']([a-z0-9-]+)["']\)/g)].map((m) => m[1]));
const invisible = ungated.filter((id) => !inSection.has(id));
invisible.length ? bad(`ungated but in no sidebar section: ${invisible.join(', ')}`)
                 : ok('every ungated point appears in a sidebar section');

// ---- 2. every ungated point has a render path ------------------------------
const mapIds = [...src('src/services/communityData.js').matchAll(/^  '([a-z0-9-]+)': \{/gm)].map((m) => m[1]);
const cardIds = [...src('src/services/cardData.js').matchAll(/^  '([a-z0-9-]+)': \{/gm)].map((m) => m[1]);
const wbIds = [...src('src/services/worldbank.js').matchAll(/^  '([a-z0-9-]+)': \{ dataset/gm)].map((m) => m[1]);
const schoolIds = ['distribution-and-quality-analysis', 'rating-distribution', 'fee-distribution', 'enrollment-growth'];
const builtIn = ['population'];
const covered = new Set([...mapIds, ...cardIds, ...wbIds, ...schoolIds, ...builtIn]);

console.log(`\n=== 2. Render paths (map ${mapIds.length} / card ${cardIds.length} / worldbank ${wbIds.length}) ===`);
const orphans = ungated.filter((id) => !covered.has(id));
orphans.length ? bad(`ungated with NO way to render: ${orphans.join(', ')}`)
               : ok('every ungated point resolves to a renderer');
const both = mapIds.filter((id) => cardIds.includes(id) || wbIds.includes(id));
both.length ? bad(`registered as both map and card: ${both.join(', ')}`)
            : ok('no data point is registered twice');
const gatedButWired = [...mapIds, ...cardIds, ...wbIds].filter((id) => !ungated.includes(id));
gatedButWired.length ? bad(`wired up but still locked: ${gatedButWired.join(', ')}`)
                     : ok('nothing is wired but left locked');

// ---- 3. map layers: join keys + value sanity -------------------------------
console.log('\n=== 3. Map layers ===');
// geoData.js exports two FeatureCollections; the map uses `geojsonData`, so
// scan only that one (the other contains a stray "000" code).
const geoFull = src('src/data/geoData.js');
const geoSrc = geoFull.slice(
  geoFull.indexOf('export const geojsonData'),
  geoFull.indexOf('export const dubaiGeoData') > -1
    ? geoFull.indexOf('export const dubaiGeoData')
    : geoFull.length
);
const codes = new Set([...geoSrc.matchAll(/"COMM_NUM":\s*"(\d+)"/g)].map((m) => m[1]));
console.log(`  (geoData communities: ${codes.size})`);

const layers = [
  ['green-space-per-capita', 'src/data/osm/green-space.json', 'per10kPeople'],
  ['healthcare-accessibility-score', 'src/data/osm/healthcare.json', 'perSqKm'],
  ['public-transportation-coverage', 'src/data/osm/transport.json', 'perSqKm'],
  ['walkability-score', 'src/data/osm/walkability.json', 'walkPerSqKm'],
  ['disability-accessibility-score', 'src/data/osm/accessibility.json', 'accessiblePct'],
  ['rent-as-percent-of-income', 'src/data/dldx/rent-as-percent-of-income.json', 'pctOfIncome'],
  ['long-term-growth-score', 'src/data/composite/long-term-growth-score.json', 'score'],
  ['median-listing-price', 'src/data/pf/median-listing-price.json', 'medianListingPrice'],
  ['mortgage-payment', 'src/data/derived/affordability.json', 'mortgageMonthly'],
  ['salary-to-afford-a-house', 'src/data/derived/affordability.json', 'salaryToAfford'],
  ['buy-v-rent-differential', 'src/data/derived/affordability.json', 'buyVsRentMonthly'],
  ['public-school-quality-rating', 'src/data/osm/school-quality.json', 'avgRating'],
  ['average-schooling-cost', 'src/data/schools/schooling-cost-by-community.json', 'meanAnnualFee'],
  ['emergency-services-response-time', 'src/data/osm/emergency-proximity.json', 'avgKm'],
  ['livability-score', 'src/data/composite/livability-score.json', 'score'],
  ['job-market-diversity', 'src/data/osm/job-diversity.json', 'jobDiversity'],
  ['population-growth', 'src/data/dsc/population-by-community.json', 'growthCagrPct'],
  ['home-value', 'src/data/dld18/home-value-by-community.json', 'medianPrice'],
  ['price-per-sqm', 'src/data/amp/price-per-sqm-by-community.json', 'latestPricePerSqm'],
  ['cap-rate', 'src/data/dldx/cap-rate.json', 'capRatePct'],
  ['rental-rate', 'src/data/dldx/rental-rate.json', 'flatRentAed'],
  ['rent-for-houses', 'src/data/dldx/rent-for-houses.json', 'villaRentAed'],
  ['home-value-to-rent-ratio', 'src/data/dldx/price-to-rent.json', 'priceToRentYears'],
  ['community-safety-score', 'src/data/dsc/traffic-safety.json', 'per1kPeople'],
  // --- derived / composite layers built by build-datapoints.js ---
  ['overvalued-percent', 'src/data/derived/overvalued-percent.json', 'overvaluedPct'],
  ['value-income', 'src/data/derived/value-income.json', 'valueToIncome'],
  ['mtg-payments-income-percent', 'src/data/derived/mtg-payments-income-percent.json', 'pctOfIncome'],
  ['monthly-home-ownership-cost', 'src/data/derived/monthly-home-ownership-cost.json', 'monthlyCost'],
  ['for-sale-inventory', 'src/data/pf/for-sale-inventory.json', 'listings'],
  ['affordability-index', 'src/data/composite/affordability-index.json', 'score'],
  ['housing-market-health-score', 'src/data/composite/housing-market-health-score.json', 'score'],
  ['school-quality-score', 'src/data/composite/school-quality-score.json', 'score'],
  ['economic-health-score', 'src/data/composite/economic-health-score.json', 'score'],
];
const cdSrc = src('src/services/communityData.js');
layers.forEach(([id, file, metric]) => {
  const d = read(file);
  const rowCodes = d.rows.map((r) => r.code);
  const unmatched = rowCodes.filter((c) => !codes.has(c));
  const dupes = rowCodes.length - new Set(rowCodes).size;
  const vals = d.rows.map((r) => r[metric]).filter((v) => v != null);
  const nan = vals.filter((v) => !isFinite(v)).length;

  // stops must be strictly ascending, else mapbox throws at runtime
  const block = cdSrc.slice(cdSrc.indexOf(`'${id}': {`));
  const sm = block.match(/stops: \[([^\]]+)\]/);
  const stops = sm ? sm[1].split(',').map(Number) : [];
  const ascending = stops.length === 6 && stops.every((v, i) => i === 0 || v > stops[i - 1]);

  const problems = [];
  if (unmatched.length) problems.push(`${unmatched.length} unmatched codes`);
  if (dupes) problems.push(`${dupes} duplicate codes`);
  if (nan) problems.push(`${nan} NaN values`);
  if (!ascending) problems.push('stops not ascending');
  if (!vals.length) problems.push('no values at all');

  problems.length
    ? bad(`${id}: ${problems.join('; ')}`)
    : ok(`${id}: ${vals.length}/${d.rows.length} communities, stops valid`);
});

// ---- 4. card data points ---------------------------------------------------
console.log('\n=== 4. Card data points ===');
const cards = [
  ['housing-units', 'src/data/dsc/housing-units.json'],
  ['two-bed-rental-price', 'src/data/dldx/two-bed-rental-price.json'],
  ['percent-crash-from-2007-12', 'src/data/amp/percent-change-from-peak.json'],
  ['property-tax-rate', 'src/data/derived/property-tax-rate.json'],
  ['poverty-rate', 'src/data/hdx/poverty.json'],
  ['home-sales-growth-yoy', 'src/data/dld18/home-sales-growth-yoy.json'],
  ['employment-growth', 'src/data/worldbank/employment-growth.json'],
  ['percent-change-from-june-2022', 'src/data/amp/percent-change-from-june-2022.json'],
  ['home-sales', 'src/data/dld18/home-sales-history.json'],
  ['offplan-share', 'src/data/dld/offplan-share.json'],
  ['home-value-growth-yoy', 'src/data/dld18/home-value-growth-yoy.json'],
  ['home-value-growth-5year', 'src/data/dld18/home-value-growth-5year.json'],
  ['mortgage-share', 'src/data/dld/mortgage-share.json'],
  ['home-value-growth-mom', 'src/data/dld/home-value-mom.json'],
  ['housing-units-growth-rate', 'src/data/dsc/housing-growth.json'],
  ['unemployment-rate', 'src/data/worldbank/unemployment-rate.json'],
  ['median-household-income', 'src/data/worldbank/gdp-per-capita.json'],
  ['college-degree-rate', 'src/data/worldbank/tertiary-enrollment.json'],
  ['digital-infrastructure-score', 'src/data/worldbank/internet-users-pct.json'],
  ['environmental-quality-index', 'src/data/worldbank/co2-per-capita.json'],
  ['income-plus-employment', 'src/data/composite/income-plus-employment.json'],
];
cards.forEach(([id, file]) => {
  const d = read(file);
  if (d.value !== undefined) {
    // single-value card (a scalar, not a time series)
    isFinite(d.value)
      ? ok(`${id}: single value ${d.value} (${d.period || 'no period'})`)
      : bad(`${id}: value is not finite (${d.value})`);
    return;
  }
  const s = d.series || [];
  const ascending = s.every((p, i) => i === 0 || String(p.year) > String(s[i - 1].year));
  const nan = s.filter((p) => !isFinite(p.value)).length;
  (!s.length || !ascending || nan)
    ? bad(`${id}: ${!s.length ? 'empty series' : !ascending ? 'years not ascending' : nan + ' NaN'}`)
    : ok(`${id}: ${s.length} points, ${d.yearRange.join('-')}`);
});
const edu = read('src/data/composite/education-plus-age.json');
const eduParts = [edu.inputs.tertiaryEnrolment.value, edu.inputs.workingAgeShare.value];
const eduExpect = Math.round(((eduParts[0] + eduParts[1]) / 2) * 10) / 10;
Math.abs(edu.value - eduExpect) < 0.05 && eduParts.every((v) => v > 0 && v <= 100)
  ? ok(`education-plus-age: ${edu.value} = mean(${eduParts.map((v) => v.toFixed(1)).join(', ')})`)
  : bad(`education-plus-age: stated ${edu.value} != mean of its own inputs ${eduExpect}`);

const age = read('src/data/dsc/age-distribution.json');
const bandSum = age.bands.reduce((t, b) => t + b.population, 0);
bandSum === age.totalPopulation
  ? ok(`median-age: bands sum to stated total (${bandSum.toLocaleString()})`)
  : bad(`median-age: bands sum ${bandSum} != total ${age.totalPopulation}`);

// ---- 4b. composites: no score without the declared minimum components ------
console.log('\n=== 4b. Composite integrity ===');
[
  'src/data/composite/affordability-index.json',
  'src/data/composite/housing-market-health-score.json',
  'src/data/composite/school-quality-score.json',
  'src/data/composite/economic-health-score.json',
].forEach((f) => {
  const d = read(f);
  const bogus = d.rows.filter((r) => r.score != null && r.components < d.minComponents);
  const orphanComponents = d.rows.filter((r) => r.score == null && r.components >= d.minComponents);
  const outOfRange = d.rows.filter((r) => r.score != null && (r.score < 0 || r.score > 100));
  const problems = [];
  if (bogus.length) problems.push(`${bogus.length} scored below minComponents`);
  if (orphanComponents.length) problems.push(`${orphanComponents.length} unscored despite enough components`);
  if (outOfRange.length) problems.push(`${outOfRange.length} outside 0-100`);
  problems.length
    ? bad(`${d.id}: ${problems.join('; ')}`)
    : ok(`${d.id}: ${d.communitiesWithData} scored, all >= ${d.minComponents} components, all within 0-100`);
});

// ---- 5. external cross-check ----------------------------------------------
console.log('\n=== 5. Cross-check against known Dubai population ===');
const pop = read('src/data/dsc/population-by-community.json');
const byYear = {};
pop.rows.forEach((r) => r.series.forEach((p) => { byYear[p.year] = (byYear[p.year] || 0) + p.population; }));
const refs = { 2019: 3360000, 2022: 3550000 };
// our series has 2018 and 2022; compare 2022 and check monotonic growth
const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
const monotonic = years.every((y, i) => i === 0 || byYear[y] > byYear[years[i - 1]]);
monotonic ? ok(`population totals rise across ${years.join(', ')}`)
          : bad('population totals are not monotonically increasing');
const got = byYear[2022];
const diff = Math.abs(got - refs[2022]) / refs[2022] * 100;
diff < 5 ? ok(`2022 total ${got.toLocaleString()} within ${diff.toFixed(1)}% of published ~3.55M`)
         : bad(`2022 total ${got.toLocaleString()} is ${diff.toFixed(1)}% off published ~3.55M`);

console.log(`\n${failures === 0 ? '\x1b[32mALL CHECKS PASSED\x1b[0m' : '\x1b[31m' + failures + ' CHECK(S) FAILED\x1b[0m'}\n`);
process.exit(failures ? 1 : 0);
