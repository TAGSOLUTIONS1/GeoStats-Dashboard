import React, { useRef, useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

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
            className=""
          />
          <span className="text-xs text-blue">{item.label}</span>
        </div>
        <div className="flex items-center space-x-2 relative">
          {item.isPremium && (
            <span className=" text-orange font-semibold font-hoefler text-sm py-0.5 rounded">New</span>
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
              className="relative info-icon"
            >
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-hoefler font-bold italic">i</span>
              </div>
            </button>

             {/* Tooltip */}
             {hoveredItem === item.id && (
              <div 
                className="fixed bg-black opacity-80 text-white text-xs px-2 py-1 rounded shadow-lg 
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
                  style={{ top: '80%' }} 
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
