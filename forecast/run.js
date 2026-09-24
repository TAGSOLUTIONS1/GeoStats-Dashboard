/**
 * Forecast runner: applies each enabled spec to every area and writes
 * forecast files in the shape the app already reads, plus a summary with the
 * backtest table. Pure arithmetic, deterministic, seconds to run.
 *
 *   node build-forecasts.js            # all enabled specs
 */
const fs = require('fs');
const path = require('path');
const specs = require('./specs');
const M = require('./models');
const { backtest } = require('./backtest');

const ROOT = path.join(__dirname, '..');
const AREAS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/average_meter_price/forecasts/Areas_id.json'), 'utf8'));
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/average_meter_price/dubai_index.json'), 'utf8'));

const monthKey = (d) => d.slice(0, 7);
const monthIndex = (key, startKey) => (Number(key.slice(0, 4)) - Number(startKey.slice(0, 4))) * 12 + (Number(key.slice(5, 7)) - Number(startKey.slice(5, 7)));
const keyAt = (startKey, i) => { const y = Number(startKey.slice(0, 4)) + Math.floor((Number(startKey.slice(5, 7)) - 1 + i) / 12); const m = ((Number(startKey.slice(5, 7)) - 1 + i) % 12) + 1; return `${y}-${String(m).padStart(2, '0')}`; };

const runLevelSpec = (id, spec) => {
  const T = M.TRANSFORMS[spec.transform];
  // ---- driver: the market index on a monthly grid, transformed
  const startKey = INDEX.rows[0].month;
  const endKey = INDEX.rows[INDEX.rows.length - 1].month;
  const N = monthIndex(endKey, startKey) + 1;
  const index = new Array(N).fill(null);
  INDEX.rows.forEach((r) => { if (T.valid(r.median)) index[monthIndex(r.month, startKey)] = T.fwd(r.median); });

  // Index model fitted once per origin (shared by every area at that origin)
  const indexFitCache = new Map();
  const indexModelAt = (upto) => { // data up to and including month `upto`
    if (!indexFitCache.has(upto)) indexFitCache.set(upto, M.fitDampedHolt(index.slice(0, upto + 1)));
    return indexFitCache.get(upto);
  };

  const origins = Array.from({ length: spec.backtestOrigins }, (_, k) => N - 1 - spec.backtestOrigins + k);
  const results = [];
  const skipped = [];
  const unreliable = [];
  const pooledErrors = { model: Array.from({ length: spec.backtestHorizon + 1 }, () => []), naive: Array.from({ length: spec.backtestHorizon + 1 }, () => []) };

  for (const area of AREAS) {
    const fp = path.join(ROOT, spec.history.dir, spec.history.file(area.area_id));
    if (!fs.existsSync(fp)) continue;
    const rows = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const raw = new Array(N).fill(null);
    rows.forEach((r) => { const k = monthKey(String(r[spec.history.dateField])); const v = Number(r[spec.history.valueField]); const i = monthIndex(k, startKey); if (i >= 0 && i < N && Number.isFinite(v) && T.valid(v)) raw[i] = v; });
    const obs = raw.filter((v) => v != null).length;
    if (obs === 0) continue;
    const y = M.winsorise(raw, spec.winsor).map((v) => (v == null ? null : T.fwd(v)));
    // ratio of the area to the market wherever both exist
    const ratio = y.map((v, i) => (v == null || index[i] == null ? null : v - index[i]));
    const lastObs = y.length - 1 - [...y].reverse().findIndex((v) => v != null);

    // ---- candidate forecasters, each closed over data up to `upto`
    const makeForecaster = (method, upto) => {
      const im = indexModelAt(upto);
      if (!im) return null;
      const rUpto = ratio.slice(0, upto + 1);
      const rObs = rUpto.filter((v) => v != null).length;
      const yUpto = y.slice(0, upto + 1);
      const lastSeen = yUpto.length - 1 - [...yUpto].reverse().findIndex((v) => v != null);
      if (!(lastSeen >= 0) || yUpto[lastSeen] == null) return null;

      // The market's path h months after the origin. Always the index
      // forecast: the origin is the newest month the index has, and inside the
      // backtest anything after the origin is exactly what must not be used.
      const marketAt = (h) => im.forecast(h);

      let base = null;
      if (method === 'ewma') {
        const r = rObs ? M.ewma(rUpto, spec.ratioLambda) : null;
        if (r == null) return null;
        base = (h) => marketAt(h) + r;
      } else if (method === 'drift') {
        if (rObs < spec.minHistory) return null;
        const rm = M.fitDampedHolt(rUpto);
        if (!rm) return null;
        base = (h) => marketAt(h) + rm.forecast(h);
      } else if (method === 'market') { // sparse areas: market trend × last 12-month mean ratio
        const recent = rUpto.filter((v) => v != null).slice(-12);
        if (!recent.length) return null;
        const r = recent.reduce((a, b) => a + b, 0) / recent.length;
        base = (h) => marketAt(h) + r;
      } else if (method === 'naive-trend') {
        const nm = M.naiveTrend(yUpto, spec.naiveWindow);
        if (!nm) return null;
        base = (h) => nm.forecast(h);
      }
      if (!base) return null;
      if (!spec.anchor) return base;

      // Anchor: close the gap between the model at the origin and the area's
      // recent recorded level, fading it out over the horizon.
      const recentVals = [];
      for (let t = lastSeen; t >= 0 && recentVals.length < spec.anchor.window; t--) if (yUpto[t] != null) recentVals.push(yUpto[t]);
      recentVals.sort((a, b) => a - b);
      const recentLevel = recentVals[recentVals.length >> 1];
      // measured at the last recorded month, which may be before the origin
      const offset = lastSeen - upto;
      const d0 = recentLevel - base(offset);
      if (!Number.isFinite(d0)) return base;
      return (h) => base(h) + d0 * Math.pow(spec.anchor.decay, h - offset);
    };

    // ---- backtest each candidate; origins need enough history before them
    // Under 12 recorded months there is nothing to validate against, so no
    // forecast is written: the chart says none is available, which is true.
    if (obs < 12) { skipped.push(area.name_en); continue; }
    const tooSparse = false;
    const candidates = obs >= spec.minHistory ? [...spec.ratioModels, 'naive-trend'] : ['market', 'naive-trend'];
    const scores = {};
    for (const method of candidates) {
      scores[method] = backtest({ y, origins, horizon: spec.backtestHorizon, fitForecast: (Tt) => (y.slice(0, Tt + 1).filter((v) => v != null).length >= Math.min(spec.minHistory, 12) ? makeForecaster(method, Tt) : null) });
    }
    const naiveMape = tooSparse ? null : scores['naive-trend'].mape;
    let method, gate;
    if (tooSparse) { method = 'market'; gate = 'unvalidated'; }
    else {
      // ewma is the default share model; drift (a trending share) must beat it
      // clearly on error AND get the direction right to be trusted.
      const s = scores;
      const ok = (m) => s[m] && s[m].mape != null;
      method = ok('ewma') ? 'ewma' : ok('market') ? 'market' : null;
      if (ok('drift') && (!ok('ewma') || (s.drift.mape < s.ewma.mape * 0.85 && (s.drift.directionHit ?? 0) >= 0.6))) method = 'drift';
      gate = 'model';
      const margin = spec.gateMargin ?? 1;
      if (method == null || (naiveMape != null && !(s[method].mape <= naiveMape * margin))) { method = 'naive-trend'; gate = 'fallback'; }
      if (scores[method] && scores[method].mape == null) gate = 'unvalidated';
    }
    const chosen = scores[method];
    chosen.errors.forEach((arr, h) => { if (h) pooledErrors[gate === 'fallback' ? 'naive' : 'model'][h].push(...arr); });

    // An unreliable model is worse than none: say there is no forecast.
    if (spec.maxMape != null && chosen.mape != null && chosen.mape > spec.maxMape) {
      unreliable.push(`${area.name_en} (${Math.round(chosen.mape * 100)}%)`);
      continue;
    }

    // ---- final forecast. The origin is the market's last month, so every
    // forecast starts after the newest data the app holds: an area whose sales
    // stopped earlier is not given "forecast" months that have already passed.
    const origin = N - 1;
    const fc = makeForecaster(method, origin);
    if (!fc) continue;
    results.push({ area, obs, lastObs, origin, y, method, gate, mape: chosen.mape, naiveMape, directionHit: chosen.directionHit, directionN: chosen.directionN, errors: chosen.errors, fc, lastValue: T.inv(y[lastObs]), staleMonths: origin - lastObs });
  }

  // ---- bands: per-area error quantiles at each horizon, pooled when thin
  const [qLo, qHi] = spec.band;
  const out = [];
  for (const r of results) {
    const rows = [];
    for (let h = 1; h <= spec.horizon; h++) {
      const hb = Math.min(h, spec.backtestHorizon);
      let errs = r.errors[hb];
      if (!errs || errs.length < 8) errs = pooledErrors[r.gate === 'fallback' ? 'naive' : 'model'][hb];
      // beyond the backtest horizon, widen the band with the square root of the extra horizon
      const widen = h > spec.backtestHorizon ? Math.sqrt(h / spec.backtestHorizon) : 1;
      // Error quantiles can sit on one side of zero when a model runs biased;
      // the band still has to contain the point forecast to read as a range.
      const lo = Math.min(0, M.quantile(errs, qLo) ?? -0.15) * widen, hi = Math.max(0, M.quantile(errs, qHi) ?? 0.15) * widen;
      const v = r.fc(h);
      rows.push({
        ds: `${keyAt(startKey, r.origin + h)}-01`,
        yhat: String(Math.round(M.TRANSFORMS[spec.transform].inv(v) * 100) / 100),
        yhat_lower: Math.floor(M.TRANSFORMS[spec.transform].inv(v + lo)),
        yhat_upper: Math.ceil(M.TRANSFORMS[spec.transform].inv(v + hi)),
        area_id: String(r.area.area_id), name_en: r.area.name_en,
        method: r.method === 'naive-trend' ? 'naive-trend' : `market×share (${r.method})`,
        validated: r.gate !== 'unvalidated' && r.mape != null,
        last_recorded_month: keyAt(startKey, r.lastObs),
        months_since_last_sale: r.staleMonths,
        backtest_mape: r.mape == null ? null : Math.round(r.mape * 1000) / 10,
        naive_mape: r.naiveMape == null ? null : Math.round(r.naiveMape * 1000) / 10,
        direction_hit: r.directionHit == null ? null : Math.round(r.directionHit * 100),
        observed_months: r.obs,
      });
    }
    const outDir = path.join(ROOT, spec.output.dir);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, spec.output.file(r.area.area_id)), JSON.stringify(rows));
    const last = rows[rows.length - 1];
    out.push({ area_id: r.area.area_id, name: r.area.name_en, observed: r.obs, method: last.method, validated: last.validated, backtest_mape: last.backtest_mape, naive_mape: last.naive_mape, direction_hit: last.direction_hit, months_since_last_sale: r.staleMonths, last_value: Math.round(r.lastValue), first_forecast: Math.round(Number(rows[0].yhat)), forecast_end: Math.round(Number(last.yhat)), change_pct: Math.round((Number(last.yhat) / r.lastValue - 1) * 1000) / 10 });
  }

  const idxModel = indexModelAt(N - 1);
  const summary = {
    builtAt: new Date().toISOString(), spec: id, horizonMonths: spec.horizon, lastDataMonth: endKey,
    index: { params: idxModel.params, forecastEnd: Math.round(M.TRANSFORMS[spec.transform].inv(idxModel.forecast(spec.horizon))), last: INDEX.rows[INDEX.rows.length - 1].median, changePct: Math.round((M.TRANSFORMS[spec.transform].inv(idxModel.forecast(spec.horizon)) / INDEX.rows[INDEX.rows.length - 1].median - 1) * 1000) / 10 },
    areas: out,
    skippedUnder12Months: skipped,
    skippedUnreliable: unreliable,
  };
  fs.writeFileSync(path.join(ROOT, spec.output.dir, 'summary.json'), JSON.stringify(summary, null, 1));
  return summary;
};

const main = () => {
  for (const [id, spec] of Object.entries(specs)) {
    if (!spec.enabled) { console.log(`skip ${id}: ${spec.reason}`); continue; }
    if (spec.family !== 'level') { console.log(`skip ${id}: family '${spec.family}' runner not implemented yet`); continue; }
    const s = runLevelSpec(id, spec);
    const a = s.areas;
    const model = a.filter((x) => x.method !== 'naive-trend');
    const med = (arr) => { const v = arr.filter((x) => x != null).sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : null; };
    console.log(`\n${id}: ${a.length} areas forecast ${s.horizonMonths} months from ${s.lastDataMonth}`);
    console.log(`  Dubai index: last ${s.index.last} → ${s.index.forecastEnd} AED/m² (${s.index.changePct >= 0 ? '+' : ''}${s.index.changePct}%), damped Holt ${JSON.stringify(s.index.params)}`);
    console.log(`  model chosen for ${model.length} areas (beat naive), naive-trend fallback for ${a.length - model.length}`);
    console.log(`  no forecast for ${s.skippedUnder12Months.length} areas with under 12 recorded months and ${s.skippedUnreliable.length} whose best model was off by over ${spec.maxMape * 100}% in testing`);
    console.log(`  median backtest MAPE: model areas ${med(model.map((x) => x.backtest_mape))}%  vs their naive ${med(model.map((x) => x.naive_mape))}%  | fallback areas ${med(a.filter((x) => x.method === 'naive-trend').map((x) => x.backtest_mape))}%`);
    console.log(`  median 12-month direction hit-rate: ${med(a.map((x) => x.direction_hit))}%`);
    console.log(`  areas rising / falling over the horizon: ${a.filter((x) => x.change_pct > 0).length} / ${a.filter((x) => x.change_pct < 0).length}; median change ${med(a.map((x) => x.change_pct))}%`);
    console.log('  sample (name | months | method | mape% | naive% | dir% | last → end):');
    a.slice(0, 8).forEach((x) => console.log(`   ${x.name.padEnd(22)} ${String(x.observed).padStart(3)}  ${x.method.padEnd(20)} ${String(x.backtest_mape).padStart(5)}  ${String(x.naive_mape).padStart(5)}  ${String(x.direction_hit).padStart(4)}  ${x.last_value} → ${x.forecast_end} (${x.change_pct >= 0 ? '+' : ''}${x.change_pct}%)`));
  }
};

module.exports = { main };
