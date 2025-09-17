import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { dataSections } from '../../data/sidebarData';
import SidebarSearch from './SidebarSearch';
import DataSection from './DataSection';
import DetailPanel from './DetailPanel';
import ExploreDataPointsModal from '../ui/ExploreDataPointsModal';

const Sidebar = () => {
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  
  const {
    activeItem,
    hoveredItem,
    selectedDetailItem,
    detailPanelPosition,
    selectedDataPoint,
    searchQuery,
    setHoveredItem,
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
    handleSearchChange
  } = useSidebar();

  return (
    <div className="w-80 bg-gray-100 text-black h-screen flex flex-col relative z-20 overflow-visible">
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">G</span>
          </div>
          <h1 className="text-xl font-bold text-black">GeoStats</h1>
        </div>
      </div>

      {/* Search Bar */}
      <SidebarSearch 
        searchQuery={searchQuery} 
        onSearchChange={handleSearchChange} 
      />

      {/* Data Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {dataSections.map((section) => (
          <DataSection
            key={section.id}
            section={section}
            activeItem={activeItem}
            selectedDataPoint={selectedDataPoint}
            onItemClick={handleItemClick}
            onInfoClick={handleSubItemClick}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
          />
        ))}
      </div>

      {/* Explore Data Points Link */}
      <div className="p-4 border-t border-gray-300">
        <button
          onClick={() => setIsExploreModalOpen(true)}
          className="w-full flex items-center justify-between p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
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

      {/* Explore Data Points Modal */}
      <ExploreDataPointsModal
        isOpen={isExploreModalOpen}
        onClose={() => setIsExploreModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;