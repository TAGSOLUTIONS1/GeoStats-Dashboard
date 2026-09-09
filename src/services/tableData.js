// Per-community rows for the Table View.
//
// Every map data point registered in communityData.js can be shown as a
// column, plus Population (which the map paints from its own dataset). Cards
// (Dubai-wide series / single values) have no per-community rows, so they are
// not offered.
import { geojsonData } from '../data/geoData';
import population from '../data/dsc/population-by-community.json';
import { mapDataPoints, getValuesByCommunity, getMapDataPointMeta } from './communityData';
import { dataSections } from '../data/sidebarData';

const allPoints = dataSections.flatMap((s) => s.items || []).filter(Boolean);
const getDataPointById = (id) => allPoints.find((dp) => dp.id === id);

const POPULATION_ID = 'population';

/** All 226 communities on the map, in a stable order. */
export const communities = geojsonData.features.map((f) => ({
  code: String(f.properties.COMM_NUM),
  name: f.properties.CNAME_E,
}));

/** Ids the table can actually supply values for. */
export const tableBackedIds = new Set([...Object.keys(mapDataPoints), POPULATION_ID]);

/** Columns shown when the table first opens. */
export const defaultColumnIds = ['home-value', 'price-per-sqm', POPULATION_ID];

const populationValues = (() => {
  const out = {};
  population.rows.forEach((r) => {
    if (r.populationLatest != null) out[String(r.code)] = r.populationLatest;
  });
  return out;
})();

const cache = new Map();

/** code -> value for one data point (null-free). */
export const getColumnValues = (id) => {
  if (cache.has(id)) return cache.get(id);
  const values = id === POPULATION_ID ? populationValues : getValuesByCommunity(id) || {};
  cache.set(id, values);
  return values;
};

/** How to print a cell for a data point, mirroring the map labels. */
export const getColumnFormat = (id) => {
  if (id === POPULATION_ID) return { digits: 0, divisor: 1, suffix: '', currency: false };
  const cfg = mapDataPoints[id];
  if (!cfg) return { digits: 0, divisor: 1, suffix: '', currency: false };
  const suffix = cfg.labelSuffix || '';
  return {
    digits: cfg.labelDigits ?? 1,
    divisor: cfg.labelDivisor || 1,
    suffix,
    // Plain AED amounts read best as currency; anything with a divisor or a
    // rate suffix (per mo, per yr, %, km) keeps the map's own label style.
    currency: /AED/.test(suffix) && !cfg.labelDivisor && !/\/|per/.test(suffix),
  };
};

export const formatCell = (value, id) => {
  if (value === null || value === undefined || value === '') return '—';
  const f = getColumnFormat(id);
  if (f.currency) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  }
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: f.digits, maximumFractionDigits: f.digits,
  }).format(value / f.divisor);
  return `${n}${f.suffix}`;
};

/** Short header text for a column. */
export const getColumnLabel = (id) => {
  if (id === POPULATION_ID) return 'Population';
  return getDataPointById(id)?.label || getMapDataPointMeta(id)?.label || id;
};

/** Source line for a column (used in the CSV export). */
export const getColumnSource = (id) => {
  if (id === POPULATION_ID) return `${population.source || 'Dubai Statistics Center'} (${population.period || 'latest'})`;
  const meta = getMapDataPointMeta(id);
  return meta ? `${meta.source}${meta.period ? ` (${meta.period})` : ''}` : '';
};

/**
 * Build rows for the chosen columns. A community earns a row only if it has
 * a value in at least one of them, so the table never fills with blanks.
 */
export const buildRows = (columnIds) => {
  const valueSets = columnIds.map((id) => getColumnValues(id));
  return communities
    .map((c) => {
      const row = { code: c.code, area: c.name };
      columnIds.forEach((id, i) => {
        const v = valueSets[i][c.code];
        row[id] = v === undefined ? null : v;
      });
      return row;
    })
    .filter((row) => columnIds.some((id) => row[id] != null));
};

/** CSV text for the current columns, with a source line per column. */
export const toCsv = (columnIds, rows) => {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = ['Rank', 'Area', ...columnIds.map(getColumnLabel)].map(esc).join(',');
  const body = rows.map((r, i) =>
    [i + 1, r.area, ...columnIds.map((id) => (r[id] == null ? '' : r[id]))].map(esc).join(',')
  );
  const sources = columnIds.map((id) => esc(`Source - ${getColumnLabel(id)}: ${getColumnSource(id)}`));
  return [header, ...body, '', ...sources].join('\n');
};

export default buildRows;
