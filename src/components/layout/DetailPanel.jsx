import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const DetailPanel = ({ selectedItem, position, onClose }) => {
  const panelRef = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (selectedItem) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedItem, onClose]);

  if (!selectedItem) return null;

  const renderContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{selectedItem.label}</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-gray-300 text-xs leading-relaxed">
            {selectedItem.description}
          </p>
          
          {selectedItem.id === 'for-sale-inventory' && (
            <div className="space-y-2">
              {/* <p className="text-gray-300 text-xs">
                <strong className="text-white">Source:</strong> Geostats
              </p> */}
              <p className="text-gray-300 text-xs">
                <strong className="text-white">Note:</strong> For Sale Inventory excludes listings that are pending.
              </p>
            </div>
          )}
          
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('modal:open', { detail: 'explore' }));
              onClose(); // Close the detail panel when opening the explore modal
            }}
            className="flex items-center space-x-2 text-azure hover:text-azure-light text-xs transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Learn more about this data point</span>
          </button>
        </div>
      </div>
    );
  };

  // Calculate responsive positioning
  const getResponsivePosition = () => {
    const viewportWidth = windowSize.width;
    const viewportHeight = windowSize.height;
    const panelWidth = viewportWidth < 640 ? Math.min(320, viewportWidth - 32) : 320; // sm: 320px, mobile: min(320, screen-32)
    const panelHeight = 200; // Estimated height
    const margin = 24; // Safe margin from edges
    const bottomMargin = 100; // Extra margin from bottom
    
    let left = position.left + 10;
    let top = position.top;
    let transform = 'translateY(-50%)';
    let arrowPosition = 'left-0 -translate-x-1/2';
    
    // Check if panel would go off the right edge
    if (left + panelWidth > viewportWidth - margin) {
      left = position.left - panelWidth - 10; // Position to the left
      arrowPosition = 'right-0 translate-x-1/2';
    }
    
    // Check if panel would go off the bottom edge (more aggressive check)
    const bottomSpace = viewportHeight - position.top;
    const topSpace = position.top;
    
    // If there's more space above, position above the click point
    if (topSpace > bottomSpace && topSpace > panelHeight + margin) {
      top = position.top - panelHeight/2 - 10; // Position above
      transform = 'translateY(-50%)';
    }
    // If there's more space below, position below the click point
    else if (bottomSpace > panelHeight + bottomMargin) {
      top = position.top + panelHeight/2 + 10; // Position below
      transform = 'translateY(0)';
    }
    // If neither has enough space, position to fit within viewport
    else {
      if (topSpace < bottomSpace) {
        // Position at bottom of screen with extra margin
        top = viewportHeight - panelHeight - bottomMargin;
        transform = 'translateY(0)';
      } else {
        // Position at top of screen with margin
        top = margin;
        transform = 'translateY(0)';
      }
    }
    
    // Check if panel would go off the top edge
    if (top < margin) {
      top = margin;
      transform = 'translateY(0)';
    }
    
    // Final safety check - ensure panel never goes off bottom
    const finalBottomPosition = top + panelHeight;
    if (finalBottomPosition > viewportHeight - bottomMargin) {
      top = viewportHeight - panelHeight - bottomMargin;
      transform = 'translateY(0)';
    }
    
    // On very small screens, center the panel
    if (viewportWidth < 480) {
      left = Math.max(margin, (viewportWidth - panelWidth) / 2);
      top = Math.max(margin, Math.min(viewportHeight - panelHeight - bottomMargin, position.top));
      transform = 'translateY(0)';
      arrowPosition = 'hidden'; // Hide arrow on very small screens
    }
    
    return { left, top, transform, arrowPosition };
  };

  const { left, top, transform, arrowPosition } = getResponsivePosition();

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: transform,
      }}
    >
      <div 
        ref={panelRef} 
        className={`bg-gray-900 rounded-lg shadow-xl border border-gray-700 pointer-events-auto ${
          windowSize.width < 640 
            ? `w-80 max-w-[calc(100vw-2rem)]` 
            : 'max-w-md w-80'
        }`}
      >
        <div className="p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>
      <div 
        className={`absolute w-4 h-4 bg-gray-900 rotate-45 ${arrowPosition}`}
        style={{ 
          top: transform.includes('-100%') ? '100%' : transform.includes('translateY(0)') ? '0%' : '50%'
        }}
      />
    </div>
  );
};

export default DetailPanel;