import React, { useMemo, useState, useEffect, useRef } from "react";
import { useCallback } from "react";
import { X, Calendar, ZoomIn, ZoomOut, Maximize2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Info, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import DraggableBar from "./DraggableBar";

// Minimum observations before a fitted trend line is meaningful, and the gap
// (in months) beyond which the line is broken rather than drawn across
// missing months. Both are shown to the user in the data-quality panel.
const MIN_TREND_POINTS = 12;
const GAP_MONTHS = 3;
const SPARSE_POINTS = 12;

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
const fmtAed = (v) => Math.round(v).toLocaleString('en-US');
// Axis labels: thousands are abbreviated on phones, where the axis is narrow.
const fmtAxis = (v, compact) =>
  compact && Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1)}k` : fmtAed(v);

const GraphModal = ({ 
  isOpen = true, 
  onClose = () => {}, 
  series = [], 
  placeName = "Demo Location", 
  pastSeries = [] 
}) => {
  const [chartType, setChartType] = useState("line");
  const [showTrend, setShowTrend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [dataView, setDataView] = useState("all");
  const [timePeriod, setTimePeriod] = useState("all");
  const [customRange, setCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [zoom, setZoom] = useState(1);
  const [panValue, setPanValue] = useState(50);
  const [cursor, setCursor] = useState(null);
  const svgRef = useRef(null);

  // Phone layout: a narrower SVG so axis text stays legible once scaled down,
  // explanations collapsed by default, and a readout strip instead of a
  // floating tooltip.
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [showOutliers, setShowOutliers] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640);
  
  const svgWidth = compact ? 380 : 760;
  const svgHeight = compact ? 280 : 360;
  const axisFont = compact ? 12 : 11;
  // Memoised so the useCallback hooks below keep a stable dependency.
  const margin = useMemo(
    () => (compact ? { top: 24, right: 12, bottom: 34, left: 44 } : { top: 20, right: 20, bottom: 40, left: 50 }),
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
  // outlives a single opening. Without this reset the date window, zoom and pan
  // captured for the first area stay pinned for the rest of the session: a later
  // area draws a new trend line inside the previous area's axes.
  const lastPlace = useRef(null);
  useEffect(() => {
    if (placeName === lastPlace.current) return;
    lastPlace.current = placeName;
    setCustomRange(false);
    setStartDate("");
    setEndDate("");
    setZoom(1);
    setPanValue(50);
    setCursor(null);
  }, [placeName]);

  // Initialize date range. startDate is cleared above whenever the area changes,
  // so this re-seeds the window from each new area's own first and last dates.
  useEffect(() => {
    if (allData.length > 0 && !startDate) {
      const dates = allData.map(d => d.x);
      setStartDate(new Date(Math.min(...dates)).toISOString().split('T')[0]);
      setEndDate(new Date(Math.max(...dates)).toISOString().split('T')[0]);
    }
  }, [allData, startDate]);

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
      
      return {
        x: periodDate,
        y: avgY,
        date: periodDate.toISOString(),
        type: group.types.has('historical') && group.types.has('forecast') ? 'mixed' : 
              group.types.has('historical') ? 'historical' : 'forecast',
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
    
    if (customRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(d => d.x >= start && d.x <= end);
    }
    
    return aggregateData(filtered, timePeriod);
  }, [allData, dataView, customRange, startDate, endDate, timePeriod, aggregateData]);

  // Scale functions
  const dataExists = dataPoints.length > 0;
  const xValues = dataPoints.map(p => p.x.getTime());
  const xMin = dataExists ? Math.min(...xValues) : 0;
  const xMax = dataExists ? Math.max(...xValues) : 1;
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
  const yMax = outlierCap && !showOutliers ? outlierCap.cap : yMaxRaw;
  const yRange = yMax - yMin;
  const isCapped = (y) => Boolean(outlierCap) && !showOutliers && y > outlierCap.cap;

  const xScale = useCallback((date) => {
    if (!dataExists || xMax === xMin) return margin.left;
    
    const chartWidth = svgWidth - margin.left - margin.right;
    const baseX = margin.left + ((date.getTime() - xMin) / (xMax - xMin)) * chartWidth;
    
    // Apply zoom and pan
    const center = svgWidth / 2;
    const panOffset = (panValue - 50) * chartWidth * (zoom - 1) / 50;
    
    return (baseX - center) * zoom + center - panOffset;
  }, [dataExists, xMin, xMax, zoom, panValue, svgWidth, margin]);

  const yScale = useCallback((value) => {
    if (!dataExists || yRange === 0) return svgHeight - margin.bottom;
    const v = Math.min(value, yMin + yRange); // pinned outliers sit on the top edge
    return svgHeight - margin.bottom - ((v - yMin) / yRange) * (svgHeight - margin.top - margin.bottom);
  }, [dataExists, yMin, yRange, svgHeight, margin]);

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

  const ticksY = useMemo(() => {
    const step = (yMax - yMin) / 5;
    return Array.from({ length: 6 }, (_, i) => yMin + i * step);
  }, [yMin, yMax]);

  // Line path: straight segments between observed points, and no segment at
  // all where more than GAP_MONTHS months passed with nothing recorded.
  const buildPath = useCallback((pts) => {
    let path = "";
    pts.forEach((p, i) => {
      const prev = pts[i - 1];
      const startNew = i === 0 || monthsBetween(prev.x, p.x) > GAP_MONTHS;
      path += `${startNew ? ' M' : ' L'} ${xScale(p.x)} ${yScale(p.y)}`;
    });
    return path.trim();
  }, [xScale, yScale]);
  const pathD = useMemo(() => buildPath(dataPoints.filter((p) => p.type !== 'forecast')), [dataPoints, buildPath]);
  const forecastPathD = useMemo(() => buildPath(dataPoints.filter((p) => p.type === 'forecast')), [dataPoints, buildPath]);

  // Spans with no observations, drawn as a hatched band so a gap reads as a
  // gap rather than as a flat price.
  const gapBands = useMemo(() => {
    const bands = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const a = dataPoints[i - 1], b = dataPoints[i];
      if (a.type === 'historical' && b.type === 'historical' && monthsBetween(a.x, b.x) > GAP_MONTHS) {
        bands.push({ x1: xScale(a.x), x2: xScale(b.x), months: monthsBetween(a.x, b.x) - 1 });
      }
    }
    return bands;
  }, [dataPoints, xScale]);

  // Trend line
  const trendLine = useMemo(() => {
    // Fit to recorded sales only; a line through model output would describe
    // the model, not the market.
    const basis = dataView === 'forecast' ? dataPoints : dataPoints.filter((p) => p.type !== 'forecast');
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
  }, [dataPoints, xScale, yScale, quality, dataView]);

  const observedInView = dataPoints.filter((p) => p.type !== 'forecast').length;
  const forecastInView = dataPoints.length - observedInView;
  const trendUnavailableReason = !trendLine && showTrend
    ? observedInView < MIN_TREND_POINTS
      ? `Trend needs at least ${MIN_TREND_POINTS} observed months (this view has ${observedInView})`
      : 'Trend hidden: the series has a gap of 2+ years'
    : null;

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 10));
  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.3, 1);
      if (newZoom === 1) setPanValue(50);
      return newZoom;
    });
  };
  const handleResetView = () => {
    setZoom(1);
    setPanValue(50);
  };

  // Cursor tracking. The pointer position (CSS px) is converted to SVG units
  // and the zoom / pan of xScale is inverted, so the readout matches the finger
  // or mouse at any screen size.
  const updateCursor = useCallback((clientX) => {
    if (!svgRef.current || !dataExists) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const sx = (clientX - rect.left) * (svgWidth / rect.width);
    const chartWidth = svgWidth - margin.left - margin.right;
    const center = svgWidth / 2;
    const panOffset = (panValue - 50) * chartWidth * (zoom - 1) / 50;
    const baseX = (sx - center + panOffset) / zoom + center;
    const t = xMin + ((baseX - margin.left) / chartWidth) * (xMax - xMin);

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
  }, [dataExists, dataPoints, svgWidth, margin, panValue, zoom, xMin, xMax, xScale]);
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

  const description = 'Monthly average of residential sale prices per square metre, Dubai Land Department transactions (bundled export, Jan 2010 to Aug 2025). Months with no sales are not shown.';
  // The readout strip shows the point under the finger or mouse, otherwise the
  // latest point in view. It replaces a floating tooltip, whose position could
  // not follow the SVG once it was scaled down to a phone.
  const readout = cursor ? cursor.point : (dataPoints.length ? dataPoints[dataPoints.length - 1] : null);
  const readoutDate = (p) => (timePeriod === 'yearly' ? String(p.x.getFullYear()) : fmtMonth(p.x));
  const readoutKind = (p) =>
    (p.type === 'forecast' ? 'Model forecast' : p.type === 'mixed' ? 'Historical + forecast average' : 'Recorded sales') +
    (p.aggregated ? ` · avg of ${p.count}` : '');
  const segment = (active) =>
    `flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-medium transition-colors ${
      active ? 'bg-azure text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
    }`;
  const chip = (active) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 sm:px-3 sm:py-1.5 text-xs font-medium transition-colors ${
      active ? 'bg-blue text-white border-blue' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;
  const pctBadge = (pct) =>
    `inline-flex items-center gap-0.5 mt-0.5 text-[11px] font-semibold ${pct >= 0 ? 'text-emerald-200' : 'text-rose-200'}`;
  const xTickStep = compact ? Math.max(1, Math.ceil(ticksX.length / 5)) : 1;
  const pointRadius = timePeriod === 'yearly' ? (compact ? 5 : 6) : timePeriod === 'monthly' ? (compact ? 3.5 : 4.5) : (compact ? 3 : 4);

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
          {/* Header: place name as the headline, with the key figures beneath it */}
          <div className="relative px-4 sm:px-6 pt-2.5 sm:pt-4 pb-4 bg-gradient-to-r from-blue to-azure text-white">
            <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/40" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Average price per m² · AED</div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight truncate">{placeName}</h2>
                <p className="hidden sm:block text-xs text-white/75 mt-1 max-w-2xl">{description}</p>
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
              {/* Time Period Selection */}
              <div className="flex items-center flex-wrap gap-3">
                <span className="hidden sm:inline text-sm font-semibold text-gray-700">Time Period:</span>
                <div className="flex w-full sm:w-auto rounded-xl sm:rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                  <button className={segment(timePeriod === "all")} onClick={() => setTimePeriod("all")}>
                    All points
                  </button>
                  <button className={`${segment(timePeriod === "monthly")} border-l border-gray-300`} onClick={() => setTimePeriod("monthly")}>
                    Monthly avg
                  </button>
                  <button className={`${segment(timePeriod === "yearly")} border-l border-gray-300`} onClick={() => setTimePeriod("yearly")}>
                    Yearly avg
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Data View Selection */}
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

                {/* Chart Type and zoom share a row on phones; on wider screens the
                    wrapper dissolves (contents) and the zoom pill moves to the end */}
                <div className="flex items-center justify-between w-full sm:w-auto sm:contents">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm font-semibold text-gray-700">Type:</span>
                  <div className="inline-flex rounded-xl sm:rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                    <button className={segment(chartType === "line")} onClick={() => setChartType("line")}>
                      Line
                    </button>
                    <button className={`${segment(chartType === "scatter")} border-l border-gray-300`} onClick={() => setChartType("scatter")}>
                      Scatter
                    </button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-white overflow-hidden sm:order-last">
                  <button
                    onClick={handleZoomOut}
                    className="p-3 sm:p-2 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    title="Zoom Out"
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-xs text-gray-600 font-medium tabular-nums min-w-[3rem] text-center">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                  <button onClick={handleZoomIn} className="p-3 sm:p-2 hover:bg-gray-100 transition-colors" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetView}
                    className="p-3 sm:p-2 border-l border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    title="Reset View"
                    disabled={zoom <= 1}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
                </div>

                {/* Options */}
                <div className="flex items-center flex-wrap gap-2 sm:ml-auto">
                  <button type="button" aria-pressed={showTrend} className={chip(showTrend)} onClick={() => setShowTrend((v) => !v)}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trend
                  </button>
                  <button type="button" aria-pressed={showLabels} className={chip(showLabels)} onClick={() => setShowLabels((v) => !v)}>
                    Labels
                  </button>
                  {outlierCap && (
                    <button
                      type="button"
                      aria-pressed={showOutliers}
                      className={chip(showOutliers)}
                      onClick={() => setShowOutliers((v) => !v)}
                      title={`${outlierCap.count} month${outlierCap.count === 1 ? '' : 's'} above ${fmtAed(outlierCap.cap)} AED/m² ${showOutliers ? 'shown at full scale' : 'pinned to the top edge'}`}
                    >
                      {showOutliers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {outlierCap.count} outlier{outlierCap.count === 1 ? '' : 's'}
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="flex items-center flex-wrap gap-2 sm:gap-3 pt-3 border-t border-gray-200">
                <button type="button" aria-pressed={customRange} className={chip(customRange)} onClick={() => setCustomRange((v) => !v)}>
                  <Calendar className="w-3.5 h-3.5" />
                  Custom range
                </button>

                {customRange && (
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 sm:flex-none min-w-0 px-3 py-2 sm:py-1.5 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500 font-medium">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 sm:flex-none min-w-0 px-3 py-2 sm:py-1.5 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Data Summary */}
                <div className="text-xs text-gray-600 sm:ml-auto bg-gray-50 px-3 py-1.5 rounded-lg">
                  <strong>{observedInView}</strong> <span className="hidden sm:inline">observed </span>{timePeriod === "yearly" ? "years" : "months"}
                  {forecastInView > 0 && <span className="ml-1">+ <strong>{forecastInView}</strong> forecast</span>}
                  {timePeriod !== "all" && <span className="ml-1">({timePeriod} average)</span>}
                </div>
              </div>

              {/* The pan bar only means something once the chart is zoomed */}
              {zoom > 1 && (
                <DraggableBar value={panValue} onChange={setPanValue} disabled={zoom <= 1} />
              )}
            </div>

            {/* SVG Chart */}
            {dataPoints.length === 0 ? (
              <div className="flex items-center justify-center h-64 sm:h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500 text-sm">No data available for selected range</p>
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
                      {fmtAed(readout.y)} <span className="text-[11px] font-medium text-white/70">AED/m²</span>
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
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
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
                          fill="#f3f4f6"
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
                    {quality?.forecastStart && dataView === "all" && (
                      <>
                        <line
                          x1={xScale(quality.forecastStart)}
                          x2={xScale(quality.forecastStart)}
                          y1={margin.top}
                          y2={svgHeight - margin.bottom}
                          stroke="#10b981"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x={xScale(quality.forecastStart) + 4}
                          y={svgHeight - margin.bottom - 6}
                          fontSize={axisFont - 1}
                          fill="#059669"
                        >
                          forecast →
                        </text>
                      </>
                    )}

                    {/* Y-axis unit */}
                    <text
                      x={6}
                      y={margin.top - 8}
                      fontSize={axisFont - 1}
                      fill="#6b7280"
                      fontWeight="500"
                    >
                      AED / m²
                    </text>

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

                    {/* Cursor line */}
                    {cursor && (
                      <line
                        x1={cursor.x}
                        x2={cursor.x}
                        y1={margin.top}
                        y2={svgHeight - margin.bottom}
                        stroke="#aaa"
                        strokeDasharray="4"
                      />
                    )}

                    {/* Cursor point highlight */}
                    {cursor && (
                      <circle
                        cx={cursor.x}
                        cy={yScale(cursor.point.y)}
                        r={5}
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth={2}
                      />
                    )}

                    {/* Axes */}
                    <line
                      x1={margin.left}
                      y1={svgHeight - margin.bottom}
                      x2={svgWidth - margin.right}
                      y2={svgHeight - margin.bottom}
                      stroke="#9ca3af"
                      strokeWidth="2"
                    />
                    <line
                      x1={margin.left}
                      y1={margin.top}
                      x2={margin.left}
                      y2={svgHeight - margin.bottom}
                      stroke="#9ca3af"
                      strokeWidth="2"
                    />

                    {/* X-axis labels: every year on desktop, a readable subset on phones */}
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

                    {/* Y-axis labels */}
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
                      {/* Line chart with gradient */}
                      {chartType === "line" && (
                        <>
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d={forecastPathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray="5,4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}

                      {/* Points: a pinned outlier is drawn as a triangle at the top edge */}
                      {dataPoints.map((p, i) => (
                        <g key={i}>
                          {isCapped(p.y) ? (
                            <path
                              d={`M ${xScale(p.x)} ${margin.top + 2} l -5 9 h 10 z`}
                              fill="#f59e0b"
                              stroke="white"
                              strokeWidth="1.5"
                            />
                          ) : (
                            <circle
                              cx={xScale(p.x)}
                              cy={yScale(p.y)}
                              r={pointRadius}
                              fill={p.type === "historical" ? "#3b82f6" : "#10b981"}
                              stroke="white"
                              strokeWidth="2"
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            />
                          )}
                          {showLabels && !isCapped(p.y) && (
                            <text
                              x={xScale(p.x) + 8}
                              y={yScale(p.y) - 8}
                              fontSize={axisFont - 1}
                              fontWeight="600"
                              fill="#374151"
                              style={{ pointerEvents: 'none' }}
                            >
                              {fmtAxis(p.y, compact)}
                            </text>
                          )}
                        </g>
                      ))}

                      {/* Trend line */}
                      {showTrend && trendLine && (
                        <>
                          <line
                            x1={trendLine.x1}
                            y1={trendLine.y1}
                            x2={trendLine.x2}
                            y2={trendLine.y2}
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="6,4"
                            opacity="0.8"
                          />
                          <text
                            x={svgWidth - margin.right - 6}
                            y={margin.top + 12}
                            textAnchor="end"
                            fontSize={axisFont}
                            fill="#f59e0b"
                            fontWeight="600"
                          >
                            {compact
                              ? `${trendLine.slope > 0 ? '↗' : '↘'} ${trendLine.perYearPct >= 0 ? '+' : ''}${trendLine.perYearPct.toFixed(1)}%/yr`
                              : `${trendLine.slope > 0 ? '↗ Upward' : '↘ Downward'} trend, ${trendLine.perYearPct >= 0 ? '+' : ''}${trendLine.perYearPct.toFixed(1)}%/yr over ${trendLine.n} points`}
                          </text>
                        </>
                      )}
                    </g>
                  </svg>
                </div>

                {/* Legend */}
                {dataView === "all" && activeHistorical.length > 0 && (
                  <div className="flex items-center justify-start sm:justify-center flex-wrap gap-x-4 gap-y-1.5 mt-3 sm:mt-4 text-xs bg-white rounded-lg py-2 sm:py-3 px-3 sm:px-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#3b82f6] ring-2 ring-blue-200"></div>
                      <span className="font-medium text-xs sm:text-sm text-gray-700">Recorded sales (DLD)</span>
                    </div>
                    {hasForecast && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 ring-2 ring-green-200"></div>
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Model forecast</span>
                      </div>
                    )}
                    {gapBands.length > 0 && chartType === "line" && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></div>
                        <span className="font-medium text-xs sm:text-sm text-gray-700">No sales recorded</span>
                      </div>
                    )}
                    {outlierCap && !showOutliers && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-sm leading-none">▲</span>
                        <span className="font-medium text-xs sm:text-sm text-gray-700">Outlier pinned to top</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* About this data: collapsed on phones, open on desktop */}
            {quality && (
              <div className="mt-4 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAboutOpen((v) => !v)}
                  aria-expanded={aboutOpen}
                  className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-azure" />
                    About this data
                  </span>
                  {aboutOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {aboutOpen && (
                  <div className="px-4 pb-3 space-y-1">
                    <div className="sm:hidden">{description}</div>
                    <div>
                      <strong>{quality.observations}</strong> months with recorded sales between {fmtMonth(quality.first)} and {fmtMonth(quality.last)}
                      {' '}({quality.coveragePct}% of the {quality.spanMonths} months in that span).
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
                        {outlierCap.count} month{outlierCap.count === 1 ? '' : 's'} sit far above the rest of the series (over {fmtAed(outlierCap.cap)} AED/m², typically a single unusual sale). {showOutliers ? 'The axis is showing them at full scale.' : 'They are pinned to the top edge so the other months stay readable; use the outliers button to show the full scale.'}
                      </div>
                    )}
                    {trendUnavailableReason && <div className="text-gray-600">{trendUnavailableReason}.</div>}
                    {trendLine && (
                      <div className="text-gray-600">
                        Trend: ordinary least-squares line through the {trendLine.n} points in view, {trendLine.perYearPct >= 0 ? '+' : ''}{trendLine.perYearPct.toFixed(1)}% a year relative to the average level. A summary of direction, not a prediction.
                      </div>
                    )}
                    {hasForecast ? (
                      <div>
                        Forecast: bundled gradient-boosting (XGBoost) model projection, monthly from {fmtMonth(quality.forecastStart)} to {fmtMonth(quality.forecastEnd)}, shown in green. A model output for orientation only, not a prediction of actual sales, and unvalidated against outcomes.
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
