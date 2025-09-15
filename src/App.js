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
      </div>
    </Layout>
  );
}

export default App;
