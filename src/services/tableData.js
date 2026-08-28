// Real per-community rows for the Table View.
// Replaces the previous hardcoded placeholder rows, which showed invented
// figures (round numbers like 3,200,000) that were not sourced from anything.
import homeValue from '../data/dld18/home-value-by-community.json';
import pricePerSqm from '../data/amp/price-per-sqm-by-community.json';
import population from '../data/dsc/population-by-community.json';

const byCode = (rows) => {
  const m = new Map();
  rows.forEach((r) => m.set(String(r.code), r));
  return m;
};

const hv = byCode(homeValue.rows);
const pp = byCode(pricePerSqm.rows);
const po = byCode(population.rows);

const codes = new Set([...hv.keys(), ...pp.keys(), ...po.keys()]);

// A community earns a row only if it has at least one real measurement.
const rows = [...codes]
  .map((code) => {
    const h = hv.get(code);
    const p = pp.get(code);
    const o = po.get(code);
    return {
      code,
      area: (h && h.name) || (p && p.name) || (o && o.name) || code,
      homeValue: h && h.medianPrice != null ? h.medianPrice : null,
      pricePerSqm: p && p.latestPricePerSqm != null ? p.latestPricePerSqm : null,
      population: o && o.populationLatest != null ? o.populationLatest : null,
    };
  })
  .filter((r) => r.homeValue != null || r.pricePerSqm != null || r.population != null)
  // Rank by home value where known, then by population, so the top of the
  // table is the part with the most complete data.
  .sort((a, b) => (b.homeValue || 0) - (a.homeValue || 0) || (b.population || 0) - (a.population || 0))
  .map((r, i) => ({ rk: i + 1, ...r }));

export const tableRows = rows;

export const tableSources = {
  homeValue: 'DLD transactions (2020-2022 pooled)',
  pricePerSqm: 'Dubai area price history (2025)',
  population: 'Dubai Statistics Center (2022)',
};

export default tableRows;
