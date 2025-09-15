import React from 'react';
import Layout from './components/layout/Layout';
import './App.css';

function App() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to GeoStats</h1>
          <p className="mt-2 text-gray-600">Your comprehensive geographic data analytics platform</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <p className="text-gray-600">View your dashboard from the sidebar to see detailed analytics and statistics.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Geo Data</h3>
            <p className="text-gray-600">Explore location data and regional statistics using the Geo Stats section.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">Configure your preferences and manage your account settings.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
