import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const FilterPanel = ({ isOpen, onClose }) => {

  const [filters, setFilters] = useState({
    'population-growth': { min: 0.0, max: 0.0, minRange: 0.0, maxRange: 10.0, label: 'Population Growth', unit: '%' },
    'price-cut': { min: 0.0, max: 0.0, minRange: 0.0, maxRange: 20.0, label: 'Price Cut %', unit: '%' },
    'sale-inventory-growth': { min: -100.0, max: 1000.0, minRange: -100.0, maxRange: 1000.0, label: 'Sale Inventory Growth (YoY)', unit: '%' },
    'median-household-income': { min: 35430, max: 179469, minRange: 20000, maxRange: 200000, label: 'Median Household Income', unit: '$' }
  });

  const handleSliderChange = (filterKey, type, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [type]: parseFloat(value)
      }
    }));
  };

  const handleInputChange = (filterKey, type, value) => {
    const numValue = parseFloat(value) || 0;
    setFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [type]: numValue
      }
    }));
  };

  const resetFilters = () => {
    setFilters({
      'population-growth': { min: 0.0, max: 0.0, minRange: 0.0, maxRange: 10.0, label: 'Population Growth', unit: '%' },
      'price-cut': { min: 0.0, max: 0.0, minRange: 0.0, maxRange: 20.0, label: 'Price Cut %', unit: '%' },
      'sale-inventory-growth': { min: -100.0, max: 1000.0, minRange: -100.0, maxRange: 1000.0, label: 'Sale Inventory Growth (YoY)', unit: '%' },
      'median-household-income': { min: 35430, max: 179469, minRange: 20000, maxRange: 200000, label: 'Median Household Income', unit: '$' }
    });
  };

  return (
    <>
        <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={isOpen ? { opacity: 1, height: "80%" } : { opacity: 1, height: 0 }}
        transition={{ duration: 0.75, ease: "easeInOut" }}
        className="fixed top-16 right-10 w-80 bg-white shadow-2xl z-50 overflow-hidden"
        onClick={onClose}
        >
      <div 
        className="h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(filters).map(([key, filter]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{filter.label}</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Range Slider */}
              <div className="space-y-2">
                <div className="relative h-2">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 rounded-lg"></div>
                  <div 
                    className="absolute top-0 h-2 bg-red-500 rounded-lg"
                    style={{
                      left: `${((filter.min - filter.minRange) / (filter.maxRange - filter.minRange)) * 100}%`,
                      width: `${((filter.max - filter.min) / (filter.maxRange - filter.minRange)) * 100}%`
                    }}
                  ></div>
                  <input
                    type="range"
                    min={filter.minRange}
                    max={filter.maxRange}
                    value={filter.min}
                    onChange={(e) => handleSliderChange(key, 'min', e.target.value)}
                    className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                  />
                  <input
                    type="range"
                    min={filter.minRange}
                    max={filter.maxRange}
                    value={filter.max}
                    onChange={(e) => handleSliderChange(key, 'max', e.target.value)}
                    className="absolute top-0 w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
                  />
                </div>
                
                {/* Input Fields */}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={filter.min}
                    onChange={(e) => handleInputChange(key, 'min', e.target.value)}
                    className="flex-1 w-1/2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    step="0.1"
                  />
                  <span className="text-xs text-gray-500">to</span>
                  <input
                    type="number"
                    value={filter.max}
                    onChange={(e) => handleInputChange(key, 'max', e.target.value)}
                    className="flex-1 w-1/2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add More Filters Button */}
          <button className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add data filters</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider-thumb::-webkit-slider-track {
          background: transparent;
        }
        
        .slider-thumb::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </motion.div>
    </>
  );
};

export default FilterPanel;