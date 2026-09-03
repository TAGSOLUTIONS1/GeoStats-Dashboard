import catalog from '../data/worldbank/index.json';

import population from '../data/worldbank/population.json';
import populationGrowth from '../data/worldbank/population-growth.json';
import gdpPerCapita from '../data/worldbank/gdp-per-capita.json';
import incomeGrowth from '../data/worldbank/income-growth.json';
import employmentGrowth from '../data/worldbank/employment-growth.json';
import unemploymentRate from '../data/worldbank/unemployment-rate.json';
import lifeExpectancy from '../data/worldbank/life-expectancy.json';
import urbanPopulationPct from '../data/worldbank/urban-population-pct.json';
import inflation from '../data/worldbank/inflation.json';
import tertiaryEnrollment from '../data/worldbank/tertiary-enrollment.json';
import co2PerCapita from '../data/worldbank/co2-per-capita.json';
import internetUsersPct from '../data/worldbank/internet-users-pct.json';

// World Bank UAE indicators. NOTE: this data is country-level (one value per
// year for the whole UAE), so it cannot be used to colour the community map
// the way `population` from new_population.js is. Use it for charts/trends.
const datasets = {
  'population': population,
  'population-growth': populationGrowth,
  'gdp-per-capita': gdpPerCapita,
  'income-growth': incomeGrowth,
  'employment-growth': employmentGrowth,
  'unemployment-rate': unemploymentRate,
  'life-expectancy': lifeExpectancy,
  'urban-population-pct': urbanPopulationPct,
  'inflation': inflation,
  'tertiary-enrollment': tertiaryEnrollment,
  'co2-per-capita': co2PerCapita,
  'internet-users-pct': internetUsersPct,
};

// Maps a sidebar data point id -> the World Bank dataset backing it.
// Entries marked `proxy` are approximations, not the literal metric.
export const dataPointSources = {
  'unemployment-rate': { dataset: 'unemployment-rate', proxy: false },
  'median-household-income': { dataset: 'gdp-per-capita', proxy: true },
  'income-growth': { dataset: 'income-growth', proxy: true },
  'employment-growth': { dataset: 'employment-growth', proxy: true },
  'college-degree-rate': { dataset: 'tertiary-enrollment', proxy: true },
  'digital-infrastructure-score': { dataset: 'internet-users-pct', proxy: true },
  'environmental-quality-index': { dataset: 'co2-per-capita', proxy: true },
};

export const getCatalog = () => catalog;

export const getDataset = (id) => datasets[id] || null;

/** Full { year, value } series for a dataset id. */
export const getSeries = (id) => {
  const ds = datasets[id];
  return ds ? ds.series : [];
};

/** Most recent { year, value } for a dataset id. */
export const getLatest = (id) => {
  const series = getSeries(id);
  return series.length ? series[series.length - 1] : null;
};

/** Series for a sidebar data point id, or null if nothing backs it yet. */
export const getSeriesForDataPoint = (dataPointId) => {
  const mapping = dataPointSources[dataPointId];
  if (!mapping) return null;
  const ds = datasets[mapping.dataset];
  if (!ds) return null;
  return { ...ds, isProxy: mapping.proxy };
};

/** Year-over-year % change, derived from any absolute series. */
export const getYoYGrowth = (id) => {
  const series = getSeries(id);
  return series.slice(1).map((point, i) => {
    const prev = series[i].value;
    return {
      year: point.year,
      value: prev ? ((point.value - prev) / prev) * 100 : null,
    };
  });
};

export default datasets;
