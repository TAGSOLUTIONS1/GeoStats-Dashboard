import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DatePicker = ({ selectedDate, onDateChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(6); // July (0-indexed)
  const dropdownRef = useRef(null);

  // Parse the selected date (format: "Jul 2025")
  const parseSelectedDate = (dateString) => {
    const [month, year] = dateString.split(' ');
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    return { month: monthIndex, year: parseInt(year) };
  };

  const formatDate = (monthIndex, year) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Initialize from selectedDate prop
  useEffect(() => {
    if (selectedDate) {
      const { month, year } = parseSelectedDate(selectedDate);
      setSelectedMonth(month);
      setCurrentYear(year);
    }
  }, [selectedDate]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleMonthChange = (monthIndex) => {
    setSelectedMonth(monthIndex);
    onDateChange(formatDate(monthIndex, currentYear));
    setIsOpen(false);
  };

  const handleYearChange = (direction) => {
    if (direction === 'prev') {
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentYear(prev => prev + 1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white px-4 py-2 rounded-3xl hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-700">Date: {selectedDate}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64"
          >
            {/* Year Navigation Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => handleYearChange('prev')}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex items-center -space-x-3"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              
              <h3 className="text-base font-semibold text-gray-900">
                {currentYear}
              </h3>
              
              <button
                onClick={() => handleYearChange('next')}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex items-center -space-x-3"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Month Grid - 3x4 Layout */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthChange(index)}
                    className={`px-2 py-1.5 text-xs rounded transition-colors ${
                      selectedMonth === index
                        ? 'bg-azure text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;