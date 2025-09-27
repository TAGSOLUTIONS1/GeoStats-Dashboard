import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import dummyData from "../../data/average_meter_price/forecasts/lgbm/forecast_area_464_2010onwards.json";

const GraphModal = ({ isOpen, onClose, series, placeName }) => {
  const [tooltip, setTooltip] = useState(null);
  const [chartType, setChartType] = useState("line"); // 'line' or 'scatter'
  const [showTrend, setShowTrend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  // Use fixed SVG dimensions for viewBox, but let CSS handle actual size
  const svgWidth = 760;
  const svgHeight = 360;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const activeSeries = series.length > 0 ? series : dummyData;

  const dataPoints = useMemo(() => {
    return activeSeries.map((item) => ({
      x: new Date(item.ds),
      y: parseFloat(item.yhat),
      date: item.ds,
      name: item.name_en,
      areaId: item.area_id,
    }));
  }, [activeSeries]);
    
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


  // --- Helper to get SVG Bounding Box for Tooltip Positioning ---
  const handleMouseEnter = (e, p) => {
    // Get the SVG element's position on the screen
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    
    // Get the chart coordinate (already in the original 760x360 scale)
    const chartX = xScale(p.x);
    const chartY = yScale(p.y);

    // Calculate the percentage of the current point relative to the SVG viewbox
    const percentX = chartX / svgWidth;
    const percentY = chartY / svgHeight;

    // Map the chart coordinate to the actual screen position
    const screenX = svgRect.left + (svgRect.width * percentX);
    const screenY = svgRect.top + (svgRect.height * percentY);

    setTooltip({
      x: screenX,
      y: screenY,
      value: p,
    });
  };


  return isOpen ? (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={
        isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }
      }
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed max-w-[96vw] h-[75%] sm:h-[83%] bottom-0 right-2  md:right-[5%] flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-full sm:w-[880px] max-w-[95vw] overflow-auto">
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
          <div className="flex items-center flex-wrap gap-3 mb-4 flex-shrink-0">
            {/* ... (Chart control buttons remain the same) ... */}
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${
                  chartType === "line"
                    ? "bg-azure text-white"
                    : "bg-white"
                } `}
                onClick={() => setChartType("line")}
              >
                Line
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  chartType === "scatter"
                    ? "bg-azure text-white"
                    : "bg-white"
                } `}
                onClick={() => setChartType("scatter")}
              >
                Scatter
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTrend}
                onChange={(e) => setShowTrend(e.target.checked)}
              />
              Trend line
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              Show labels
            </label>
          </div>

          {/* SVG Chart */}
          {activeSeries.length === 0 ? (
          <div className="flex items-center justify-center h-60 text-gray-500 text-sm">
            No forecast data available
          </div>
        ) : (
          <div className="relative w-full">
            {/* SVG Wrapper with Responsive Aspect Ratio */}
            {/* The 'pb-[47.3%]' gives an aspect ratio of 760/360 ≈ 2.11, so 1 / 2.11 * 100% ≈ 47.3% */}
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
                        fill="#10b981"
                        className="cursor-pointer"
                        onMouseEnter={(e) => handleMouseEnter(e, p)} // Use updated handler
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
                className="fixed bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none"
                style={{
                  // Position the tooltip relative to the screen using state
                  top: tooltip.y - 40,
                  left: tooltip.x,
                  transform: 'translateX(-50%)' // Center the tooltip over the point
                }}
              >
                <div>{new Date(tooltip.value.date).toLocaleDateString()}</div>
                <div>Value: {tooltip.value.y.toFixed(2)}</div>
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