import React, { useState } from 'react';
import { X, Home, TrendingUp, BarChart3, DollarSign, Users, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { dataSections } from '../../data/sidebarData';
import { motion } from 'framer-motion';

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
    <motion.div
        initial={{ opacity: 0, y: "100%" }}   // hidden below screen
        animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed w-[76%] h-[85%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-gray-200 shadow-2xl rounded-t-2xl"
        >
    {/* <div className="fixed w-[76%] top-[10%] right-5 flex items-center justify-center z-50 p-4"> */}
      <div className=" w-full h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
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
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div className="space-y-4 pb-8">
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
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                      {section.items.map((point) => (
                        <div
                          key={point.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors mb-2"
                        >
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2 flex items-center space-x-2">
                              <span>{point.label}</span>
                              {point.isPremium && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            {point.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${point.isPremium ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                              <span className="text-xs text-gray-500">
                                {point.isPremium ? 'Premium Feature' : 'Free Feature'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Source: <span className="font-medium text-blue-600">{point.source}</span>
                            </div>
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
    {/* </div> */}
    </motion.div>
  );
};

export default ExploreDataPointsModal;