import React, { useState } from 'react';
import Map from '../components/ui/Map';

const MapPage = () => {
  const [filter, setFilter] = useState('Area');

  const filters = [
    { id: 'Emirates', label: 'Emirates' },
    { id: 'Area', label: 'Area' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-dubai-gray-50 to-dubai-blue-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-dubai-gray-500 font-semibold">Interactive Map</p>
              <h1 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mt-2">
                Dubai Communities Map
              </h1>
              <p className="text-lg text-dubai-gray-600 mt-3 max-w-3xl">
                Explore the original GeoStats map dashboard for Dubai. Visualize population density and area data across communities.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {filters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    filter === item.id
                      ? 'bg-dubai-blue text-white border-dubai-blue'
                      : 'bg-white text-dubai-gray-700 border-dubai-gray-300 hover:border-dubai-blue'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[700px] rounded-2xl overflow-hidden shadow-lg border border-dubai-gray-200">
            <Map selectedFilter={filter} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default MapPage;
