import React, { useState } from 'react';
import { X, Home, TrendingUp, BarChart3, DollarSign, Users, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { dataSections } from '../../data/sidebarData';

const ExploreDataPointsModal = ({ isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    'popular-data': true,
    'home-price-affordability': false,
    'market-trends': false,
    'demographic': false,
    'investor-metrics': false
  });

  if (!isOpen) return null;

  const iconMap = {
    Home,
    TrendingUp,
    BarChart3,
    DollarSign,
    Users,
    Crown
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || BarChart3;
    return <IconComponent className="w-5 h-5" />;
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="fixed w-[76%] top-[10%] right-5 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Data Points</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {dataSections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
                  {expandedSections[section.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Section Content */}
                {expandedSections[section.id] && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.items.map((point) => (
                        <div
                          key={point.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                {getIcon(point.icon)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                  <span>{point.label}</span>
                                  {point.isPremium && (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  )}
                                </h4>
                                {point.isSelected && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Selected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {point.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${point.isPremium ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                              <span className="text-xs text-gray-500">
                                {point.isPremium ? 'Premium Feature' : 'Free Feature'}
                              </span>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">Learn More</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreDataPointsModal;