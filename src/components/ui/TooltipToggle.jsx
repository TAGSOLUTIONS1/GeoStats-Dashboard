import React from 'react';
import { motion } from 'framer-motion';

const TooltipToggle = ({ isEnabled, onToggle, className = '' }) => {
  return (
    <div
      className={`flex items-center space-x-2 bg-white px-4 py-2 rounded-3xl hover:bg-gray-50 ${className}`}
    >
      <span className="text-sm text-gray-700">Tooltip</span>
      <button
        onClick={onToggle} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-300 ${
          isEnabled ? 'bg-azure' : 'bg-gray-300'
        }`}
      >
        <motion.span
          layout
          className="inline-block h-3 w-3 rounded-full bg-white shadow-md"
          animate={{ x: isEnabled ? 18 : 3 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      </button>
    </div>
  );
};

export default TooltipToggle;
