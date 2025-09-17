import React, { useState } from 'react';
import { X, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { sampleData } from '../../data/TableViewData';

const TableViewModal = ({ isOpen, onClose, data = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!isOpen) return null;

  const tableData = data.length > 0 ? data : sampleData;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
    { key: 'rk', label: 'RK', sortable: true, format: 'number' },
    { key: 'zip', label: 'Zip', sortable: true, format: 'text'},
    { key: 'city', label: 'City', sortable: true, format: 'text' },
    { key: 'homeValue', label: 'Home Value', sortable: true, format: 'currency' },
    { key: 'homeValueGrowth', label: 'Home Value Growth (YoY)', sortable: true, format: 'percentage' },
    { key: 'population', label: 'Population', sortable: true, format: 'number' }
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
      className="fixed w-[76%] h-[98%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-full h-full flex flex-col overflow-y-auto ">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold text-gray-900">GeoStats Table View - Zip</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
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
        <div className="flex-1 p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-center">
                  {tableHeaders.map((header) => (
                    <th 
                      key={header.key}
                      className="py-2 px-3 font-semibold text-sm text-gray-900 cursor-pointer hover:bg-gray-50 justify-items-center"
                      onClick={() => header.sortable && handleSort(header.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{header.label}</span>
                        {header.sortable && (
                          sortConfig.key === header.key ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : <ChevronUp className="w-3 h-3 opacity-30" />
                        )}
                      </div>
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
                        className={`py-2 px-3 text-center text-xs text-gray-900 ${header.className || ''}`}
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
                <span className="text-xs text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">Rows per Page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 border rounded text-xs ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white border-red-600'
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
                className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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