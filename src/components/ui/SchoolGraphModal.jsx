import React, { useMemo, useRef, useState, useEffect } from "react";
import { X, BarChart3, TrendingUp, Users, School, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { processRatingOverYears, processSchoolRatingOverYears, processSchoolEnrollmentOverYears, processFeesOverYears, processSchoolFeesOverYears } from "../../services/school";

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
  visualizationMode = 'rating', // 'rating', 'enrollment', or 'fee'
  ratingData = [],
  enrollmentData = [],
  schools = []
}) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const [ratingViewMode, setRatingViewMode] = useState('count'); // 'count', 'overall', 'individual', 'all'
  const [enrollmentViewMode, setEnrollmentViewMode] = useState('overall'); // 'overall', 'individual', 'all'
  const [feeViewMode, setFeeViewMode] = useState('overall'); // 'overall', 'individual', 'all'
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedEnrollmentSchool, setSelectedEnrollmentSchool] = useState('');
  const [selectedFeeSchool, setSelectedFeeSchool] = useState('');
  
  const svgWidth = 760;
  const svgHeight = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  // Process rating over years data
  const ratingOverYears = useMemo(() => {
    if (!schools || schools.length === 0) return [];
    return processRatingOverYears(schools);
  }, [schools]);

  // Get unique school names for dropdown
  const schoolNames = useMemo(() => {
    if (!schools || schools.length === 0) return [];
    return schools
      .map(s => s['School Name'])
      .filter(name => name)
      .sort();
  }, [schools]);

  // Process selected school rating over years
  const selectedSchoolRatingData = useMemo(() => {
    if (!selectedSchool || !schools || schools.length === 0) return [];
    const school = schools.find(s => s['School Name'] === selectedSchool);
    if (!school) return [];
    return processSchoolRatingOverYears(school);
  }, [selectedSchool, schools]);

  // Process all schools rating over years
  const allSchoolsRatingData = useMemo(() => {
    if (!schools || schools.length === 0) return new Map();
    const schoolRatingsMap = new Map();
    
    schools.forEach(school => {
      const schoolName = school['School Name'];
      if (!schoolName) return;
      
      const ratings = processSchoolRatingOverYears(school);
      if (ratings.length > 0) {
        schoolRatingsMap.set(schoolName, ratings);
      }
    });
    
    return schoolRatingsMap;
  }, [schools]);

  // Process selected school enrollment over years
  const selectedSchoolEnrollmentData = useMemo(() => {
    if (!selectedEnrollmentSchool || !schools || schools.length === 0) return [];
    const school = schools.find(s => s['School Name'] === selectedEnrollmentSchool);
    if (!school) return [];
    return processSchoolEnrollmentOverYears(school);
  }, [selectedEnrollmentSchool, schools]);

  // Process all schools enrollment over years
  const allSchoolsEnrollmentData = useMemo(() => {
    if (!schools || schools.length === 0) return new Map();
    const schoolEnrollmentsMap = new Map();
    
    schools.forEach(school => {
      const schoolName = school['School Name'];
      if (!schoolName) return;
      
      const enrollments = processSchoolEnrollmentOverYears(school);
      if (enrollments.length > 0) {
        schoolEnrollmentsMap.set(schoolName, enrollments);
      }
    });
    
    return schoolEnrollmentsMap;
  }, [schools]);

  // Process fees over years data
  const feesOverYears = useMemo(() => {
    if (!schools || schools.length === 0) return [];
    return processFeesOverYears(schools);
  }, [schools]);

  // Process selected school fees over years
  const selectedSchoolFeesData = useMemo(() => {
    if (!selectedFeeSchool || !schools || schools.length === 0) return [];
    const school = schools.find(s => s['School Name'] === selectedFeeSchool);
    if (!school) return [];
    return processSchoolFeesOverYears(school);
  }, [selectedFeeSchool, schools]);

  // Process all schools fees over years
  const allSchoolsFeesData = useMemo(() => {
    if (!schools || schools.length === 0) return new Map();
    const schoolFeesMap = new Map();
    
    schools.forEach(school => {
      const schoolName = school['School Name'];
      if (!schoolName) return;
      
      const fees = processSchoolFeesOverYears(school);
      if (fees.length > 0) {
        schoolFeesMap.set(schoolName, fees);
      }
    });
    
    return schoolFeesMap;
  }, [schools]);

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

  // Reset selected school when view mode changes
  useEffect(() => {
    if (ratingViewMode !== 'individual') {
      setSelectedSchool('');
    } else if (selectedSchool === '' && schoolNames.length > 0) {
      setSelectedSchool(schoolNames[0]);
    }
  }, [ratingViewMode, schoolNames, selectedSchool]);

  // Rating Distribution Chart with multiple view modes
  const renderRatingChart = () => {
    // View mode selector (only for rating mode)
    const viewModeSelector = (
      <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setRatingViewMode('count')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              ratingViewMode === 'count'
                ? 'bg-azure text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300'
            }`}
          >
            <BarChart3 className="w-3 h-3 inline mr-1.5" />
            By Count
          </button>
          <button
            onClick={() => setRatingViewMode('overall')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              ratingViewMode === 'overall'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-gray-300'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline mr-1.5" />
            Overall
          </button>
          <button
            onClick={() => setRatingViewMode('individual')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              ratingViewMode === 'individual'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
            }`}
          >
            <School className="w-3 h-3 inline mr-1.5" />
            Individual
          </button>
          <button
            onClick={() => setRatingViewMode('all')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              ratingViewMode === 'all'
                ? 'bg-orange-light text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700 border border-gray-300'
            }`}
          >
            <Users className="w-3 h-3 inline mr-1.5" />
            All Schools
          </button>
        </div>
      </div>
    );

    // Count view (bar chart)
    if (ratingViewMode === 'count') {
      if (!ratingData || ratingData.length === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No rating data available</p>
              </div>
            </div>
          </div>
        );
      }

      const chartWidth = svgWidth - margin.left - margin.right;
      const chartHeight = svgHeight - margin.top - margin.bottom;

      const maxCount = Math.max(...ratingData.map(d => d.count));
      const barWidth = chartWidth / ratingData.length * 0.6;
      const xScale = (index) => margin.left + (index + 0.2) * (chartWidth / ratingData.length);

      return (
        <div className="relative w-full">
          {viewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Rating Distribution by Count</h3>
              <p className="text-sm text-gray-600">Number of schools by rating in {areaName}</p>
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
                      const container = e.currentTarget.closest('.relative');
                      if (container) {
                        const containerRect = container.getBoundingClientRect();
                        setCursor({
                          x: rect.left - containerRect.left + rect.width / 2,
                          y: rect.top - containerRect.top,
                          data: d
                        });
                      }
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
        {cursor && cursor.data && (() => {
          const tooltipWidth = 140; // Approximate tooltip width
          const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
          return (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
              style={{
                left: `${tooltipLeft}px`,
                top: `${Math.max(10, cursor.y - 70)}px`,
              }}
            >
              <div className="font-semibold">{cursor.data.label}</div>
              <div className="text-gray-300">Schools: {cursor.data.count}</div>
              <div className="text-gray-300">{cursor.data.percentage}% of rated schools</div>
            </div>
          );
        })()}

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
        </div>
      );
    }

    // Overall rating over years view (line chart)
    if (ratingViewMode === 'overall') {
      if (!ratingOverYears || ratingOverYears.length === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No rating data over years available</p>
              </div>
            </div>
          </div>
        );
      }

      const chartWidth = svgWidth - margin.left - margin.right;
      const chartHeight = svgHeight - margin.top - margin.bottom;

      const ratings = ratingOverYears.map(d => d.averageRating);
      const maxRating = Math.max(...ratings, 5);
      const minRating = Math.min(...ratings, 0);
      const range = maxRating - minRating || 5;

      const xScale = (index) => margin.left + (index / (ratingOverYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minRating) / range) * chartHeight;

      const linePath = ratingOverYears.map((d, index) => {
        const x = xScale(index);
        const y = yScale(d.averageRating);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      const areaPath = linePath + ` L ${xScale(ratingOverYears.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

      return (
        <div className="relative w-full">
          {viewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Overall Rating Trend</h3>
              <p className="text-sm text-gray-600">Average rating over years in {areaName}</p>
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
                  const index = Math.round(ratio * (ratingOverYears.length - 1));
                  if (index >= 0 && index < ratingOverYears.length) {
                    const point = ratingOverYears[index];
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
                  <linearGradient id="ratingGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(rating => {
                  const y = margin.top + chartHeight - ((rating - minRating) / range) * chartHeight;
                  return (
                    <g key={rating}>
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
                        {rating}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path
                  d={areaPath}
                  fill="url(#ratingGradient)"
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
                {ratingOverYears.map((d, index) => {
                  const x = xScale(index);
                  const y = yScale(d.averageRating);
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
                {ratingOverYears.map((d, index) => {
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
                  Average Rating
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
            {cursor && cursor.data && (() => {
              const tooltipWidth = 160;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold">Year: {cursor.data.year}</div>
                  <div className="text-gray-300">Average Rating: {cursor.data.averageRating.toFixed(2)}</div>
                  <div className="text-gray-300">Schools: {cursor.data.schoolCount}</div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    // Individual school view
    if (ratingViewMode === 'individual') {
      if (!schoolNames || schoolNames.length === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools available</p>
              </div>
            </div>
          </div>
        );
      }

      if (!selectedSchoolRatingData || selectedSchoolRatingData.length === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {schoolNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No rating data available for selected school</p>
              </div>
            </div>
          </div>
        );
      }

      const chartWidth = svgWidth - margin.left - margin.right;
      const chartHeight = svgHeight - margin.top - margin.bottom;

      const ratings = selectedSchoolRatingData.map(d => d.rating);
      const maxRating = Math.max(...ratings, 5);
      const minRating = Math.min(...ratings, 0);
      const range = maxRating - minRating || 5;

      const xScale = (index) => margin.left + (index / (selectedSchoolRatingData.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minRating) / range) * chartHeight;

      const linePath = selectedSchoolRatingData.map((d, index) => {
        const x = xScale(index);
        const y = yScale(d.rating);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      const areaPath = linePath + ` L ${xScale(selectedSchoolRatingData.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

      const ratingLabels = {
        0: 'Not yet inspected',
        1: 'Unsatisfactory',
        2: 'Acceptable',
        3: 'Good',
        4: 'Very Good',
        5: 'Outstanding'
      };

      return (
        <div className="relative w-full">
          {viewModeSelector}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {schoolNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">School Rating Over Years</h3>
              <p className="text-sm text-gray-600">{selectedSchool}</p>
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
                  const index = Math.round(ratio * (selectedSchoolRatingData.length - 1));
                  if (index >= 0 && index < selectedSchoolRatingData.length) {
                    const point = selectedSchoolRatingData[index];
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
                  <linearGradient id="schoolRatingGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(rating => {
                  const y = margin.top + chartHeight - ((rating - minRating) / range) * chartHeight;
                  return (
                    <g key={rating}>
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
                        {rating}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path
                  d={areaPath}
                  fill="url(#schoolRatingGradient)"
                />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {selectedSchoolRatingData.map((d, index) => {
                  const x = xScale(index);
                  const y = yScale(d.rating);
                  const color = RATING_COLORS[d.rating] || '#10B981';
                  return (
                    <circle
                      key={d.year}
                      cx={x}
                      cy={y}
                      r="5"
                      fill={color}
                      stroke="#fff"
                      strokeWidth="2"
                      className="hover:r-7 transition-all cursor-pointer"
                    />
                  );
                })}

                {/* X-axis labels */}
                {selectedSchoolRatingData.map((d, index) => {
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
                  Rating
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
            {cursor && cursor.data && (() => {
              const tooltipWidth = 150;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold">Year: {cursor.data.year}</div>
                  <div className="text-gray-300">Rating: {cursor.data.rating}</div>
                  <div className="text-gray-300">{ratingLabels[cursor.data.rating] || 'Unknown'}</div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    // All schools view (multiple lines)
    if (ratingViewMode === 'all') {
      // Check if we have schools data
      if (!schools || schools.length === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools available in this area</p>
              </div>
            </div>
          </div>
        );
      }

      if (!allSchoolsRatingData || allSchoolsRatingData.size === 0) {
        return (
          <div>
            {viewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No rating data over years available for schools in this area</p>
                <p className="text-gray-400 text-xs mt-2">Schools may not have historical rating data</p>
              </div>
            </div>
          </div>
        );
      }

      const chartWidth = svgWidth - margin.left - margin.right;
      const chartHeight = svgHeight - margin.top - margin.bottom;

      // Get all years from all schools
      const allYears = new Set();
      allSchoolsRatingData.forEach(ratings => {
        ratings.forEach(d => allYears.add(d.year));
      });
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);

      const maxRating = 5;
      const minRating = 0;
      const range = maxRating - minRating || 5;

      const xScale = (index) => margin.left + (index / (sortedYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minRating) / range) * chartHeight;

      // Generate colors for each school
      const schoolColors = Array.from(allSchoolsRatingData.keys()).map((_, i) => {
        const hue = (i * 137.508) % 360; // Golden angle for color distribution
        return `hsl(${hue}, 70%, 50%)`;
      });

      return (
        <div className="relative w-full">
          {viewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">All Schools Rating Trends</h3>
              <p className="text-sm text-gray-600">Rating over years for all schools in {areaName}</p>
              <p className="text-xs text-gray-500 mt-1">Showing {allSchoolsRatingData.size} school{allSchoolsRatingData.size !== 1 ? 's' : ''} with rating data</p>
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
                  const yearIndex = Math.round(ratio * (sortedYears.length - 1));
                  if (yearIndex >= 0 && yearIndex < sortedYears.length) {
                    const year = sortedYears[yearIndex];
                    const nearestData = Array.from(allSchoolsRatingData.entries()).map(([schoolName, ratings]) => {
                      const yearData = ratings.find(r => r.year === year);
                      return yearData ? { schoolName, ...yearData } : null;
                    }).filter(Boolean);
                    if (nearestData.length > 0) {
                      setCursor({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                        data: { year, schools: nearestData }
                      });
                    }
                  }
                }}
                onMouseLeave={() => setCursor(null)}
              >
                <defs>
                  {Array.from(allSchoolsRatingData.keys()).map((schoolName, i) => (
                    <linearGradient key={schoolName} id={`schoolGradient-${i}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={schoolColors[i]} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={schoolColors[i]} stopOpacity="0.05" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(rating => {
                  const y = margin.top + chartHeight - ((rating - minRating) / range) * chartHeight;
                  return (
                    <g key={rating}>
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
                        {rating}
                      </text>
                    </g>
                  );
                })}

                {/* Draw lines for each school */}
                {Array.from(allSchoolsRatingData.entries()).map(([schoolName, ratings], schoolIndex) => {
                  const schoolRatings = sortedYears.map(year => {
                    const yearData = ratings.find(r => r.year === year);
                    return yearData ? yearData.rating : null;
                  });

                  const linePath = schoolRatings.reduce((path, rating, index) => {
                    if (rating !== null) {
                      const x = xScale(index);
                      const y = yScale(rating);
                      return path + (path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`);
                    }
                    return path;
                  }, '');

                  return (
                    <g key={schoolName}>
                      <path
                        d={linePath}
                        fill="none"
                        stroke={schoolColors[schoolIndex]}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                        className="hover:opacity-100 hover:stroke-width-3 transition-all cursor-pointer"
                      />
                      {schoolRatings.map((rating, index) => {
                        if (rating !== null) {
                          const x = xScale(index);
                          const y = yScale(rating);
                          return (
                            <circle
                              key={`${schoolName}-${sortedYears[index]}`}
                              cx={x}
                              cy={y}
                              r="3"
                              fill={schoolColors[schoolIndex]}
                              stroke="#fff"
                              strokeWidth="1"
                              className="hover:r-5 transition-all cursor-pointer"
                            />
                          );
                        }
                        return null;
                      })}
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {sortedYears.map((year, index) => {
                  const x = xScale(index);
                  return (
                    <text
                      key={year}
                      x={x}
                      y={margin.top + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {year}
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
                  Rating
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
            {cursor && cursor.data && cursor.data.schools && (() => {
              const tooltipWidth = 200;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none max-w-xs"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                <div className="font-semibold mb-1">Year: {cursor.data.year}</div>
                <div className="max-h-40 overflow-y-auto">
                  {cursor.data.schools.map((school, i) => (
                    <div key={i} className="text-gray-300 text-xs">
                      {school.schoolName}: {school.rating}
                    </div>
                  ))}
                </div>
              </div>
              );
            })()}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 justify-center max-h-32 overflow-y-auto">
              {Array.from(allSchoolsRatingData.keys()).map((schoolName, i) => (
                <div key={schoolName} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: schoolColors[i] }}
                  />
                  <span className="text-xs text-gray-700 truncate max-w-[150px]">{schoolName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default: return count view
    return (
      <div>
        {viewModeSelector}
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No rating data available</p>
          </div>
        </div>
      </div>
    );
  };

  // Enrollment view mode selector
  const enrollmentViewModeSelector = (
    <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setEnrollmentViewMode('overall')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            enrollmentViewMode === 'overall'
              ? 'bg-azure text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300'
          }`}
        >
          <TrendingUp className="w-3 h-3 inline mr-1.5" />
          Overall Average
        </button>
        <button
          onClick={() => setEnrollmentViewMode('individual')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            enrollmentViewMode === 'individual'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
          }`}
        >
          <School className="w-3 h-3 inline mr-1.5" />
          Individual School
        </button>
        <button
          onClick={() => setEnrollmentViewMode('all')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            enrollmentViewMode === 'all'
              ? 'bg-orange-light text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700 border border-gray-300'
          }`}
        >
          <Users className="w-3 h-3 inline mr-1.5" />
          All Schools
        </button>
      </div>
    </div>
  );

  // Enrollment Over Years Chart
  const renderEnrollmentChart = () => {
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    // Overall average view
    if (enrollmentViewMode === 'overall') {
      if (!enrollmentData || enrollmentData.length === 0) {
        return (
          <div>
            {enrollmentViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No enrollment data available</p>
              </div>
            </div>
          </div>
        );
      }

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
        <div className="relative w-full">
          {enrollmentViewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Overall Enrollment Trend</h3>
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
        {cursor && cursor.data && (() => {
          const tooltipWidth = 180;
          const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
          return (
            <div
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
              style={{
                left: `${tooltipLeft}px`,
                top: `${Math.max(10, cursor.y - 70)}px`,
              }}
            >
              <div className="font-semibold">Year: {cursor.data.year}</div>
              <div className="text-gray-300">Total Enrollment: {cursor.data.totalEnrollment.toLocaleString()}</div>
              <div className="text-gray-300">Average: {cursor.data.enrollment.toLocaleString()}</div>
              <div className="text-gray-300">Schools: {cursor.data.schoolCount}</div>
            </div>
          );
        })()}
          </div>
        </div>
      );
    }

    // Individual school view
    if (enrollmentViewMode === 'individual') {
      if (!schoolNames || schoolNames.length === 0) {
        return (
          <div>
            {enrollmentViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools available</p>
              </div>
            </div>
          </div>
        );
      }

      if (!selectedSchoolEnrollmentData || selectedSchoolEnrollmentData.length === 0) {
        return (
          <div>
            {enrollmentViewModeSelector}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
              <select
                value={selectedEnrollmentSchool}
                onChange={(e) => setSelectedEnrollmentSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a school</option>
                {schoolNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No enrollment data available for selected school</p>
              </div>
            </div>
          </div>
        );
      }

      const sortedYears = selectedSchoolEnrollmentData.map(d => d.year).sort((a, b) => a - b);
      const enrollments = selectedSchoolEnrollmentData.map(d => d.enrollment);
      const maxEnrollment = Math.max(...enrollments);
      const minEnrollment = Math.min(...enrollments);
      const range = maxEnrollment - minEnrollment || 1;

      const xScale = (index) => margin.left + (index / (sortedYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minEnrollment) / range) * chartHeight;

      const linePath = selectedSchoolEnrollmentData
        .sort((a, b) => a.year - b.year)
        .map((d, index) => {
          const x = xScale(index);
          const y = yScale(d.enrollment);
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

      const areaPath = linePath + ` L ${xScale(sortedYears.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

      return (
        <div className="relative w-full">
          {enrollmentViewModeSelector}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
            <select
              value={selectedEnrollmentSchool}
              onChange={(e) => setSelectedEnrollmentSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a school</option>
              {schoolNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">School Enrollment Over Years</h3>
              <p className="text-sm text-gray-600">{selectedEnrollmentSchool}</p>
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
                  const index = Math.round(ratio * (sortedYears.length - 1));
                  if (index >= 0 && index < sortedYears.length) {
                    const year = sortedYears[index];
                    const yearData = selectedSchoolEnrollmentData.find(d => d.year === year);
                    if (yearData) {
                      setCursor({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                        data: { year, enrollment: yearData.enrollment }
                      });
                    }
                  }
                }}
                onMouseLeave={() => setCursor(null)}
              >
                <defs>
                  <linearGradient id="individualEnrollmentGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
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
                  fill="url(#individualEnrollmentGradient)"
                />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {selectedSchoolEnrollmentData
                  .sort((a, b) => a.year - b.year)
                  .map((d, index) => {
                    const x = xScale(index);
                    const y = yScale(d.enrollment);
                    return (
                      <circle
                        key={d.year}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#10B981"
                        stroke="#fff"
                        strokeWidth="2"
                        className="hover:r-7 transition-all cursor-pointer"
                      />
                    );
                  })}

                {/* X-axis labels */}
                {sortedYears.map((year, index) => {
                  const x = xScale(index);
                  return (
                    <text
                      key={year}
                      x={x}
                      y={margin.top + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {year}
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
                  Enrollment
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
            {cursor && cursor.data && (() => {
              const tooltipWidth = 150;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold">Year: {cursor.data.year}</div>
                  <div className="text-gray-300">Enrollment: {cursor.data.enrollment.toLocaleString()}</div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    // All schools view
    if (enrollmentViewMode === 'all') {
      if (!schools || schools.length === 0) {
        return (
          <div>
            {enrollmentViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools available in this area</p>
              </div>
            </div>
          </div>
        );
      }

      if (!allSchoolsEnrollmentData || allSchoolsEnrollmentData.size === 0) {
        return (
          <div>
            {enrollmentViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No enrollment data over years available for schools in this area</p>
                <p className="text-gray-400 text-xs mt-2">Schools may not have historical enrollment data</p>
              </div>
            </div>
          </div>
        );
      }

      // Get all years from all schools
      const allYears = new Set();
      allSchoolsEnrollmentData.forEach(enrollments => {
        enrollments.forEach(d => allYears.add(d.year));
      });
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);

      // Calculate min/max enrollment across all schools
      let maxEnrollment = 0;
      let minEnrollment = Infinity;
      allSchoolsEnrollmentData.forEach(enrollments => {
        enrollments.forEach(d => {
          if (d.enrollment > maxEnrollment) maxEnrollment = d.enrollment;
          if (d.enrollment < minEnrollment) minEnrollment = d.enrollment;
        });
      });
      const range = maxEnrollment - minEnrollment || 1;

      const xScale = (index) => margin.left + (index / (sortedYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minEnrollment) / range) * chartHeight;

      // Generate colors for each school
      const schoolColors = Array.from(allSchoolsEnrollmentData.keys()).map((_, i) => {
        const hue = (i * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
      });

      return (
        <div className="relative w-full">
          {enrollmentViewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">All Schools Enrollment Trends</h3>
              <p className="text-sm text-gray-600">Enrollment over years for all schools in {areaName}</p>
              <p className="text-xs text-gray-500 mt-1">Showing {allSchoolsEnrollmentData.size} school{allSchoolsEnrollmentData.size !== 1 ? 's' : ''} with enrollment data</p>
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
                  const yearIndex = Math.round(ratio * (sortedYears.length - 1));
                  if (yearIndex >= 0 && yearIndex < sortedYears.length) {
                    const year = sortedYears[yearIndex];
                    const nearestData = Array.from(allSchoolsEnrollmentData.entries()).map(([schoolName, enrollments]) => {
                      const yearData = enrollments.find(r => r.year === year);
                      return yearData ? { schoolName, ...yearData } : null;
                    }).filter(Boolean);
                    if (nearestData.length > 0) {
                      setCursor({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                        data: { year, schools: nearestData }
                      });
                    }
                  }
                }}
                onMouseLeave={() => setCursor(null)}
              >
                <defs>
                  {Array.from(allSchoolsEnrollmentData.keys()).map((schoolName, i) => (
                    <linearGradient key={schoolName} id={`enrollmentSchoolGradient-${i}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={schoolColors[i]} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={schoolColors[i]} stopOpacity="0.05" />
                    </linearGradient>
                  ))}
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

                {/* Draw lines for each school */}
                {Array.from(allSchoolsEnrollmentData.entries()).map(([schoolName, enrollments], schoolIndex) => {
                  const schoolEnrollments = sortedYears.map(year => {
                    const yearData = enrollments.find(r => r.year === year);
                    return yearData ? yearData.enrollment : null;
                  });

                  const linePath = schoolEnrollments.reduce((path, enrollment, index) => {
                    if (enrollment !== null) {
                      const x = xScale(index);
                      const y = yScale(enrollment);
                      return path + (path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`);
                    }
                    return path;
                  }, '');

                  return (
                    <g key={schoolName}>
                      <path
                        d={linePath}
                        fill="none"
                        stroke={schoolColors[schoolIndex]}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                        className="hover:opacity-100 hover:stroke-width-3 transition-all cursor-pointer"
                      />
                      {schoolEnrollments.map((enrollment, index) => {
                        if (enrollment !== null) {
                          const x = xScale(index);
                          const y = yScale(enrollment);
                          return (
                            <circle
                              key={`${schoolName}-${sortedYears[index]}`}
                              cx={x}
                              cy={y}
                              r="3"
                              fill={schoolColors[schoolIndex]}
                              stroke="#fff"
                              strokeWidth="1"
                              className="hover:r-5 transition-all"
                            />
                          );
                        }
                        return null;
                      })}
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {sortedYears.map((year, index) => {
                  const x = xScale(index);
                  return (
                    <text
                      key={year}
                      x={x}
                      y={margin.top + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {year}
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
                  Enrollment
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
            {cursor && cursor.data && cursor.data.schools && (() => {
              const tooltipWidth = 200;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none max-w-xs"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold mb-1">Year: {cursor.data.year}</div>
                  <div className="max-h-40 overflow-y-auto">
                    {cursor.data.schools.map((school, i) => (
                      <div key={i} className="text-gray-300 text-xs">
                        {school.schoolName}: {school.enrollment.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Legend */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Schools</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {Array.from(allSchoolsEnrollmentData.keys()).map((schoolName, i) => (
                  <div key={schoolName} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: schoolColors[i] }}
                    />
                    <span className="text-xs text-gray-700 truncate max-w-[150px]">{schoolName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: return overall view
    return (
      <div>
        {enrollmentViewModeSelector}
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No enrollment data available</p>
          </div>
        </div>
      </div>
    );
  };

  // Fee view mode selector
  const feeViewModeSelector = (
    <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFeeViewMode('overall')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            feeViewMode === 'overall'
              ? 'bg-azure text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300'
          }`}
        >
          <TrendingUp className="w-3 h-3 inline mr-1.5" />
          Overall Average
        </button>
        <button
          onClick={() => setFeeViewMode('individual')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            feeViewMode === 'individual'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
          }`}
        >
          <School className="w-3 h-3 inline mr-1.5" />
          Individual School
        </button>
        <button
          onClick={() => setFeeViewMode('all')}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            feeViewMode === 'all'
              ? 'bg-orange-light text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700 border border-gray-300'
          }`}
        >
          <Users className="w-3 h-3 inline mr-1.5" />
          All Schools
        </button>
      </div>
    </div>
  );

  // Fees Over Years Chart
  const renderFeesChart = () => {
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    // Overall average view
    if (feeViewMode === 'overall') {
      if (!feesOverYears || feesOverYears.length === 0) {
        return (
          <div>
            {feeViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No fees data available</p>
              </div>
            </div>
          </div>
        );
      }

      const fees = feesOverYears.map(d => d.averageFee);
      const maxFee = Math.max(...fees);
      const minFee = Math.min(...fees);
      const range = maxFee - minFee || 1;

      const xScale = (index) => margin.left + (index / (feesOverYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minFee) / range) * chartHeight;

      // Create path for line
      const linePath = feesOverYears.map((d, index) => {
        const x = xScale(index);
        const y = yScale(d.averageFee);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      // Create area path
      const areaPath = linePath + ` L ${xScale(feesOverYears.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

      return (
        <div className="relative w-full">
          {feeViewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Overall Fee Trend</h3>
              <p className="text-sm text-gray-600">Average fee trends in {areaName}</p>
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
                  const index = Math.round(ratio * (feesOverYears.length - 1));
                  if (index >= 0 && index < feesOverYears.length) {
                    const point = feesOverYears[index];
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
                  <linearGradient id="feesGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const y = margin.top + chartHeight - ratio * chartHeight;
                  const value = minFee + ratio * range;
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path
                  d={areaPath}
                  fill="url(#feesGradient)"
                />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {feesOverYears.map((d, index) => {
                  const x = xScale(index);
                  const y = yScale(d.averageFee);
                  return (
                    <circle
                      key={d.year}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#10B981"
                      stroke="#fff"
                      strokeWidth="2"
                      className="hover:r-7 transition-all cursor-pointer"
                    />
                  );
                })}

                {/* X-axis labels */}
                {feesOverYears.map((d, index) => {
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
                  Average Fee (AED)
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
            {cursor && cursor.data && (() => {
              const tooltipWidth = 180;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold">Year: {cursor.data.year}</div>
                  <div className="text-gray-300">Average Fee: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cursor.data.averageFee)}</div>
                  <div className="text-gray-300">Schools: {cursor.data.schoolCount}</div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    // Individual school view
    if (feeViewMode === 'individual') {
      if (!schoolNames || schoolNames.length === 0) {
        return (
          <div>
            {feeViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools available</p>
              </div>
            </div>
          </div>
        );
      }

      if (!selectedSchoolFeesData || selectedSchoolFeesData.length === 0) {
        return (
          <div>
            {feeViewModeSelector}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
              <select
                value={selectedFeeSchool}
                onChange={(e) => setSelectedFeeSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a school</option>
                {schoolNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No fees data available for selected school</p>
              </div>
            </div>
          </div>
        );
      }

      const sortedYears = selectedSchoolFeesData.map(d => d.year).sort((a, b) => a - b);
      const fees = selectedSchoolFeesData.map(d => d.averageFee);
      const maxFee = Math.max(...fees);
      const minFee = Math.min(...fees);
      const range = maxFee - minFee || 1;

      const xScale = (index) => margin.left + (index / (sortedYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minFee) / range) * chartHeight;

      const linePath = selectedSchoolFeesData
        .sort((a, b) => a.year - b.year)
        .map((d, index) => {
          const x = xScale(index);
          const y = yScale(d.averageFee);
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

      const areaPath = linePath + ` L ${xScale(sortedYears.length - 1)} ${margin.top + chartHeight} L ${xScale(0)} ${margin.top + chartHeight} Z`;

      return (
        <div className="relative w-full">
          {feeViewModeSelector}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select School:</label>
            <select
              value={selectedFeeSchool}
              onChange={(e) => setSelectedFeeSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a school</option>
              {schoolNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">School Fee Over Years</h3>
              <p className="text-sm text-gray-600">{selectedFeeSchool}</p>
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
                  const index = Math.round(ratio * (sortedYears.length - 1));
                  if (index >= 0 && index < sortedYears.length) {
                    const year = sortedYears[index];
                    const yearData = selectedSchoolFeesData.find(d => d.year === year);
                    if (yearData) {
                      setCursor({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                        data: { year, averageFee: yearData.averageFee }
                      });
                    }
                  }
                }}
                onMouseLeave={() => setCursor(null)}
              >
                <defs>
                  <linearGradient id="individualFeesGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const y = margin.top + chartHeight - ratio * chartHeight;
                  const value = minFee + ratio * range;
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path
                  d={areaPath}
                  fill="url(#individualFeesGradient)"
                />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {selectedSchoolFeesData
                  .sort((a, b) => a.year - b.year)
                  .map((d, index) => {
                    const x = xScale(index);
                    const y = yScale(d.averageFee);
                    return (
                      <circle
                        key={d.year}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#10B981"
                        stroke="#fff"
                        strokeWidth="2"
                        className="hover:r-7 transition-all cursor-pointer"
                      />
                    );
                  })}

                {/* X-axis labels */}
                {sortedYears.map((year, index) => {
                  const x = xScale(index);
                  return (
                    <text
                      key={year}
                      x={x}
                      y={margin.top + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {year}
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
                  Average Fee (AED)
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
            {cursor && cursor.data && (() => {
              const tooltipWidth = 150;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold">Year: {cursor.data.year}</div>
                  <div className="text-gray-300">Average Fee: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cursor.data.averageFee)}</div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    // All schools view
    if (feeViewMode === 'all') {
      if (!schools || schools.length === 0) {
        return (
          <div>
            {feeViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No schools selected for this area</p>
              </div>
            </div>
          </div>
        );
      }

      if (!allSchoolsFeesData || allSchoolsFeesData.size === 0) {
        return (
          <div>
            {feeViewModeSelector}
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500 text-sm">No fees data over years available for schools in this area</p>
                <p className="text-gray-400 text-xs mt-2">Schools may not have historical fees data</p>
              </div>
            </div>
          </div>
        );
      }

      // Get all years from all schools
      const allYears = new Set();
      allSchoolsFeesData.forEach(fees => {
        fees.forEach(d => allYears.add(d.year));
      });
      const sortedYears = Array.from(allYears).sort((a, b) => a - b);

      // Calculate min/max fee across all schools
      let maxFee = 0;
      let minFee = Infinity;
      allSchoolsFeesData.forEach(fees => {
        fees.forEach(d => {
          if (d.averageFee > maxFee) maxFee = d.averageFee;
          if (d.averageFee < minFee) minFee = d.averageFee;
        });
      });
      const range = maxFee - minFee || 1;

      const xScale = (index) => margin.left + (index / (sortedYears.length - 1 || 1)) * chartWidth;
      const yScale = (value) => margin.top + chartHeight - ((value - minFee) / range) * chartHeight;

      // Generate colors for each school
      const schoolColors = Array.from(allSchoolsFeesData.keys()).map((_, i) => {
        const hue = (i * 137.508) % 360;
        return `hsl(${hue}, 70%, 50%)`;
      });

      return (
        <div className="relative w-full">
          {feeViewModeSelector}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">All Schools Fee Trends</h3>
              <p className="text-sm text-gray-600">Fee over years for all schools in {areaName}</p>
              <p className="text-xs text-gray-500 mt-1">Showing {allSchoolsFeesData.size} school{allSchoolsFeesData.size !== 1 ? 's' : ''} with fees data</p>
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
                  const yearIndex = Math.round(ratio * (sortedYears.length - 1));
                  if (yearIndex >= 0 && yearIndex < sortedYears.length) {
                    const year = sortedYears[yearIndex];
                    const nearestData = Array.from(allSchoolsFeesData.entries()).map(([schoolName, fees]) => {
                      const yearData = fees.find(r => r.year === year);
                      return yearData ? { schoolName, ...yearData } : null;
                    }).filter(Boolean);
                    if (nearestData.length > 0) {
                      setCursor({
                        x: e.clientX - svgRect.left,
                        y: e.clientY - svgRect.top,
                        data: { year, schools: nearestData }
                      });
                    }
                  }
                }}
                onMouseLeave={() => setCursor(null)}
              >
                <defs>
                  {Array.from(allSchoolsFeesData.keys()).map((schoolName, i) => (
                    <linearGradient key={schoolName} id={`feesSchoolGradient-${i}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={schoolColors[i]} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={schoolColors[i]} stopOpacity="0.05" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const y = margin.top + chartHeight - ratio * chartHeight;
                  const value = minFee + ratio * range;
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Draw lines for each school */}
                {Array.from(allSchoolsFeesData.entries()).map(([schoolName, fees], schoolIndex) => {
                  const schoolFees = sortedYears.map(year => {
                    const yearData = fees.find(r => r.year === year);
                    return yearData ? yearData.averageFee : null;
                  });

                  const linePath = schoolFees.reduce((path, fee, index) => {
                    if (fee !== null) {
                      const x = xScale(index);
                      const y = yScale(fee);
                      return path + (path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`);
                    }
                    return path;
                  }, '');

                  return (
                    <g key={schoolName}>
                      <path
                        d={linePath}
                        fill="none"
                        stroke={schoolColors[schoolIndex]}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                        className="hover:opacity-100 hover:stroke-width-3 transition-all cursor-pointer"
                      />
                      {schoolFees.map((fee, index) => {
                        if (fee !== null) {
                          const x = xScale(index);
                          const y = yScale(fee);
                          return (
                            <circle
                              key={`${schoolName}-${sortedYears[index]}`}
                              cx={x}
                              cy={y}
                              r="3"
                              fill={schoolColors[schoolIndex]}
                              stroke="#fff"
                              strokeWidth="1"
                              className="hover:r-5 transition-all"
                            />
                          );
                        }
                        return null;
                      })}
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {sortedYears.map((year, index) => {
                  const x = xScale(index);
                  return (
                    <text
                      key={year}
                      x={x}
                      y={margin.top + chartHeight + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {year}
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
                  Average Fee (AED)
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
            {cursor && cursor.data && cursor.data.schools && (() => {
              const tooltipWidth = 200;
              const tooltipLeft = Math.max(10, Math.min(cursor.x - tooltipWidth / 2, svgWidth - tooltipWidth - 10));
              return (
                <div
                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none max-w-xs"
                  style={{
                    left: `${tooltipLeft}px`,
                    top: `${Math.max(10, cursor.y - 70)}px`,
                  }}
                >
                  <div className="font-semibold mb-1">Year: {cursor.data.year}</div>
                  <div className="max-h-40 overflow-y-auto">
                    {cursor.data.schools.map((school, i) => (
                      <div key={i} className="text-gray-300 text-xs">
                        {school.schoolName}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(school.averageFee)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Legend */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Schools</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {Array.from(allSchoolsFeesData.keys()).map((schoolName, i) => (
                  <div key={schoolName} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: schoolColors[i] }}
                    />
                    <span className="text-xs text-gray-700 truncate max-w-[150px]">{schoolName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: return overall view
    return (
      <div>
        {feeViewModeSelector}
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">No fees data available</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "-100%" }}
      animate={{ opacity: 1, y: "0%" }}
      exit={{ opacity: 0, y: "-100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed top-20 w-[98%] md:w-[95%] lg:w-[70%] 2xl:w-[75%] right-1 md:right-[2%] xl:right-[5%] z-50 p-2 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            {visualizationMode === 'rating' ? (
              <BarChart3 className="w-6 h-6 text-blue-600" />
            ) : visualizationMode === 'fee' ? (
              <DollarSign className="w-6 h-6 text-blue-600" />
            ) : (
              <TrendingUp className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {visualizationMode === 'rating' ? 'Rating Distribution' : visualizationMode === 'fee' ? 'Fee Trends' : 'Enrollment Trends'}
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
          {visualizationMode === 'rating' ? renderRatingChart() : visualizationMode === 'fee' ? renderFeesChart() : renderEnrollmentChart()}
        </div>
      </div>
    </motion.div>
  );
};

export default SchoolGraphModal;

