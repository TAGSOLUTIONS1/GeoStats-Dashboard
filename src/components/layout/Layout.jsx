import React, { useState } from 'react';
import { Search, Filter, Share, LogIn , Share2} from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('State');

  const filterOptions = ['State', 'City', 'Area', 'Zip'];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between">
            
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your State, City, or ZIP Code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>

              <div className="flex items-center space-x-6">
              {/* Filter Options */}
              <div className="flex items-center space-x-8">
                {filterOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="filter"
                      value={option}
                      checked={selectedFilter === option}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="text-blue-600 w-3 h-3"
                    />
                    <span className="text-base text-gray-700">{option}</span>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-6">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
                    <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <p>Filter</p>
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Sign up
                </button>
                <button className="px-4 py-2 bg-blue-600 text-black text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              </div>
            </div>
        </div>
        
        {/* Main Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;