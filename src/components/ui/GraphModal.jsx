import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { X, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Info, Eye, EyeOff, ChartLine, ChartScatter, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import RangeBrush from "./RangeBrush";
import dubaiIndex from "../../data/average_meter_price/dubai_index.json";

// Minimum observations before a fitted trend line is meaningful, and the gap
// (in months) beyond which the line is broken rather than drawn across
// missing months. Both are shown to the user in the data-quality panel.
const MIN_TREND_POINTS = 12;
const GAP_MONTHS = 3;
const SPARSE_POINTS = 12;

// Series the chart can show. Only price per m² has a per-area history in the
// bundled export today; transactions per month and rent per m² join this list
// once their data is wired. mapDataPointId keeps the painted map layer in step
// with the chart when the reader switches series.
const CHART_METRICS = [
  {
    id: 'price-per-sqm',
    label: 'Average price per m²',
    unit: 'AED/m²',
    mapDataPointId: 'price-per-sqm',
    definition: 'Monthly average sale price per m² of residential DLD transactions, Jan 2010 to Aug 2025. Months with no sales are left blank.',
  },
];

// One accent for the data, orange only for the fitted trend and annotations.
const COLORS = {
  series: '#3696A8',   // brand azure
  trend: '#FE6A0F',    // brand orange
  market: '#9ca3af',
  label: '#052C43',    // brand blue
  gap: '#f3f4f6',
};

// Source dates are "YYYY-MM-DD ..." strings. Parse the parts as a local date
// so the calendar day is never shifted by a UTC conversion.
const parseLocalDate = (str) => {
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(str);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const fmtAed = (v) => Math.round(v).toLocaleString('en-US');
// Axis labels: thousands are abbreviated on phones, where the axis is narrow.
const fmtAxis = (v, compact) => {
  if (!compact || Math.abs(v) < 1000) return fmtAed(v);
  const k = v / 1000;
  return `${Number.isInteger(k) || Math.abs(v) >= 10000 ? Math.round(k) : k.toFixed(1)}k`;
};

// Round an axis to 1 / 2 / 5 × 10ⁿ steps so ticks read 8,000 · 10,000 rather
// than 8,703 · 11,330, starting just below the data minimum.
const niceScale = (lo, hi, maxTicks) => {
  const range = Math.max(hi - lo, 1);
  const rough = range / Math.max(1, maxTicks - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(v);
  return { min, max, step, ticks };
};

// Monotone cubic interpolation (Fritsch–Carlson with harmonic-mean tangents):
// a smooth curve that never overshoots the points it passes through.
const monotonePath = (pts) => {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (n === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  const dx = [], m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = dx[i] ? (pts[i + 1].y - pts[i].y) / dx[i] : 0;
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  t[n - 1] = m[n - 2];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${pts[i].x + h} ${pts[i].y + t[i] * h} ${pts[i + 1].x - h} ${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
};

// Split a date-sorted series wherever more than GAP_MONTHS months passed with
// nothing recorded, so no curve is drawn across a gap.
const splitAtGaps = (pts, gapLimit = GAP_MONTHS) => {
  const segs = [];
  let cur = [];
  pts.forEach((p, i) => {
    if (i > 0 && monthsBetween(pts[i - 1].x, p.x) > gapLimit) { segs.push(cur); cur = []; }
    cur.push(p);
  });
  if (cur.length) segs.push(cur);
  return segs;
};

const GraphModal = ({
  isOpen = true,
  onClose = () => {},
  series = [],
  placeName = "Demo Location",
  pastSeries = [],
  loading = false
}) => {
  const [metricId, setMetricId] = useState(CHART_METRICS[0].id);
  const metric = CHART_METRICS.find((m) => m.id === metricId) || CHART_METRICS[0];
  const [chartType, setChartType] = useState("line");
  const [showTrend, setShowTrend] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showMarket, setShowMarket] = useState(false);
  const [dataView, setDataView] = useState("all");
  // Yearly points by default: one point per year reads as a trend. Monthly
  // averages and every recorded month stay one tap away.
  const [timePeriod, setTimePeriod] = useState("yearly");
  // Month-index window from the brush; null means the whole span.
  const [brush, setBrush] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [showOutliers, setShowOutliers] = useState(false);
  const svgRef = useRef(null);
  const aboutRef = useRef(null);

  // Phone layout: a narrower SVG so axis text stays legible once scaled down,
  // explanations collapsed by default, and a readout strip instead of a
  // floating tooltip.
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [aboutOpen, setAboutOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);

  const svgWidth = compact ? 380 : 760;
  const svgHeight = compact ? 280 : 360;
  const axisFont = compact ? 12 : 11;
  // Memoised so the useCallback hooks below keep a stable dependency.
  const margin = useMemo(
    () => (compact ? { top: 26, right: 12, bottom: 34, left: 44 } : { top: 24, right: 20, bottom: 40, left: 58 }),
    [compact]
  );

  // Only real data is drawn. An area with no forecast file simply has no
  // forecast; nothing is substituted for it.
  const activeSeries = series;
  const activeHistorical = pastSeries;
  const hasForecast = activeSeries.length > 0;

  // Combine and sort data
  const allData = useMemo(() => {
    const combined = [];

    activeHistorical?.forEach((item) => {
      combined.push({
        x: parseLocalDate(item.instance_date || item.ds),
        y: parseFloat(item.avg_meter_price ?? item.y ?? item.yhat),
        date: item.instance_date || item.ds,
        type: 'historical'
      });
    });

    activeSeries.forEach((item) => {
      combined.push({
        x: parseLocalDate(item.ds),
        y: parseFloat(item.yhat),
        date: item.ds,
        type: 'forecast'
      });
    });

    return combined.sort((a, b) => a.x - b.x);
  }, [activeSeries, activeHistorical]);

  // The Dubai-wide index for the "Dubai average" overlay: for each month the
  // median across areas of that area's average price per m² (built by
  // build-price-index.js, equal-weighted by area).
  const marketData = useMemo(
    () => dubaiIndex.rows.map((r) => ({
      x: new Date(Number(r.month.slice(0, 4)), Number(r.month.slice(5, 7)) - 1, 1),
      y: r.median,
      date: r.month,
      type: 'market',
    })),
    []
  );

  // Data-quality facts shown to the user: how many months were actually
  // observed, where the gaps are, and whether a value repeats suspiciously.
  const quality = useMemo(() => {
    const hist = allData.filter((d) => d.type === 'historical');
    if (hist.length === 0) return null;
    const first = hist[0].x;
    const last = hist[hist.length - 1].x;
    const spanMonths = monthsBetween(first, last) + 1;
    const gaps = [];
    for (let i = 1; i < hist.length; i++) {
      const g = monthsBetween(hist[i - 1].x, hist[i].x);
      if (g > GAP_MONTHS) gaps.push({ from: hist[i - 1].x, to: hist[i].x, months: g - 1 });
    }
    const counts = {};
    hist.forEach((d) => { const k = d.y.toFixed(4); counts[k] = (counts[k] || 0) + 1; });
    const repeated = Object.entries(counts).filter(([, n]) => n >= 3).map(([v, n]) => ({ value: Number(v), times: n }));
    const forecastStart = hasForecast ? allData.find((d) => d.type === 'forecast')?.x : null;
    return {
      observations: hist.length,
      first,
      last,
      spanMonths,
      coveragePct: Math.round((hist.length / spanMonths) * 100),
      gaps,
      largestGap: gaps.reduce((m, g) => Math.max(m, g.months), 0),
      repeated,
      sparse: hist.length < SPARSE_POINTS,
      forecastStart,
      forecastEnd: hasForecast ? allData[allData.length - 1].x : null,
    };
  }, [allData, hasForecast]);

  // Headline figures for the header: the latest recorded month, its change
  // against the nearest month at least a year earlier, and the forecast horizon.
  const headline = useMemo(() => {
    const hist = allData.filter((d) => d.type === 'historical');
    if (hist.length === 0) return null;
    const latest = hist[hist.length - 1];
    const target = new Date(latest.x.getFullYear() - 1, latest.x.getMonth(), 1);
    let yearAgo = null;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].x <= target) { yearAgo = hist[i]; break; }
    }
    const yoyPct = yearAgo && yearAgo.y ? ((latest.y - yearAgo.y) / yearAgo.y) * 100 : null;
    const fc = allData.filter((d) => d.type === 'forecast');
    const forecastEnd = fc.length ? fc[fc.length - 1] : null;
    const forecastPct = forecastEnd && latest.y ? ((forecastEnd.y - latest.y) / latest.y) * 100 : null;
    return { latest, yearAgo, yoyPct, forecastEnd, forecastPct };
  }, [allData]);

  // Sparse areas open as scatter so the eye is not led along an invented line.
  useEffect(() => {
    if (quality) setChartType(quality.sparse ? 'scatter' : 'line');
  }, [quality]);

  // The modal returns null when closed rather than unmounting, so its view state
  // outlives a single opening. Without this reset the window and cursor captured
  // for the first area would stay pinned for the rest of the session.
  const lastPlace = useRef(null);
  useEffect(() => {
    if (placeName === lastPlace.current) return;
    lastPlace.current = placeName;
    setBrush(null);
    setCursor(null);
    setShowOutliers(false);
  }, [placeName]);

  // Month axis the brush moves over: index 0 is the first month with any data.
  const axis = useMemo(() => {
    if (!allData.length) return null;
    const start = startOfMonth(allData[0].x);
    return { start, total: Math.max(1, monthsBetween(start, allData[allData.length - 1].x)) };
  }, [allData]);
  const win = useMemo(() => (axis ? (brush || { start: 0, end: axis.total }) : null), [axis, brush]);
  const dateAt = useCallback((i) => (axis ? addMonths(axis.start, i) : new Date()), [axis]);
  const inWindow = useCallback((d) => {
    if (!axis || !win) return true;
    return d.x >= dateAt(win.start) && d.x <= endOfMonth(dateAt(win.end));
  }, [axis, win, dateAt]);

  // Aggregate data by time period
  const aggregateData = useCallback((data, period) => {
    if (period === "all") return data;

    const grouped = {};
    data.forEach(point => {
      const key = period === "monthly"
        ? `${point.x.getFullYear()}-${String(point.x.getMonth() + 1).padStart(2, '0')}`
        : `${point.x.getFullYear()}`;

      if (!grouped[key]) {
        grouped[key] = { values: [], types: new Set(), date: point.x };
      }
      grouped[key].values.push(point.y);
      grouped[key].types.add(point.type);
    });

    return Object.entries(grouped).map(([key, group]) => {
      const avgY = group.values.reduce((a, b) => a + b, 0) / group.values.length;
      const [year, month] = key.split('-');
      const periodDate = period === "monthly"
        ? new Date(parseInt(year), parseInt(month) - 1, 15)
        : new Date(parseInt(year), 6, 1);
      const hasHist = group.types.has('historical');
      const hasFc = group.types.has('forecast');

      return {
        x: periodDate,
        y: avgY,
        date: periodDate.toISOString(),
        type: hasHist && hasFc ? 'mixed' : hasHist ? 'historical' : hasFc ? 'forecast' : [...group.types][0],
        aggregated: true,
        count: group.values.length
      };
    }).sort((a, b) => a.x - b.x);
  }, []);

  // Filter data
  const dataPoints = useMemo(() => {
    let filtered = allData;

    if (dataView === 'historical') {
      filtered = filtered.filter(d => d.type === 'historical');
    } else if (dataView === 'forecast') {
      filtered = filtered.filter(d => d.type === 'forecast');
    }

    filtered = filtered.filter(inWindow);

    return aggregateData(filtered, timePeriod);
  }, [allData, dataView, inWindow, timePeriod, aggregateData]);

  // Scale functions
  const dataExists = dataPoints.length > 0;
  const xValues = dataPoints.map(p => p.x.getTime());
  const xMin = dataExists ? Math.min(...xValues) : 0;
  const xMax = dataExists ? Math.max(...xValues) : 1;

  const marketPoints = useMemo(() => {
    if (!showMarket || !dataExists) return [];
    return aggregateData(marketData.filter(inWindow), timePeriod)
      .filter((p) => p.x.getTime() >= xMin && p.x.getTime() <= xMax);
  }, [showMarket, dataExists, marketData, inWindow, timePeriod, aggregateData, xMin, xMax]);

  const yValues = dataPoints.map(p => p.y);
  const yMin = dataExists ? Math.min(...yValues) : 0;
  const yMaxRaw = dataExists ? Math.max(...yValues) : 1;

  // A single month far above the rest (typically one unusual sale) would press
  // every other point flat against the x-axis. Such months are pinned to the
  // top edge and counted; the reader can restore the full axis with a button.
  const outlierCap = useMemo(() => {
    const ys = dataPoints.map((p) => p.y).sort((a, b) => a - b);
    if (ys.length < 8) return null;
    const p95 = ys[Math.floor(ys.length * 0.95)];
    if (!(ys[ys.length - 1] > p95 * 2)) return null;
    const cap = p95 * 1.2;
    return { cap, count: ys.filter((y) => y > cap).length };
  }, [dataPoints]);
  const yMaxEff = outlierCap && !showOutliers ? outlierCap.cap : yMaxRaw;
  const isCapped = (y) => Boolean(outlierCap) && !showOutliers && y > outlierCap.cap;

  // Axis domain: the area's points, plus the market overlay when shown, on a
  // rounded scale.
  const marketYs = marketPoints.map((p) => p.y);
  const nice = useMemo(
    () => niceScale(
      Math.min(yMin, ...(marketYs.length ? marketYs : [yMin])),
      Math.max(yMaxEff, ...(marketYs.length ? marketYs : [yMaxEff])),
      compact ? 5 : 6
    ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [yMin, yMaxEff, compact, marketPoints]
  );

  const xScale = useCallback((date) => {
    if (!dataExists || xMax === xMin) return margin.left;
    const chartWidth = svgWidth - margin.left - margin.right;
    return margin.left + ((date.getTime() - xMin) / (xMax - xMin)) * chartWidth;
  }, [dataExists, xMin, xMax, svgWidth, margin]);

  const yScale = useCallback((value) => {
    const range = nice.max - nice.min;
    if (!dataExists || range === 0) return svgHeight - margin.bottom;
    const v = Math.min(value, nice.max); // pinned outliers sit on the top edge
    return svgHeight - margin.bottom - ((v - nice.min) / range) * (svgHeight - margin.top - margin.bottom);
  }, [dataExists, nice, svgHeight, margin]);

  // Generate ticks
  const ticksX = useMemo(() => {
    if (!dataExists) return [];
    const start = new Date(xMin);
    const end = new Date(xMax);
    const ticks = [];
    let current = new Date(start.getFullYear(), 0, 1);

    while (current.getTime() <= end.getTime()) {
      ticks.push(new Date(current));
      current.setFullYear(current.getFullYear() + 1);
    }
    return ticks;
  }, [xMin, xMax, dataExists]);
  const ticksY = nice.ticks;
  // Every second year on desktop, a readable subset on phones.
  const xTickStep = compact ? Math.max(1, Math.ceil(ticksX.length / 5)) : ticksX.length > 8 ? 2 : 1;

  // Curves. Observed points are split at gaps; the forecast continues from the
  // last observed point so the line does not restart lower or higher.
  const baseY = svgHeight - margin.bottom;
  const gapLimit = timePeriod === 'yearly' ? 12 : GAP_MONTHS;
  const toXY = useCallback((p) => ({ x: xScale(p.x), y: yScale(p.y) }), [xScale, yScale]);
  const observedPts = useMemo(() => dataPoints.filter((p) => p.type !== 'forecast'), [dataPoints]);
  const forecastPts = useMemo(() => dataPoints.filter((p) => p.type === 'forecast'), [dataPoints]);
  const observedSegs = useMemo(() => splitAtGaps(observedPts, gapLimit).map((seg) => seg.map(toXY)), [observedPts, toXY, gapLimit]);
  const forecastSeg = useMemo(() => {
    if (!forecastPts.length) return [];
    const lastObs = observedPts[observedPts.length - 1];
    const joins = lastObs && monthsBetween(lastObs.x, forecastPts[0].x) <= 12 ? [toXY(lastObs)] : [];
    return [...joins, ...forecastPts.map(toXY)];
  }, [observedPts, forecastPts, toXY]);
  const closeArea = (seg) => (seg.length ? `${monotonePath(seg)} L ${seg[seg.length - 1].x} ${baseY} L ${seg[0].x} ${baseY} Z` : '');
  const marketSegs = useMemo(() => splitAtGaps(marketPoints, gapLimit).map((seg) => seg.map(toXY)), [marketPoints, toXY, gapLimit]);

  // Spans with no observations, drawn as a hatched band so a gap reads as a
  // gap rather than as a flat price.
  const gapBands = useMemo(() => {
    const bands = [];
    for (let i = 1; i < observedPts.length; i++) {
      const a = observedPts[i - 1], b = observedPts[i];
      if (monthsBetween(a.x, b.x) > gapLimit) {
        bands.push({ x1: xScale(a.x), x2: xScale(b.x), months: monthsBetween(a.x, b.x) - 1 });
      }
    }
    return bands;
  }, [observedPts, xScale, gapLimit]);

  // Trend line
  const trendLine = useMemo(() => {
    // Fit to recorded sales only; a line through model output would describe
    // the model, not the market.
    const basis = dataView === 'forecast' ? dataPoints : observedPts;
    if (basis.length < MIN_TREND_POINTS) return null;
    if (quality && quality.largestGap >= 24 && dataView !== 'forecast') return null;

    const n = basis.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    basis.forEach(p => {
      const xVal = p.x.getTime();
      sumX += xVal;
      sumY += p.y;
      sumXY += xVal * p.y;
      sumXX += xVal * xVal;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    if (!isFinite(slope)) return null;

    const bMin = basis[0].x.getTime();
    const bMax = basis[basis.length - 1].x.getTime();
    const by1 = slope * bMin + intercept;
    const by2 = slope * bMax + intercept;
    const years = (bMax - bMin) / (365.25 * 24 * 3600 * 1000);
    const meanY = sumY / n;
    const perYearPct = years > 0 && meanY ? ((by2 - by1) / years / meanY) * 100 : 0;

    return {
      x1: xScale(new Date(bMin)),
      y1: yScale(by1),
      x2: xScale(new Date(bMax)),
      y2: yScale(by2),
      slope,
      perYearPct,
      n
    };
  }, [dataPoints, observedPts, xScale, yScale, quality, dataView]);

  // Labels that matter: first, last, highest, lowest and pronounced turning
  // points of the observed series, plus the forecast's end value.
  const smartLabels = useMemo(() => {
    const obs = observedPts.filter((p) => !isCapped(p.y));
    const out = [];
    if (obs.length) {
      const ys = obs.map((p) => p.y);
      const lo = Math.min(...ys), hi = Math.max(...ys);
      const range = hi - lo || 1;
      const picks = new Map();
      const add = (i, score, above) => {
        const cur = picks.get(i);
        if (!cur || cur.score < score) picks.set(i, { score, above });
      };
      add(0, 3, true);
      add(obs.length - 1, 3, true);
      add(ys.indexOf(hi), 4, true);
      add(ys.indexOf(lo), 4, false);
      for (let i = 1; i < obs.length - 1; i++) {
        const prev = ys[i - 1], cur = ys[i], next = ys[i + 1];
        const isMax = cur > prev && cur > next;
        const isMin = cur < prev && cur < next;
        if (!isMax && !isMin) continue;
        const prominence = Math.min(Math.abs(cur - prev), Math.abs(cur - next)) / range;
        if (prominence >= 0.08) add(i, 1 + prominence, isMax);
      }
      const limit = compact ? 6 : 10;
      const minGap = Math.max(1, Math.round(obs.length / (limit * 2)));
      const chosen = [];
      [...picks.entries()]
        .sort((a, b) => b[1].score - a[1].score)
        .forEach(([i, v]) => {
          if (chosen.length >= limit) return;
          if (v.score >= 3 || chosen.every((c) => Math.abs(c.i - i) >= minGap)) chosen.push({ i, ...v });
        });
      chosen.forEach(({ i, above }) => out.push({ p: obs[i], above }));
    }
    if (forecastPts.length && dataView !== 'historical') {
      out.push({ p: forecastPts[forecastPts.length - 1], above: true, forecast: true });
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observedPts, forecastPts, compact, dataView, outlierCap, showOutliers]);

  const observedInView = observedPts.length;
  const forecastInView = forecastPts.length;
  const trendUnavailableReason = !trendLine && showTrend
    ? observedInView < MIN_TREND_POINTS
      ? `Trend needs at least ${MIN_TREND_POINTS} observed ${timePeriod === 'yearly' ? 'years' : 'months'} (this view has ${observedInView})`
      : 'Trend hidden: the series has a gap of 2+ years'
    : null;

  // Cursor tracking. The pointer position (CSS px) is converted to SVG units so
  // the readout matches the finger or mouse at any screen size.
  const updateCursor = useCallback((clientX) => {
    if (!svgRef.current || !dataExists) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const sx = (clientX - rect.left) * (svgWidth / rect.width);
    const chartWidth = svgWidth - margin.left - margin.right;
    const t = xMin + ((sx - margin.left) / chartWidth) * (xMax - xMin);

    let nearest = null;
    let minDist = Infinity;
    dataPoints.forEach(p => {
      const dist = Math.abs(p.x.getTime() - t);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    });

    if (nearest) {
      setCursor({ x: xScale(nearest.x), point: nearest });
    }
  }, [dataExists, dataPoints, svgWidth, margin, xMin, xMax, xScale]);
  const handleChartMouseMove = (e) => updateCursor(e.clientX);
  const handleChartTouch = (e) => {
    if (e.touches && e.touches[0]) updateCursor(e.touches[0].clientX);
  };

  // A point kept from a previous filter or aggregation would mislabel the readout.
  useEffect(() => { setCursor(null); }, [dataPoints]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Switching series also repaints the map layer, so map and chart agree.
  const handleMetricChange = (id) => {
    setMetricId(id);
    const target = CHART_METRICS.find((m) => m.id === id);
    if (target?.mapDataPointId && typeof window !== 'undefined') {
      window.selectedDataPoint = target.mapDataPointId;
      window.dispatchEvent(new CustomEvent('sidebar:dataPointSelected', { detail: { dataPointId: target.mapDataPointId } }));
    }
  };

  const openAbout = () => {
    setAboutOpen(true);
    setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // The readout strip shows the point under the finger or mouse, otherwise the
  // latest point in view.
  const readout = cursor ? cursor.point : (dataPoints.length ? dataPoints[dataPoints.length - 1] : null);
  const readoutDate = (p) => (timePeriod === 'yearly' ? String(p.x.getFullYear()) : fmtMonth(p.x));
  const readoutKind = (p) =>
    (p.type === 'forecast' ? 'Model forecast' : p.type === 'mixed' ? 'Recorded + forecast average' : 'Recorded sales') +
    (p.aggregated ? ` · avg of ${p.count} months` : '');
  const segment = (active) =>
    `flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium transition-colors ${
      active ? 'bg-azure text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
    }`;
  const iconSeg = (active) =>
    `px-3 py-2.5 sm:py-1.5 transition-colors ${active ? 'bg-azure text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`;
  const chip = (active) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 sm:px-3 sm:py-1.5 text-xs font-medium transition-colors ${
      active ? 'bg-blue text-white border-blue' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;
  const pctBadge = (pct) =>
    `inline-flex items-center gap-0.5 mt-0.5 text-[11px] font-semibold ${pct >= 0 ? 'text-emerald-200' : 'text-rose-200'}`;
  const pointRadius = timePeriod === 'yearly' ? (compact ? 4 : 5) : timePeriod === 'monthly' ? (compact ? 2.5 : 3) : (compact ? 2.5 : 3);
  const showDots = chartType === 'scatter' || timePeriod !== 'all';
  const brushTicks = useMemo(() => {
    if (!axis) return [];
    const step = compact ? 4 : 2;
    const ticks = [];
    for (let y = axis.start.getFullYear(); y <= dateAt(axis.total).getFullYear(); y++) {
      if (y % step !== 0) continue;
      const v = monthsBetween(axis.start, new Date(y, 0, 1));
      if (v >= 0 && v <= axis.total) ticks.push({ value: v, label: String(y) });
    }
    return ticks;
  }, [axis, compact, dateAt]);
  const labelAnchor = (sx) =>
    sx < margin.left + 22 ? 'start' : sx > svgWidth - margin.right - 22 ? 'end' : 'middle';

  if (!isOpen) return null;

  return (
    <>
      {/* Phones: dim the map behind the sheet; a tap outside closes it */}
      <div className="sm:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: "0%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] sm:right-1 md:right-[2%] xl:right-[5%] z-50 sm:p-2"
      >
        <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-h-[92dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header: series selector, place name as the headline, key figures */}
          <div className="relative px-4 sm:px-6 pt-2.5 sm:pt-4 pb-4 bg-gradient-to-r from-blue to-azure text-white">
            <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/40" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <label className="inline-flex items-center gap-1 rounded-md bg-white/15 border border-white/20 pl-2 pr-1 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  <select
                    value={metricId}
                    onChange={(e) => handleMetricChange(e.target.value)}
                    disabled={CHART_METRICS.length < 2}
                    aria-label="Series"
                    title={CHART_METRICS.length < 2 ? 'More series (transactions, rent) appear here once their data is wired' : 'Choose the series'}
                    className="appearance-none bg-transparent text-inherit font-inherit uppercase tracking-wider focus:outline-none pr-1 disabled:opacity-100"
                  >
                    {CHART_METRICS.map((m) => (
                      <option key={m.id} value={m.id} className="text-gray-900 normal-case tracking-normal">{m.label} · {m.unit}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-white/70" />
                </label>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight truncate mt-1">{placeName}</h2>
                <p className="text-xs text-white/75 mt-1 max-w-2xl">
                  {metric.definition}{' '}
                  <button type="button" onClick={openAbout} className="inline-block whitespace-nowrap underline decoration-white/50 underline-offset-2 hover:text-white">
                    How to read this chart
                  </button>
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {headline && quality && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/10 px-3 py-2 min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-white/70 truncate">Latest · {fmtMonth(headline.latest.x)}</div>
                  <div className="text-base sm:text-lg font-bold tabular-nums leading-tight">{fmtAed(headline.latest.y)}</div>
                  {headline.yoyPct != null ? (
                    <div className={pctBadge(headline.yoyPct)}>
                      {headline.yoyPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {headline.yoyPct >= 0 ? '+' : ''}{headline.yoyPct.toFixed(1)}%
                      <span className="hidden sm:inline font-normal text-white/60"> vs {fmtMonth(headline.yearAgo.x)}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/60 mt-0.5">no year-earlier sale</div>
                  )}
                  {/* The latest month can itself be one of the pinned outliers; say so
                      rather than let the headline read as where the chart line ends */}
                  {outlierCap && headline.latest.y > outlierCap.cap && (
                    <div className="text-[10px] font-semibold text-amber-200 mt-0.5">▲ outlier month — see chart</div>
                  )}
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-white/70 truncate">
                    {headline.forecastEnd ? `Forecast · ${fmtMonth(headline.forecastEnd.x)}` : 'Forecast'}
                  </div>
                  {headline.forecastEnd ? (
                    <>
                      <div className="text-base sm:text-lg font-bold tabular-nums leading-tight">{fmtAed(headline.forecastEnd.y)}</div>
                      <div className={pctBadge(headline.forecastPct)}>
                        {headline.forecastPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {headline.forecastPct >= 0 ? '+' : ''}{headline.forecastPct.toFixed(1)}%
                        <span className="hidden sm:inline font-normal text-white/60"> vs latest</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-semibold text-white/80 mt-1">Not available</div>
                  )}
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 min-w-0 col-span-2 sm:col-span-1 flex sm:block items-center justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-wide text-white/70 truncate">Recorded</div>
                  <div className="text-base sm:text-lg font-bold tabular-nums leading-tight">
                    {quality.observations} <span className="text-xs font-medium text-white/70">months</span>
                  </div>
                  <div className="text-[11px] text-white/60 sm:mt-0.5 truncate">
                    {quality.coveragePct}% of {quality.first.getFullYear()}–{quality.last.getFullYear()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Controls */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Period, with the line / scatter icons on the right */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="hidden sm:inline text-sm font-semibold text-gray-700">Period:</span>
                  <div className="flex w-full sm:w-auto rounded-xl sm:rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                    <button className={segment(timePeriod === "yearly")} onClick={() => setTimePeriod("yearly")}>
                      Yearly avg
                    </button>
                    <button className={`${segment(timePeriod === "monthly")} border-l border-gray-300`} onClick={() => setTimePeriod("monthly")}>
                      Monthly avg
                    </button>
                    <button className={`${segment(timePeriod === "all")} border-l border-gray-300`} onClick={() => setTimePeriod("all")}>
                      All points
                    </button>
                  </div>
                </div>
                <div className="inline-flex rounded-xl sm:rounded-lg border border-gray-300 overflow-hidden shadow-sm" role="group" aria-label="Chart type">
                  <button aria-label="Line chart" aria-pressed={chartType === 'line'} title="Line" className={iconSeg(chartType === 'line')} onClick={() => setChartType('line')}>
                    <ChartLine className="w-4 h-4" />
                  </button>
                  <button aria-label="Scatter chart" aria-pressed={chartType === 'scatter'} title="Scatter" className={`${iconSeg(chartType === 'scatter')} border-l border-gray-300`} onClick={() => setChartType('scatter')}>
                    <ChartScatter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View and overlays */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="hidden sm:inline text-sm font-semibold text-gray-700">View:</span>
                  <div className="flex w-full sm:w-auto rounded-xl sm:rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                    <button className={segment(dataView === "all")} onClick={() => setDataView("all")}>
                      All
                    </button>
                    {activeHistorical.length > 0 && (
                      <button className={`${segment(dataView === "historical")} border-l border-gray-300`} onClick={() => setDataView("historical")}>
                        Historical
                      </button>
                    )}
                    {hasForecast && (
                      <button className={`${segment(dataView === "forecast")} border-l border-gray-300`} onClick={() => setDataView("forecast")}>
                        Forecast
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 sm:ml-auto">
                  <button type="button" aria-pressed={showTrend} className={chip(showTrend)} onClick={() => setShowTrend((v) => !v)}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trend
                  </button>
                  <button type="button" aria-pressed={showLabels} className={chip(showLabels)} onClick={() => setShowLabels((v) => !v)}>
                    Labels
                  </button>
                  <button
                    type="button"
                    aria-pressed={showMarket}
                    className={chip(showMarket)}
                    onClick={() => setShowMarket((v) => !v)}
                    title="Median across all Dubai areas of the monthly average price per m²"
                  >
                    <span className="inline-block w-3.5 border-t-2 border-gray-400" aria-hidden="true" />
                    Dubai average
                  </button>
                  {outlierCap && (
                    <button
                      type="button"
                      aria-pressed={showOutliers}
                      className={chip(showOutliers)}
                      onClick={() => setShowOutliers((v) => !v)}
                      title={`${outlierCap.count} ${timePeriod === 'yearly' ? 'year' : 'month'}${outlierCap.count === 1 ? '' : 's'} above ${fmtAed(outlierCap.cap)} AED/m² ${showOutliers ? 'shown at full scale' : 'pinned to the top edge'}`}
                    >
                      {showOutliers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {outlierCap.count} outlier{outlierCap.count === 1 ? '' : 's'}
                    </button>
                  )}
                </div>
              </div>

              {/* Time window: a two-handle brush over the whole span */}
              {axis && win && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2 text-xs">
                    <span className="font-semibold text-gray-700 tabular-nums">
                      {fmtMonth(dateAt(win.start))} – {fmtMonth(dateAt(win.end))}
                    </span>
                    <div className="flex items-center gap-2">
                      {brush && (
                        <button type="button" className={chip(false)} onClick={() => setBrush(null)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                          All years
                        </button>
                      )}
                      <span className="text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <strong>{observedInView}</strong> <span className="hidden sm:inline">observed </span>{timePeriod === "yearly" ? "years" : "months"}
                        {forecastInView > 0 && <span className="ml-1">+ <strong>{forecastInView}</strong> forecast</span>}
                      </span>
                    </div>
                  </div>
                  <RangeBrush
                    min={0}
                    max={axis.total}
                    start={win.start}
                    end={win.end}
                    onChange={setBrush}
                    ticks={brushTicks}
                    className="px-2"
                  />
                </div>
              )}
            </div>

            {/* SVG Chart */}
            {dataPoints.length === 0 && loading ? (
              <div className="h-64 sm:h-96 bg-gray-50 rounded-xl border border-gray-200 p-4 animate-pulse" role="status" aria-live="polite">
                <div className="h-10 rounded-lg bg-gray-200 mb-3" />
                <div className="h-full max-h-[calc(100%-4rem)] rounded-lg bg-gray-200/70" />
                <span className="sr-only">Loading price history</span>
              </div>
            ) : dataPoints.length === 0 ? (
              <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500 text-sm">{allData.length === 0 ? 'No recorded sales for this area in the bundled DLD export' : 'No data available for selected range'}</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-2.5 sm:p-4 border border-gray-200">
                {readout && (
                  <div className="chart-readout flex items-center justify-between gap-3 rounded-lg bg-blue text-white px-3 py-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{readoutDate(readout)}</div>
                      <div className="text-[10px] text-white/70 truncate">
                        {readoutKind(readout)}{cursor ? '' : ' · latest in view'}
                      </div>
                    </div>
                    <div className="text-lg font-bold tabular-nums whitespace-nowrap">
                      {fmtAed(readout.y)} <span className="text-[11px] font-medium text-white/70">{metric.unit}</span>
                    </div>
                  </div>
                )}

                <div className="relative h-0 w-full" style={{ paddingTop: `${(svgHeight / svgWidth) * 100}%` }}>
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="absolute top-0 left-0 w-full h-full touch-pan-y"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={() => setCursor(null)}
                    onTouchStart={handleChartTouch}
                    onTouchMove={handleChartTouch}
                  >
                    <defs>
                      <clipPath id="chart-area-clip">
                        <rect
                          x={margin.left}
                          y={margin.top}
                          width={svgWidth - margin.left - margin.right}
                          height={svgHeight - margin.top - margin.bottom}
                        />
                      </clipPath>
                      <linearGradient id="observedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.series} stopOpacity="0.32" />
                        <stop offset="100%" stopColor={COLORS.series} stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.series} stopOpacity="0.14" />
                        <stop offset="100%" stopColor={COLORS.series} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid */}
                    {ticksX.map((t, i) => (
                      <line
                        key={`grid-x-${i}`}
                        x1={xScale(t)}
                        y1={svgHeight - margin.bottom}
                        x2={xScale(t)}
                        y2={margin.top}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="2,3"
                      />
                    ))}
                    {ticksY.map((t, i) => (
                      <line
                        key={`grid-y-${i}`}
                        x1={margin.left}
                        y1={yScale(t)}
                        x2={svgWidth - margin.right}
                        y2={yScale(t)}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="2,3"
                      />
                    ))}

                    {/* Months with no recorded sales */}
                    {chartType === "line" && gapBands.map((g, i) => (
                      <g key={`gap-${i}`}>
                        <rect
                          x={Math.min(g.x1, g.x2)}
                          y={margin.top}
                          width={Math.abs(g.x2 - g.x1)}
                          height={svgHeight - margin.top - margin.bottom}
                          fill={COLORS.gap}
                          opacity="0.9"
                        />
                        {Math.abs(g.x2 - g.x1) > 70 && (
                          <text
                            x={(g.x1 + g.x2) / 2}
                            y={margin.top + 30}
                            textAnchor="middle"
                            fontSize={axisFont - 1}
                            fill="#9ca3af"
                          >
                            no sales recorded ({g.months} months)
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Where the forecast begins */}
                    {quality?.forecastStart && dataView === "all" && forecastPts.length > 0 && (
                      <>
                        <line
                          x1={xScale(quality.forecastStart)}
                          x2={xScale(quality.forecastStart)}
                          y1={margin.top}
                          y2={svgHeight - margin.bottom}
                          stroke="#9ca3af"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={xScale(quality.forecastStart) + 4}
                          y={svgHeight - margin.bottom - 6}
                          fontSize={axisFont - 1}
                          fill="#6b7280"
                        >
                          forecast →
                        </text>
                      </>
                    )}

                    {/* Y-axis unit */}
                    <text
                      x={6}
                      y={margin.top - 10}
                      fontSize={axisFont - 1}
                      fill="#6b7280"
                      fontWeight="500"
                    >
                      {metric.unit}
                    </text>

                    {/* Axes */}
                    <line
                      x1={margin.left}
                      y1={svgHeight - margin.bottom}
                      x2={svgWidth - margin.right}
                      y2={svgHeight - margin.bottom}
                      stroke="#d1d5db"
                      strokeWidth="1.5"
                    />

                    {/* X-axis labels: every second year on desktop, a readable subset on phones */}
                    {ticksX.map((t, i) => (
                      i % xTickStep === 0 && (
                        <text
                          key={`label-x-${i}`}
                          x={xScale(t)}
                          y={svgHeight - margin.bottom + (compact ? 18 : 20)}
                          textAnchor="middle"
                          fontSize={axisFont}
                          fontWeight="500"
                          fill="#6b7280"
                        >
                          {t.getFullYear()}
                        </text>
                      )
                    ))}

                    {/* Y-axis labels on rounded steps */}
                    {ticksY.map((t, i) => (
                      <text
                        key={`label-y-${i}`}
                        x={margin.left - 8}
                        y={yScale(t) + 4}
                        textAnchor="end"
                        fontSize={axisFont}
                        fontWeight="500"
                        fill="#6b7280"
                      >
                        {fmtAxis(t, compact)}
                      </text>
                    ))}

                    <g clipPath="url(#chart-area-clip)">
                      {/* Soft area fill and smooth line for recorded sales */}
                      {chartType === "line" && observedSegs.map((seg, i) => (
                        <g key={`obs-${i}`}>
                          <path d={closeArea(seg)} fill="url(#observedFill)" />
                          <path d={monotonePath(seg)} fill="none" stroke={COLORS.series} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      ))}

                      {/* Forecast: same weight, dashed, continuing from the last observed point */}
                      {chartType === "line" && forecastSeg.length > 1 && (
                        <>
                          <path d={closeArea(forecastSeg)} fill="url(#forecastFill)" />
                          <path d={monotonePath(forecastSeg)} fill="none" stroke={COLORS.series} strokeWidth="2.5" strokeDasharray="6,5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}

                      {/* Dubai average overlay */}
                      {marketSegs.map((seg, i) => (
                        <path key={`mkt-${i}`} d={monotonePath(seg)} fill="none" stroke={COLORS.market} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      ))}

                      {/* Points: recorded solid, forecast hollow, pinned outliers as a triangle on the top edge */}
                      {dataPoints.map((p, i) => {
                        if (isCapped(p.y)) {
                          return (
                            <path
                              key={i}
                              d={`M ${xScale(p.x)} ${margin.top + 2} l -5 9 h 10 z`}
                              fill={COLORS.trend}
                              stroke="white"
                              strokeWidth="1.5"
                            />
                          );
                        }
                        if (!showDots) return null;
                        const fc = p.type === 'forecast';
                        return (
                          <circle
                            key={i}
                            cx={xScale(p.x)}
                            cy={yScale(p.y)}
                            r={pointRadius}
                            fill={fc ? 'white' : COLORS.series}
                            stroke={fc ? COLORS.series : 'white'}
                            strokeWidth={fc ? 2 : 1.5}
                          />
                        );
                      })}

                      {/* Trend line */}
                      {showTrend && trendLine && (
                        <>
                          <line
                            x1={trendLine.x1}
                            y1={trendLine.y1}
                            x2={trendLine.x2}
                            y2={trendLine.y2}
                            stroke={COLORS.trend}
                            strokeWidth="2"
                            strokeDasharray="6,4"
                            opacity="0.85"
                          />
                          <text
                            x={svgWidth - margin.right - 6}
                            y={margin.top + 12}
                            textAnchor="end"
                            fontSize={axisFont}
                            fill={COLORS.trend}
                            fontWeight="600"
                          >
                            {compact
                              ? `${trendLine.slope > 0 ? '↗' : '↘'} ${trendLine.perYearPct >= 0 ? '+' : ''}${trendLine.perYearPct.toFixed(1)}%/yr`
                              : `${trendLine.slope > 0 ? '↗ Upward' : '↘ Downward'} trend, ${trendLine.perYearPct >= 0 ? '+' : ''}${trendLine.perYearPct.toFixed(1)}%/yr over ${trendLine.n} points`}
                          </text>
                        </>
                      )}

                      {/* Outlier months pinned to the top edge */}
                      {outlierCap && !showOutliers && (
                        <text
                          x={svgWidth - margin.right - 6}
                          y={margin.top + (showTrend && trendLine ? 26 : 12)}
                          textAnchor="end"
                          fontSize={axisFont - 1}
                          fill="#b45309"
                          fontWeight="600"
                        >
                          ▲ {outlierCap.count} outlier{outlierCap.count === 1 ? '' : 's'} pinned to top
                        </text>
                      )}

                      {/* Labels that matter */}
                      {showLabels && smartLabels.map(({ p, above, forecast }, i) => {
                        const sx = xScale(p.x);
                        const sy = yScale(p.y);
                        return (
                          <text
                            key={`lbl-${i}`}
                            x={sx}
                            y={above ? sy - 10 : sy + 16}
                            textAnchor={labelAnchor(sx)}
                            fontSize={axisFont}
                            fontWeight="700"
                            fill={forecast ? '#6b7280' : COLORS.label}
                            stroke="white"
                            strokeWidth="3.5"
                            paintOrder="stroke"
                            style={{ pointerEvents: 'none' }}
                          >
                            {fmtAxis(p.y, compact)}
                          </text>
                        );
                      })}

                      {/* Cursor */}
                      {cursor && (
                        <>
                          <line
                            x1={cursor.x}
                            x2={cursor.x}
                            y1={margin.top}
                            y2={svgHeight - margin.bottom}
                            stroke="#9ca3af"
                            strokeDasharray="4"
                          />
                          <circle
                            cx={cursor.x}
                            cy={yScale(cursor.point.y)}
                            r={6}
                            fill={COLORS.trend}
                            stroke="white"
                            strokeWidth={2}
                          />
                        </>
                      )}
                    </g>
                  </svg>
                </div>

                {/* Legend */}
                {activeHistorical.length > 0 && (
                  <div className="flex items-center justify-start sm:justify-center flex-wrap gap-x-4 gap-y-1.5 mt-3 sm:mt-4 text-xs bg-white rounded-lg py-2 sm:py-3 px-3 sm:px-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: COLORS.series }} />
                      <span className="font-medium text-xs sm:text-sm text-gray-700">Recorded sales (DLD)</span>
                    </div>
                    {hasForecast && dataView !== 'historical' && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 border-t-2 border-dashed" style={{ borderColor: COLORS.series }} />
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Model forecast</span>
                      </div>
                    )}
                    {showMarket && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 border-t-2" style={{ borderColor: COLORS.market }} />
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Dubai average (median of areas)</span>
                      </div>
                    )}
                    {showTrend && trendLine && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 border-t-2 border-dashed" style={{ borderColor: COLORS.trend }} />
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Fitted trend</span>
                      </div>
                    )}
                    {gapBands.length > 0 && chartType === "line" && (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300" />
                        <span className="font-medium text-xs sm:text-sm text-gray-700">No sales recorded</span>
                      </div>
                    )}
                    {outlierCap && !showOutliers && (
                      <div className="flex items-center gap-2">
                        <span className="text-orange text-sm leading-none">▲</span>
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Outlier pinned to top</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* About this data: collapsed on phones, open on desktop */}
            {quality && (
              <div ref={aboutRef} className="mt-4 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg scroll-mt-4">
                <button
                  type="button"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-azure" />
                    How to read this chart
                  </span>
                  {aboutOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {aboutOpen && (
                  <div className="px-4 pb-3 space-y-1">
                    <div>
                      <strong>{quality.observations}</strong> months with recorded sales between {fmtMonth(quality.first)} and {fmtMonth(quality.last)}
                      {' '}({quality.coveragePct}% of the {quality.spanMonths} months in that span).
                    </div>
                    <div>
                      Yearly points are the average of that year's monthly averages; monthly points are the average of that month's sales. Labels mark the first, last, highest, lowest and pronounced turning points. Drag the handles above the chart to zoom into a period.
                    </div>
                    {quality.gaps.length > 0 && (
                      <div>
                        No sales recorded for {quality.gaps.map((g) => `${fmtMonth(g.from)} to ${fmtMonth(g.to)} (${g.months} months)`).join('; ')}. The chart leaves these spans blank rather than drawing a line across them.
                      </div>
                    )}
                    {quality.sparse && (
                      <div className="text-amber-700">
                        Sparse series: fewer than {SPARSE_POINTS} observed months, so the view opens as scatter and no trend is fitted. Values reflect the few sales that occurred and may be single transactions.
                      </div>
                    )}
                    {quality.repeated.length > 0 && (
                      <div className="text-amber-700">
                        The value {quality.repeated.map((r) => `${Math.round(r.value).toLocaleString('en-US')} AED/m² appears ${r.times} times`).join(', ')} on different dates, which suggests the same property or a placeholder in the source rather than independent sales.
                      </div>
                    )}
                    {outlierCap && (
                      <div className="text-amber-700">
                        {outlierCap.count} {timePeriod === 'yearly' ? 'year' : 'month'}{outlierCap.count === 1 ? '' : 's'} sit far above the rest of the series (over {fmtAed(outlierCap.cap)} AED/m², typically a single unusual sale). {showOutliers ? 'The axis is showing them at full scale.' : 'They are pinned to the top edge so the other points stay readable; use the outliers button to show the full scale.'}
                      </div>
                    )}
                    {trendUnavailableReason && <div className="text-gray-600">{trendUnavailableReason}.</div>}
                    {trendLine && (
                      <div className="text-gray-600">
                        Trend: ordinary least-squares line through the {trendLine.n} points in view, {trendLine.perYearPct >= 0 ? '+' : ''}{trendLine.perYearPct.toFixed(1)}% a year relative to the average level. A summary of direction, not a prediction.
                      </div>
                    )}
                    {showMarket && (
                      <div className="text-gray-600">
                        Dubai average: {dubaiIndex.method} Equal-weighted by area, not by number of sales.
                      </div>
                    )}
                    {hasForecast ? (
                      <div>
                        Forecast: bundled gradient-boosting (XGBoost) model projection, monthly from {fmtMonth(quality.forecastStart)} to {fmtMonth(quality.forecastEnd)}, drawn dashed from the last recorded point. A model output for orientation only, not a prediction of actual sales, and unvalidated against outcomes.
                      </div>
                    ) : (
                      <div>No forecast is available for this area, so only recorded sales are shown.</div>
                    )}
                    <div className="text-gray-500">Source: Dubai Land Department transaction export bundled with GeoStats, monthly average sale price per m² by area.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default GraphModal;
