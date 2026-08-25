// Data points shown as a card (a trend line or a distribution) rather than
// painted on the map, because the underlying data is not per-community.
import { getSeriesForDataPoint } from './worldbank';
import housingUnits from '../data/dsc/housing-units.json';
import ageDistribution from '../data/dsc/age-distribution.json';
import housingGrowth from '../data/dsc/housing-growth.json';
import poverty from '../data/hdx/poverty.json';

const localDatasets = {
  'housing-units': {
    kind: 'series',
    label: housingUnits.label,
    unit: housingUnits.unit,
    scopeLabel: 'Dubai emirate',
    series: housingUnits.series,
    yearRange: housingUnits.yearRange,
    source: 'UAE census series (ArcGIS)',
    isProxy: false,
  },
  'housing-units-growth-rate': {
    kind: 'series',
    label: housingGrowth.label,
    unit: housingGrowth.unit,
    scopeLabel: 'Dubai emirate',
    series: housingGrowth.series,
    yearRange: housingGrowth.yearRange,
    source: 'UAE census series (ArcGIS)',
    isProxy: false,
  },
  'poverty-rate': {
    kind: 'series',
    label: poverty.label,
    unit: poverty.unit,
    scopeLabel: 'UAE nationwide',
    series: poverty.series,
    yearRange: poverty.yearRange,
    source: 'World Bank via HDX',
    isProxy: false,
  },
  'median-age': {
    kind: 'distribution',
    label: ageDistribution.label,
    unit: ageDistribution.unit,
    scopeLabel: 'Dubai emirate',
    value: ageDistribution.medianAge,
    year: ageDistribution.year,
    bands: ageDistribution.bands,
    totalPopulation: ageDistribution.totalPopulation,
    malePct: ageDistribution.malePct,
    source: 'UAE population by age (ArcGIS)',
    isProxy: false,
  },
};

/** Resolves a sidebar data point id to a card-renderable dataset, or null. */
export const getCardDataset = (dataPointId) => {
  if (localDatasets[dataPointId]) return localDatasets[dataPointId];

  const wb = getSeriesForDataPoint(dataPointId);
  if (!wb || !wb.series || !wb.series.length) return null;
  return {
    kind: 'series',
    label: wb.label,
    unit: wb.unit,
    scopeLabel: 'UAE nationwide',
    series: wb.series,
    yearRange: wb.yearRange,
    source: `World Bank Open Data${wb.lastUpdated ? ` · updated ${wb.lastUpdated}` : ''}`,
    isProxy: wb.isProxy,
  };
};

export const hasCard = (dataPointId) => getCardDataset(dataPointId) !== null;

export default localDatasets;
