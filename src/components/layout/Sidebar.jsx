import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { dataSections } from '../../data/sidebarData';
import SidebarSearch from './SidebarSearch';
import DataSection from './DataSection';
import DetailPanel from './DetailPanel';

const Sidebar = () => {
  const {
    activeItem,
    hoveredItem,
    selectedDetailItem,
    detailPanelPosition,
    searchQuery,
    setHoveredItem,
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
    handleSearchChange
  } = useSidebar();

  return (
    <div className="w-80 bg-gray-100 text-black h-screen flex flex-col relative overflow-visible">
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
            onItemClick={handleItemClick}
            onInfoClick={handleSubItemClick}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
          />
        ))}
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