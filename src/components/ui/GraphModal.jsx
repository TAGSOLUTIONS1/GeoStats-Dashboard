import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

// Lightweight modal with a simple SVG line chart (dummy data supported)
const GraphModal = ({ isOpen, onClose, title = 'Home Value Growth (YoY)', subtitle, placeName, series = [] }) => {
  // Controls
  const [chartType, setChartType] = useState('line'); // 'line' | 'scatter'
  const [metricX, setMetricX] = useState('Home Value Growth (YoY)');
  const [metricY, setMetricY] = useState('Sale Inventory Growth (YoY)');
  const [showTrend, setShowTrend] = useState(false);
  const [showLabels, setShowLabels] = useState(false);


  // Build dummy series if none provided (for line chart: year vs value)
  const dataPoints = series.length > 0 ? series : [
    { x: 2001, y: 10.0 }, { x: 2002, y: 11.5 }, { x: 2003, y: 12.4 }, { x: 2004, y: 8.7 },
    { x: 2005, y: 13.6 }, { x: 2006, y: 5.9 }, { x: 2007, y: -2.3 }, { x: 2008, y: -7.1 },
    { x: 2009, y: -3.2 }, { x: 2010, y: -4.8 }, { x: 2011, y: 3.0 }, { x: 2012, y: 6.9 },
    { x: 2013, y: -1.3 }, { x: 2014, y: -2.0 }, { x: 2015, y: 0.3 }, { x: 2016, y: 2.1 },
    { x: 2017, y: -1.1 }, { x: 2018, y: -1.8 }, { x: 2019, y: 12.0 }, { x: 2020, y: 11.3 },
    { x: 2021, y: 6.0 }, { x: 2022, y: 10.6 }, { x: 2023, y: 1.8 }
  ];

  // Dummy scatter points for two metrics
  const scatterPoints = useMemo(() => {
    // Fabricate some correlated points
    const rng = [
      { x: -5, y: -6 }, { x: -2, y: -3 }, { x: 0, y: 1 }, { x: 2, y: 3 }, { x: 4, y: 6 },
      { x: 6, y: 8 }, { x: 8, y: 9 }, { x: 10, y: 11 }, { x: 12, y: 13 }, { x: 14, y: 12 },
      { x: 5, y: 4 }, { x: 3, y: 1 }, { x: 9, y: 7 }, { x: -3, y: -2 }
    ];
    return rng.map((p, i) => ({ x: p.x, y: p.y, label: `P${i + 1}` }));
  }, []);

  const width = 760;
  const height = 360;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const xValues = (chartType === 'scatter' ? scatterPoints.map(p => p.x) : dataPoints.map(p => p.x));
  const yValues = (chartType === 'scatter' ? scatterPoints.map(p => p.y) : dataPoints.map(p => p.y));
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(-8, Math.min(...yValues));
  const yMax = Math.max(16, Math.max(...yValues));

  const xScale = x => margin.left + ((x - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
  const yScale = y => height - margin.bottom - ((y - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

  const pathD = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
    .join(' ');

  const areaD = `M ${xScale(dataPoints[0].x)} ${yScale(0)} ` +
    dataPoints.map(p => `L ${xScale(p.x)} ${yScale(p.y)}`).join(' ') +
    ` L ${xScale(dataPoints[dataPoints.length - 1].x)} ${yScale(0)} Z`;

  const ticksX = Array.from(new Set([xMin, ...((chartType === 'scatter' ? scatterPoints : dataPoints).filter((_, i) => i % 2 === 0).map(p => p.x)), xMax]));
  const ticksY = [-8, -4, 0, 4, 8, 12, 16];

  // Linear regression (least squares)
  const trend = useMemo(() => {
    if (!showTrend) return null;
    const pts = chartType === 'scatter' ? scatterPoints : dataPoints.map((p, i) => ({ x: p.x, y: p.y }));
    const n = pts.length;
    if (n < 2) return null;
    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = pts.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const m = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;
    const x0 = xMin;
    const x1 = xMax;
    const y0 = m * x0 + b;
    const y1 = m * x1 + b;
    return { x0, y0, x1, y1 };
  }, [showTrend, chartType, scatterPoints, dataPoints, xMin, xMax]);

  return (isOpen ? (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed max-w-[95vw] h-[98%] bottom-0 right-[10%] flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-[880px] max-w-[95vw]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}{placeName ? ` — ${placeName}` : ''}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
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

            {chartType === 'scatter' && (
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
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
              Trend line
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
              Show labels
            </label>
          </div>

          <svg width={width} height={height} className="w-full h-auto">
            <defs>
              <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Axes */}
            <g>
              {ticksX.map((t, i) => (
                <g key={i}>
                  <line x1={xScale(t)} x2={xScale(t)} y1={margin.top} y2={height - margin.bottom} stroke="#f1f5f9" />
                  <text x={xScale(t)} y={height - 8} textAnchor="middle" fontSize="10" fill="#475569">{t}</text>
                </g>
              ))}
              {ticksY.map((t, i) => (
                <g key={i}>
                  <line x1={margin.left} x2={width - margin.right} y1={yScale(t)} y2={yScale(t)} stroke="#f1f5f9" />
                  <text x={margin.left - 6} y={yScale(t) + 3} textAnchor="end" fontSize="10" fill="#475569">{t}%</text>
                </g>
              ))}
            </g>

            {chartType === 'line' && (
              <>
                {/* Area under line */}
                <path d={areaD} fill="url(#areaFill)" />
                {/* Line */}
                <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" />
                {/* Points */}
                {dataPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={xScale(p.x)} cy={yScale(p.y)} r="4" fill="#10b981" />
                    {showLabels && (
                      <text x={xScale(p.x) + 6} y={yScale(p.y) - 6} fontSize="10" fill="#334155">{p.y}%</text>
                    )}
                  </g>
                ))}
              </>
            )}

            {chartType === 'scatter' && (
              <>
                {scatterPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={xScale(p.x)} cy={yScale(p.y)} r="4" fill="#ef4444" />
                    {showLabels && (
                      <text x={xScale(p.x) + 6} y={yScale(p.y) - 6} fontSize="10" fill="#334155">{p.label}</text>
                    )}
                  </g>
                ))}
              </>
            )}

            {/* Trend line */}
            {trend && (
              <line x1={xScale(trend.x0)} y1={yScale(trend.y0)} x2={xScale(trend.x1)} y2={yScale(trend.y1)} stroke="#6366f1" strokeDasharray="4 3" strokeWidth="2" />
            )}
          </svg>
          <div className="mt-3 text-xs text-gray-500">Dummy data shown. We can plug in predictions later.</div>
        </div>
      </div>
    </motion.div>
  ) : null);
};

export default GraphModal;

