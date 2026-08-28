// Data points shown as a card (a trend line or a distribution) rather than
// painted on the map, because the underlying data is not per-community.
import { getSeriesForDataPoint } from './worldbank';
import housingUnits from '../data/dsc/housing-units.json';
import ageDistribution from '../data/dsc/age-distribution.json';
import housingGrowth from '../data/dsc/housing-growth.json';
import poverty from '../data/hdx/poverty.json';
import homeSales from '../data/dld18/home-sales-history.json';
import homeValueMom from '../data/dld/home-value-mom.json';
import offplanShare from '../data/dld/offplan-share.json';
import mortgageShare from '../data/dld/mortgage-share.json';
import rentalRate from '../data/yield/rental-rate.json';
import priceToRent from '../data/yield/price-to-rent.json';
import hvYoy from '../data/dld18/home-value-growth-yoy.json';
import hv5y from '../data/dld18/home-value-growth-5year.json';

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
  'home-sales': {
    kind: 'series',
    label: homeSales.label,
    unit: homeSales.unit,
    scopeLabel: 'Dubai emirate',
    series: homeSales.series,
    yearRange: homeSales.yearRange,
    source: 'DLD transactions (unofficial mirror)',
    isProxy: false,
  },
  'home-value-growth-mom': {
    kind: 'series',
    label: homeValueMom.label,
    unit: homeValueMom.unit,
    scopeLabel: 'Dubai emirate',
    series: homeValueMom.series,
    yearRange: homeValueMom.yearRange,
    source: 'DLD transactions (unofficial mirror)',
    isProxy: false,
  },
  'offplan-share': {
    kind: 'series', label: offplanShare.label, unit: 'percent', scopeLabel: 'Dubai emirate',
    series: offplanShare.series, yearRange: offplanShare.yearRange,
    source: 'DLD transactions (unofficial mirror)', isProxy: false,
  },
  'mortgage-share': {
    kind: 'series', label: mortgageShare.label, unit: 'percent', scopeLabel: 'Dubai emirate',
    series: mortgageShare.series, yearRange: mortgageShare.yearRange,
    source: 'DLD transactions (unofficial mirror)', isProxy: false,
  },
  'home-value-growth-yoy': {
    kind: 'series', label: hvYoy.label, unit: 'percent', scopeLabel: 'Dubai emirate',
    series: hvYoy.series, yearRange: hvYoy.yearRange,
    source: 'DLD 1995-2023 transactions (mirror)', isProxy: false,
  },
  'home-value-growth-5year': {
    kind: 'series', label: hv5y.label, unit: 'percent', scopeLabel: 'Dubai emirate',
    series: hv5y.series, yearRange: hv5y.yearRange,
    source: 'DLD 1995-2023 transactions (mirror)', isProxy: false,
  },
  'rental-rate': {
    kind: 'value', label: rentalRate.label, unit: 'aed', scopeLabel: 'Dubai emirate',
    value: rentalRate.value, areas: rentalRate.areas, period: rentalRate.period,
    note: 'Derived from sale price x gross yield',
    source: 'Dubai area yields dataset (origin unstated)', isProxy: false,
  },
  'home-value-to-rent-ratio': {
    kind: 'value', label: priceToRent.label, unit: 'years', scopeLabel: 'Dubai emirate',
    value: priceToRent.value, areas: priceToRent.areas, period: priceToRent.period,
    note: 'Years of rent equal to the purchase price',
    source: 'Dubai area yields dataset (origin unstated)', isProxy: false,
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
