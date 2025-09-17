import React, { useState } from 'react';
import { Search, Filter, LogIn, Share2, Table, MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import FilterPanel from '../ui/FilterPanel';
import TableViewModal from '../ui/TableViewModal';
import DatePicker from '../ui/DatePicker';
import TooltipToggle from '../ui/TooltipToggle';
import FeedbackModal from '../ui/FeedbackModal';
import ShareModal from '../ui/ShareModal';
import Map from '../ui/Map';

const Layout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('State');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Jul 2025');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
        <div className="bg-white/95 mt-4 mx-6 border-b border-gray-200 px-6 py-2 flex justify-between pointer-events-auto">
            
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
                  <Filter className="w-5 h-5 text-gray-600" />
                  <p>Filter</p>
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Sign up
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1">
                  <LogIn className="w-4 h-4" />
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
            <TooltipToggle 
              isEnabled={isTooltipEnabled}
              onToggle={handleTooltipToggle}
            />
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
      <div className="absolute bottom-20 right-4 pointer-events-auto z-30">
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
};

export default Layout;