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
  setHoveredItem
}) => {
  return (
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={() => onItemClick(section.id)}
        className="w-full flex items-center justify-between text-left py-2 rounded-lg px-2"
      >
        <span className="font-semibold text-blue uppercase text-xs tracking-wide">
          {section.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-blue transform transition-transform ${activeItem === section.id ? 'rotate-180' : ''}`} />
      </button>

      {/* Section Items */}
      {activeItem === section.id && section.items.length > 0 && (
        <div className="space-y-1 ml-2">
          {section.items.map((item) => (
            <DataPointItem
              key={item.id}
              item={{...item, isSelected: selectedDataPoint === item.id}}
              onItemClick={onItemClick}
              onInfoClick={onInfoClick}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DataSection;