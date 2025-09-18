import React, { useState } from 'react';
import { X, Crown, ChevronDown, ChevronUp, Sparkles, TrendingUp, BarChart3, Users, Home, DollarSign, Star, Zap } from 'lucide-react';
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Icon mapping for sections
  const sectionIcons = {
    'popular-data': Sparkles,
    'home-price-affordability': Home,
    'market-trends': TrendingUp,
    'demographic': Users,
    'investor-metrics': BarChart3
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={isOpen ? { opacity: 1, y: "0%" } : { opacity: 1, y: "100%" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed w-[78%] h-[87%] bottom-0 right-5 flex items-center justify-center z-50 p-4 bg-white border border-azure-200 shadow-2xl rounded-t-2xl backdrop-blur-sm"
    >
      <div className="w-full h-full flex flex-col">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue via-blue-light to-azure p-4 rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue/90 to-azure/90 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-inter">Explore Data Points</h2>
                <p className="text-white text-xs font-inter">Discover comprehensive real estate insights</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm group"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-transparent to-blue-50/30">
          <div className="space-y-4 pb-6">
            {dataSections.map((section, index) => {
              const IconComponent = sectionIcons[section.id] || BarChart3;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm border border-azure-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue/5 via-azure/5 to-orange/5 hover:from-blue/10 hover:via-azure/10 hover:to-orange/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue to-azure rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-blue font-inter group-hover:text-azure transition-colors">
                          {section.label}
                        </h3>
                        <p className="text-xs text-blue/70 font-inter">
                          {section.items.length} data points available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="px-2 py-1 bg-azure/10 rounded-full">
                        <span className="text-xs font-semibold text-azure font-inter">
                          {section.items.filter(item => item.isPremium).length} Premium
                        </span>
                      </div>
                      {expandedSections[section.id] ? (
                        <ChevronUp className="w-5 h-5 text-azure group-hover:scale-110 transition-transform" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Section Content */}
                  {expandedSections[section.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-gradient-to-br from-white/50 to-blue-50/30"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {section.items.map((point, pointIndex) => (
                          <motion.div
                            key={point.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: pointIndex * 0.05 }}
                            className="group bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-azure-200 hover:border-azure hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                          >
                            {/* Header with icon and premium badge */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-gradient-to-br from-blue/10 to-azure/10 rounded-md group-hover:from-blue/20 group-hover:to-azure/20 transition-all duration-200">
                                  <Zap className="w-4 h-4 text-azure" />
                                </div>
                                <h4 className="font-bold text-blue text-sm font-inter group-hover:text-azure transition-colors">
                                  {point.label}
                                </h4>
                              </div>
                              {point.isPremium && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-orange to-orange-light rounded-full shadow-lg">
                                  <Crown className="w-3 h-3 text-white" />
                                  <span className="text-xs font-bold text-white font-inter">Premium</span>
                                </div>
                              )}
                            </div>

                            {/* Description - flex-grow to take available space */}
                            <p className="text-blue/80 text-xs leading-relaxed mb-3 font-inter flex-grow">
                              {point.description}
                            </p>

                            {/* Footer with status and source - always at bottom */}
                            <div className="flex items-center justify-between pt-3 border-t border-azure-100 mt-auto">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full shadow-sm ${point.isPremium ? 'bg-gradient-to-r from-orange to-orange-light' : 'bg-gradient-to-r from-azure to-azure-light'}`}></div>
                                <span className="text-xs font-semibold text-blue/70 font-inter">
                                  {point.isPremium ? 'Premium Feature' : 'Free Feature'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-azure" />
                                <span className="text-xs font-medium text-azure font-inter">
                                  {point.source}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExploreDataPointsModal;