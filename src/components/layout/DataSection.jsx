import React from 'react';
import { ChevronDown } from 'lucide-react';
import DataPointItem from './DataPointItem';

const DataSection = ({ 
  section, 
  activeItem, 
  selectedDataPoint,
  onItemClick, 
  onInfoClick, 
  hoveredItem, 
  hoveredcrown,
  setHoveredItem,
  setHoveredcrown
}) => {
  // Safety check: return null if section is invalid
  if (!section || !section.id) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={() => onItemClick(section.id)}
        className="w-full flex items-center justify-between text-left py-2 rounded-lg px-2"
      >
        <span className="font-semibold text-blue font-roboto uppercase text-xs tracking-wide">
          {section.label || ''}
        </span>
        <ChevronDown className={`w-4 h-4 text-blue transform transition-transform ${activeItem === section.id ? 'rotate-180' : ''}`} />
      </button>

      {/* Section Items */}
      {activeItem === section.id && section.items && Array.isArray(section.items) && section.items.length > 0 && (
        <div className="space-y-1">
          {section.items
            .filter(item => item && item.id) // Filter out undefined/null items
            .map((item) => (
              <DataPointItem
                key={item.id}
                item={{...item, isSelected: selectedDataPoint === item.id}}
                onItemClick={onItemClick}
                onInfoClick={onInfoClick}
                hoveredItem={hoveredItem}
                hoveredcrown={hoveredcrown}
                setHoveredItem={setHoveredItem}
                setHoveredcrown={setHoveredcrown}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default DataSection;