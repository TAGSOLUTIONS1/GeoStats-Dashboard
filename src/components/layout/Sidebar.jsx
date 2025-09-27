import React, { useState, useEffect } from 'react';
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
    hoveredcrown,
    selectedDetailItem,
    detailPanelPosition,
    selectedDataPoint,
    searchQuery,
    setHoveredItem,
    setHoveredcrown,
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
    handleSearchChange
  } = useSidebar();

  // Expose currently selected data point for other components (e.g., Map hover tooltip)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.selectedDataPoint = selectedDataPoint;
    }
  }, [selectedDataPoint]);

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
            hoveredcrown={hoveredcrown}
            setHoveredItem={setHoveredItem}
            setHoveredcrown={setHoveredcrown}
          />
        ))}
      </div>

      {/* Explore Data Points Link */}
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