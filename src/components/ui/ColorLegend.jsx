import React from 'react';

const ColorLegend = ({ mode }) => {
  if (!mode) return null;

  if (mode === 'rating') {
    return (
      <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        {/* <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Rating:</span> */}
        <div className="flex items-center space-x-1">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d32f2f' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">0</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #d32f2f, #f57c00)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f57c00' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">1</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #f57c00, #fbc02d)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbc02d' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">2</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #fbc02d, #689f38)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#689f38' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">3</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #689f38, #1976d2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1976d2' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">4</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #1976d2, #00796b)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00796b' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">5</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'enrollment') {
    return (
      <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        {/* <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Enrollment:</span> */}
        <div className="flex items-center space-x-1">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fff3e0' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">0</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #fff3e0, #ffe0b2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffe0b2' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">100</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #ffe0b2, #ffcc80)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffcc80' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">500</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #ffcc80, #ffb74d)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffb74d' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">1K</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #ffb74d, #ff9800)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff9800' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">2.5K</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #ff9800, #f57c00)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f57c00' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">5K</span>
          </div>
          <div className="w-12 h-4 rounded" style={{ background: 'linear-gradient(to right, #f57c00, #e65100)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e65100' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">10K+</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'count') {
    return (
      <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        {/* <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Schools:</span> */}
        <div className="flex items-center space-x-1">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e3f2fd' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">0</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #e3f2fd, #bbdefb)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#bbdefb' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">1-2</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #bbdefb, #90caf9)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#90caf9' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">3-5</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #90caf9, #64b5f6)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#64b5f6' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">6-10</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #64b5f6, #42a5f5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#42a5f5' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">11-20</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #42a5f5, #2196f3)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2196f3' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">21-30</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #2196f3, #1e88e5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e88e5' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">31-50</span>
          </div>
          <div className="w-8 h-4 rounded" style={{ background: 'linear-gradient(to right, #1e88e5, #1976d2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1976d2' }}></div>
            <span className="text-[10px] text-gray-600 mt-0.5">51+</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ColorLegend;

