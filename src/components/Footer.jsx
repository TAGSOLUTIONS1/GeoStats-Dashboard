'use client';
import React, { memo } from 'react';
import Link from 'next/link';
import { MapPin, Mail } from 'lucide-react';

const Footer = memo(() => {
  return (
    <footer className="bg-dubai-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-6 w-6 text-dubai-blue-light" />
              <span className="text-xl font-bold">GeoStats</span>
            </div>
            <p className="text-dubai-gray-300 mb-4 max-w-md">
              Understand Dubai. Decide Smarter. Population, income, mobility, and real-estate insights — explained simply.
            </p>
            <div className="flex items-center space-x-2 text-dubai-gray-400">
              <Mail className="h-4 w-4" />
              <a href="mailto:contact@tagsolutionsltd.com" className="hover:text-dubai-blue-light">
                contact@tagsolutionsltd.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/b2c" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  For People & Businesses
                </Link>
              </li>
              <li>
                <Link href="/b2g" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  For Government
                </Link>
              </li>
              <li>
                <Link href="/use-cases" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  About
                </Link>
              </li>
              <li>
                <Link href="/faq" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" prefetch={false} className="text-dubai-gray-300 hover:text-dubai-blue-light">
                  Become a Data Partner
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dubai-gray-800 mt-8 pt-8 text-center text-dubai-gray-400">
          <p>&copy; {new Date().getFullYear()} GeoStats. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
