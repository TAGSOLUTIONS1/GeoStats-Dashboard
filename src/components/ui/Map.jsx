import React from 'react';

const Map = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-gray-100 overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
        {/* Map Background - simulating a geographic map */}
        <div className="w-full h-full relative flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Interactive Map</h2>
            <p className="text-gray-600">Full-screen map component ready for development</p>
          </div>
        </div>
        
        {/* States/Regions - simplified representation */}
        <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-green-200 rounded-lg opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-16 bg-green-200 rounded-lg opacity-60"></div>
        <div className="absolute bottom-1/3 left-1/3 w-28 h-18 bg-green-200 rounded-lg opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-20 h-14 bg-green-200 rounded-lg opacity-60"></div>
        
        {/* City Markers */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-blue-500 rounded-full"></div>
        
        {/* Interactive Tooltip (like in reference) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <span>Sample City, State</span>
            <button className="bg-red-500 text-white px-2 py-1 rounded text-xs">
              Click to see metro
            </button>
          </div>
        </div>
      </div>
      
      {/* Map Controls - Bottom Right */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        {/* Data Point Label */}
        <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
          Data Point: For Sale Inventory
        </div>
        
        {/* Zoom Controls */}
        <div className="flex flex-col space-y-1">
          <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg font-bold">+</span>
          </button>
          <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg font-bold">-</span>
          </button>
        </div>
        
        {/* Feedback Button */}
        <button className="w-8 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-200">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Scale Indicator */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded px-3 py-1 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-16 h-0.5 bg-red-500"></div>
          <span>0 145</span>
        </div>
      </div>
    </div>
  );
};

export default Map;