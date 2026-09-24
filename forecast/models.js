/**
 * Model building blocks for the forecast runner. Everything works on a plain
 * array indexed by month (or year) with null for missing periods, on a
 * transformed scale chosen by the data point's spec.
 */

// ---- transforms -----------------------------------------------------------
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const TRANSFORMS = {
  // price levels: proportional growth
  log: { fwd: (v) => Math.log(v), inv: (v) => Math.exp(v), valid: (v) => v > 0 },
  // counts: zero is common
  log1p: { fwd: (v) => Math.log1p(v), inv: (v) => Math.max(0, Math.expm1(v)), valid: (v) => v >= 0 },
  // bounded rates in [0,1]
  logit: {
    fwd: (v) => { const p = clamp(v, 1e-4, 1 - 1e-4); return Math.log(p / (1 - p)); },
    inv: (v) => 1 / (1 + Math.exp(-v)),
    valid: (v) => v >= 0 && v <= 1,
  },
  none: { fwd: (v) => v, inv: (v) => v, valid: () => true },
};

// Winsorise the non-null values of a series at the given quantiles.
const winsorise = (ys, [lo, hi]) => {
  const vals = ys.filter((v) => v != null).sort((a, b) => a - b);
  if (vals.length < 10) return ys;
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const a = q(lo), b = q(hi);
  return ys.map((v) => (v == null ? null : clamp(v, a, b)));
};

// ---- damped Holt (additive trend) with gaps ---------------------------------
// Missing periods carry level and trend forward with damping, so a gap does
// not pull the model toward zero or invent a value.
const dampedHolt = (y, { alpha, beta, phi }) => {
  const n = y.length;
  let first = y.findIndex((v) => v != null);
  if (first < 0) return null;
  let level = y[first];
  let second = y.findIndex((v, i) => i > first && v != null);
  let trend = second > first ? (y[second] - y[first]) / (second - first) : 0;
  let sse = 0, count = 0;
  for (let t = first + 1; t < n; t++) {
    const f = level + phi * trend;
    if (y[t] != null) {
      sse += (y[t] - f) ** 2; count += 1;
      const prev = level;
      level = alpha * y[t] + (1 - alpha) * f;
      trend = beta * (level - prev) + (1 - beta) * phi * trend;
    } else {
      level = f;
      trend = phi * trend;
    }
  }
  const forecast = (h) => { let s = 0, p = 1; for (let i = 1; i <= h; i++) { p *= phi; s += p; } return level + s * trend; };
  return { level, trend, sse, count, forecast, params: { alpha, beta, phi } };
};

const GRID = { alpha: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], beta: [0.02, 0.05, 0.1, 0.2, 0.3], phi: [0.8, 0.85, 0.9, 0.95, 0.98] };
// Grid search on one-step-ahead squared error. Cheap: a few hundred passes
// over a series of a few hundred points.
const fitDampedHolt = (y) => {
  let best = null;
  for (const alpha of GRID.alpha) for (const beta of GRID.beta) for (const phi of GRID.phi) {
    const m = dampedHolt(y, { alpha, beta, phi });
    if (m && (!best || m.sse < best.sse)) best = m;
  }
  return best;
};

// ---- helpers ---------------------------------------------------------------
// Exponentially weighted mean of the non-null values (latest weighted most).
const ewma = (y, lambda) => {
  let s = null;
  for (const v of y) { if (v == null) continue; s = s == null ? v : lambda * v + (1 - lambda) * s; }
  return s;
};

// Last value plus the OLS slope per period over the trailing window: the
// naive baseline every model must beat.
const naiveTrend = (y, window) => {
  // The window counts recorded points, not calendar months, so an area whose
  // sales stopped a year ago still fits its trend on its own last months.
  const all = [];
  for (let t = 0; t < y.length; t++) if (y[t] != null) all.push(t);
  const idx = all.slice(-window); const vals = idx.map((t) => y[t]);
  if (!vals.length) return null;
  const last = vals[vals.length - 1];
  let slope = 0;
  if (vals.length >= 6) {
    const n = vals.length, mx = idx.reduce((a, b) => a + b, 0) / n, my = vals.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (idx[i] - mx) * (vals[i] - my); sxx += (idx[i] - mx) ** 2; }
    slope = sxx ? sxy / sxx : 0;
  }
  const lastT = idx[idx.length - 1];
  // The slope is damped (phi = 0.9) exactly like the model's trend, so the
  // baseline cannot run away over a long horizon either.
  const phi = 0.9;
  const damped = (k) => { let s = 0, p = 1; for (let i = 1; i <= k; i++) { p *= phi; s += p; } return s; };
  return { forecast: (h) => last + slope * damped(h + (y.length - 1 - lastT)), slope };
};

// Additive seasonal indices (period p) as the average deviation of each
// season from a centred moving average over the last `years` cycles.
const seasonalIndices = (y, period, years = 3) => {
  const start = Math.max(0, y.length - period * years);
  const sums = new Array(period).fill(0), counts = new Array(period).fill(0);
  for (let t = start; t < y.length; t++) {
    if (y[t] == null) continue;
    const lo = t - Math.floor(period / 2), hi = t + Math.floor(period / 2);
    const win = []; for (let k = lo; k <= hi; k++) if (k >= 0 && k < y.length && y[k] != null) win.push(y[k]);
    if (win.length < period / 2) continue;
    const ma = win.reduce((a, b) => a + b, 0) / win.length;
    sums[t % period] += y[t] - ma; counts[t % period] += 1;
  }
  const idx = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
  const mean = idx.reduce((a, b) => a + b, 0) / period;
  return idx.map((v) => v - mean);
};

const quantile = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

module.exports = { TRANSFORMS, winsorise, dampedHolt, fitDampedHolt, ewma, naiveTrend, seasonalIndices, quantile, clamp };
