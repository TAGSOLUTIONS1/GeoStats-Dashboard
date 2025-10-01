// Utility functions for sidebar operations

export const filterDataPoints = (dataPoints, searchQuery) => {
  if (!searchQuery.trim()) return dataPoints;
  
  return dataPoints.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

export const getSelectedDataPoint = (dataPoints) => {
  return dataPoints.find(item => item.isSelected);
};

export const toggleDataPointSelection = (dataPoints, selectedId) => {
  return dataPoints.map(item => ({
    ...item,
    isSelected: item.id === selectedId
  }));
};

export const getDataPointById = (dataPoints, id) => {
  return dataPoints.find(item => item.id === id);
};

export const formatDataPointDescription = (item) => {
  const baseDescription = item.description;
  
  if (item.id === 'for-sale-inventory') {
    return {
      ...item,
      source: 'https://www.geostats.ai',
      note: 'For Sale Inventory excludes listings that are pending.'
    };
  }
  
  if (item.id === 'home-value') {
    return {
      ...item,
      dataRange: '$208,652 - $6,025,408',
      updateFrequency: 'Monthly'
    };
  }
  
  return item;
};