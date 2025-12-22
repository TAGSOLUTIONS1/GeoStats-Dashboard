import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/map', label: 'Map' },
    { path: '/b2c', label: 'For People & Businesses' },
    { path: '/b2g', label: 'For Government' },
    { path: '/use-cases', label: 'Use Cases' },
    { path: '/about', label: 'About' },
  ];

  return (
    <nav className="bg-white border-b border-dubai-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <MapPin className="h-8 w-8 text-dubai-blue" />
            <span className="text-2xl font-bold text-dubai-gray-900">GeoStats</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base font-medium transition-colors whitespace-nowrap ${
                  isActive(link.path)
                    ? 'text-dubai-blue border-b-2 border-dubai-blue pb-1'
                    : 'text-dubai-gray-600 hover:text-dubai-blue'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <Link
              to="/contact"
              className="bg-dubai-blue text-white text-center w-40 px-6 py-2 rounded-lg font-medium hover:bg-dubai-blue-dark transition-colors"
            >
              Become a Data Partner
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-dubai-gray-600 hover:text-dubai-blue flex-shrink-0"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-dubai-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-dubai-blue text-white'
                    : 'text-dubai-gray-600 hover:bg-dubai-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium bg-dubai-blue text-white text-center"
            >
              Become a Data Partner
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
