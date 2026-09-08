#!/usr/bin/env node
/**
 * Builds the derived / composite data points that need no external source.
 * Every input is already bundled in src/data. Re-run after any input changes:
 *
 *   node build-datapoints.js
 *
 * Writes 11 files and prints the per-community coverage of each. Nothing here
 * invents data: each output records its own method, inputs and limitation, the
 * same way the hand-built files in src/data already do.
 */
const fs = require('fs');
const path = require('path');

const D = path.join(__dirname, 'src', 'data');
const R = (p) => JSON.parse(fs.readFileSync(path.join(D, p), 'utf8'));
const RETRIEVED = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- shared ----

// The income denominator already used by rent-as-percent-of-income. Keeping the
// same basis is what makes these ratios comparable with the shipping metric.
const INCOME_AED = 184629;
const INCOME_NOTE =
  'UAE GDP per capita (World Bank, 2024) converted at 3.6725 AED/USD. This is ' +
  'national output per person, not median household income, and understates ' +
  'real household earning power -- use for relative ranking between ' +
  'communities, not as an absolute affordability figure.';

const geoSource = fs.readFileSync(path.join(D, 'geoData.js'), 'utf8');
const geoSlice = geoSource.slice(
  geoSource.indexOf('export const geojsonData'),
  geoSource.indexOf('export const dubaiGeoData') > -1
    ? geoSource.indexOf('export const dubaiGeoData')
    : geoSource.length
);
const CODES = [...new Set([...geoSlice.matchAll(/"COMM_NUM":\s*"(\d+)"/g)].map((m) => m[1]))];

const index = (rows) => {
  const m = {};
  rows.forEach((r) => { m[r.code] = r; });
  return m;
};

/** null unless the value is a real, finite number. Number(null) is 0, so guard. */
const any = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** As `any`, but 0 means "none present" rather than "scored zero". */
const pos = (v) => {
  const n = any(v);
  return n != null && n > 0 ? n : null;
};

/** Percentile rank 0-100 across the communities that have a value. */
const percentileRank = (values) => {
  const present = values.map((v, i) => ({ v, i })).filter((x) => x.v != null);
  present.sort((a, b) => a.v - b.v);
  const out = new Array(values.length).fill(null);
  present.forEach((x, rank) => {
    out[x.i] = present.length > 1 ? (rank / (present.length - 1)) * 100 : 50;
  });
  return out;
};

/** Six strictly ascending stops spanning the distribution, as Mapbox needs. */
const makeStops = (values, digits = 0) => {
  const s = values.filter((v) => v != null).sort((a, b) => a - b);
  if (!s.length) return [0, 1, 2, 3, 4, 5];
  const at = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
  const raw = [at(0), at(0.2), at(0.4), at(0.6), at(0.8), s[s.length - 1]];
  const f = 10 ** digits;
  const out = [];
  raw.forEach((v) => {
    let r = Math.round(v * f) / f;
    if (out.length && r <= out[out.length - 1]) r = out[out.length - 1] + 1 / f;
    out.push(Math.round(r * f) / f);
  });
  return out;
};

const nameOf = (() => {
  const pop = index(R('dsc/population-by-community.json').rows);
  return (code) => (pop[code] ? pop[code].name : null);
})();

const written = [];
const write = (file, payload) => {
  const full = path.join(D, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(payload, null, 2) + '\n');
  const metric = payload.metric;
  const n = payload.rows ? payload.rows.filter((r) => r[metric] != null).length : null;
  written.push({ file, id: payload.id, n });
  console.log(
    `  ${payload.id.padEnd(30)} ${n != null ? String(n).padStart(3) + '/226' : '  card'}  ->  ${file}`
  );
};

/** Assembles a per-community map layer file in the shape communityData expects. */
const layer = ({ id, file, label, metric, values, digits, meta }) => {
  const rows = CODES.map((code) => ({
    code,
    name: nameOf(code),
    [metric]: values[code] != null ? values[code] : null,
  }));
  const present = rows.map((r) => r[metric]).filter((v) => v != null);
  write(file, {
    id,
    label,
    scope: 'community',
    joinKey: 'COMM_NUM',
    metric,
    retrieved: RETRIEVED,
    ...meta,
    communitiesWithData: present.length,
    stops: makeStops(present, digits),
    rows,
  });
};

/** Percentile-mean composite, the recipe established by livability-score. */
const composite = ({ id, file, label, components, minComponents, meta }) => {
  const cols = components.map((c) => {
    const raw = CODES.map(c.get);
    const ranked = percentileRank(raw);
    return {
      key: c.key,
      source: c.source,
      inverted: !!c.invert,
      coverage: raw.filter((v) => v != null).length,
      col: c.invert ? ranked.map((v) => (v == null ? null : 100 - v)) : ranked,
    };
  });

  const values = {};
  const detail = {};
  CODES.forEach((code, i) => {
    const have = cols.map((c) => c.col[i]).filter((v) => v != null);
    detail[code] = {};
    cols.forEach((c) => {
      detail[code]['pct_' + c.key] = c.col[i] == null ? null : Math.round(c.col[i] * 10) / 10;
    });
    detail[code].components = have.length;
    if (have.length >= minComponents) {
      values[code] = Math.round(have.reduce((a, b) => a + b, 0) / have.length);
    }
  });

  const rows = CODES.map((code) => ({
    code,
    name: nameOf(code),
    components: detail[code].components,
    score: values[code] != null ? values[code] : null,
    ...detail[code],
  }));
  rows.forEach((r) => { delete r.components; r.components = detail[r.code].components; });

  const present = rows.map((r) => r.score).filter((v) => v != null);
  write(file, {
    id,
    label,
    scope: 'community',
    joinKey: 'COMM_NUM',
    metric: 'score',
    retrieved: RETRIEVED,
    ...meta,
    method:
      'Each component is percentile-ranked across the communities that have it ' +
      '(inverted components ranked so that "better" is always higher). The score ' +
      'is the unweighted mean of the available percentiles. Communities with ' +
      `fewer than ${minComponents} components are null.`,
    components: cols.reduce((acc, c) => {
      acc[c.key] = { source: c.source, inverted: c.inverted, communities: c.coverage };
      return acc;
    }, {}),
    minComponents,
    communitiesWithData: present.length,
    stops: makeStops(present, 0),
    rows,
  });
};

// ----------------------------------------------------------------- inputs ----

const affordability = index(R('derived/affordability.json').rows);
const rentPctIncome = index(R('dldx/rent-as-percent-of-income.json').rows);
const capRate = index(R('dldx/cap-rate.json').rows);
const listings = index(R('pf/median-listing-price.json').rows);
const schoolQuality = index(R('osm/school-quality.json').rows);
const schoolCost = index(R('schools/schooling-cost-by-community.json').rows);
const jobDiversity = index(R('osm/job-diversity.json').rows);
const population = index(R('dsc/population-by-community.json').rows);
const pricePerSqm = index(R('amp/price-per-sqm-by-community.json').rows);

console.log('\nBuilding derived data points\n');

// ------------------------------------------------------- 1. direct ratios ----

layer({
  id: 'value-income',
  file: 'derived/value-income.json',
  label: 'Home value to income ratio',
  metric: 'valueToIncome',
  digits: 1,
  values: Object.fromEntries(CODES.map((c) => {
    const price = affordability[c] ? pos(affordability[c].askingPrice) : null;
    return [c, price ? Math.round((price / INCOME_AED) * 10) / 10 : null];
  }).filter(([, v]) => v != null)),
  meta: {
    source: 'Derived: Property Finder Feb-2026 asking prices / UAE GDP per capita (World Bank 2024)',
    sourceUrl: 'https://www.kaggle.com/datasets/mohammedhassan1112/uae-property-finder',
    period: '2026 snapshot (prices Feb 2026, income 2024)',
    method: `Median community asking price divided by AED ${INCOME_AED.toLocaleString('en-US')} of annual income.`,
    incomeProxyAed: INCOME_AED,
    limitation:
      'Prices are listing-side ASKING prices, not completed sales, and cover ' +
      `only the 34 communities with 10+ listings in the scrape. ${INCOME_NOTE}`,
  },
});

layer({
  id: 'mtg-payments-income-percent',
  file: 'derived/mtg-payments-income-percent.json',
  label: 'Mortgage payments as % of income',
  metric: 'pctOfIncome',
  digits: 1,
  values: Object.fromEntries(CODES.map((c) => {
    const monthly = affordability[c] ? pos(affordability[c].mortgageMonthly) : null;
    return [c, monthly ? Math.round(((monthly * 12) / INCOME_AED) * 1000) / 10 : null];
  }).filter(([, v]) => v != null)),
  meta: {
    source: 'Derived: Emirates NBD mortgage terms on PF Feb-2026 asking prices / UAE GDP per capita',
    sourceUrl: 'https://www.emiratesnbd.com/en/loans/home-loans',
    period: '2026 snapshot (prices Feb 2026, rate Jul 2026, income 2024)',
    method:
      'Annualised mortgage payment (principal and interest, 80% LTV over 25 years ' +
      `at 3.99% p.a.) as a percentage of AED ${INCOME_AED.toLocaleString('en-US')} annual income.`,
    incomeProxyAed: INCOME_AED,
    limitation:
      'Values above 100% mean the modelled payment exceeds the proxy income entirely, ' +
      `which reflects the proxy more than the community. ${INCOME_NOTE}`,
  },
});

// Service charge is a real cost with no bundled source, so it is an explicit,
// labelled assumption rather than a silent addition.
const SERVICE_CHARGE_PA = 0.011;
layer({
  id: 'monthly-home-ownership-cost',
  file: 'derived/monthly-home-ownership-cost.json',
  label: 'Estimated monthly ownership cost (AED)',
  metric: 'monthlyCost',
  digits: 0,
  values: Object.fromEntries(CODES.map((c) => {
    const row = affordability[c];
    const monthly = row ? pos(row.mortgageMonthly) : null;
    const price = row ? pos(row.askingPrice) : null;
    if (!monthly || !price) return [c, null];
    return [c, Math.round(monthly + (price * SERVICE_CHARGE_PA) / 12)];
  }).filter(([, v]) => v != null)),
  meta: {
    source: 'Derived: ENBD mortgage terms + a stated service-charge assumption',
    sourceUrl: 'https://www.emiratesnbd.com/en/loans/home-loans',
    period: '2026 snapshot (prices Feb 2026, rate Jul 2026)',
    method:
      'Mortgage principal and interest (80% LTV, 25 years, 3.99% p.a.) plus a ' +
      `service charge modelled at ${(SERVICE_CHARGE_PA * 100).toFixed(1)}% of property value per year.`,
    assumptions: { serviceChargePctOfValuePa: SERVICE_CHARGE_PA, interestRatePa: 0.0399, tenureYears: 25, loanToValue: 0.8 },
    limitation:
      'The service-charge component is an ASSUMPTION, not sourced data -- the ' +
      'project holds no per-community service-charge or floor-area figures. Real ' +
      'charges vary widely by building. Dubai levies no annual property tax, so ' +
      'no tax component is included. Replace the assumption with published DLD ' +
      'Mollak service-charge rates before treating this as an absolute figure.',
  },
});

// -------------------------------------------------------- 2. overvaluation ----

const areas = R('average_meter_price/forecasts/Areas_id.json');
const areaByMuni = {};
areas.forEach((a) => { areaByMuni[String(a.municipality_number)] = a; });

const gdpSeries = R('worldbank/gdp-per-capita.json').series;
const gdpByYear = {};
gdpSeries.forEach((p) => { gdpByYear[Number(p.year)] = Number(p.value) * 3.6725; });
const gdpYears = Object.keys(gdpByYear).map(Number).sort((a, b) => a - b);
const gdpAt = (y) => (gdpByYear[y] != null ? gdpByYear[y] : gdpByYear[gdpYears[gdpYears.length - 1]]);

const HIST = path.join(D, 'average_meter_price', 'historical_data');
const histFiles = fs.readdirSync(HIST).filter((f) => f.endsWith('.json'));

const overvalued = {};
CODES.forEach((code) => {
  const area = areaByMuni[code];
  if (!area) return;
  const file = histFiles.find((f) => f.startsWith(`avg_meter_price_${area.area_id}_`));
  if (!file) return;
  const rows = JSON.parse(fs.readFileSync(path.join(HIST, file), 'utf8'))
    .map((r) => ({ year: Number(String(r.instance_date).slice(0, 4)), value: Number(r.avg_meter_price) }))
    .filter((r) => Number.isFinite(r.value) && r.value > 0 && Number.isFinite(r.year));
  if (rows.length < 36) return;
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  if (years.length < 6) return;
  const latest = years[years.length - 1];
  const ratios = rows.map((r) => ({ year: r.year, ratio: r.value / gdpAt(r.year) }));
  const recent = ratios.filter((r) => r.year >= latest - 1).map((r) => r.ratio);
  const longRun = ratios.filter((r) => r.year < latest - 1).map((r) => r.ratio);
  if (recent.length < 6 || longRun.length < 24) return;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const pct = (mean(recent) / mean(longRun) - 1) * 100;
  if (Number.isFinite(pct)) overvalued[code] = Math.round(pct * 10) / 10;
});

layer({
  id: 'overvalued-percent',
  file: 'derived/overvalued-percent.json',
  label: 'Over / undervalued vs long-run price-to-income (%)',
  metric: 'overvaluedPct',
  digits: 0,
  values: overvalued,
  meta: {
    source: 'Derived: per-community price per m² history (DLD-derived) / UAE GDP per capita (World Bank)',
    period: '2010 to 2025, community-level monthly price history',
    method:
      "Each community's monthly average price per m² is divided by UAE GDP per " +
      'capita for that year to give a price-to-income ratio. The mean ratio over ' +
      "the two most recent years is compared with the mean over that community's " +
      'earlier history. Positive = currently expensive relative to its own long-run ' +
      'relationship with income; negative = cheap relative to it.',
    requires: 'at least 36 monthly observations spanning 6 or more distinct years',
    limitation:
      'This measures a community against ITS OWN history, not against other ' +
      'communities or any external fair value. A long-established district and a ' +
      'newly built one are not comparable on this metric. The income denominator ' +
      `is Dubai-wide, so it shifts every community equally. ${INCOME_NOTE}`,
  },
});

// ---------------------------------------------------------- 3. inventory ----

layer({
  id: 'for-sale-inventory',
  file: 'pf/for-sale-inventory.json',
  label: 'Residential listings on the market',
  metric: 'listings',
  digits: 0,
  values: Object.fromEntries(CODES.map((c) => [c, listings[c] ? pos(listings[c].listings) : null])
    .filter(([, v]) => v != null)),
  meta: {
    source: 'Property Finder residential sale listings (Kaggle scrape), joined to communities',
    sourceUrl: 'https://www.kaggle.com/datasets/mohammedhassan1112/uae-property-finder',
    period: 'snapshot scraped 2026-02-13',
    method: 'Count of residential sale listings whose coordinates fall inside each community polygon.',
    limitation:
      'A 1548-listing sample of one February 2026 scrape, NOT the full market, so ' +
      'these are relative volumes rather than true inventory counts. Being a single ' +
      'snapshot it supports no growth rate, no months-of-supply and no trend -- the ' +
      'listings-derived data points that need history remain unavailable.',
  },
});

// -------------------------------------------------------- 4. composites ----

composite({
  id: 'affordability-index',
  file: 'composite/affordability-index.json',
  label: 'Affordability index (0-100, higher = more affordable)',
  minComponents: 2,
  components: [
    { key: 'rent-as-percent-of-income', source: 'DLD Exchange Ejari 2026 YTD / GDP per capita', invert: true, get: (c) => (rentPctIncome[c] ? pos(rentPctIncome[c].pctOfIncome) : null) },
    { key: 'home-value-to-rent-ratio', source: 'DLD Exchange 2026 YTD', invert: true, get: (c) => (capRate[c] ? pos(capRate[c].priceToRentYears) : null) },
    { key: 'salary-to-afford-a-house', source: 'Derived: ENBD terms on PF asking prices', invert: true, get: (c) => (affordability[c] ? pos(affordability[c].salaryToAfford) : null) },
    { key: 'buy-v-rent-differential', source: 'Derived: ENBD mortgage vs Ejari rent', invert: true, get: (c) => (affordability[c] ? any(affordability[c].buyVsRentMonthly) : null) },
  ],
  meta: {
    source: 'In-house composite of four affordability data points already in this dashboard',
    provenance: 'NOT a third-party index. Computed from data verified elsewhere in this project.',
    period: '2026 (rents and prices 2026, income 2024)',
    limitation:
      'A relative ranking within Dubai, not an absolute affordability standard. ' +
      'Component coverage is uneven -- buy-v-rent reaches only 27 communities -- so ' +
      'a score built on 2 components is much less stable than one built on 4. Check ' +
      'the components count before reading a single score closely.',
  },
});

composite({
  id: 'housing-market-health-score',
  file: 'composite/housing-market-health-score.json',
  label: 'Housing market health score (0-100)',
  minComponents: 2,
  components: [
    { key: 'cap-rate', source: 'DLD Exchange 2026 YTD', get: (c) => (capRate[c] ? pos(capRate[c].capRatePct) : null) },
    { key: 'sale-transactions', source: 'DLD Exchange 2026 YTD', get: (c) => (capRate[c] ? pos(capRate[c].saleTransactions) : null) },
    { key: 'rental-contracts', source: 'DLD Exchange Ejari 2026 YTD', get: (c) => (capRate[c] ? pos(capRate[c].flatContracts) : null) },
    { key: 'price-growth-5y', source: 'Dubai area price history (DLD-derived)', get: (c) => (pricePerSqm[c] ? any(pricePerSqm[c].growth5yPct) : null) },
  ],
  meta: {
    source: 'In-house composite: yield, transaction depth, rental depth and 5-year price growth',
    provenance: 'NOT a third-party score. Computed from data verified elsewhere in this project.',
    period: '2026 YTD transactions with 5-year price growth to 2025',
    limitation:
      'Transaction and contract counts reward large, busy communities, so this ' +
      'partly measures market SIZE as well as health. High cap rates can signal ' +
      'weak capital values rather than a strong market -- read alongside price growth.',
  },
});

composite({
  id: 'school-quality-score',
  file: 'composite/school-quality-score.json',
  label: 'School quality score (0-100)',
  minComponents: 2,
  components: [
    { key: 'public-school-quality-rating', source: 'KHDA DSIB inspection ratings 2022/23', get: (c) => (schoolQuality[c] ? pos(schoolQuality[c].avgRating) : null) },
    { key: 'schools-per-sqkm', source: 'KHDA school locations', get: (c) => (schoolQuality[c] ? pos(schoolQuality[c].schoolsPerSqKm) : null) },
    { key: 'curricula-choice', source: 'KHDA curricula per community', get: (c) => (schoolQuality[c] ? pos(schoolQuality[c].curriculaCount) : null) },
    { key: 'average-schooling-cost', source: 'KHDA fee schedules 2024/25', invert: true, get: (c) => (schoolCost[c] ? pos(schoolCost[c].meanAnnualFee) : null) },
  ],
  meta: {
    source: 'In-house composite of KHDA inspection ratings, school density, curricula choice and fees',
    provenance: 'NOT a third-party score, and NOT based on test scores, graduation rates or parent reviews -- Dubai publishes DSIB inspection ratings instead.',
    period: 'DSIB 2022/23 ratings, 2024/25 fee schedules',
    limitation:
      'Only communities that contain a school are scored -- a community with none ' +
      'is null, not zero, and families there may still be well served by schools ' +
      'next door. Fees are inverted, treating cheaper as better, which is a ' +
      'value judgement, not a quality measure.',
  },
});

composite({
  id: 'economic-health-score',
  file: 'composite/economic-health-score.json',
  label: 'Economic health score (0-100)',
  minComponents: 2,
  components: [
    { key: 'job-market-diversity', source: 'OpenStreetMap business categories', get: (c) => (jobDiversity[c] ? pos(jobDiversity[c].jobDiversity) : null) },
    { key: 'business-count', source: 'OpenStreetMap shop/office tags', get: (c) => (jobDiversity[c] ? pos(jobDiversity[c].businessesClassified) : null) },
    { key: 'population-growth', source: 'Dubai Statistics Center 2011-2022', get: (c) => (population[c] ? any(population[c].growthCagrPct) : null) },
  ],
  meta: {
    source: 'In-house composite of local business diversity, business density and population growth',
    provenance: 'NOT a third-party score. Computed from data verified elsewhere in this project.',
    period: 'OSM snapshot 2026, population 2011-2022',
    limitation:
      'Business counts come from OpenStreetMap, whose coverage is richer in central ' +
      'districts than in outlying ones, so this favours established commercial areas. ' +
      'It captures local economic ACTIVITY, not resident incomes or employment -- ' +
      'no per-community income or unemployment data exists for Dubai.',
  },
});

// ------------------------------------------------------------- 5. cards ----

const tertiary = R('worldbank/tertiary-enrollment.json');
const ageDist = R('dsc/age-distribution.json');
const gdpPc = R('worldbank/gdp-per-capita.json');
const employment = R('worldbank/employment-growth.json');
const unemployment = R('worldbank/unemployment-rate.json');

// Both halves are already natural 0-100 percentages, so the index is their
// plain mean -- no percentile trick, which on a 7-point series would just
// report "latest year = 100".
const tertiaryLatest = tertiary.series[tertiary.series.length - 1];
const tertiaryPct = Number(tertiaryLatest.value);

const WORKING_AGE = /^(1[5-9]|[2-5][0-9]|6[0-4])-/;
const workingAgePop = ageDist.bands
  .filter((b) => WORKING_AGE.test(String(b.label)))
  .reduce((sum, b) => sum + Number(b.population), 0);
const workingAgePct = (workingAgePop / Number(ageDist.totalPopulation)) * 100;

write('composite/education-plus-age.json', {
  id: 'education-plus-age',
  label: 'Education and age profile (0-100)',
  kind: 'value',
  scope: 'uae',
  unit: 'score',
  retrieved: RETRIEVED,
  value: Math.round(((tertiaryPct + workingAgePct) / 2) * 10) / 10,
  period: `Tertiary enrolment ${tertiaryLatest.year}, age structure ${ageDist.year}`,
  source: 'World Bank tertiary enrolment + Dubai Statistics Center age distribution',
  method:
    'The mean of two percentages: gross tertiary enrolment ratio, and the share ' +
    'of the population aged 15-64. Both are already 0-100 measures, so they are ' +
    'averaged directly rather than percentile-ranked.',
  note:
    `Tertiary enrolment ${tertiaryPct.toFixed(1)}% (${tertiaryLatest.year}); ` +
    `working-age 15-64 share ${workingAgePct.toFixed(1)}%, median age ` +
    `${ageDist.medianAge} (${ageDist.year}).`,
  limitation:
    'UAE / Dubai-wide, so it cannot vary by community. Dubai\'s working-age share ' +
    'is unusually high because of labour migration, not because of local ageing ' +
    'patterns, so this reads very differently from the same index elsewhere. The ' +
    'gross enrolment ratio can exceed the population it describes and is not a ' +
    'measure of degrees held.',
  inputs: {
    tertiaryEnrolment: { year: tertiaryLatest.year, value: tertiaryPct, source: 'World Bank' },
    workingAgeShare: { year: ageDist.year, value: Math.round(workingAgePct * 10) / 10, source: 'Dubai Statistics Center' },
    medianAge: { year: ageDist.year, value: ageDist.medianAge, source: 'Dubai Statistics Center' },
  },
});

// Income + employment: all three inputs are annual series, so this one is a
// real index over time rather than a single value.
const yearsOf = (s) => new Set(s.series.map((p) => Number(p.year)));
const sharedYears = [...yearsOf(gdpPc)]
  .filter((y) => yearsOf(employment).has(y) && yearsOf(unemployment).has(y))
  .sort((a, b) => a - b);
const valueAt = (s, y) => {
  const hit = s.series.find((p) => Number(p.year) === y);
  return hit ? Number(hit.value) : null;
};
const gdpGrowth = sharedYears.map((y, i) => {
  if (i === 0) return null;
  const prev = valueAt(gdpPc, sharedYears[i - 1]);
  const now = valueAt(gdpPc, y);
  return prev && now ? ((now - prev) / prev) * 100 : null;
});
const rank01 = (arr) => {
  const ok = arr.filter((v) => v != null).sort((a, b) => a - b);
  return (v) => (v == null || !ok.length ? null : (ok.filter((x) => x < v).length / Math.max(1, ok.length - 1)) * 100);
};
const rIncome = rank01(gdpGrowth);
const empVals = sharedYears.map((y) => valueAt(employment, y));
const unempVals = sharedYears.map((y) => valueAt(unemployment, y));
const rEmp = rank01(empVals);
const rUnemp = rank01(unempVals);

const ipeSeries = sharedYears.map((y, i) => {
  const parts = [rIncome(gdpGrowth[i]), rEmp(empVals[i]), rUnemp(unempVals[i]) == null ? null : 100 - rUnemp(unempVals[i])]
    .filter((v) => v != null);
  return parts.length >= 2 ? { year: y, value: Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) } : null;
}).filter(Boolean);

write('composite/income-plus-employment.json', {
  id: 'income-plus-employment',
  label: 'Income and employment index (0-100)',
  kind: 'series',
  scope: 'uae',
  unit: 'score',
  retrieved: RETRIEVED,
  series: ipeSeries,
  yearRange: [ipeSeries[0].year, ipeSeries[ipeSeries.length - 1].year],
  period: `${ipeSeries[0].year} to ${ipeSeries[ipeSeries.length - 1].year}`,
  source: 'World Bank: GDP per capita growth, employment growth, unemployment rate',
  method:
    'Each of the three series is percentile-ranked against its own history ' +
    '(unemployment inverted so lower is better) and the three ranks averaged. ' +
    'The result shows which years were strong relative to the UAE\'s own record.',
  limitation:
    'UAE nationwide, not Dubai and not per community. GDP per capita growth is ' +
    'a proxy for household income growth and tracks oil revenue as much as wages. ' +
    'A relative index: 50 means a typical year for the UAE, not a neutral absolute.',
});

console.log(`\nWrote ${written.length} files.\n`);
