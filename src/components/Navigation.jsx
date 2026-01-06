'use client';

import React, { useState, memo, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, MapPin } from 'lucide-react';

const Navigation = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => pathname === path;

  // Handle instant navigation with transition
  const handleClick = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/map', label: 'Map' },
    { path: '/b2c', label: 'For People & Businesses' },
    { path: '/b2g', label: 'For Government' },
    { path: '/use-cases', label: 'Use Cases' },
    { path: '/about', label: 'About' },
    { path: '/faq', label: 'FAQ' },
  ];

  return (
    <nav className="bg-white border-b border-dubai-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" prefetch={false} className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/logo/geo_stats.png" alt="Logo" className="w-auto h-10" />
              </div>
              <h1 className="text-2xl font-semibold text-orange font-tomorrow">GeoStats</h1>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                prefetch={false}
                onClick={(e) => handleClick(e, link.path)}
                className={`text-base font-medium transition-colors whitespace-nowrap ${
                  isActive(link.path)
                    ? 'text-dubai-blue border-b-2 border-dubai-blue pb-1'
                    : 'text-dubai-gray-600 hover:text-dubai-blue'
                } ${isPending ? 'opacity-70' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <Link
              href="/contact"
              prefetch={false}
              onClick={(e) => handleClick(e, '/contact')}
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
                href={link.path}
                prefetch={false}
                onClick={(e) => {
                  setIsOpen(false);
                  handleClick(e, link.path);
                }}
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
              href="/contact"
              prefetch={false}
              onClick={(e) => {
                setIsOpen(false);
                handleClick(e, '/contact');
              }}
              className="block px-3 py-2 rounded-lg text-base font-medium bg-dubai-blue text-white text-center"
            >
              Become a Data Partner
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
