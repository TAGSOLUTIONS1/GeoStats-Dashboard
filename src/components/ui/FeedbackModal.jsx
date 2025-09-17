import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const FeedbackModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle feedback submission here
    console.log('Feedback submitted:', { email, feedback });
    // Reset form
    setEmail('');
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send us your feedback</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Email Input */}
          <div className="mb-4">
            {/* <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your email
            </label> */}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          {/* Feedback Textarea */}
          <div className="mb-4">
            {/* <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Your feedback
            </label> */}
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure focus:border-transparent resize-none"
              placeholder="Please leave feedback related to your experience on GeoStats App."
              required
            />
          </div>

          {/* Instruction Text */}
          <p className="text-sm text-gray-600 mb-6">
            If you would like a response to your feedback, please leave your email.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Feedback</span>
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;