import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TooltipToggle = ({ isEnabled, onToggle, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-700">Tooltip</span>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isEnabled ? 'bg-red-600' : 'bg-gray-200'
        }`}
      >
        <motion.span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform`}
          animate={{
            x: isEnabled ? 20 : 4,
          }}
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