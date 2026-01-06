'use client';

import React, { memo } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

const Layout = memo(({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
