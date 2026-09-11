import React, { useMemo, useState, useEffect, useRef } from "react";
import { useCallback } from "react";
import { X, Calendar, ZoomIn, ZoomOut, Maximize2, TrendingUp } from "lucide-react";
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
  
  const svgWidth = 760;
  const svgHeight = 360;
  // Memoised so the useCallback hooks below keep a stable dependency.
  const margin = useMemo(() => ({ top: 20, right: 20, bottom: 40, left: 50 }), []);

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
  const yMax = dataExists ? Math.max(...yValues) : 1;
  const yRange = yMax - yMin;

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
    return svgHeight - margin.bottom - ((value - yMin) / yRange) * (svgHeight - margin.top - margin.bottom);
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

  // Cursor tracking
  const handleChartMouseMove = (e) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const ratio = (mouseX - margin.left) / (svgWidth - margin.left - margin.right);
    const dateAtCursor = new Date(xMin + ratio * (xMax - xMin));

    let nearest = null;
    let minDist = Infinity;
    dataPoints.forEach(p => {
      const dist = Math.abs(p.x.getTime() - dateAtCursor.getTime());
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    });

    if (nearest) {
      setCursor({ x: xScale(nearest.x), point: nearest });
    }
  };

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

  return isOpen ? (
     <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={
        isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }
      }
      transition={{ duration: 0.5, ease: "easeInOut" }}
      // className="mobile-modal fixed bottom-0 w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] right-1 md:right-[2%] xl:right-[5%] z-50 p-2 mobile-scroll-fix"
      className="fixed bottom-0 w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] right-1 md:right-[2%] xl:right-[5%] z-50 p-2 overflow-y-auto"
    >
    <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Average Price per m² (AED)
              {placeName && <span className="text-blue-600"> — {placeName}</span>}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Monthly average of residential sale prices per square metre, Dubai Land Department transactions (bundled export, Jan 2010 to Aug 2025). Months with no sales are not shown.
            </p>
            {/* {stats && (
              <div className="flex gap-4 mt-1 text-xs text-gray-600">
                <span>Avg: <strong className="text-gray-900">{stats.avg.toFixed(2)}</strong></span>
                <span>Max: <strong className="text-green-600">{stats.max.toFixed(2)}</strong></span>
                <span>Min: <strong className="text-orange-600">{stats.min.toFixed(2)}</strong></span>
              </div>
            )} */}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>


        <div className="flex-1 px-6 py-5 overflow-y-auto">
          {/* Controls */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Time Period Selection */}
            <div className="flex items-center flex-wrap gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">Time Period:</span>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                <button
                  className={`px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                    timePeriod === "all"
                      ? "bg-azure text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => setTimePeriod("all")}
                >
                  All Points
                </button>
                <button
                  className={`px-4 py-2 text-xs sm:text-sm font-medium border-l border-gray-300 transition-all ${
                    timePeriod === "monthly"
                      ? "bg-azure text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => setTimePeriod("monthly")}
                >
                  Monthly Avg
                </button>
                <button
                  className={`px-4 py-2 text-xs sm:text-sm font-medium border-l border-gray-300 transition-all ${
                    timePeriod === "yearly"
                      ? "bg-azure text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => setTimePeriod("yearly")}
                >
                  Yearly Avg
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Data View Selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">View:</span>
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                  <button
                    className={`px-3 py-1.5 text-xs sm:text-sm transition-all ${
                      dataView === "all"
                        ? "bg-azure text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setDataView("all")}
                  >
                    All
                  </button>
                  {activeHistorical.length > 0 && (
                    <button
                      className={`px-3 py-1.5 text-xs sm:text-sm border-l border-gray-300 transition-all ${
                        dataView === "historical"
                          ? "bg-azure text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => setDataView("historical")}
                    >
                      Historical
                    </button>
                  )}
                  {hasForecast && (
                    <button
                      className={`px-3 py-1.5 text-xs sm:text-sm border-l border-gray-300 transition-all ${
                        dataView === "forecast"
                          ? "bg-azure text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => setDataView("forecast")}
                    >
                      Forecast
                    </button>
                  )}
                </div>
              </div>

              {/* Chart Type */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Type:</span>
                <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                  <button
                    className={`px-3 py-1.5 text-xs sm:text-sm transition-all ${
                      chartType === "line"
                        ? "bg-azure text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setChartType("line")}
                  >
                    Line
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs sm:text-sm border-l border-gray-300 transition-all ${
                      chartType === "scatter"
                        ? "bg-azure text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setChartType("scatter")}
                  >
                    Scatter
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-1 sm:gap-3 ml-auto">
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={showTrend}
                    onChange={(e) => setShowTrend(e.target.checked)}
                    className="cursor-pointer w-4 h-4 text-blue-600"
                  />
                  <TrendingUp className="w-4 h-4" />
                  Trend
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="cursor-pointer w-4 h-4 text-blue-600"
                  />
                  Labels
                </label>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-l pl-1 sm:pl-3 border-gray-300">
                  <button
                    onClick={handleZoomIn}
                    className="p-0.5 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-0.5 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom Out"
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetView}
                    className="p-0.5 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Reset View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium ml-1">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-gray-200">
              <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={customRange}
                  onChange={(e) => setCustomRange(e.target.checked)}
                  className="cursor-pointer w-4 h-4 text-blue-600"
                />
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Custom Range</span>
              </label>
              
              {customRange && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-500 font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Data Summary */}
              <div className="text-xs text-gray-600 ml-auto bg-gray-50 px-3 py-1.5 rounded-lg">
                <strong>{observedInView}</strong> observed {timePeriod === "yearly" ? "years" : "months"}
                {forecastInView > 0 && <span className="ml-1">+ <strong>{forecastInView}</strong> forecast</span>}
                {timePeriod !== "all" && <span className="ml-1">({timePeriod} average)</span>}
              </div>
            </div>

            <div>
          <DraggableBar
          value={panValue}
          onChange={setPanValue}
          disabled={zoom<=1}
          ></DraggableBar>
        </div>
        
          </div>

          {/* SVG Chart */}
          {dataPoints.length === 0 ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No data available for selected range</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
              <div className="relative h-0 w-full pt-[47.3%]">
                <svg 
                  ref={svgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="absolute top-0 left-0 w-full h-full"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setCursor(null)}
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
                          fontSize="10"
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
                        fontSize="10"
                        fill="#059669"
                      >
                        forecast →
                      </text>
                    </>
                  )}

                  {/* Y-axis unit */}
                  <text
                    x={12}
                    y={margin.top - 6}
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="500"
                  >
                    AED / m²
                  </text>

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

                  {/* X-axis labels */}
                  {ticksX.map((t, i) => (
                    <text
                      key={`label-x-${i}`}
                      x={xScale(t)}
                      y={svgHeight - margin.bottom + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="500"
                      fill="#6b7280"
                    >
                      {t.getFullYear()}
                      {/* {timePeriod === "yearly" 
                        ? t.getFullYear()
                        : t.toLocaleString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                      } */}
                    </text>
                  ))}

                  {/* Y-axis labels */}
                  {ticksY.map((t, i) => (
                    <text
                      key={`label-y-${i}`}
                      x={margin.left - 12}
                      y={yScale(t) + 4}
                      textAnchor="end"
                      fontSize="11"
                      fontWeight="500"
                      fill="#6b7280"
                    >
                      {t.toFixed(1)}
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

                    {/* Scatter points */}
                    {dataPoints.map((p, i) => (
                      <g key={i}>
                        {(chartType === "scatter" || chartType === "line") && (
                          <circle
                            cx={xScale(p.x)}
                            cy={yScale(p.y)}
                            r={timePeriod === "yearly" ? "6" : timePeriod === "monthly" ? "4.5" : "4"}
                            fill={p.type === "historical" ? "#3b82f6" : "#10b981"}
                            stroke="white"
                            strokeWidth="2"
                            className="cursor-pointer transition-all hover:r-6"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            // onMouseEnter={(e) => handleMouseEnter(e, p)}
                            // onMouseLeave={() => setTooltip(null)}
                          />
                        )}
                        {showLabels && (
                          <text
                            x={xScale(p.x) + 8}
                            y={yScale(p.y) - 8}
                            fontSize="10"
                            fontWeight="600"
                            fill="#374151"
                            style={{ pointerEvents: 'none' }}
                          >
                            {p.y.toFixed(1)}
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
                          x={svgWidth - margin.right - 10}
                          y={margin.top + 15}
                          textAnchor="end"
                          fontSize="11"
                          fill="#f59e0b"
                          fontWeight="600"
                        >
                          {trendLine.slope > 0 ? '↗ Upward' : '↘ Downward'} trend, {trendLine.perYearPct >= 0 ? '+' : ''}{trendLine.perYearPct.toFixed(1)}%/yr over {trendLine.n} points
                        </text>
                      </>
                    )}
                  </g>
                </svg>
              </div>
              
              {cursor && (
                <div
                  className="absolute bg-gray-900 text-white shadow-md border rounded px-2 py-1 text-sm"
                  style={{
                    left: cursor.x + margin.left,
                    top: yScale(cursor.point.y) - 40,
                  }}
                >
                  <div><strong>{timePeriod === "yearly" ? cursor.point.x.getFullYear() : fmtMonth(cursor.point.x)}</strong></div>
                  <div>{Math.round(cursor.point.y).toLocaleString('en-US')} AED/m²</div>
                  <div className="text-[10px] text-gray-300">
                    {cursor.point.type === 'forecast' ? 'Model forecast' : cursor.point.type === 'mixed' ? 'Historical + forecast average' : 'Recorded sales'}
                    {cursor.point.aggregated ? ` · avg of ${cursor.point.count}` : ''}
                  </div>
                </div>
              )}


              {/* Tooltip */}
              {/* {tooltip  && (
                <div
                  className="fixed bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-2xl pointer-events-none z-50 border border-gray-700"
                  style={{
                    top: tooltip.y - 70,
                    left: tooltip.x,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-semibold text-xs mb-2">
                    {timePeriod === "yearly" 
                      ? tooltip.value.x.getFullYear()
                      : timePeriod === "monthly"
                      ? tooltip.value.x.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : tooltip.value.x.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Value:</span>
                    <span className="font-bold text-xs text-blue-400">{tooltip.value.y.toFixed(2)}</span>
                  </div>
                  {tooltip.value.aggregated && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      Avg of {tooltip.value.count} points
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      tooltip.value.type === 'historical' ? 'bg-azure' :
                      tooltip.value.type === 'mixed' ? 'bg-purple-600' :
                      'bg-green-600'
                    }`}>
                      {tooltip.value.type === 'mixed' ? 'Historical + Forecast' : 
                       tooltip.value.type.charAt(0).toUpperCase() + tooltip.value.type.slice(1)}
                    </span>
                  </div>
                </div>
              )} */}
              
              {/* Legend */}
              {dataView === "all" && activeHistorical.length > 0 && (
                <div className="flex items-center justify-center gap-6 mt-4 text-xs bg-white rounded-lg py-3 px-4 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#3b82f6] ring-2 ring-blue-200"></div>
                    <span className="font-medium text-xs sm:text-sm text-gray-700">Recorded sales (DLD)</span>
                  </div>
                  {hasForecast && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 ring-2 ring-green-200"></div>
                      <span className="font-medium text-xs sm:text-sm text-gray-700">Model forecast</span>
                    </div>
                  )}
                  {gapBands.length > 0 && chartType === "line" && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></div>
                      <span className="font-medium text-xs sm:text-sm text-gray-700">No sales recorded</span>
                    </div>
                  )}
                  {/* {timePeriod !== "all" && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-200"></div>
                      <span className="font-medium text-gray-700">Mixed Period</span>
                    </div>
                  )} */}
                </div>
              )}
            </div>
          )}

          {/* About this data */}
          {quality && (
            <div className="mt-4 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1">
              <div className="font-semibold text-gray-800">About this data</div>
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
      </div>
    </motion.div>
  ) : null;
};

export default GraphModal;