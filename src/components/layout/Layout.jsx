import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, LogIn, Share2, Table, MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import FilterPanel from '../ui/FilterPanel';
import TableViewModal from '../ui/TableViewModal';
import DatePicker from '../ui/DatePicker';
import TooltipToggle from '../ui/TooltipToggle';
import FeedbackModal from '../ui/FeedbackModal';
import ShareModal from '../ui/ShareModal';
import Map from '../ui/Map';
import mapboxgl from 'mapbox-gl';

const Layout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('State');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Jul 2025');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const filterOptions = ['State', 'City', 'Area', 'Zip'];

  const handleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const handleTableView = () => {
    setIsTableViewOpen(!isTableViewOpen);
  };

  const handleTooltipToggle = () => {
    setIsTooltipEnabled(!isTooltipEnabled);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleFeedback = () => {
    setIsFeedbackOpen(!isFeedbackOpen);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query) {
      setSearchSuggestions([]);
      return;
    }

    // Debounce the API call
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}&` +
          `bbox=54.13,24.5,56.4,25.7` // Restrict to Dubai area
        );
        const data = await response.json();
        setSearchSuggestions(data.features);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSelection = (feature) => {
    setSearchQuery(feature.place_name);
    setSearchSuggestions([]);
    // Center map on selected location
    if (window.map) {
      window.map.flyTo({
        center: feature.center,
        zoom: 13
      });
    }
  };

  return (
    // <div>
    //   <Map />
    // </div>
    <div className="flex h-screen bg-gray-50 relative">
      <Sidebar />
      
      {/* Background Map - Fixed behind main content only */}
      <div className="absolute left-72 right-0 top-0 bottom-0">
        <Map />
      </div>
      
      <main className="flex-1 relative z-20 flex flex-col pointer-events-none">
        {/* Top Header */}
        <div className="bg-white/95 mt-4 mx-6 border-b border-gray-200 px-6 py-2 flex justify-between pointer-events-auto items-center">
            
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations in Dubai"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure w-80"
                />
                
                {/* Search suggestions dropdown */}
                {searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => handleSearchSelection(feature)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{feature.text}</p>
                        <p className="text-xs text-gray-500">{feature.place_name}</p>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-azure"></div>
                  </div>
                )}
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
                      className="text-azure w-3 h-3"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                    <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={handleFilterPanel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300"
                >
                  <Filter className="w-4 h-4 text-gray-600" />
                  <p className="text-sm">Filter</p>
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-azure hover:text-azure-dark transition-colors">
                  Sign up
                </button>
                <button className="px-3 py-1.5 bg-azure text-white text-xs font-medium rounded-lg hover:bg-azure-dark transition-colors flex items-center space-x-1">
                  <LogIn className="w-3 h-3" />
                  <span>Login</span>
                </button>
              </div>
            </div>
        </div>
        
        {/* Main Content Area - Only render if there are actual children */}
        {children && React.Children.count(children) > 0 && (
          <div className="flex-1 overflow-y-auto bg-transparent pointer-events-none">
            <div className="pointer-events-auto">
              {children}
            </div>
          </div>
        )}
        
        {/* Spacer to push bottom controls down when no children */}
        {(!children || React.Children.count(children) === 0) && (
          <div className="flex-1"></div>
        )}

        {/* Bottom Control Bar */}
        <div className="px-6 py-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-6">
            {/* <TooltipToggle 
              isEnabled={isTooltipEnabled}
              onToggle={handleTooltipToggle}
            /> */}
            <button 
              onClick={handleTableView}
              className="flex bg-white px-4 py-2 rounded-3xl hover:bg-gray-50 items-center space-x-2 transition-colors"
            >
              <Table className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Table View</span>
            </button>
            <DatePicker 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
          
        </div>
      </main>
      
      {/* Feedback Button - Floating above map controls */}
      <div className="absolute bottom-52 right-4 pointer-events-auto z-10">
        <button 
          onClick={handleFeedback}
          className="flex items-center space-x-2 px-4 py-2 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center -space-x-5">
            <MessageCircle className="w-4 h-4 text-gray-600 -rotate-90 mt-1 z-10" />
            <MessageCircle className="w-4 h-4 text-gray-600 rotate-6 fill-white z-20" />
          </div>
          <span className="text-sm text-gray-700 ml-6">Feedback</span>
        </button>
      </div>
      
      {/* Filter Panel */}
        <FilterPanel 
          isOpen={isFilterPanelOpen} 
          onClose={handleFilterPanel} 
        />
      
      {/* Table View Modal */}
      <TableViewModal 
        isOpen={isTableViewOpen} 
        onClose={handleTableView} 
      />
      
      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={handleFeedback} 
      />
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
}

export default Layout;