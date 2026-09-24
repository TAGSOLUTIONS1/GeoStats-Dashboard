/**
 * Forecast registry: one spec per data point. The runner applies the same
 * pipeline (prepare → model → backtest → band → JSON) to every spec; the spec
 * decides the maths. Only price per m² has a per-area history in the bundled
 * data today, so it is the only enabled spec; the others are the families the
 * runner supports, ready for their series.
 */
module.exports = {
  'price-per-sqm': {
    enabled: true,
    family: 'level',            // market index × area share of the market
    label: 'Average price per m²',
    unit: 'AED/m²',
    frequency: 'monthly',
    transform: 'log',           // proportional growth
    winsor: [0.02, 0.98],       // one unusual sale must not steer a year
    minSales: null,             // not in the bundled export; noted in the output
    driver: 'dubai-index',      // src/data/average_meter_price/dubai_index.json
    ratioModels: ['ewma', 'drift'],
    ratioLambda: 0.3,
    horizon: 24,
    minHistory: 24,             // months with a value before an area gets its own ratio model
    backtestOrigins: 24,
    backtestHorizon: 12,
    naiveWindow: 24,
    // Anchoring the first forecast month to the recent recorded level was
    // tested (decay 0.85 over the median of the last 3 months) and rejected:
    // across 130 areas it raised the median backtest error from 15.9% to 16.7%
    // and was worse in 84 of them, while only moving the median first-month
    // step from 3.6% to 2.3%. The runner honours this field if it is set.
    anchor: null,
    // The model must beat the plain trend line by this margin to be worth
    // shipping; a tie goes to the simpler baseline.
    gateMargin: 0.98,
    // An area whose best model was off by more than this in testing gets no
    // forecast at all: its recorded prices mix property types too unevenly for
    // any line to mean something. The chart then says none is available.
    maxMape: 0.5,
    band: [0.1, 0.9],
    fallback: 'naive-trend',
    history: { dir: 'src/data/average_meter_price/historical_data', file: (areaId) => `avg_meter_price_${areaId}_2010onwards.json`, dateField: 'instance_date', valueField: 'avg_meter_price' },
    output: { dir: 'src/data/average_meter_price/forecasts/geostats', file: (areaId) => `forecast_area_${areaId}_2010onwards.json` },
    explain: 'Dubai-wide price index projected with a damped trend, multiplied by this area\'s typical share of the market (its smoothed price ratio to the index). Bands are the 10th–90th percentile of this model\'s own past errors at each horizon.',
  },

  // ---- families registered, disabled until their per-area series exist ----
  'transactions-per-month': {
    enabled: false, reason: 'bundled DLD export carries monthly averages only, no counts',
    family: 'count', unit: 'sales', frequency: 'monthly', transform: 'log1p', seasonal: 12, bounds: [0, null],
    horizon: 12, minHistory: 36, backtestOrigins: 24, backtestHorizon: 12, naiveWindow: 24, band: [0.1, 0.9], fallback: 'seasonal-naive',
    explain: 'Damped trend with yearly seasonal pattern on log counts; never below zero.',
  },
  'rent-per-sqm': {
    enabled: false, reason: 'per-area rent history not wired (DLD rent contracts via Dubai Pulse)',
    family: 'level', unit: 'AED/m²/yr', frequency: 'monthly', transform: 'log', winsor: [0.02, 0.98], driver: 'dubai-rent-index',
    ratioModels: ['ewma', 'drift'], ratioLambda: 0.3, horizon: 24, minHistory: 24, backtestOrigins: 24, backtestHorizon: 12, naiveWindow: 24, band: [0.1, 0.9], fallback: 'naive-trend',
    explain: 'Same market-index × area-share structure as sale prices, on the rent index.',
  },
  'gross-rental-yield': {
    enabled: false, reason: 'no per-area yield history',
    family: 'rate', unit: '%', frequency: 'monthly', transform: 'logit', meanReverting: true, bounds: [0, 1],
    horizon: 12, minHistory: 24, backtestOrigins: 24, backtestHorizon: 12, naiveWindow: 24, band: [0.1, 0.9], fallback: 'last-value',
    explain: 'Bounded rate on a logit scale, damped so it reverts toward the area\'s long-run level; stays inside 0–100%.',
  },
  'population': {
    enabled: false, reason: 'annual census points only (2011, 2014, 2015, 2018, 2022)',
    family: 'annual', unit: 'people', frequency: 'annual', transform: 'log', horizon: 5, minHistory: 3, backtestOrigins: 2, backtestHorizon: 2, naiveWindow: 3, band: [0.1, 0.9], fallback: 'naive-trend',
    explain: 'Linear trend on log population across census years; wide band because of the few points.',
  },
  'economic-health-score': {
    enabled: false, reason: 'composite: recomputed from its components\' forecasts, never forecast directly',
    family: 'composite', components: ['business-diversity', 'business-density', 'population-growth'],
  },
  'growth-rates': {
    enabled: false, reason: 'derived: YoY / MoM changes are computed from the level forecast so they stay consistent with it',
    family: 'derived',
  },
};
