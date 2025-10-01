import { useState } from 'react';

export const useSidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredcrown, setHoveredcrown] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailPanelPosition, setDetailPanelPosition] = useState({ top: 0, left: 0 });
  const [selectedDataPoint, setSelectedDataPoint] = useState('population');
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemClick = (item) => {
    if (item.id && item.label) {
      setSelectedDataPoint(item.id);
    } else {
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
    setActiveItem,
    setHoveredItem,
    setHoveredcrown,
    setSearchQuery,

    // Handlers
    handleItemClick,
    handleSubItemClick,
    handleCloseDetail,
  };
};
