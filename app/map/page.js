'use client';

import dynamic from 'next/dynamic';

// Dynamically import Layout2 with no SSR (contains heavy map components)
const Layout2 = dynamic(() => import('@/components/layout/Layout'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <Layout2 />;
}

