import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

const GraphModal = ({ isOpen, onClose, series , placeName }) => {
  const [tooltip, setTooltip] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' or 'scatter'
  const [showTrend, setShowTrend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  // const [metricX, setMetricX] = useState('Home Value Growth (YoY)');
  // const [metricY, setMetricY] = useState('Sale Inventory Growth (YoY)');
  // Transform series data
  const dataPoints = useMemo(() => {
    return series.map((item) => ({
      x: new Date(item.ds), // Full Date
      y: parseFloat(item.yhat),
      date: item.ds,
      name: item.name_en,
      areaId: item.area_id,
    }));
  }, [series]);

  // Dimensions
  const width = 760;
  const height = 360;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  // X-axis scale (time based)
  const xValues = dataPoints.map((p) => p.x.getTime());
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  const xScale = (date) =>
    margin.left +
    ((date.getTime() - xMin) / (xMax - xMin)) *
      (width - margin.left - margin.right);

  // Y-axis scale
  const yValues = dataPoints.map((p) => p.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const yScale = (value) =>
    height -
    margin.bottom -
    ((value - yMin) / (yMax - yMin)) *
      (height - margin.top - margin.bottom);

  // X-axis ticks (every 6 months)
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

  // Y-axis ticks (5 intervals)
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

 return (isOpen ? (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed max-w-[95vw] h-[83%] bottom-0 right-[5%] flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-[880px] max-w-[95vw]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Average Meter Price{placeName ? ` — ${placeName}` : ''}</h2>
            {/* {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>} */}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Controls Row */}
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${chartType === 'line' ? 'bg-azure text-white' : 'bg-white'} `}
                onClick={() => setChartType('line')}
              >Line</button>
              <button
                className={`px-3 py-1 text-sm ${chartType === 'scatter' ? 'bg-azure text-white' : 'bg-white'} `}
                onClick={() => setChartType('scatter')}
              >Scatter</button>
            </div>

            {/* {chartType === 'scatter' && (
              <>
                <select value={metricX} onChange={(e) => setMetricX(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>Home Value Growth (YoY)</option>
                  <option>Sale Inventory Growth (YoY)</option>
                  <option>Rent Growth (YoY)</option>
                </select>
                <select value={metricY} onChange={(e) => setMetricY(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>Sale Inventory Growth (YoY)</option>
                  <option>Home Value Growth (YoY)</option>
                  <option>Rent Growth (YoY)</option>
                </select>
              </>
            )} */}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
              Trend line
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              Show labels
            </label>
          </div>

          
          {/* SVG Chart */}
          <div className="">

        <svg width={width} height={height} className="w-full h-auto">
          {/* X-axis */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#ccc"
          />
          {ticksX.map((t, i) => (
            <g key={i}>
              <line
                x1={xScale(t)}
                y1={height - margin.bottom}
                x2={xScale(t)}
                y2={margin.top}
                stroke="#eee"
              />
              <text
                x={xScale(t)}
                y={height - margin.bottom + 20}
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
            y2={height - margin.bottom}
            stroke="#ccc"
          />
          {ticksY.map((t, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={yScale(t)}
                x2={width - margin.right}
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

          {/* Line path */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* Points */}
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r="4"
              fill="#10b981"
              className="cursor-pointer"
              onMouseEnter={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  value: p,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded"
            style={{
              top: tooltip.y - 40,
              left: tooltip.x - 60,
            }}
          >
            <div>{tooltip.value.date}</div>
            <div>Value: {tooltip.value.y.toFixed(2)}</div>
          </div>
        )}

            </div>
          {/* <div className="mt-3 text-xs text-gray-500">Dummy data shown. We can plug in predictions later.</div> */}
        </div>
      </div>
    </motion.div>
  ) : null);
};

export default GraphModal;
