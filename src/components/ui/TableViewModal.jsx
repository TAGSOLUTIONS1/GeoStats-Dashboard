import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ChevronUp, ChevronDown, ArrowUpDown, ArrowDownUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { sampleData } from '../../data/TableViewData';
import { dataSections } from '../../data/sidebarData';

const TableViewModal = ({ isOpen, onClose, data = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredSort, setHoveredSort] = useState(null);
  const [columnHeaders, setColumnHeaders] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  if (!isOpen) return null;

  const tableData = data.length > 0 ? data : sampleData;

  // Flatten all data points for easy access
  const allDataPoints = dataSections.flatMap(section => 
    section.items.map(item => ({ ...item, sectionId: section.id, sectionLabel: section.label }))
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleDropdownToggle = (headerKey) => {
    setActiveDropdown(activeDropdown === headerKey ? null : headerKey);
  };

  const getSortTooltipText = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        return 'Click to sort descending';
      } else {
        return 'Click to cancel sorting';
      }
    }
    return 'Click to sort ascending';
  };

  const handleColumnHeaderChange = (columnKey, selectedDataPoint) => {
    // Check if any other column is already using this section
    const isSectionAlreadyUsed = Object.entries(columnHeaders).some(([key, value]) => 
      key !== columnKey && value?.sectionId === selectedDataPoint.sectionId
    );
    
    if (isSectionAlreadyUsed) {
      // If section is already used, swap the columns
      const existingColumn = Object.entries(columnHeaders).find(([key, value]) => 
        value?.sectionId === selectedDataPoint.sectionId
      );
      
      if (existingColumn) {
        const [existingKey, existingValue] = existingColumn;
        setColumnHeaders(prev => ({
          ...prev,
          [existingKey]: prev[columnKey] || null, // Move current column's data to existing column
          [columnKey]: selectedDataPoint // Set new data to current column
        }));
      }
    } else {
      // Normal assignment
      setColumnHeaders(prev => ({
        ...prev,
        [columnKey]: selectedDataPoint
      }));
    }
    setActiveDropdown(null);
  };

  const getColumnHeaderLabel = (columnKey) => {
    return columnHeaders[columnKey]?.label || tableHeaders.find(h => h.key === columnKey)?.label || 'Select Data Point';
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sortedData = [...tableData].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value}%`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Header configuration to reduce repetitive code
  const tableHeaders = [
    { key: 'rk', label: 'RK', sortable: true, format: 'number', width: 'w-16' },
    { key: 'zip', label: 'Zip', sortable: true, format: 'text', width: 'w-24'},
    { key: 'city', label: 'City', sortable: true, format: 'text', width: 'w-32' },
    { key: 'homeValue', label: 'Home Value', sortable: true, format: 'currency', width: 'w-32' },
    { key: 'homeValueGrowth', label: 'Home Value Growth (YoY)', sortable: true, format: 'percentage', width: 'w-40' },
    { key: 'population', label: 'Population', sortable: true, format: 'number', width: 'w-32' }
  ];

  // Format cell value based on type
  const formatCellValue = (value, format) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      default:
        return value;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed w-[78%] h-[98%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-full h-full flex flex-col overflow-y-auto ">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold text-gray-900 font-tomorrow">GeoStats Table View - Zip</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 bg-azure text-white text-xs font-medium rounded-lg hover:bg-azure-dark transition-colors flex items-center space-x-2">
              <Download className="w-3 h-3" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1">
          <div className="overflow-x-auto" ref={dropdownRef}>
            <table className="w-full border-collapse">
              <thead>
                <tr className=" text-center">
                  {tableHeaders.map((header) => (
                    <th 
                      key={header.key}
                      className={`border-l border-gray-200 py-2 px-3 font-medium text-sm text-white bg-blue hover:bg-blue-dark ${header.width} relative`}
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Header Label - No dropdown for first 3 columns */}
                        {['rk', 'zip', 'city'].includes(header.key) ? (
                          <div className="flex-1">
                            <span className="text-sm font-medium text-center block">
                              {header.label}
                            </span>
                          </div>
                        ) : (
                          /* Dropdown Button with Text for other columns */
                          <div className="flex-1">
                            <button
                              onClick={() => handleDropdownToggle(header.key)}
                              className="w-full text-left px-2 py-1 hover:bg-blue-light rounded flex items-center justify-between"
                            >
                              <span className="text-sm font-medium truncate">
                                {getColumnHeaderLabel(header.key)}
                              </span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1" />
                            </button>
                          </div>
                        )}
                        
                        {/* Sort Button */}
                        {header.sortable && (
                          <div 
                            className="relative ml-2"
                            onMouseEnter={() => setHoveredSort(header.key)}
                            onMouseLeave={() => setHoveredSort(null)}
                          >
                            <button
                              onClick={() => handleSort(header.key)}
                              className="p-1 hover:bg-blue-light rounded"
                            >
                              {sortConfig.key === header.key ? (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUpDown className="w-3 h-3 text-orange" />
                                ) : (
                                  <ArrowDownUp className="w-3 h-3 text-orange" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3" />
                              )}
                            </button>
                            {/* Sort Tooltip */}
                            {hoveredSort === header.key && (
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                                {getSortTooltipText(header.key)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === header.key && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-50 mt-1 max-h-60 overflow-y-auto">
                          <div className="py-2">
                            {dataSections.map((section) => {
                              const isExpanded = expandedSections[section.id];
                              
                              return (
                                <div key={section.id}>
                                  {/* Section Header - Clickable */}
                                  <div 
                                    className="px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-300 flex items-center justify-between"
                                    onClick={() => toggleSection(section.id)}
                                  >
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                      {section.label}
                                    </h4>
                                    <ChevronDown 
                                      className={`w-3 h-3 text-gray-500 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`} 
                                    />
                                  </div>
                                  
                                  {/* Section Items - Only show if expanded */}
                                  {isExpanded && section.items.map((point) => {
                                    const isUsedByOtherColumn = Object.entries(columnHeaders).some(([key, value]) => 
                                      key !== header.key && value?.sectionId === section.id
                                    );
                                    
                                    return (
                                      <div
                                        key={point.id}
                                        onClick={() => handleColumnHeaderChange(header.key, point)}
                                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                                          isUsedByOtherColumn ? 'opacity-50' : ''
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs text-left text-gray-700">{point.label}</span>
                                          {isUsedByOtherColumn && (
                                            <span className="text-xs text-orange">(Used in another column)</span>
                                          )}
                                        </div>
                                        {point.isPremium && (
                                          <Crown className="w-3 h-3 text-orange" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                            
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr key={row.rk} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    {tableHeaders.map((header) => (
                      <td 
                        key={header.key}
                        className={`py-3 px-3 text-center text-sm text-gray-900 ${header.width} ${header.className || ''}`}
                      >
                        {formatCellValue(row[header.key], header.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Rows per Page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-azure"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 border rounded text-sm ${
                      currentPage === pageNum
                        ? 'bg-azure text-white border-azure'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TableViewModal;