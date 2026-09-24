/**
 * Rolling-origin backtest. For each origin T the caller's `fitForecast(T)`
 * returns a function h -> prediction (transformed scale) using data up to T
 * only; errors are actual − prediction at T+h wherever an actual exists.
 */
const backtest = ({ y, origins, horizon, fitForecast }) => {
  const errors = Array.from({ length: horizon + 1 }, () => []); // errors[h]
  const direction = { hit: 0, total: 0 };
  const n = y.length;
  for (const T of origins) {
    const fc = fitForecast(T);
    if (!fc) continue;
    for (let h = 1; h <= horizon; h++) {
      const t = T + h;
      if (t >= n || y[t] == null) continue;
      errors[h].push(y[t] - fc(h));
    }
    // direction over the full backtest horizon
    const t12 = T + horizon;
    if (t12 < n && y[t12] != null && y[T] != null) {
      direction.total += 1;
      if (Math.sign(y[t12] - y[T]) === Math.sign(fc(horizon) - y[T])) direction.hit += 1;
    }
  }
  const all = errors.flat();
  // mean absolute percentage error on the original scale (log errors → % via exp)
  const mape = all.length ? all.reduce((s, e) => s + Math.abs(Math.exp(e) - 1), 0) / all.length : null;
  return { errors, mape, n: all.length, directionHit: direction.total ? direction.hit / direction.total : null, directionN: direction.total };
};

module.exports = { backtest };
