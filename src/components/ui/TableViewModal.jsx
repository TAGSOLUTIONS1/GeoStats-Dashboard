import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Download, ChevronDown, ArrowUpDown, ArrowDownUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  tableBackedIds,
  defaultColumnIds,
  buildRows,
  formatCell,
  getColumnLabel,
  toCsv,
} from '../../services/tableData';
import { dataSections } from '../../data/sidebarData';

const TableViewModal = ({ isOpen, onClose }) => {
  // Open ranked by the first value column, highest first, so the top of the
  // table is the part with data rather than the map's polygon order.
  const [sortConfig, setSortConfig] = useState({ key: defaultColumnIds[0], direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredSort, setHoveredSort] = useState(null);
  // Which data point each of the three value columns shows. Any map data
  // point can be picked; the cells follow the choice.
  const [columnIds, setColumnIds] = useState(defaultColumnIds);
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

  const rows = useMemo(() => buildRows(columnIds), [columnIds]);

  const sortedData = useMemo(() => {
    const list = [...rows];
    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        // Blanks always sink to the bottom, whichever way the sort runs.
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'string' || typeof bv === 'string') {
          return String(av).localeCompare(String(bv)) * dir;
        }
        return (av - bv) * dir;
      });
    }
    return list.map((r, i) => ({ ...r, rk: i + 1 }));
  }, [rows, sortConfig]);

  if (!isOpen) return null;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
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

  // Put a data point in a column. If another column already shows it, the
  // two columns swap so the same data never appears twice.
  const handleColumnChange = (columnIndex, pointId) => {
    setColumnIds((prev) => {
      const next = [...prev];
      const existing = next.indexOf(pointId);
      if (existing !== -1 && existing !== columnIndex) {
        next[existing] = prev[columnIndex];
      }
      next[columnIndex] = pointId;
      return next;
    });
    setSortConfig({ key: pointId, direction: 'desc' });
    setCurrentPage(1);
    setActiveDropdown(null);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleDownload = () => {
    const csv = toCsv(columnIds, sortedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geostats-community-table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const tableHeaders = [
    { key: 'rk', label: 'RK', sortable: true, fixed: true },
    { key: 'area', label: 'Area', sortable: true, fixed: true },
    ...columnIds.map((id, i) => ({ key: id, label: getColumnLabel(id), sortable: true, columnIndex: i })),
  ];

  const renderCell = (row, header) => {
    if (header.key === 'rk') return row.rk;
    if (header.key === 'area') return row.area;
    return formatCell(row[header.key], header.key);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed w-[90%] lg:w-[78%] h-[98%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl mobile-scroll-fix"
    >
      <div className="w-full h-full flex flex-col overflow-y-auto ">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 font-tomorrow">GeoStats Table View - Community</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-2 sm:px-3 py-1.5 bg-azure text-white text-[8px] sm:text-xs font-medium rounded-lg hover:bg-azure-dark transition-colors flex items-center space-x-2"
            >
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
                      className="border-l border-gray-200 py-2 px-3 font-medium text-sm text-blue-light relative font-inter"
                      style={{
                        background: `linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)`,
                        borderBottom: `3px solid #2A7A8A`,
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        {/* Header Label - No dropdown for the fixed columns */}
                        {header.fixed ? (
                          <div className="flex-1">
                            <span className="text-sm font-medium text-center block">
                              {header.label}
                            </span>
                          </div>
                        ) : (
                          /* Dropdown Button with Text for value columns */
                          <div className="flex-1">
                            <button
                              onClick={() => handleDropdownToggle(header.key)}
                              className="w-full text-left px-2 py-1 hover:bg-gray-200 rounded flex items-center justify-between"
                            >
                              <span className="text-sm font-medium truncate">
                                {header.label}
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
                              className="p-1 hover:bg-gray-200 rounded"
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
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">
                                      {section.label}
                                    </h4>
                                    <ChevronDown
                                      className={`w-3 h-3 text-gray-500 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>

                                  {/* Section Items - Only show if expanded */}
                                  {isExpanded && section.items.filter(Boolean).map((point) => {
                                    // Locked points and Dubai-wide cards have no
                                    // per-community rows to show.
                                    const hasTableData = !point.isPremium && tableBackedIds.has(point.id);
                                    const isCurrent = point.id === header.key;
                                    const usedElsewhere = !isCurrent && columnIds.includes(point.id);

                                    return (
                                      <div
                                        key={point.id}
                                        onClick={hasTableData ? () => handleColumnChange(header.columnIndex, point.id) : undefined}
                                        title={
                                          hasTableData
                                            ? undefined
                                            : point.isPremium
                                              ? 'Locked data point'
                                              : 'Dubai-wide data point: no per-community table'
                                        }
                                        className={`px-3 py-2 flex items-center justify-between ${
                                          hasTableData
                                            ? `hover:bg-gray-100 cursor-pointer ${isCurrent ? 'bg-gray-100' : ''}`
                                            : 'opacity-40 cursor-not-allowed'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs text-left text-gray-700">{point.label}</span>
                                          {!hasTableData && !point.isPremium && (
                                            <span className="text-[10px] text-gray-400">(Dubai-wide)</span>
                                          )}
                                          {usedElsewhere && (
                                            <span className="text-[10px] text-orange">(in another column)</span>
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
                {currentData.map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 hover:bg-gray-50 text-center">
                    {tableHeaders.map((header) => (
                      <td
                        key={header.key}
                        className="px-1 py-1 md:px-2 md:py-2 lg:py-3 lg:px-3 text-center text-xs sm:text-sm text-blue font-inter"
                      >
                        {renderCell(row, header)}
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
                <span className="text-[10px] sm:text-xs md:text-sm text-blue font-inter">
                  Showing {sortedData.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-[10px] sm:text-xs md:text-sm text-blue font-inter">Rows per Page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-1 sm:px-2 py-1 border border-gray-300 rounded text-[10px] sm:text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue text-blue font-inter"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-1 sm:px-2 py-1 border border-gray-300 rounded text-[10px] sm:text-xs md:text-sm hover:bg-blue hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-blue font-inter"
              >
                &lt;
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-1 sm:px-2 py-1 border rounded text-[10px] sm:text-xs md:text-sm font-inter ${
                      currentPage === pageNum
                        ? 'bg-blue text-white border-blue'
                        : 'border-gray-300 hover:bg-blue hover:text-white text-blue'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-1 sm:px-2 py-1 border border-gray-300 rounded text-[10px] sm:text-xs md:text-sm hover:bg-blue hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-blue font-inter"
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
