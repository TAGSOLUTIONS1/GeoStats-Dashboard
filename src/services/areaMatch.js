/**
 * "Find my area": turns a visitor's budget and priorities into a ranked
 * shortlist of communities.
 *
 * This module is self-contained on purpose. It reads the published data points
 * through communityData's public helpers and nothing else, so the existing map
 * layers, cards and tables are unaffected by anything here.
 *
 * The shape of an answer:
 *   1. a hard filter from the budget, using recorded prices or rents;
 *   2. a 0-100 match score built from the priorities the visitor picked, each
 *      one percentile-ranked across the communities still in the running;
 *   3. the reasons behind the score and the one caveat that matters most.
 * Communities without the data to judge are reported as unscored, never
 * silently dropped and never filled in with a guess.
 *
 * Every question and every measure is specific to what the visitor is doing.
 * A buyer is judged on price against the area's own history, resale and
 * freehold ownership; a renter on the rent itself and how stable it has been;
 * a business on its customers, its competitors and the cost of its floor
 * space — and, within that, a clinic is judged on unmet demand where a café is
 * judged on footfall. Nothing borrowed from one mode is shown in another.
 */
import { geojsonData } from '../data/geoData';
import { getValuesByCommunity, getMapDataPointMeta } from './communityData';
import priceByType from '../data/dld/price-per-sqm-by-type.json';
import rentByCommunity from '../data/dldx/rental-rate.json';
import priceHistory from '../data/amp/price-per-sqm-by-community.json';

export const MODES = [
  {
    id: 'buy',
    label: 'Buy a home',
    budgetLabel: 'Total budget',
    budgetUnit: 'AED',
    placeholder: '1,500,000',
    spaceLabel: 'What size home?',
    spaceNote: 'Typical Dubai floor areas, used to turn your budget into a price per m².',
    priorityNote: 'Priced against recorded sales, and judged on what matters when you own: the price against the area’s own history, resale, ownership and the area itself.',
  },
  {
    id: 'rent',
    label: 'Rent a home',
    budgetLabel: 'Annual rent budget',
    budgetUnit: 'AED / year',
    placeholder: '120,000',
    spaceLabel: 'What size home?',
    spaceNote: 'Villas are matched to registered villa rents; the other sizes to registered flat rents.',
    priorityNote: 'Priced against registered Ejari tenancies, and judged on what matters when you rent: the rent itself, how stable it has been, and the area itself.',
  },
  {
    id: 'business',
    label: 'Open a business',
    budgetLabel: 'Monthly rent budget',
    budgetUnit: 'AED / month',
    placeholder: '25,000',
    spaceLabel: 'How much floor space?',
    spaceNote: 'Used with the area’s registered rent per m² to estimate what your space would cost there.',
    priorityNote: 'Judged on trade, not on living: who is nearby, who is already trading, and what the floor space costs.',
  },
];

// Typical built-up areas. Homes use Dubai residential conventions; a business
// is asked for floor space instead, because bedrooms mean nothing to a shop.
export const SIZES = [
  { id: 'studio', modes: ['buy', 'rent'], label: 'Studio', m2: 45 },
  { id: '1bed', modes: ['buy', 'rent'], label: '1 bedroom', m2: 75 },
  { id: '2bed', modes: ['buy', 'rent'], label: '2 bedrooms', m2: 110 },
  { id: '3bed', modes: ['buy', 'rent'], label: '3 bedrooms', m2: 150 },
  { id: 'villa', modes: ['buy', 'rent'], label: 'Villa (4+ bedrooms)', m2: 320 },
  { id: 'kiosk', modes: ['business'], label: 'Kiosk or counter', m2: 30 },
  { id: 'shop', modes: ['business'], label: 'Shop or café', m2: 80 },
  { id: 'unit', modes: ['business'], label: 'Clinic or showroom', m2: 150 },
  { id: 'floor', modes: ['business'], label: 'Office floor', m2: 300 },
];

export const sizesFor = (mode) => SIZES.filter((s) => s.modes.includes(mode));

export const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurant or café', sizeId: 'shop' },
  { id: 'clinic', label: 'Clinic or pharmacy', sizeId: 'unit' },
  { id: 'retail', label: 'Shop or retail', sizeId: 'shop' },
  { id: 'office', label: 'Office or services', sizeId: 'floor' },
];

export const defaultSizeId = (mode, businessType = null) => {
  if (mode !== 'business') return '2bed';
  return (BUSINESS_TYPES.find((b) => b.id === businessType) || {}).sizeId || 'shop';
};

// The headings the priorities are shown under, so the visitor can see at a
// glance that the questions changed with the mode.
export const PRIORITY_GROUPS = {
  money: { buy: 'Price, return and ownership', rent: 'Rent and cost' },
  life: { buy: 'The area itself', rent: 'The area itself' },
  trade: { business: 'Customers and competition' },
  cost: { business: 'Cost of the space' },
  access: { business: 'Access and growth' },
};
export const GROUP_ORDER = ['money', 'trade', 'cost', 'life', 'access'];
export const groupLabel = (group, mode) => (PRIORITY_GROUPS[group] || {})[mode] || '';

/**
 * Each priority is a small group of published data points. Grouping them means
 * one missing layer does not silently decide a ranking, and it keeps the
 * wording the visitor sees away from the internal metric names.
 *
 * `byMode` / `byType` replace the label, hint and measures when the same
 * heading means something different to a buyer, a renter or a given trade.
 * `lower: true` marks a measure whose raw value is better when it is smaller.
 */
export const PRIORITIES = [
  // ---------------------------------------------------------------- buying
  {
    id: 'value',
    modes: ['buy', 'rent'],
    group: 'money',
    label: 'Value for money',
    reasonLabel: 'value for money',
    hint: 'Priced below its own long-run level',
    criteria: [{ id: 'overvalued-percent', lower: true }, { id: 'price-vs-own-history', lower: true }],
    byMode: {
      rent: {
        label: 'Cheaper rent',
        reasonLabel: 'low rent',
        hint: 'Rent low for Dubai, and low against buying',
        criteria: [{ id: 'rental-rate', lower: true }, { id: 'home-value-to-rent-ratio' }],
      },
    },
  },
  {
    id: 'invest',
    modes: ['buy'],
    group: 'money',
    label: 'Resale value & return',
    reasonLabel: 'resale and return',
    hint: 'Price growth, yield, sales activity, past falls',
    criteria: [
      { id: 'median-listing-price-yoy' },
      { id: 'gross-rental-yield' },
      { id: 'transaction-liquidity' },
      { id: 'max-historical-drawdown' },
    ],
  },
  {
    id: 'ownership',
    modes: ['buy'],
    group: 'money',
    label: 'Freehold ownership',
    reasonLabel: 'freehold ownership',
    hint: 'How much of the area is freehold property',
    criteria: [{ id: 'freehold-share' }],
  },
  // --------------------------------------------------------------- renting
  {
    id: 'rentstability',
    modes: ['rent'],
    group: 'money',
    label: 'Stable, renewable rent',
    reasonLabel: 'rent stability',
    hint: 'Small rent rises and tenants who renew',
    criteria: [{ id: 'rent-growth-yoy', lower: true }, { id: 'lease-renewal-rate' }],
  },
  // ------------------------------------------------------- home, both modes
  {
    id: 'schools',
    modes: ['buy', 'rent'],
    group: 'life',
    label: 'Schools',
    reasonLabel: 'schools',
    hint: 'KHDA inspection ratings nearby',
    criteria: [{ id: 'school-quality-score' }, { id: 'public-school-quality-rating' }],
  },
  {
    id: 'healthcare',
    modes: ['buy', 'rent'],
    group: 'life',
    label: 'Healthcare nearby',
    reasonLabel: 'healthcare nearby',
    hint: 'Clinics, pharmacies and hospital distance',
    criteria: [{ id: 'clinics-per-10k' }, { id: 'pharmacies-per-10k' }, { id: 'hospital-proximity', lower: true }],
  },
  {
    id: 'safety',
    modes: ['buy', 'rent'],
    group: 'life',
    label: 'Road safety & emergency cover',
    reasonLabel: 'road safety',
    hint: 'Recorded incidents and distance to services',
    criteria: [{ id: 'community-safety-score', lower: true }, { id: 'emergency-services-response-time', lower: true }],
  },
  {
    id: 'green',
    modes: ['buy', 'rent'],
    group: 'life',
    label: 'Green space',
    reasonLabel: 'green space',
    hint: 'Parks and open space per resident',
    criteria: [{ id: 'green-space-per-capita' }],
  },
  {
    id: 'family',
    modes: ['buy', 'rent'],
    group: 'life',
    label: 'Family-sized homes',
    reasonLabel: 'family-sized homes',
    hint: 'Share of 3+ bedroom homes sold, and villas',
    criteria: [{ id: 'family-household-percent' }, { id: 'villa-share-of-sales' }],
    byMode: {
      rent: {
        hint: 'Share of 3+ bedroom homes, and how big they are',
        criteria: [{ id: 'family-household-percent' }, { id: 'average-unit-size' }],
      },
    },
  },
  // --------------------------------------------- shared with business mode
  {
    id: 'metro',
    modes: ['buy', 'rent', 'business'],
    group: 'life',
    label: 'Metro & transit access',
    reasonLabel: 'metro and transit access',
    hint: 'Distance to a station, stops per km²',
    criteria: [{ id: 'metro-proximity', lower: true }, { id: 'public-transportation-coverage' }],
    byMode: {
      business: {
        group: 'access',
        label: 'Customers & staff can get here',
        reasonLabel: 'transit access',
        hint: 'Distance to a station, stops per km²',
      },
    },
  },
  {
    id: 'walkable',
    modes: ['buy', 'rent', 'business'],
    group: 'life',
    label: 'Walkable streets',
    reasonLabel: 'walkable streets',
    hint: 'Pedestrian network and everyday amenities',
    criteria: [{ id: 'walkability-score' }, { id: 'neighborhood-quality-score' }],
    byMode: {
      business: {
        group: 'access',
        label: 'Passing trade on foot',
        reasonLabel: 'foot traffic',
        hint: 'Pedestrian network and nearby amenities',
      },
    },
  },
  {
    id: 'growth',
    modes: ['buy', 'rent', 'business'],
    group: 'life',
    label: 'A growing area',
    reasonLabel: 'growth',
    hint: 'Recent population change and long-run growth',
    criteria: [{ id: 'population-growth-recent' }, { id: 'long-term-growth-score' }],
    byMode: {
      business: { group: 'access', hint: 'A customer base that is still being built' },
    },
  },
  // -------------------------------------------------------------- business
  {
    id: 'footfall',
    modes: ['business'],
    businessTypes: ['restaurant', 'retail'],
    group: 'trade',
    label: 'Footfall & density',
    reasonLabel: 'footfall',
    hint: 'Residents per km², walkable streets, transit stops',
    criteria: [{ id: 'population-density' }, { id: 'walkability-score' }, { id: 'public-transportation-coverage' }],
  },
  {
    id: 'catchment',
    modes: ['business'],
    businessTypes: ['clinic'],
    group: 'trade',
    label: 'Patient catchment',
    reasonLabel: 'patient catchment',
    hint: 'Residents per km², family homes, recent growth',
    criteria: [{ id: 'population-density' }, { id: 'family-household-percent' }, { id: 'population-growth-recent' }],
  },
  {
    id: 'underserved',
    modes: ['business'],
    businessTypes: ['clinic'],
    group: 'trade',
    label: 'Under-served for healthcare',
    reasonLabel: 'unmet healthcare demand',
    hint: 'Fewer clinics and pharmacies already licensed here',
    criteria: [
      { id: 'clinics-per-10k', lower: true },
      { id: 'pharmacies-per-10k', lower: true },
      { id: 'healthcare-accessibility-score', lower: true },
    ],
  },
  {
    id: 'district',
    modes: ['business'],
    businessTypes: ['office'],
    group: 'trade',
    label: 'Established business district',
    reasonLabel: 'an established business district',
    hint: 'Company tenancies, business mix, economic activity',
    criteria: [{ id: 'corporate-tenancy-share' }, { id: 'job-market-diversity' }, { id: 'economic-health-score' }],
  },
  {
    id: 'trade',
    modes: ['business'],
    businessTypes: ['restaurant', 'retail'],
    group: 'trade',
    label: 'Proven trade',
    reasonLabel: 'proven trade',
    hint: 'Where business activity is already established',
    criteria: [{ id: 'economic-health-score' }, { id: 'job-market-diversity' }],
    conflictsWith: ['competition'],
  },
  {
    id: 'competition',
    modes: ['business'],
    businessTypes: ['restaurant', 'retail', 'office'],
    group: 'trade',
    label: 'Less competition',
    reasonLabel: 'low competition',
    hint: 'Fewer and less varied businesses already trading',
    criteria: [{ id: 'job-market-diversity', lower: true }, { id: 'economic-health-score', lower: true }],
    conflictsWith: ['trade', 'district'],
  },
  {
    id: 'spending',
    modes: ['business'],
    group: 'trade',
    label: 'Nearby spending power',
    reasonLabel: 'spending power nearby',
    hint: 'Home prices as a proxy for catchment income',
    criteria: [{ id: 'price-per-sqm' }, { id: 'home-value' }],
    tension: ['lowrent'],
  },
  {
    id: 'lowrent',
    modes: ['business'],
    group: 'cost',
    label: 'Lower occupancy cost',
    reasonLabel: 'low occupancy cost',
    hint: 'Registered rents per m² as a proxy for what space costs',
    criteria: [{ id: 'rental-rate', lower: true }],
    tension: ['spending'],
  },
];

/**
 * Optional hard requirements, offered only where the measure behind them is
 * actually one of that mode's scoring measures. Where a real-world threshold
 * exists it is used literally (a kilometre is a kilometre); elsewhere the
 * requirement is a position in the Dubai field, and the wording says so.
 */
export const MUST_HAVES = {
  metro: { criterion: 'metro-proximity', kind: 'max', unit: 'km', options: [
    { value: 1, label: 'within 1 km of a station' },
    { value: 2, label: 'within 2 km' },
    { value: 3, label: 'within 3 km' }] },
  healthcare: { criterion: 'hospital-proximity', kind: 'max', unit: 'km', options: [
    { value: 3, label: 'hospital within 3 km' },
    { value: 5, label: 'hospital within 5 km' },
    { value: 10, label: 'hospital within 10 km' }] },
  schools: { criterion: 'public-school-quality-rating', kind: 'min', unit: 'rating', options: [
    { value: 3, label: 'schools rated 3+ (Good)' },
    { value: 4, label: 'schools rated 4+ (Very good)' }] },
  ownership: { criterion: 'freehold-share', kind: 'min', unit: '%', options: [
    { value: 50, label: 'mostly freehold (50%+)' },
    { value: 90, label: 'almost entirely freehold (90%+)' }] },
  invest: { criterion: 'gross-rental-yield', kind: 'min', unit: '%', options: [
    { value: 5, label: 'gross yield of 5%+' },
    { value: 7, label: 'gross yield of 7%+' }] },
  rentstability: { criterion: 'rent-growth-yoy', kind: 'max', unit: '%', options: [
    { value: 5, label: 'rents rose less than 5%' },
    { value: 0, label: 'rents did not rise' }] },
  safety: { criterion: 'community-safety-score', kind: 'percentile', options: [
    { value: 50, label: 'safer than the Dubai median' },
    { value: 75, label: 'in the safest quarter' }] },
  green: { criterion: 'green-space-per-capita', kind: 'percentile', options: [
    { value: 50, label: 'more green space than the median' },
    { value: 75, label: 'in the greenest quarter' }] },
  walkable: { criterion: 'walkability-score', kind: 'percentile', options: [
    { value: 50, label: 'more walkable than the median' },
    { value: 75, label: 'in the most walkable quarter' }] },
  family: { criterion: 'family-household-percent', kind: 'percentile', options: [
    { value: 50, label: 'more family homes than the median' }] },
  footfall: { criterion: 'population-density', kind: 'percentile', options: [
    { value: 50, label: 'busier than the median area' },
    { value: 75, label: 'in the busiest quarter' }] },
  catchment: { criterion: 'population-density', kind: 'percentile', options: [
    { value: 50, label: 'more residents per km² than the median' },
    { value: 75, label: 'in the densest quarter' }] },
  district: { criterion: 'corporate-tenancy-share', kind: 'percentile', options: [
    { value: 50, label: 'more company tenancies than the median' },
    { value: 75, label: 'in the top quarter for company tenancies' }] },
};

/** A priority with its mode's (and trade's) own label, hint and measures. */
const resolve = (p, mode, businessType) => {
  const over = (businessType && p.byType && p.byType[businessType])
    || (p.byMode && p.byMode[mode])
    || {};
  const { byMode, byType, ...base } = p;
  return { ...base, ...over, criteria: over.criteria || p.criteria };
};

/** The priorities offered for one brief, already resolved to that brief. */
export const prioritiesFor = (mode, businessType = null) => PRIORITIES
  .filter((p) => p.modes.includes(mode)
    && (mode !== 'business' || !p.businessTypes || p.businessTypes.includes(businessType)))
  .map((p) => resolve(p, mode, businessType));

/**
 * The must-have for a priority, or null. A requirement is only offered when
 * the measure it tests is one this mode actually scores on, so a renter is
 * never asked to filter on a buyer's number.
 */
export const mustHaveFor = (priorityId, mode, businessType = null) => {
  const mh = MUST_HAVES[priorityId];
  if (!mh) return null;
  const p = prioritiesFor(mode, businessType).find((x) => x.id === priorityId);
  if (!p || !p.criteria.some((c) => c.id === mh.criterion)) return null;
  return mh;
};

// How much evidence sits behind the money figure for each community: the
// number of recorded sales or tenancy contracts, and the months of history.
const evidenceTables = {
  flatSales: Object.fromEntries(priceByType.rows.map((r) => [String(r.code), r.flatSales])),
  villaSales: Object.fromEntries(priceByType.rows.map((r) => [String(r.code), r.villaSales])),
  flatContracts: Object.fromEntries(rentByCommunity.rows.map((r) => [String(r.code), r.flatContracts])),
  villaContracts: Object.fromEntries(rentByCommunity.rows.map((r) => [String(r.code), r.villaContracts])),
  months: Object.fromEntries(priceHistory.rows.map((r) => [String(r.code), r.months])),
};

// Proxies the visitor must be told about, keyed by priority.
const PROXY_NOTES = {
  ownership: 'Freehold share is measured from registered tenancies, as a proxy for the area’s freehold zoning.',
  spending: 'Spending power is inferred from home prices; Dubai publishes no income by community.',
  lowrent: 'Cost uses registered residential rents per m²: commercial rent is not published per community.',
  competition: 'Competition is inferred from OpenStreetMap business tags, which are richer in central districts.',
  trade: 'Business activity comes from OpenStreetMap tags, which are richer in central districts.',
  district: 'Business activity comes from Ejari company tenancies and OpenStreetMap tags, which are richer in central districts.',
  underserved: 'Few licensed clinics can mean unmet demand or simply a quiet residential area; the register does not say which.',
  catchment: 'Catchment is inferred from residents and family-home share; patient numbers are not published.',
};

export const COMMUNITIES = geojsonData.features.map((f) => ({
  code: String(f.properties.COMM_NUM),
  name: f.properties.CNAME_E,
  fullName: f.properties.COMMUNITY_E || f.properties.CNAME_E,
}));

const valuesCache = new Map();
const valuesFor = (id) => {
  if (!valuesCache.has(id)) valuesCache.set(id, getValuesByCommunity(id) || {});
  return valuesCache.get(id);
};

const medianOf = (list) => {
  const v = list.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

// Percentile rank within the communities that have the metric, 0-100, so
// metrics in different units can be averaged. Ties share the same rank.
const percentileRanks = (pairs, lower) => {
  const sorted = [...pairs].sort((a, b) => a.v - b.v);
  const out = {};
  const n = sorted.length;
  sorted.forEach((p, i) => {
    let j = i;
    while (j + 1 < n && sorted[j + 1].v === p.v) j += 1;
    const pct = n === 1 ? 100 : ((i + j) / 2 / (n - 1)) * 100;
    out[p.code] = lower ? 100 - pct : pct;
  });
  return out;
};

const fmtAed = (v) => Math.round(v).toLocaleString('en-US');

// Plain words for a percentile, so a reason reads like a sentence and a
// mid-table score is never dressed up as a selling point.
const strength = (score) => (score >= 85 ? 'excellent' : score >= 70 ? 'strong' : score >= 55 ? 'above average' : score >= 45 ? 'average' : 'below average');

/**
 * @param {object} req
 * @param {'buy'|'rent'|'business'} req.mode
 * @param {number|null} req.budget           AED (total to buy, per year to rent, per month for business)
 * @param {string} req.sizeId                one of SIZES for this mode
 * @param {string[]} req.priorityIds         up to three priorities, in order of importance
 * @param {object} req.mustHaves             priority id -> threshold
 * @param {string|null} req.businessType
 */
export const findMatches = ({ mode = 'buy', budget = null, sizeId = null, priorityIds = [], mustHaves = {}, businessType = null }) => {
  const type = mode === 'business' ? (businessType || 'restaurant') : null;
  const pool = sizesFor(mode);
  const size = pool.find((s) => s.id === sizeId) || pool.find((s) => s.id === defaultSizeId(mode, type)) || pool[0];

  // The order they were picked in is the order they matter: a first choice
  // counts three times as much as a third.
  const WEIGHTS = [3, 2, 1];
  const offered = prioritiesFor(mode, type);
  const priorities = priorityIds
    .map((id, i) => {
      const p = offered.find((x) => x.id === id);
      return p ? { ...p, weight: WEIGHTS[i] ?? 1, rank: i + 1 } : null;
    })
    .filter(Boolean);

  // ---------- 1. cost: what each community implies for this brief
  const villa = size.id === 'villa';
  const costId = mode === 'buy'
    ? (villa ? 'villa-price-per-sqm' : 'apartment-price-per-sqm')
    : mode === 'rent' ? (villa ? 'rent-for-houses' : 'rental-rate')
      : 'rental-rate';
  const costFallbackId = mode === 'buy' ? 'price-per-sqm' : null;
  const costValues = valuesFor(costId);
  const costFallback = costFallbackId ? valuesFor(costFallbackId) : {};

  // Business floor space is priced from the area's registered rent divided by
  // its own median home size, so a 30 m² kiosk and a 300 m² floor differ.
  const unitSizes = mode === 'business' ? valuesFor('average-unit-size') : {};
  const medianUnitSize = mode === 'business'
    ? (medianOf(Object.values(unitSizes).map(Number)) || 90)
    : null;

  const evidenceFor = (code) => {
    const key = mode === 'buy' ? (villa ? 'villaSales' : 'flatSales') : (villa ? 'villaContracts' : 'flatContracts');
    const n = Number(evidenceTables[key][code]) || 0;
    const months = Number(evidenceTables.months[code]) || 0;
    const noun = mode === 'buy' ? 'recorded sales' : 'tenancy contracts';
    return {
      count: n,
      months,
      level: n >= 30 ? 'firm' : n >= 10 ? 'fair' : 'thin',
      text: n > 0 ? `${n} ${noun}${months ? `, ${months} months of price history` : ''}` : (months ? `${months} months of price history` : 'few records'),
    };
  };

  const costFor = (code) => {
    if (mode === 'buy') {
      const perM2 = costValues[code] != null ? Number(costValues[code])
        : costFallback[code] != null ? Number(costFallback[code]) : null;
      if (perM2 == null) return null;
      const usedFallback = costValues[code] == null;
      return { amount: perM2 * size.m2, perM2, usedFallback, kind: 'price' };
    }
    const annual = costValues[code] != null ? Number(costValues[code]) : null;
    if (annual == null) return null;
    if (mode === 'rent') return { amount: annual, perM2: null, usedFallback: false, kind: 'rent' };
    const own = Number(unitSizes[code]);
    const basis = Number.isFinite(own) ? own : medianUnitSize;
    const perM2 = annual / basis;
    return { amount: (perM2 * size.m2) / 12, perM2, usedFallback: !Number.isFinite(own), kind: 'rent' };
  };

  // ---------- 2. shortlist by budget (a hard filter for homes only)
  const hardFilter = budget != null && budget > 0 && (mode === 'buy' || mode === 'rent');
  const withCost = [];
  const noCostData = [];
  COMMUNITIES.forEach((c) => {
    const cost = costFor(c.code);
    if (cost == null) { noCostData.push(c); return; }
    withCost.push({ ...c, cost });
  });
  const overBudget = hardFilter ? withCost.filter((c) => c.cost.amount > budget) : [];
  // Without a hard filter a community can still be ranked on everything else;
  // its cost is simply unknown and is labelled as such rather than guessed.
  const candidates = hardFilter
    ? withCost.filter((c) => c.cost.amount <= budget)
    : withCost.concat(noCostData.map((c) => ({ ...c, cost: null })));

  // ---------- 2b. hard requirements, applied after the budget
  const activeMustHaves = Object.entries(mustHaves)
    .filter(([pid, v]) => v != null && priorities.some((p) => p.id === pid) && mustHaveFor(pid, mode, type))
    .map(([pid, v]) => {
      const mh = mustHaveFor(pid, mode, type);
      return { pid, ...mh, threshold: Number(v), priority: priorities.find((p) => p.id === pid) };
    });

  const mustHaveRanks = {};
  activeMustHaves.forEach((mh) => {
    if (mh.kind !== 'percentile') return;
    const crit = mh.priority.criteria.find((c) => c.id === mh.criterion) || {};
    const vals = valuesFor(mh.criterion);
    const pairs = COMMUNITIES.map((c) => ({ code: c.code, v: Number(vals[c.code]) })).filter((x) => Number.isFinite(x.v));
    mustHaveRanks[mh.pid] = percentileRanks(pairs, crit.lower);
  });

  const failedMustHave = [];
  const meetsMustHaves = (code) => activeMustHaves.every((mh) => {
    if (mh.kind === 'percentile') {
      const pct = mustHaveRanks[mh.pid][code];
      return Number.isFinite(pct) && pct >= mh.threshold;
    }
    const raw = Number(valuesFor(mh.criterion)[code]);
    if (!Number.isFinite(raw)) return false; // an unknown cannot satisfy a requirement
    return mh.kind === 'max' ? raw <= mh.threshold : raw >= mh.threshold;
  });

  const gated = candidates.filter((c) => {
    if (meetsMustHaves(c.code)) return true;
    failedMustHave.push(c);
    return false;
  });

  // ---------- 3. score the candidates on the chosen priorities
  // Ranks are taken across every community that publishes the metric, not just
  // the ones inside the budget, so "strong for schools" means strong in Dubai
  // and a score does not shift because the budget changed.
  const rankCache = {};
  priorities.forEach((p) => {
    p.criteria.forEach((crit) => {
      const vals = valuesFor(crit.id);
      const pairs = COMMUNITIES
        .map((c) => ({ code: c.code, v: Number(vals[c.code]) }))
        .filter((x) => Number.isFinite(x.v));
      rankCache[`${p.id}:${crit.id}`] = { ranks: percentileRanks(pairs, crit.lower), n: pairs.length };
    });
  });

  const scored = [];
  const unscored = [];
  gated.forEach((c) => {
    const parts = [];
    priorities.forEach((p) => {
      // Every criterion is reported with its own number and provenance, so any
      // score can be traced back to published data.
      const detail = p.criteria.map((crit) => {
        const meta = getMapDataPointMeta(crit.id);
        const raw = Number(valuesFor(crit.id)[c.code]);
        const pct = rankCache[`${p.id}:${crit.id}`].ranks[c.code];
        return {
          id: crit.id,
          label: meta ? meta.label : crit.id,
          value: Number.isFinite(raw) ? raw : null,
          percentile: Number.isFinite(pct) ? Math.round(pct) : null,
          betterWhen: crit.lower ? 'lower' : 'higher',
          source: meta ? meta.source : null,
          period: meta ? meta.period : null,
          note: meta ? meta.note : null,
          of: rankCache[`${p.id}:${crit.id}`].n,
        };
      });
      const got = detail.filter((d) => d.percentile != null);
      parts.push({
        id: p.id, label: p.label, rank: p.rank, weight: p.weight, detail,
        score: got.length ? got.reduce((a, b) => a + b.percentile, 0) / got.length : null,
        using: got.length, of: p.criteria.length,
        reasonLabel: p.reasonLabel || p.label.toLowerCase(),
      });
    });
    // At least half the chosen priorities must be measurable, otherwise the
    // score would describe the gaps rather than the community.
    const measured = parts.filter((p) => p.score != null);
    const needed = Math.max(1, Math.ceil(priorities.length / 2));
    if (priorities.length && measured.length < needed) {
      unscored.push({ ...c, reason: `no data for ${parts.filter((p) => p.score == null).map((p) => p.label.toLowerCase()).join(', ')}` });
      return;
    }
    // Weighted by the order the priorities were chosen in.
    const wSum = measured.reduce((t, p) => t + p.weight, 0);
    const raw = measured.length ? measured.reduce((t, p) => t + p.score * p.weight, 0) / wSum : null;

    // Confidence: how much of the brief could be measured, and how many records
    // sit behind the money figure. A thin case ranks below a firm one.
    const ev = c.cost ? evidenceFor(c.code) : { count: 0, months: 0, level: 'thin', text: 'no recorded transactions' };
    const coverageRatio = priorities.length ? measured.length / priorities.length : 1;
    const confidence = coverageRatio >= 0.99 && ev.level === 'firm' ? 'high'
      : coverageRatio >= 0.5 && ev.level !== 'thin' ? 'medium' : 'low';
    const factor = confidence === 'high' ? 1 : confidence === 'medium' ? 0.95 : 0.86;

    scored.push({
      ...c,
      score: raw == null ? null : raw * factor,
      rawScore: raw, confidence, evidence: ev,
      parts: parts.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
      missing: parts.filter((p) => p.score == null).map((p) => p.label),
    });
  });

  scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || ((a.cost ? a.cost.amount : Infinity) - (b.cost ? b.cost.amount : Infinity)));

  // In business mode the budget is a preference, not a gate: an area whose
  // proxy rent is within budget is surfaced first among equally good matches.
  if (mode === 'business' && budget != null && budget > 0) {
    scored.forEach((c) => { c.withinBudget = c.cost ? c.cost.amount <= budget : null; });
    scored.sort((a, b) => (Number(b.withinBudget === true) - Number(a.withinBudget === true)) || (b.score ?? -1) - (a.score ?? -1));
  }

  // ---------- 4. the sentence each result carries
  const results = scored.map((c) => {
    const strong = c.parts.filter((p) => p.score >= 55).slice(0, 2);
    const reasons = strong.length
      ? strong.map((p) => `${strength(p.score)} for ${p.reasonLabel}`)
      : [mode === 'business' ? 'affordable, but nothing stands out on your priorities' : 'within budget, but nothing stands out on your priorities'];
    const proxied = c.parts.map((p) => PROXY_NOTES[p.id]).filter(Boolean)[0];
    const weakest = c.parts[c.parts.length - 1];
    const caveat = !c.cost
      ? (mode === 'business' ? 'No registered rent here, so occupancy cost is unknown.' : mode === 'buy' ? 'No recorded sales here.' : 'No registered tenancies here.')
      : c.missing.length
        ? `No data for ${c.missing.join(' or ').toLowerCase()} here.`
        : proxied
        || (c.cost.usedFallback
          ? (mode === 'business'
            ? 'Scaled with the Dubai median home size; this area publishes none of its own.'
            : 'Price is the community-wide median, not this property type.')
          : null)
        || (weakest && weakest.score < 40 ? `Weakest on ${weakest.reasonLabel}.` : null)
        || (mode === 'rent' ? 'Rent is the registered median across all sizes.'
          : mode === 'business' ? 'Residential rent per m² stands in for commercial rent.'
            : 'Prices are recorded sales, not asking prices.');
    return {
      code: c.code,
      name: c.name,
      fullName: c.fullName,
      score: c.score == null ? null : Math.round(c.score),
      cost: c.cost,
      costText: !c.cost
        ? (mode === 'business' ? 'Rent not registered' : mode === 'buy' ? 'Price not recorded' : 'Rent not registered')
        : mode === 'buy'
          ? `≈ AED ${fmtAed(c.cost.amount)} for ${size.label.toLowerCase()} (${fmtAed(c.cost.perM2)}/m²)`
          : mode === 'rent' ? `≈ AED ${fmtAed(c.cost.amount)} a year`
            : `≈ AED ${fmtAed(c.cost.amount)} a month for ${size.m2} m² (${fmtAed(c.cost.perM2)}/m²/yr)`,
      reasons,
      caveat,
      withinBudget: c.withinBudget ?? null,
      confidence: c.confidence,
      confidenceText: c.confidence === 'high' ? 'Every priority measured, on firm transaction evidence'
        : c.confidence === 'medium' ? 'Most of the brief measured, on moderate evidence'
          : 'Judged on partial data or few transactions — score adjusted down',
      evidence: c.evidence,
      rawScore: c.rawScore == null ? null : Math.round(c.rawScore),
      parts: c.parts,
    };
  });

  return {
    mode,
    size,
    budget,
    businessType: type,
    businessTypeLabel: type ? (BUSINESS_TYPES.find((b) => b.id === type) || {}).label || null : null,
    priorities: priorities.map((p) => ({ id: p.id, label: p.label })),
    results,
    mustHaves: activeMustHaves.map((mh) => ({
      priority: mh.priority.label,
      label: (mh.options.find((o) => o.value === mh.threshold) || {}).label || String(mh.threshold),
    })),
    coverage: {
      total: COMMUNITIES.length,
      scored: results.length,
      failedMustHave: failedMustHave.length,
      withoutCost: noCostData.length,
      overBudget: overBudget.length,
      unscored: unscored.length,
      costSource: getMapDataPointMeta(costId)?.label || costId,
      costPeriod: getMapDataPointMeta(costId)?.period || null,
    },
    unscored,
  };
};

export { strength };
export default findMatches;
