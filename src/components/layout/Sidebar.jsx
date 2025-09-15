import React, { useState } from 'react';
import DetailPanel from './DetailPanel';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      subItems: [
        { id: 'overview', label: 'Overview', description: 'View overall statistics and key metrics' },
        { id: 'analytics', label: 'Analytics', description: 'Detailed analytics and performance data' },
        { id: 'reports', label: 'Reports', description: 'Generate and view custom reports' }
      ]
    },
    {
      id: 'geostats',
      label: 'Geo Stats',
      icon: '🌍',
      subItems: [
        { id: 'locations', label: 'Locations', description: 'Manage and view location data' },
        { id: 'regions', label: 'Regions', description: 'Regional statistics and analysis' },
        { id: 'mapping', label: 'Mapping', description: 'Interactive maps and visualizations' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      subItems: [
        { id: 'profile', label: 'Profile', description: 'Manage your profile and preferences' },
        { id: 'notifications', label: 'Notifications', description: 'Configure notification settings' },
        { id: 'security', label: 'Security', description: 'Security and privacy settings' }
      ]
    }
  ];

  const handleItemClick = (itemId) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  const handleSubItemClick = (subItem) => {
    setSelectedDetailItem(subItem);
  };

  const handleCloseDetail = () => {
    setSelectedDetailItem(null);
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">GeoStats</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {sidebarItems.map((item) => (
          <div key={item.id} className="mb-2">
            {/* Main Item */}
            <button
              onClick={() => handleItemClick(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              <span className={`transform transition-transform ${activeItem === item.id ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>

            {/* Sub Items */}
            {activeItem === item.id && (
              <div className="ml-6 mt-2 space-y-1">
                {item.subItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubItemClick(subItem)}
                    onMouseEnter={() => setHoveredItem(subItem.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="w-full text-left p-2 rounded hover:bg-gray-800 transition-colors relative group"
                  >
                    <span className="text-sm text-gray-300">{subItem.label}</span>
                    
                    {/* Hover Tooltip */}
                    {hoveredItem === subItem.id && (
                      <div className="absolute left-full ml-2 top-0 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 w-48">
                        {subItem.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Version 1.0.0
        </div>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
        selectedItem={selectedDetailItem} 
        onClose={handleCloseDetail} 
      />
    </div>
  );
};

export default Sidebar;