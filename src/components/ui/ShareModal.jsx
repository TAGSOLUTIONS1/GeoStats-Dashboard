import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';

const ShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('https://map.reventure.app/dashboard?geo=zij');

  useEffect(() => {
    if (isOpen) {
      // Generate a unique share URL based on current state
      const currentUrl = window.location.href;
      setShareUrl(currentUrl);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-black mb-2">Share</h2>
        
        {/* Subtitle */}
        <p className="text-gray-700 mb-6">Share with your friends</p>
        
        {/* URL Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-azure"
          />
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${
              copied 
                ? 'bg-green-600 text-white' 
                : 'bg-azure text-white hover:bg-azure-dark'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;