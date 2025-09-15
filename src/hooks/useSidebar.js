import { useState } from 'react';

export const useSidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailPanelPosition, setDetailPanelPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? null : itemId);
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
    selectedDetailItem,
    detailPanelPosition,
    searchQuery,
    
    // Setters
    setHoveredItem,
    
    // Handlers
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
    handleSearchChange
  };
};