import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Search, Crown } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { dataSections } from '../../data/sidebarData';
import SidebarSearch from './SidebarSearch';
import DataSection from './DataSection';
import DetailPanel from './DetailPanel';
import ExploreDataPointsModal from '../ui/ExploreDataPointsModal';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('demographics');
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredcrown, setHoveredcrown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState(dataSections);

  // Filter data points based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(dataSections);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = dataSections.map(section => {
      const filteredItems = section.items.filter(item => 
        item.label.toLowerCase().includes(query)
      );
      
      return {
        ...section,
        items: filteredItems
      };
    }).filter(section => section.items.length > 0);

    setFilteredSections(filtered);

    // Auto-expand sections that have matching items
    if (filtered.length > 0 && !filtered.find(s => s.id === activeItem)) {
      setActiveItem(filtered[0].id);
    }
  }, [searchQuery]);

  const handleItemClick = (itemOrId) => {
    if (typeof itemOrId === 'string') {
      setActiveItem(activeItem === itemOrId ? null : itemOrId);
    } else {
      if (!itemOrId.isPremium) {
        setSelectedDataPoint(itemOrId.id);
      }
    }
  };

  const handleInfoClick = (item, position) => {
    console.log('Info clicked for:', item);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
        <div className="w-72 bg-gray-100 text-blue h-screen flex flex-col relative z-20 overflow-visible">
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/logo/geo_stats.png" alt="Logo" className="w-auto h-10" />
          </div>
          <h1 className="text-2xl font-semibold text-orange font-tomorrow">GeoStats</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="SEARCH DATA POINTS"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-1.5 text-sm bg-white border border-gray-400 rounded-lg text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Data Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <DataSection
            key={section.id}
            section={section}
            activeItem={activeItem}
            selectedDataPoint={selectedDataPoint}
            onItemClick={handleItemClick}
            onInfoClick={handleSubItemClick}
            hoveredItem={hoveredItem}
            hoveredcrown={hoveredcrown}
            setHoveredItem={setHoveredItem}
            setHoveredcrown={setHoveredcrown}
          />
          ))
        ) : (
          <div className="text-center text-gray-500 text-sm py-4">
            No data points found matching "{searchQuery}"
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-300">
        <button
          // onClick={() => setIsExploreModalOpen(true)}
            onClick={() => window.dispatchEvent(new CustomEvent('modal:open', { detail: 'explore' }))}
            className="w-full flex items-center justify-between p-3 bg-azure text-white rounded-lg hover:bg-azure-dark transition-colors group"
        >
          <span className="font-medium">Explore Data Points</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
        selectedItem={selectedDetailItem} 
        position={detailPanelPosition}
        onClose={handleCloseDetail} 
      />
    </div>
  );
};

export default Sidebar;