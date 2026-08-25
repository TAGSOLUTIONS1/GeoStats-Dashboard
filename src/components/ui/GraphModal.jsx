import React, { useMemo, useState, useEffect, useRef } from "react";
import { useCallback } from "react";
import { X, Calendar, ZoomIn, ZoomOut, Maximize2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import DraggableBar from "./DraggableBar";

const mockForecastData = Array.from({ length: 24 }, (_, i) => ({
  ds: new Date(2024, i, 1).toISOString(),
  yhat: 45 + Math.random() * 10 + i * 0.5,
  name_en: "Demo Area",
  area_id: "464"
}));

const mockHistoricalData = Array.from({ length: 36 }, (_, i) => ({
  ds: new Date(2021, i, 1).toISOString(),
  y: 40 + Math.random() * 8 + i * 0.3,
  name_en: "Demo Area",
  area_id: "464"
}));

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

  const activeSeries = series.length > 0 ? series : mockForecastData;
  const activeHistorical = pastSeries.length > 0 ? pastSeries : mockHistoricalData;
  
  // Combine and sort data
  const allData = useMemo(() => {
    const combined = [];
    
    activeHistorical?.forEach((item) => {
      combined.push({
        x: new Date(item.instance_date || item.ds),
        y: parseFloat(item.avg_meter_price || item.y || item.yhat),
        date: item.instance_date || item.ds,
        type: 'historical'
      });
    });
    
    activeSeries.forEach((item) => {
      combined.push({
        x: new Date(item.ds),
        y: parseFloat(item.yhat),
        date: item.ds,
        type: 'forecast'
      });
    });
    
    return combined.sort((a, b) => a.x - b.x);
  }, [activeSeries, activeHistorical]);

  // Initialize date range
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

  // Line path
  const pathD = useMemo(() => {
    if (dataPoints.length === 0) return "";
    if (dataPoints.length === 1) {
      const p = dataPoints[0];
      return `M ${xScale(p.x)} ${yScale(p.y)}`;
    }
    
    let path = `M ${xScale(dataPoints[0].x)} ${yScale(dataPoints[0].y)}`;
    for (let i = 1; i < dataPoints.length; i++) {
      const curr = dataPoints[i];
      const prev = dataPoints[i - 1];
      const x1 = xScale(prev.x);
      const y1 = yScale(prev.y);
      const x2 = xScale(curr.x);
      const y2 = yScale(curr.y);
      const mx = (x1 + x2) / 2;
      path += ` C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    }
    return path;
  }, [dataPoints, xScale, yScale]);

  // Trend line
  const trendLine = useMemo(() => {
    if (dataPoints.length < 2) return null;

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    dataPoints.forEach(p => {
      const xVal = p.x.getTime();
      sumX += xVal;
      sumY += p.y;
      sumXY += xVal * p.y;
      sumXX += xVal * xVal;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    if (!isFinite(slope)) return null;

    const y1 = slope * xMin + intercept;
    const y2 = slope * xMax + intercept;

    return {
      x1: xScale(new Date(xMin)),
      y1: yScale(y1),
      x2: xScale(new Date(xMax)),
      y2: yScale(y2),
      slope
    };
  }, [dataPoints, xMin, xMax, xScale, yScale]);

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
              Average Meter Price
              {placeName && <span className="text-blue-600"> — {placeName}</span>}
            </h2>
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
                <strong>{dataPoints.length}</strong> data points
                {timePeriod !== "all" && <span className="ml-1">({timePeriod} aggregation)</span>}
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
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="url(#lineGradient)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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
                          {trendLine.slope > 0 ? '↗ Upward' : '↘ Downward'} Trend
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
                  <div><strong>{cursor.point.x.toISOString().split("T")[0]}</strong></div>
                  <div>Value: {cursor.point.y.toFixed(2)}</div>
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
                    <span className="font-medium text-xs sm:text-sm text-gray-700">Historical Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 ring-2 ring-green-200"></div>
                    <span className="font-medium text-xs sm:text-sm text-gray-700">Forecast Data</span>
                  </div>
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
        </div>
      </div>
    </motion.div>
  ) : null;
};

export default GraphModal;