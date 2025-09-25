import { useState } from 'react';

export const useSidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredcrown, setHoveredcrown] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailPanelPosition, setDetailPanelPosition] = useState({ top: 0, left: 0 });
  const [selectedDataPoint, setSelectedDataPoint] = useState('population'); // Default to Population
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemClick = (item) => {
    // If it's a data point item, update selected data point
    if (item.id && item.label) {
      setSelectedDataPoint(item.id);
    } else {
      // If it's a section, toggle expansion
      setActiveItem(activeItem === item ? null : item);
    }
  };

  const handleSubItemClick = (subItem, buttonPosition = null) => {
    setSelectedDetailItem(subItem);
    if (buttonPosition) {
      setDetailPanelPosition(buttonPosition);
    }
  };

  const handleCloseDetail = () => {
    setSelectedDetailItem(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return {
    // State
    activeItem,
    hoveredItem,
    hoveredcrown,
    selectedDetailItem,
    detailPanelPosition,
    selectedDataPoint,
    searchQuery,
    
    // Setters
    setHoveredItem,
    setHoveredcrown,
    
    // Handlers
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
    handleSearchChange
  };
};