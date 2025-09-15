import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

const DetailPanel = ({ selectedItem, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (selectedItem) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedItem, onClose]);

  if (!selectedItem) return null;

  const renderContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{selectedItem.label}</h2>
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
          <p className="text-gray-300 text-sm leading-relaxed">
            {selectedItem.description}
          </p>
          
          {selectedItem.id === 'for-sale-inventory' && (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Source:</strong> Realtor.com
              </p>
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Note:</strong> For Sale Inventory excludes listings that are pending.
              </p>
            </div>
          )}
          
          {selectedItem.id === 'home-value' && (
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Data Range:</strong> $208,652 - $6,025,408
              </p>
              <p className="text-gray-300 text-sm">
                <strong className="text-white">Update Frequency:</strong> Monthly
              </p>
            </div>
          )}
          
          {selectedItem.isPremium && (
            <div className="bg-yellow-400 bg-opacity-20 border border-yellow-400 border-opacity-30 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                <strong>Premium Feature:</strong> This data point requires a premium subscription to access detailed analytics and historical data.
              </p>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span>Learn more about this data point</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute left-[300px] z-50 p-4 w-full">
    <div ref={panelRef} className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  </div>
  );
};

export default DetailPanel;