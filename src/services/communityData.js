// Registry of every data point that can be painted on the community map.
// Each entry resolves to a COMM_NUM -> number lookup, so Map.jsx can merge the
// values onto the GeoJSON features and colour by them.
import greenSpace from '../data/osm/green-space.json';
import healthcare from '../data/osm/healthcare.json';
import transport from '../data/osm/transport.json';
import populationByCommunity from '../data/dsc/population-by-community.json';
import trafficSafety from '../data/dsc/traffic-safety.json';
import schoolQuality from '../data/osm/school-quality.json';
import jobDiversity from '../data/osm/job-diversity.json';
import walkability from '../data/osm/walkability.json';

const GREEN = ['#e8f5e9', '#c8e6c9', '#81c784', '#4caf50', '#2e7d32', '#1b5e20'];
// Safety is inverted: many incidents = bad, so the scale runs green -> red.
const SAFETY = ['#1b5e20', '#66bb6a', '#fff59d', '#ffb74d', '#e57373', '#b71c1c'];
const BLUE = ['#e3f2fd', '#bbdefb', '#64b5f6', '#2196f3', '#1565c0', '#0d47a1'];

export const mapDataPoints = {
  'green-space-per-capita': {
    dataset: greenSpace,
    property: 'GreenSpace_Per10k',
    metric: 'per10kPeople',
    label: 'Green spaces per 10k residents',
    stops: [0, 0.42, 1.81, 9.26, 31.7, 80],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'healthcare-accessibility-score': {
    dataset: healthcare,
    property: 'Healthcare_PerSqKm',
    metric: 'perSqKm',
    label: 'Healthcare facilities per km²',
    stops: [0, 0.13, 0.32, 1.13, 4.4, 10.7],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'public-transportation-coverage': {
    dataset: transport,
    property: 'Transport_PerSqKm',
    metric: 'perSqKm',
    label: 'Transit stops per km²',
    stops: [0, 0.11, 0.38, 1.52, 4.7, 10.6],
    palette: GREEN,
    source: 'OpenStreetMap',
  },
  'population-growth': {
    dataset: populationByCommunity,
    property: 'PopGrowth_Cagr',
    metric: 'growthCagrPct',
    label: 'Population growth (annual %, 2011–2022)',
    stops: [-0.29, 2.46, 5.68, 16.1, 39.5, 80],
    palette: BLUE,
    source: 'Dubai Statistics Center',
  },
  'community-safety-score': {
    dataset: trafficSafety,
    property: 'Safety_IncidentsPer1k',
    metric: 'per1kPeople',
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
    label: 'Average DSIB school rating (1–5)',
    stops: [2, 2.5, 3, 3.5, 4.25, 5],
    palette: BLUE,
    source: 'KHDA DSIB ratings',
  },
  'job-market-diversity': {
    dataset: jobDiversity,
    property: 'Jobs_Diversity',
    metric: 'jobDiversity',
    label: 'Business category diversity (Shannon H)',
    stops: [1.86, 2.35, 2.66, 3.04, 3.17, 3.45],
    palette: BLUE,
    source: 'OpenStreetMap',
  },
  'walkability-score': {
    dataset: walkability,
    property: 'Walk_PerSqKm',
    metric: 'walkPerSqKm',
    label: 'Pedestrian ways per km²',
    stops: [0.27, 7.95, 34, 73.6, 116.9, 200],
    palette: GREEN,
    source: 'OpenStreetMap',
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
    note: dataset.note || null,
    communities: Object.keys(getValuesByCommunity(dataPointId) || {}).length,
  };
};

export default mapDataPoints;
