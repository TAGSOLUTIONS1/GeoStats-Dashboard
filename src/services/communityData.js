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
