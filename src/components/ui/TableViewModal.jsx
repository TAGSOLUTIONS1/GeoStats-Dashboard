import React, { useState } from 'react';
import { X, Download, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const TableViewModal = ({ isOpen, onClose, data = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState('Jul 2025');

  if (!isOpen) return null;

  // Sample data based on the image
  const sampleData = [
    { rk: 1, zip: '68461', city: 'Walton', homeValue: 724991, homeValueGrowth: 1.7, population: 732 },
    { rk: 2, zip: '68430', city: 'Roca', homeValue: 601184, homeValueGrowth: 1.8, population: 1661 },
    { rk: 3, zip: '68339', city: 'Denton', homeValue: 597490, homeValueGrowth: 1.3, population: 993 },
    { rk: 4, zip: '68517', city: 'Lincoln', homeValue: 582499, homeValueGrowth: 4.0, population: 462 },
    { rk: 5, zip: '68520', city: 'Lincoln', homeValue: 581986, homeValueGrowth: 5.2, population: 2491 },
    { rk: 6, zip: '68428', city: 'Raymond', homeValue: 571065, homeValueGrowth: 3.2, population: 1370 },
    { rk: 7, zip: '68532', city: 'Lincoln', homeValue: 562964, homeValueGrowth: 3.7, population: 728 },
    { rk: 8, zip: '68527', city: 'Lincoln', homeValue: 523558, homeValueGrowth: 3.2, population: 2238 },
    { rk: 9, zip: '68404', city: 'Martell', homeValue: 516148, homeValueGrowth: 2.3, population: 1048 },
    { rk: 10, zip: '68402', city: 'Malcolm', homeValue: 513720, homeValueGrowth: 5.0, population: 1282 },
    { rk: 11, zip: '68401', city: 'Lincoln', homeValue: 500000, homeValueGrowth: 2.5, population: 1500 },
    { rk: 12, zip: '68403', city: 'Lincoln', homeValue: 495000, homeValueGrowth: 3.1, population: 1200 },
    { rk: 13, zip: '68405', city: 'Lincoln', homeValue: 490000, homeValueGrowth: 2.8, population: 1100 },
    { rk: 14, zip: '68406', city: 'Lincoln', homeValue: 485000, homeValueGrowth: 3.5, population: 1300 },
    { rk: 15, zip: '68407', city: 'Lincoln', homeValue: 480000, homeValueGrowth: 2.9, population: 1400 },
    { rk: 16, zip: '68408', city: 'Lincoln', homeValue: 475000, homeValueGrowth: 3.3, population: 1600 },
    { rk: 17, zip: '68409', city: 'Lincoln', homeValue: 470000, homeValueGrowth: 2.7, population: 1700 },
    { rk: 18, zip: '68410', city: 'Lincoln', homeValue: 465000, homeValueGrowth: 3.4, population: 1800 },
    { rk: 19, zip: '68411', city: 'Lincoln', homeValue: 460000, homeValueGrowth: 2.6, population: 1900 },
    { rk: 20, zip: '68412', city: 'Lincoln', homeValue: 455000, homeValueGrowth: 3.6, population: 2000 },
    { rk: 21, zip: '68413', city: 'Lincoln', homeValue: 450000, homeValueGrowth: 2.4, population: 2100 },
    { rk: 22, zip: '68414', city: 'Lincoln', homeValue: 445000, homeValueGrowth: 3.8, population: 2200 },
    { rk: 23, zip: '68415', city: 'Lincoln', homeValue: 440000, homeValueGrowth: 2.3, population: 2300 },
    { rk: 24, zip: '68416', city: 'Lincoln', homeValue: 435000, homeValueGrowth: 3.7, population: 2400 },
    { rk: 25, zip: '68417', city: 'Lincoln', homeValue: 430000, homeValueGrowth: 2.5, population: 2500 },
    { rk: 26, zip: '68418', city: 'Lincoln', homeValue: 425000, homeValueGrowth: 3.9, population: 2600 },
    { rk: 27, zip: '68419', city: 'Lincoln', homeValue: 420000, homeValueGrowth: 2.8, population: 2700 },
    { rk: 28, zip: '68420', city: 'Lincoln', homeValue: 415000, homeValueGrowth: 3.2, population: 2800 },
    { rk: 29, zip: '68421', city: 'Lincoln', homeValue: 410000, homeValueGrowth: 2.7, population: 2900 },
    { rk: 30, zip: '68422', city: 'Lincoln', homeValue: 405000, homeValueGrowth: 3.5, population: 3000 },
    { rk: 31, zip: '68423', city: 'Lincoln', homeValue: 400000, homeValueGrowth: 2.6, population: 3100 },
    { rk: 32, zip: '68424', city: 'Lincoln', homeValue: 395000, homeValueGrowth: 3.4, population: 3200 },
    { rk: 33, zip: '68425', city: 'Lincoln', homeValue: 390000, homeValueGrowth: 2.9, population: 3300 },
    { rk: 34, zip: '68426', city: 'Lincoln', homeValue: 385000, homeValueGrowth: 3.6, population: 3400 },
    { rk: 35, zip: '68427', city: 'Lincoln', homeValue: 380000, homeValueGrowth: 2.4, population: 3500 },
    { rk: 36, zip: '68428', city: 'Lincoln', homeValue: 375000, homeValueGrowth: 3.8, population: 3600 },
    { rk: 37, zip: '68429', city: 'Lincoln', homeValue: 370000, homeValueGrowth: 2.3, population: 3700 },
    { rk: 38, zip: '68430', city: 'Lincoln', homeValue: 365000, homeValueGrowth: 3.7, population: 3800 },
    { rk: 39, zip: '68431', city: 'Lincoln', homeValue: 360000, homeValueGrowth: 2.5, population: 3900 },
    { rk: 40, zip: '68432', city: 'Lincoln', homeValue: 355000, homeValueGrowth: 3.9, population: 4000 },
    { rk: 41, zip: '68433', city: 'Lincoln', homeValue: 350000, homeValueGrowth: 2.8, population: 4100 },
    { rk: 42, zip: '68434', city: 'Lincoln', homeValue: 345000, homeValueGrowth: 3.2, population: 4200 }
  ];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed w-[90%] h-[85%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
    >
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">GeoStats Table View - Zip</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Date: {selectedDate}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('rk')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>RK</span>
                      {sortConfig.key === 'rk' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('zip')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Zip</span>
                      {sortConfig.key === 'zip' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>City</span>
                      {sortConfig.key === 'city' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('homeValue')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Home Value</span>
                      {sortConfig.key === 'homeValue' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('homeValueGrowth')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Home Value Growth (YoY)</span>
                      {sortConfig.key === 'homeValueGrowth' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('population')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Population</span>
                      {sortConfig.key === 'population' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : <ChevronUp className="w-4 h-4 opacity-30" />}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, index) => (
                  <tr key={row.rk} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{row.rk}</td>
                    <td className="py-3 px-4 text-gray-900 font-mono">{row.zip}</td>
                    <td className="py-3 px-4 text-gray-900">{row.city}</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">{formatCurrency(row.homeValue)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatPercentage(row.homeValueGrowth)}</td>
                    <td className="py-3 px-4 text-gray-900">{formatNumber(row.population)}</td>
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
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm ${
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
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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