import { useState } from 'react';

export const useSidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  const handleSubItemClick = (subItem) => {
    setSelectedDetailItem(subItem);
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