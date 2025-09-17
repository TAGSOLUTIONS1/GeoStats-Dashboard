import React from 'react';
import { Search } from 'lucide-react';

const SidebarSearch = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="SEARCH DATA POINTS"
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-1.5 text-sm bg-white border border-gray-600 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default SidebarSearch;