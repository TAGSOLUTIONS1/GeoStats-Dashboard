import React, { useRef, useEffect, useState } from 'react';
import { Info, Crown } from 'lucide-react';

const DataPointItem = ({ 
  item, 
  onItemClick, 
  onInfoClick, 
  hoveredItem, 
  setHoveredItem 
}) => {
  const infoButtonRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (hoveredItem === item.id && infoButtonRef.current) {
      const rect = infoButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right - 110
      });
    }
  }, [hoveredItem, item.id]);

  return (
    <div className="relative">
      <button
        onClick={() => onItemClick(item)}
        className="w-full flex items-center justify-between p-2 rounded-lg transition-colors group hover:bg-gray-200"
      >
        <div className="flex items-center text-left space-x-3">
          <input
            type="radio"
            name="dataPoint"
            value={item.id}
            checked={item.isSelected}
            onChange={() => onItemClick(item)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm text-black">{item.label}</span>
        </div>
        <div className="flex items-center space-x-2 relative">
          {item.isPremium && (
            <span className="text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded">New</span>
          )}
          <div className="relative flex items-center space-x-2">
          {item.isPremium && (
            <Crown className="w-3 h-3 text-yellow-400" />
          )}
            <button
              ref={infoButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                const rect = infoButtonRef.current.getBoundingClientRect();
                const position = {
                  top: rect.top + window.scrollY,
                  left: rect.right + window.scrollX + 10
                };
                onInfoClick(item, position);
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="p-1 rounded relative"
            >
              <Info className="w-4 h-4 text-gray-900 fill-[#ACACAC] rounded-full" />
            </button>

             {/* Tooltip */}
             {hoveredItem === item.id && (
              <div 
                className="fixed bg-black opacity-80 text-white text-sm px-2 py-2 rounded shadow-lg 
                          whitespace-nowrap z-[9999] pointer-events-none"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: 'translateY(-190%)'
                }}
              >
                Click the icon to learn more

                {/* Arrow */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"
                  style={{ top: '90%' }} 
                />
              </div>
            )}

          </div>
        </div>
      </button>
    </div>
  );
};

export default DataPointItem;
