import React from 'react';

const ColorLegend = ({ mode }) => {
  if (!mode) return null;

  if (mode === 'rating') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#d32f2f' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #d32f2f, #f57c00)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#f57c00' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">1</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #f57c00, #fbc02d)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#fbc02d' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">2</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #fbc02d, #689f38)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#689f38' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">3</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #689f38, #1976d2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#1976d2' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">4</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #1976d2, #00796b)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#00796b' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">5</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'enrollment') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#fff3e0' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #fff3e0, #ffe0b2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ffe0b2' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">100</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ffe0b2, #ffcc80)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ffcc80' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">500</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ffcc80, #ffb74d)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ffb74d' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">1K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ffb74d, #ff9800)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ff9800' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">2.5K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ff9800, #f57c00)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#f57c00' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">5K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #f57c00, #e65100)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e65100' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">10K+</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'fee') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e8f5e9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #e8f5e9, #c8e6c9)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#c8e6c9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">10K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #c8e6c9, #a5d6a7)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#a5d6a7' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">25K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #a5d6a7, #81c784)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#81c784' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">50K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #81c784, #66bb6a)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#66bb6a' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">75K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #66bb6a, #4caf50)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#4caf50' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">100K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #4caf50, #388e3c)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#388e3c' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">150K+</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'count') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e3f2fd' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #e3f2fd, #bbdefb)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#bbdefb' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">1-2</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #bbdefb, #90caf9)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#90caf9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">3-5</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #90caf9, #64b5f6)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#64b5f6' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">6-10</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #64b5f6, #42a5f5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#42a5f5' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">11-20</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #42a5f5, #2196f3)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#2196f3' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">21-30</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #2196f3, #1e88e5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#1e88e5' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">31-50</span>
          </div>
          <div className="w-6 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #1e88e5, #1976d2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#1976d2' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">51+</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'property-count') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ede7f6' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ede7f6, #d1c4e9)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#d1c4e9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">20</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #d1c4e9, #b39ddb)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#b39ddb' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">60</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #b39ddb, #7e57c2)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#7e57c2' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">120</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #7e57c2, #512da8)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#512da8' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">200+</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'property-furnishing') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#fff3e0' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0%</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #fff3e0, #ffcc80)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ffcc80' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">25%</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ffcc80, #ffb74d)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#ffb74d' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">50%</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #ffb74d, #fb8c00)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#fb8c00' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">75%</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #fb8c00, #e65100)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e65100' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">100%</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'property-rent') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e8f5e9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #e8f5e9, #a5d6a7)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#a5d6a7' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">80K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #a5d6a7, #66bb6a)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#66bb6a' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">160K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #66bb6a, #43a047)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#43a047' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">240K</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #43a047, #1b5e20)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#1b5e20' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">320K+</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'property-rent-sqft') {
    return (
      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-0.5">
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#e3f2fd' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">0</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #e3f2fd, #90caf9)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#90caf9' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">80</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #90caf9, #42a5f5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#42a5f5' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">140</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #42a5f5, #1e88e5)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#1e88e5' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">220</span>
          </div>
          <div className="w-8 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #1e88e5, #0d47a1)' }}></div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-2.5 rounded" style={{ backgroundColor: '#0d47a1' }}></div>
            <span className="text-[9px] text-gray-600 mt-0.5 leading-none">300+</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 text-[9px] text-gray-600 ml-1">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#e0e0e0' }}></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ColorLegend;

