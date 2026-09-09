// Registry of every data point that can be painted on the community map.
// Each entry resolves to a COMM_NUM -> number lookup, so Map.jsx can merge the
// values onto the GeoJSON features and colour by them.
import greenSpace from '../data/osm/green-space.json';
import healthcare from '../data/osm/healthcare.json';
import transport from '../data/osm/transport.json';
import populationByCommunity from '../data/dsc/population-by-community.json';
import trafficSafety from '../data/dsc/traffic-safety.json';
import homeValue from '../data/dld18/home-value-by-community.json';
import ppsmByCommunity from '../data/amp/price-per-sqm-by-community.json';
import capRate from '../data/dldx/cap-rate.json';
import rentalRate from '../data/dldx/rental-rate.json';
import rentForHouses from '../data/dldx/rent-for-houses.json';
import priceToRent from '../data/dldx/price-to-rent.json';
import schoolQuality from '../data/osm/school-quality.json';
import jobDiversity from '../data/osm/job-diversity.json';
import walkability from '../data/osm/walkability.json';
import accessibility from '../data/osm/accessibility.json';
import rentPctIncome from '../data/dldx/rent-as-percent-of-income.json';
import longTermGrowth from '../data/composite/long-term-growth-score.json';
import medianListing from '../data/pf/median-listing-price.json';
import affordability from '../data/derived/affordability.json';
import schoolingCost from '../data/schools/schooling-cost-by-community.json';
import emergencyProximity from '../data/osm/emergency-proximity.json';
import livability from '../data/composite/livability-score.json';
import culturalDiversity from '../data/schools/cultural-diversity-index.json';
import valueIncome from '../data/derived/value-income.json';
import mtgPctIncome from '../data/derived/mtg-payments-income-percent.json';
import ownershipCost from '../data/derived/monthly-home-ownership-cost.json';
import overvalued from '../data/derived/overvalued-percent.json';
import forSaleInventory from '../data/pf/for-sale-inventory.json';
import affordabilityIndex from '../data/composite/affordability-index.json';
import marketHealth from '../data/composite/housing-market-health-score.json';
import schoolScore from '../data/composite/school-quality-score.json';
import economicHealth from '../data/composite/economic-health-score.json';

const GREEN = ['#e8f5e9', '#c8e6c9', '#81c784', '#4caf50', '#2e7d32', '#1b5e20'];
// Safety is inverted: many incidents = bad, so the scale runs green -> red.
const SAFETY = ['#1b5e20', '#66bb6a', '#fff59d', '#ffb74d', '#e57373', '#b71c1c'];
const BLUE = ['#e3f2fd', '#bbdefb', '#64b5f6', '#2196f3', '#1565c0', '#0d47a1'];

export const mapDataPoints = {
  'green-space-per-capita': {
    dataset: greenSpace,
    property: 'GreenSpace_Per10k',
    metric: 'per10kPeople',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Green spaces per 10k residents',
    stops: [0, 0.42, 1.81, 9.26, 31.7, 80],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'healthcare-accessibility-score': {
    dataset: healthcare,
    property: 'Healthcare_PerSqKm',
    metric: 'perSqKm',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Healthcare facilities per km²',
    stops: [0, 0.13, 0.32, 1.13, 4.4, 10.7],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'public-transportation-coverage': {
    dataset: transport,
    property: 'Transport_PerSqKm',
    metric: 'perSqKm',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Transit stops per km²',
    stops: [0, 0.11, 0.38, 1.52, 4.7, 10.6],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'population-growth': {
    dataset: populationByCommunity,
    property: 'PopGrowth_Cagr',
    metric: 'growthCagrPct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Population growth (annual %, 2011–2022)',
    stops: [-0.29, 2.46, 5.68, 16.1, 39.5, 80],
    palette: BLUE,
    source: 'Dubai Statistics Center',
  },
  'community-safety-score': {
    dataset: trafficSafety,
    property: 'Safety_IncidentsPer1k',
    metric: 'per1kPeople',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Road incidents per 1k people (2023–25)',
    stops: [11.1, 21.6, 39.6, 58.6, 96.5, 217],
    palette: SAFETY,
    source: 'Dubai Traffic Incident Reports',
    inverted: true,
  },
  'emergency-services-response-time': {
    dataset: emergencyProximity,
    property: 'Emergency_AvgKm',
    metric: 'avgKm',
    labelDigits: 1,
    labelSuffix: ' km',
    label: 'Avg. distance to nearest fire station, police & hospital (km)',
    stops: [0.55, 1.46, 3.05, 5.32, 10.68, 68.7],
    palette: SAFETY,
    source: 'OpenStreetMap (Overpass, Sep 2026)',
    inverted: true,
  },
  'livability-score': {
    dataset: livability,
    property: 'Livability_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Livability score (0–100, percentile composite)',
    stops: [16.9, 42.4, 52.7, 61.9, 68.7, 84],
    palette: GREEN,
    source: 'Composite of 6 GeoStats layers (OSM, KHDA, Dubai Police)',
  },
  'cultural-diversity-index': {
    dataset: culturalDiversity,
    property: 'CulturalDiversity_Index',
    metric: 'index',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Cultural diversity index (school-curriculum proxy, 0–100)',
    stops: [14.8, 23, 35.1, 39.2, 45.9, 54.5],
    palette: BLUE,
    source: 'KHDA school curricula 2024/25 (proxy)',
  },
  'average-schooling-cost': {
    dataset: schoolingCost,
    property: 'School_MeanFee',
    metric: 'meanAnnualFee',
    labelDigits: 0,
    labelDivisor: 1000,
    labelSuffix: 'K AED/yr',
    label: 'Average annual school fee (AED)',
    stops: [10099, 19785, 32342, 47969, 59105, 70689],
    palette: BLUE,
    source: 'KHDA fee schedules 2024/25 (bundled)',
  },
  'public-school-quality-rating': {
    dataset: schoolQuality,
    property: 'School_AvgRating',
    metric: 'avgRating',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Average DSIB school rating (1–5)',
    stops: [2, 2.5, 3, 3.5, 4.25, 5],
    palette: BLUE,
    source: 'KHDA DSIB ratings',
  },
  'job-market-diversity': {
    dataset: jobDiversity,
    property: 'Jobs_Diversity',
    metric: 'jobDiversity',
    labelDigits: 2,
    labelSuffix: '',
    label: 'Business category diversity (Shannon H)',
    stops: [1.86, 2.35, 2.66, 3.04, 3.17, 3.45],
    palette: BLUE,
    source: 'OpenStreetMap',
  },
  'walkability-score': {
    dataset: walkability,
    property: 'Walk_PerSqKm',
    metric: 'walkPerSqKm',
    labelDigits: 1,
    labelSuffix: '',
    label: 'Pedestrian ways per km²',
    stops: [0.27, 7.95, 34, 73.6, 116.9, 200],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'home-value': {
    dataset: homeValue,
    property: 'HomeValue_Median',
    metric: 'medianPrice',
    labelDigits: 1,
    labelDivisor: 1000000,
    labelSuffix: 'M AED',
    label: 'Median home sale price (AED)',
    stops: [400000, 525000, 850000, 1967888, 2436630, 8000000],
    palette: BLUE,
    source: 'Dubai Land Department 1995-2023 export (mirror)',
  },
  'price-per-sqm': {
    dataset: ppsmByCommunity,
    property: 'PricePerSqm',
    metric: 'latestPricePerSqm',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Price per m² (AED)',
    stops: [3125, 6754, 14014, 20786, 28108, 43635],
    palette: BLUE,
    source: 'Dubai area price history (DLD-derived)',
  },
  'cap-rate': {
    dataset: capRate,
    property: 'CapRate_Gross',
    metric: 'capRatePct',
    labelDigits: 2,
    labelSuffix: '%',
    label: 'Gross rental yield (%)',
    stops: [1.78, 2.67, 4.07, 5.2, 6.72, 9.09],
    palette: GREEN,
    source: 'DLD Exchange (Ejari + DLD, 2026 YTD)',
  },
  'rental-rate': {
    dataset: rentalRate,
    property: 'Rent_Flat',
    metric: 'flatRentAed',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Median annual flat rent (AED)',
    stops: [40000, 50000, 60000, 79380, 115000, 205000],
    palette: BLUE,
    source: 'DLD Exchange (Ejari, 2026 YTD)',
  },
  'rent-for-houses': {
    dataset: rentForHouses,
    property: 'Rent_Villa',
    metric: 'villaRentAed',
    labelDigits: 0,
    labelSuffix: ' AED',
    label: 'Median annual villa rent (AED)',
    stops: [110000, 150000, 190000, 280000, 310000, 1450000],
    palette: BLUE,
    source: 'DLD Exchange (Ejari, 2026 YTD)',
  },
  'home-value-to-rent-ratio': {
    dataset: priceToRent,
    property: 'PriceToRent_Years',
    metric: 'priceToRentYears',
    labelDigits: 1,
    labelSuffix: ' yrs',
    label: 'Home value to rent ratio (years)',
    stops: [14.4, 19, 23, 37.4, 51.4, 75.3],
    palette: SAFETY,
    source: 'DLD Exchange (Ejari + DLD, 2026 YTD)',
  },
  'disability-accessibility-score': {
    dataset: accessibility,
    property: 'Access_Pct',
    metric: 'accessiblePct',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Wheelchair-accessible share of tagged places (%)',
    stops: [8.1, 27.3, 43.2, 66.7, 83.8, 90.9],
    palette: GREEN,
    source: 'OpenStreetMap (wheelchair tag)',
  },
  'rent-as-percent-of-income': {
    dataset: rentPctIncome,
    property: 'RentPctIncome',
    metric: 'pctOfIncome',
    labelDigits: 1,
    labelSuffix: '%',
    label: 'Rent as % of income (proxy)',
    stops: [21.7, 27.1, 32.5, 43, 62.3, 111],
    palette: SAFETY,
    source: 'DLD Exchange (Ejari, 2026 YTD) / World Bank GDP proxy',
  },
  'long-term-growth-score': {
    dataset: longTermGrowth,
    property: 'GrowthScore',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Long-term growth score (0-100)',
    stops: [35, 44, 59, 75, 84, 90],
    palette: BLUE,
    source: 'In-house composite (population + home value + income growth)',
  },
  'median-listing-price': {
    dataset: medianListing,
    property: 'ListingPrice_Median',
    metric: 'medianListingPrice',
    labelDigits: 1,
    labelDivisor: 1000000,
    labelSuffix: 'M AED',
    label: 'Median asking price (AED)',
    stops: [992500, 1344876, 1760000, 2825000, 3490000, 5495000],
    palette: BLUE,
    source: 'Property Finder listings (Feb 2026 snapshot)',
  },
  'mortgage-payment': {
    dataset: affordability,
    property: 'Mortgage_Monthly',
    metric: 'mortgageMonthly',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Est. monthly mortgage payment (AED)',
    stops: [4187, 5673, 7424, 11917, 14722, 23179],
    palette: BLUE,
    source: 'Derived: PF Feb-2026 asking x ENBD 3.99% / 25yr / 80% LTV',
  },
  'salary-to-afford-a-house': {
    dataset: affordability,
    property: 'Salary_ToAfford',
    metric: 'salaryToAfford',
    labelDigits: 0,
    labelDivisor: 1000,
    labelSuffix: 'K AED/yr',
    label: 'Income needed to afford a home (AED/yr)',
    stops: [167466, 226922, 296967, 476665, 588872, 927178],
    palette: BLUE,
    source: 'Derived: 30% of income to mortgage (ENBD 3.99% / 25yr / 80% LTV)',
  },
  'buy-v-rent-differential': {
    dataset: affordability,
    property: 'BuyVsRent_Monthly',
    metric: 'buyVsRentMonthly',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Buy vs rent: mortgage minus rent (AED/mo)',
    stops: [-1140, -177, 1061, 3072, 4722, 6096],
    palette: SAFETY,
    source: 'Derived: ENBD mortgage vs Ejari 2026 flat rent',
  },
  'overvalued-percent': {
    dataset: overvalued,
    property: 'Overvalued_Pct',
    metric: 'overvaluedPct',
    labelDigits: 0,
    labelSuffix: '%',
    label: 'Over / undervalued vs its own price-to-income history',
    stops: [-38, 3, 24, 40, 66, 182],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: community price/m2 history / UAE GDP per capita',
  },
  'value-income': {
    dataset: valueIncome,
    property: 'ValueToIncome',
    metric: 'valueToIncome',
    labelDigits: 1,
    labelSuffix: 'x income',
    label: 'Home value as a multiple of annual income',
    stops: [3.4, 6.5, 8.4, 11.9, 16.8, 29.8],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: PF Feb-2026 asking / UAE GDP per capita 2024',
  },
  'mtg-payments-income-percent': {
    dataset: mtgPctIncome,
    property: 'MtgPct_Income',
    metric: 'pctOfIncome',
    labelDigits: 0,
    labelSuffix: '% of income',
    label: 'Mortgage payments as % of income',
    stops: [17.3, 32.9, 42.6, 60.3, 85, 150.7],
    palette: SAFETY,
    inverted: true,
    source: 'Derived: ENBD 3.99% / 25yr / 80% LTV vs UAE GDP per capita',
  },
  'monthly-home-ownership-cost': {
    dataset: ownershipCost,
    property: 'Ownership_Monthly',
    metric: 'monthlyCost',
    labelDigits: 0,
    labelSuffix: ' AED/mo',
    label: 'Est. monthly ownership cost (AED)',
    stops: [3236, 6162, 7981, 11297, 15919, 28216],
    palette: BLUE,
    source: 'Derived: ENBD mortgage + stated service-charge assumption',
  },
  'for-sale-inventory': {
    dataset: forSaleInventory,
    property: 'ForSale_Listings',
    metric: 'listings',
    labelDigits: 0,
    labelSuffix: ' listings',
    label: 'Residential listings on the market',
    stops: [1, 2, 5, 18, 37, 158],
    palette: BLUE,
    source: 'Property Finder listings (Feb 2026 snapshot)',
  },
  'affordability-index': {
    dataset: affordabilityIndex,
    property: 'Affordability_Index',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Affordability index (0-100, higher = more affordable)',
    stops: [14, 30, 43, 51, 61, 91],
    palette: GREEN,
    source: 'In-house composite of four affordability data points',
  },
  'housing-market-health-score': {
    dataset: marketHealth,
    property: 'MarketHealth_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Housing market health score (0-100)',
    stops: [9, 26, 43, 56, 67, 91],
    palette: BLUE,
    source: 'In-house composite: yield, transaction depth, price growth',
  },
  'school-quality-score': {
    dataset: schoolScore,
    property: 'SchoolQuality_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'School quality score (0-100)',
    stops: [9, 29, 46, 54, 67, 87],
    palette: GREEN,
    source: 'In-house composite: DSIB ratings, density, curricula, fees',
  },
  'economic-health-score': {
    dataset: economicHealth,
    property: 'EconomicHealth_Score',
    metric: 'score',
    labelDigits: 0,
    labelSuffix: '',
    label: 'Economic health score (0-100)',
    stops: [9, 34, 45, 55, 64, 90],
    palette: GREEN,
    source: 'In-house composite: business diversity, density, population growth',
  },
};


/** COMM_NUM -> metric value for one sidebar data point (null values dropped). */
export const getValuesByCommunity = (dataPointId) => {
  const cfg = mapDataPoints[dataPointId];
  if (!cfg) return null;
  const out = {};
  cfg.dataset.rows.forEach((row) => {
    const value = row[cfg.metric];
    if (value != null) out[row.code] = value;
  });
  return out;
};

/** Metadata for the legend / attribution line. */
export const getMapDataPointMeta = (dataPointId) => {
  const cfg = mapDataPoints[dataPointId];
  if (!cfg) return null;
  const { dataset, label, source, inverted } = cfg;
  return {
    label,
    source,
    stops: cfg.stops,
    palette: cfg.palette,
    inverted: !!inverted,
    period: dataset.period || null,
    note: dataset.limitation || dataset.note || null,
    communities: Object.keys(getValuesByCommunity(dataPointId) || {}).length,
  };
};

export default mapDataPoints;
