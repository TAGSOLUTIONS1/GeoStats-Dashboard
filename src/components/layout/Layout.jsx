import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, LogIn, Share2, Table, MessageCircle, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import FilterPanel from '../ui/FilterPanel';
import TableViewModal from '../ui/TableViewModal';
import DatePicker from '../ui/DatePicker';
import TooltipToggle from '../ui/TooltipToggle';
import FeedbackModal from '../ui/FeedbackModal';
import ShareModal from '../ui/ShareModal';
import Map from '../ui/Map';
import GraphModal from '../ui/GraphModal';

const Layout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Emirate');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Jul 2025');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [graphPlace, setGraphPlace] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchTimeoutRef = useRef(null);

  const filterOptions = ['Emirate', 'City', 'Community'];

  useEffect(() => {
    const onPlaceSelected = (e) => {
      const { placeName } = e.detail || {};
      setGraphPlace(placeName || 'Selected Area');
      setIsGraphOpen(true);
    };
    window.addEventListener('map:placeSelected', onPlaceSelected);
    return () => window.removeEventListener('map:placeSelected', onPlaceSelected);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.hamburger-menu')) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
    
    const coordinates = feature.center || feature.geometry.coordinates;
    
    if (window.map) {
      // Fly to location
      window.map.flyTo({
        center: coordinates,
        zoom: 15,
        essential: true,
        duration: 2000
      });

      // Highlight the location
      window.highlightSearchResult(coordinates);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`sidebar-container fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="relative">
          <Sidebar />
          {/* Close button for mobile sidebar */}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Background Map - Fixed behind main content only */}
      <div className="absolute left-0 right-0 top-0 bottom-0">
        <Map />
      </div>
      
      <main className="flex-1 relative z-20 flex flex-col pointer-events-none">
        {/* Top Header */}
        <div className="bg-white/95 mt-4 mx-2 sm:mx-4 lg:mx-6 border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-2 flex justify-between pointer-events-auto items-center rounded-lg">
          {/* Left side with hamburger and search */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
            {/* Hamburger Menu - Only visible on mobile */}
            <button
              onClick={toggleSidebar}
              className="hamburger-menu lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations in Dubai"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure w-full"
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
                      <p className="text-xs text-gray-500 truncate">{feature.place_name}</p>
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
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {/* Filter Options - Hidden on small screens, shown as horizontal on medium+ */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
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
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleFilterPanel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <p className="text-sm hidden sm:block">Filter</p>
              </button>
              <button className="px-2 sm:px-3 py-1.5 text-xs font-medium text-azure hover:text-azure-dark transition-colors hidden sm:block">
                Sign up
              </button>
              <button className="px-2 sm:px-3 py-1.5 bg-azure text-white text-xs font-medium rounded-lg hover:bg-azure-dark transition-colors flex items-center space-x-1">
                <LogIn className="w-3 h-3" />
                <span className="hidden sm:block">Login</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Filter Options - Show when filter options are hidden */}
        <div className="md:hidden bg-white/95 mx-2 sm:mx-4 mt-2 px-4 py-3 rounded-lg pointer-events-auto">
          <div className="flex flex-wrap gap-4">
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
        <div className="px-2 sm:px-4 lg:px-6 py-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            <button 
              onClick={handleTableView}
              className="flex bg-white px-3 sm:px-4 py-2 rounded-3xl hover:bg-gray-50 items-center space-x-2 transition-colors"
            >
              <Table className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 hidden sm:block">Table View</span>
            </button>
            <div className="hidden sm:block">
              <DatePicker 
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
          </div>
          
          {/* Mobile Date Picker */}
          <div className="sm:hidden">
            <DatePicker 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </main>
      
      {/* Feedback Button - Floating above map controls */}
      <div className="absolute bottom-52 right-2 sm:right-4 pointer-events-auto z-10">
        <button 
          onClick={handleFeedback}
          className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center -space-x-5">
            <MessageCircle className="w-4 h-4 text-gray-600 -rotate-90 mt-1 z-10" />
            <MessageCircle className="w-4 h-4 text-gray-600 rotate-6 fill-white z-20" />
          </div>
          <span className="text-sm text-gray-700 ml-6 hidden sm:block">Feedback</span>
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
      
      {/* Graph Modal (opens on map click) */}
      <GraphModal 
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        placeName={graphPlace}
      />
    </div>
  );
}

export default Layout;