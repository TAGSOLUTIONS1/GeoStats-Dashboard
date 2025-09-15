import React from 'react';

const DetailPanel = ({ selectedItem, onClose }) => {
  if (!selectedItem) return null;

  const renderContent = () => {
    switch (selectedItem.id) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Locations</h3>
                <p className="text-3xl font-bold text-blue-600">1,247</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Active Regions</h3>
                <p className="text-3xl font-bold text-green-600">23</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Data Points</h3>
                <p className="text-3xl font-bold text-purple-600">45,678</p>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Data Processing Speed</span>
                  <span className="text-green-600 font-semibold">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Response Time</span>
                  <span className="text-blue-600 font-semibold">245ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>System Uptime</span>
                  <span className="text-purple-600 font-semibold">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Locations</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">New York</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">City</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">California</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">State</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 hour ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Mapping</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Interactive Map Component</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{selectedItem.label}</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Detailed information for {selectedItem.label} will be displayed here.</p>
              <p className="text-sm text-gray-500 mt-2">{selectedItem.description}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h1 className="text-xl font-semibold">{selectedItem.label}</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;