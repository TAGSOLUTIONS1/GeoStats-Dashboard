import React, { useMemo, useRef, useState, useEffect } from "react";
import { X, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const RATING_COLORS = {
  0: '#9CA3AF', // Gray - Not yet inspected
  1: '#EF4444', // Red - Unsatisfactory
  2: '#F59E0B', // Amber - Acceptable
  3: '#10B981', // Green - Good
  4: '#3B82F6', // Blue - Very Good
  5: '#8B5CF6'  // Purple - Outstanding
};

const SchoolGraphModal = ({ 
  isOpen = false, 
  onClose = () => {}, 
  areaName = "Selected Area",
  visualizationMode = 'rating', // 'rating' or 'enrollment'
  ratingData = [],
  enrollmentData = []
}) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  
  const svgWidth = 760;
  const svgHeight = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

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

  // Rating Distribution Chart
  const renderRatingChart = () => {
    if (!ratingData || ratingData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No rating data available</p>
          </div>
        </div>
      );
    }

    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const maxCount = Math.max(...ratingData.map(d => d.count));
    const barWidth = chartWidth / ratingData.length * 0.6;
    const xScale = (index) => margin.left + (index + 0.2) * (chartWidth / ratingData.length);
    const yScale = (value) => margin.top + chartHeight - (value / maxCount) * chartHeight;

    return (
      <div className="relative w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Rating Distribution</h3>
          <p className="text-sm text-gray-600">Distribution of school ratings in {areaName}</p>
        </div>
        <div className="relative h-0 w-full pt-[52.6%]">
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="absolute top-0 left-0 w-full h-full"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const y = margin.top + chartHeight - (i / 5) * chartHeight;
              return (
                <g key={i}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={svgWidth - margin.right}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={margin.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6B7280"
                  >
                    {Math.round((i / 5) * maxCount)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {ratingData.map((d, index) => {
              const x = xScale(index);
              const height = d.count > 0 ? (d.count / maxCount) * chartHeight : 0;
              const y = margin.top + chartHeight - height;
              const color = RATING_COLORS[d.rating] || '#9CA3AF';

              return (
                <g key={d.rating}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill={color}
                    opacity="0.8"
                    rx="4"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCursor({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        data: d
                      });
                    }}
                    onMouseLeave={() => setCursor(null)}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={margin.top + chartHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#374151"
                    fontWeight="500"
                  >
                    {d.label.split(' ')[0]}
                  </text>
                  {d.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#1F2937"
                      fontWeight="600"
                    >
                      {d.count}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Y-axis label */}
            <text
              x={-svgHeight / 2}
              y={20}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="14"
              fill="#6B7280"
              fontWeight="500"
            >
              Number of Schools
            </text>

            {/* X-axis label */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#6B7280"
              fontWeight="500"
            >
              Rating
            </text>
          </svg>
        </div>

        {/* Tooltip */}
        {cursor && cursor.data && (
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y - 60}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">{cursor.data.label}</div>
            <div className="text-gray-300">Schools: {cursor.data.count}</div>
            <div className="text-gray-300">{cursor.data.percentage}% of rated schools</div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {ratingData.filter(d => d.count > 0).map(d => (
            <div key={d.rating} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: RATING_COLORS[d.rating] }}
              />
              <span className="text-sm text-gray-700">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enrollment Over Years Chart
  const renderEnrollmentChart = () => {
    if (!enrollmentData || enrollmentData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No enrollment data available</p>
          </div>
        </div>
      );
    }

    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    const years = enrollmentData.map(d => d.year);
    const enrollments = enrollmentData.map(d => d.totalEnrollment);
    const maxEnrollment = Math.max(...enrollments);
    const minEnrollment = Math.min(...enrollments);
    const range = maxEnrollment - minEnrollment || 1;

    const xScale = (index) => margin.left + (index / (enrollmentData.length - 1 || 1)) * chartWidth;
    const yScale = (value) => margin.top + chartHeight - ((value - minEnrollment) / range) * chartHeight;

    // Create path for line
    const linePath = enrollmentData.map((d, index) => {
      const x = xScale(index);
      const y = yScale(d.totalEnrollment);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Create area path
    const areaPath = linePath + ` L ${xScale(enrollmentData.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

    return (
      <div className="relative w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Enrollment Over Years</h3>
          <p className="text-sm text-gray-600">Total enrollment trends in {areaName}</p>
        </div>
        <div className="relative h-0 w-full pt-[52.6%]">
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="absolute top-0 left-0 w-full h-full"
            onMouseMove={(e) => {
              const svgRect = svgRef.current.getBoundingClientRect();
              const mouseX = e.clientX - svgRect.left;
              const ratio = (mouseX - margin.left) / chartWidth;
              const index = Math.round(ratio * (enrollmentData.length - 1));
              if (index >= 0 && index < enrollmentData.length) {
                const point = enrollmentData[index];
                setCursor({
                  x: e.clientX - svgRect.left,
                  y: e.clientY - svgRect.top,
                  data: point
                });
              }
            }}
            onMouseLeave={() => setCursor(null)}
          >
            <defs>
              <linearGradient id="enrollmentGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = margin.top + chartHeight - ratio * chartHeight;
              const value = minEnrollment + ratio * range;
              return (
                <g key={ratio}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={svgWidth - margin.right}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={margin.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6B7280"
                  >
                    {Math.round(value).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#enrollmentGradient)"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {enrollmentData.map((d, index) => {
              const x = xScale(index);
              const y = yScale(d.totalEnrollment);
              return (
                <circle
                  key={d.year}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#3B82F6"
                  stroke="#fff"
                  strokeWidth="2"
                  className="hover:r-7 transition-all cursor-pointer"
                />
              );
            })}

            {/* X-axis labels */}
            {enrollmentData.map((d, index) => {
              const x = xScale(index);
              return (
                <text
                  key={d.year}
                  x={x}
                  y={margin.top + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  fontWeight="500"
                >
                  {d.year}
                </text>
              );
            })}

            {/* Y-axis label */}
            <text
              x={-svgHeight / 2}
              y={20}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="14"
              fill="#6B7280"
              fontWeight="500"
            >
              Total Enrollment
            </text>

            {/* X-axis label */}
            <text
              x={svgWidth / 2}
              y={svgHeight - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#6B7280"
              fontWeight="500"
            >
              Year
            </text>
          </svg>
        </div>

        {/* Tooltip */}
        {cursor && cursor.data && (
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y - 60}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">Year: {cursor.data.year}</div>
            <div className="text-gray-300">Total Enrollment: {cursor.data.totalEnrollment.toLocaleString()}</div>
            <div className="text-gray-300">Average: {cursor.data.enrollment.toLocaleString()}</div>
            <div className="text-gray-300">Schools: {cursor.data.schoolCount}</div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: "0%" }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed bottom-0 w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] right-1 md:right-[2%] xl:right-[5%] z-50 p-2 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            {visualizationMode === 'rating' ? (
              <BarChart3 className="w-6 h-6 text-blue-600" />
            ) : (
              <TrendingUp className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {visualizationMode === 'rating' ? 'Rating Distribution' : 'Enrollment Trends'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{areaName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {visualizationMode === 'rating' ? renderRatingChart() : renderEnrollmentChart()}
        </div>
      </div>
    </motion.div>
  );
};

export default SchoolGraphModal;

