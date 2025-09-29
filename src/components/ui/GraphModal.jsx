import React, { useMemo, useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";

// Mock data for demo
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

const GraphModal = ({ isOpen = true, onClose = () => {}, series = [], placeName = "Demo Location", pastSeries = [] }) => {
  const [tooltip, setTooltip] = useState(null);
  const [chartType, setChartType] = useState("line");
  const [showTrend, setShowTrend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [dataView, setDataView] = useState("all");
  const [customRange, setCustomRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const svgWidth = 760;
  const svgHeight = 360;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const activeSeries = series.length > 0 ? series : mockForecastData;
  const activeHistorical = pastSeries.length > 0 ? pastSeries : mockHistoricalData;
  
  // Combine historical and forecast data
  const allData = useMemo(() => {
    const combined = [];
    
    // Add historical data
    if (activeHistorical && activeHistorical.length > 0) {
      activeHistorical.forEach((item) => {
        combined.push({
          x: new Date(item.ds),
          y: parseFloat(item.y || item.yhat),
          date: item.ds,
          name: item.name_en,
          areaId: item.area_id,
          type: 'historical'
        });
      });
    }
    
    // Add forecast data
    activeSeries.forEach((item) => {
      combined.push({
        x: new Date(item.ds),
        y: parseFloat(item.yhat),
        date: item.ds,
        name: item.name_en,
        areaId: item.area_id,
        type: 'forecast'
      });
    });
    
    return combined.sort((a, b) => a.x - b.x);
  }, [activeSeries, activeHistorical]);

  // Get date range for initial values
  useEffect(() => {
    if (allData.length > 0) {
      const dates = allData.map(d => d.x);
      const min = new Date(Math.min(...dates));
      const max = new Date(Math.max(...dates));
      
      if (!startDate) setStartDate(min.toISOString().split('T')[0]);
      if (!endDate) setEndDate(max.toISOString().split('T')[0]);
    }
  }, [allData, startDate, endDate]);

  // Filter data based on view and custom range
  const dataPoints = useMemo(() => {
    let filtered = allData;
    
    // Filter by data type
    if (dataView === 'historical') {
      filtered = filtered.filter(d => d.type === 'historical');
    } else if (dataView === 'forecast') {
      filtered = filtered.filter(d => d.type === 'forecast');
    }
    
    // Filter by custom date range
    if (customRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(d => d.x >= start && d.x <= end);
    }
    
    return filtered;
  }, [allData, dataView, customRange, startDate, endDate]);
    
  // X-axis scale
  const xValues = dataPoints.map((p) => p.x.getTime());
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  const xScale = (date) =>
    margin.left +
    ((date.getTime() - xMin) / (xMax - xMin)) *
      (svgWidth - margin.left - margin.right);

  // Y-axis scale
  const yValues = dataPoints.map((p) => p.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const yScale = (value) =>
    svgHeight -
    margin.bottom -
    ((value - yMin) / (yMax - yMin)) *
      (svgHeight - margin.top - margin.bottom);

  // X-axis ticks
  const ticksX = useMemo(() => {
    const ticks = [];
    const start = new Date(xMin);
    const end = new Date(xMax);
    let current = new Date(start);
    while (current <= end) {
      ticks.push(new Date(current));
      current.setMonth(current.getMonth() + 6);
    }
    return ticks;
  }, [xMin, xMax]);

  // Y-axis ticks
  const ticksY = useMemo(() => {
    const step = (yMax - yMin) / 5;
    return Array.from({ length: 6 }, (_, i) => yMin + i * step);
  }, [yMin, yMax]);

  // Line path
  const pathD = dataPoints
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(p.x)} ${yScale(p.y)}`
    )
    .join(" ");

  // Trend line (simple linear regression)
  const trendLine = useMemo(() => {
    if (dataPoints.length < 2) return null;

    const n = dataPoints.length;
    const xs = dataPoints.map((p) => p.x.getTime());
    const ys = dataPoints.map((p) => p.y);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) ** 2;
    }
    const slope = num / den;
    const intercept = meanY - slope * meanX;

    const y1 = slope * xMin + intercept;
    const y2 = slope * xMax + intercept;

    return {
      x1: xScale(new Date(xMin)),
      y1: yScale(y1),
      x2: xScale(new Date(xMax)),
      y2: yScale(y2),
    };
  }, [dataPoints, xMin, xMax, xScale, yScale]);

  const handleMouseEnter = (e, p) => {
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const chartX = xScale(p.x);
    const chartY = yScale(p.y);
    const percentX = chartX / svgWidth;
    const percentY = chartY / svgHeight;
    const screenX = svgRect.left + (svgRect.width * percentX);
    const screenY = svgRect.top + (svgRect.height * percentY);

    setTooltip({
      x: screenX,
      y: screenY,
      value: p,
    });
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Average Meter Price
              {placeName ? ` — ${placeName}` : ""}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto">
          {/* Controls */}
          <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
            {/* Data View Selection */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-1">View:</span>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm ${
                    dataView === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setDataView("all")}
                >
                  All Data
                </button>
                {activeHistorical.length > 0 && (
                  <button
                    className={`px-3 py-1.5 text-sm border-l border-gray-300 ${
                      dataView === "historical"
                        ? "bg-blue-500 text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setDataView("historical")}
                  >
                    Historical
                  </button>
                )}
                <button
                  className={`px-3 py-1.5 text-sm border-l border-gray-300 ${
                    dataView === "forecast"
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setDataView("forecast")}
                >
                  Forecast
                </button>
              </div>
            </div>

            {/* Chart Type and Options */}
            <div className="flex items-center flex-wrap gap-3">
              <span className="text-sm font-medium text-gray-700 mr-1">Chart:</span>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm ${
                    chartType === "line"
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setChartType("line")}
                >
                  Line
                </button>
                <button
                  className={`px-3 py-1.5 text-sm border-l border-gray-300 ${
                    chartType === "scatter"
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setChartType("scatter")}
                >
                  Scatter
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTrend}
                  onChange={(e) => setShowTrend(e.target.checked)}
                  className="cursor-pointer"
                />
                Trend line
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="cursor-pointer"
                />
                Show labels
              </label>
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center flex-wrap gap-3 pt-2 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={customRange}
                  onChange={(e) => setCustomRange(e.target.checked)}
                  className="cursor-pointer"
                />
                <Calendar className="w-4 h-4" />
                Custom Range
              </label>
              
              {customRange && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>

            {/* Data Summary */}
            <div className="text-xs text-gray-500 pt-1">
              Showing {dataPoints.length} data points
              {dataView === "all" && activeHistorical.length > 0 && (
                <span className="ml-2">
                  ({allData.filter(d => d.type === 'historical').length} historical, {allData.filter(d => d.type === 'forecast').length} forecast)
                </span>
              )}
            </div>
          </div>

          {/* SVG Chart */}
          {dataPoints.length === 0 ? (
          <div className="flex items-center justify-center h-60 text-gray-500 text-sm">
            No data available for selected range
          </div>
        ) : (
          <div className="relative w-full">
            <div className="relative h-0 w-full pt-[47.3%]"> 
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                preserveAspectRatio="xMidYMid meet" 
                className="absolute top-0 left-0 w-full h-full"
              >
                {/* X-axis */}
                <line
                  x1={margin.left}
                  y1={svgHeight - margin.bottom}
                  x2={svgWidth - margin.right}
                  y2={svgHeight - margin.bottom}
                  stroke="#ccc"
                />
                {ticksX.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={xScale(t)}
                      y1={svgHeight - margin.bottom}
                      x2={xScale(t)}
                      y2={margin.top}
                      stroke="#eee"
                    />
                    <text
                      x={xScale(t)}
                      y={svgHeight - margin.bottom + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#475569"
                    >
                      {t.toLocaleString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </text>
                  </g>
                ))}

                {/* Y-axis */}
                <line
                  x1={margin.left}
                  y1={margin.top}
                  x2={margin.left}
                  y2={svgHeight - margin.bottom}
                  stroke="#ccc"
                />
                {ticksY.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={margin.left}
                      y1={yScale(t)}
                      x2={svgWidth - margin.right}
                      y2={yScale(t)}
                      stroke="#eee"
                    />
                    <text
                      x={margin.left - 10}
                      y={yScale(t) + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#475569"
                    >
                      {t.toFixed(1)}
                    </text>
                  </g>
                ))}

                {/* Line chart */}
                {chartType === "line" && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                )}

                {/* Scatter points */}
                {dataPoints.map((p, i) => (
                  <g key={i}>
                    {(chartType === "scatter" || chartType === "line") && (
                      <circle
                        cx={xScale(p.x)}
                        cy={yScale(p.y)}
                        r="4"
                        fill={p.type === 'historical' ? "#3b82f6" : "#10b981"}
                        className="cursor-pointer"
                        onMouseEnter={(e) => handleMouseEnter(e, p)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )}
                    {showLabels && (
                      <text
                        x={xScale(p.x) + 5}
                        y={yScale(p.y) - 5}
                        fontSize="10"
                        fill="#111"
                      >
                        {p.y.toFixed(1)}
                      </text>
                    )}
                  </g>
                ))}

                {/* Trend line */}
                {showTrend && trendLine && (
                  <line
                    x1={trendLine.x1}
                    y1={trendLine.y1}
                    x2={trendLine.x2}
                    y2={trendLine.y2}
                    stroke="#FF7E2A"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                  />
                )}
              </svg>
            </div>
            
            {/* Tooltip */}
            {tooltip && (
              <div
                className="fixed bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-50"
                style={{
                  top: tooltip.y - 50,
                  left: tooltip.x,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="font-medium mb-1">
                  {new Date(tooltip.value.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div>Value: <span className="font-semibold">{tooltip.value.y.toFixed(2)}</span></div>
                <div className="mt-1 text-[10px] opacity-75 capitalize">
                  {tooltip.value.type}
                </div>
              </div>
            )}
            
            {/* Legend */}
            {dataView === "all" && activeHistorical.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-light"></div>
                  <span>Historical Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Forecast Data</span>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  ) : null;
};

export default GraphModal;