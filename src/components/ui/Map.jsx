import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Global flag to prevent multiple map initializations
let mapInitialized = false;

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-98.5795);
  const [lat, setLat] = useState(39.8283);
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    // Set Mapbox access token
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    
    if (!token || token === 'your_mapbox_access_token_here') {
      console.error('Mapbox access token not found. Please add REACT_APP_MAPBOX_ACCESS_TOKEN to your .env file');
      console.log('Current token value:', token);
      return;
    }

    console.log('Mapbox token found:', token.substring(0, 20) + '...');
    mapboxgl.accessToken = token;

    if (map.current || mapInitialized) {
      console.log('Map already initialized, skipping...');
      return;
    }

    const initializeMap = () => {
      console.log('Initializing Mapbox map...');
      console.log('Container element:', mapContainer.current);
      console.log('Container dimensions:', {
        width: mapContainer.current?.offsetWidth,
        height: mapContainer.current?.offsetHeight
      });

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom
        });

        console.log('Mapbox map created:', map.current);
        mapInitialized = true; // Mark as initialized globally
        
        // Add event listeners to debug
        map.current.on('load', () => {
          console.log('Map loaded successfully!');
        });
        
        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });
        
        map.current.on('render', () => {
          console.log('Map is rendering...');
        });
        
      } catch (error) {
        console.error('Error creating Mapbox map:', error);
        return;
      }

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
      }), 'bottom-left');

      // Sample data points for demonstration
      const sampleDataPoints = [
        {
          coordinates: [-74.006, 40.7128],
          properties: {
            title: 'New York City',
            state: 'NY',
            dataPoint: 'For Sale Inventory',
            value: 1250
          }
        },
        {
          coordinates: [-87.6298, 41.8781],
          properties: {
            title: 'Chicago',
            state: 'IL',
            dataPoint: 'For Sale Inventory',
            value: 890
          }
        },
        {
          coordinates: [-122.4194, 37.7749],
          properties: {
            title: 'San Francisco',
            state: 'CA',
            dataPoint: 'For Sale Inventory',
            value: 2100
          }
        },
        {
          coordinates: [-96.7970, 32.7767],
          properties: {
            title: 'Dallas',
            state: 'TX',
            dataPoint: 'For Sale Inventory',
            value: 1560
          }
        },
        {
          coordinates: [-80.1918, 25.7617],
          properties: {
            title: 'Miami',
            state: 'FL',
            dataPoint: 'For Sale Inventory',
            value: 980
          }
        }
      ];

      // Add markers and data sources (only once)
      map.current.on('load', () => {
        // Check if data has already been added
        if (map.current._dataAdded) {
          console.log('Data already added, skipping...');
          return;
        }

        console.log('Adding markers and data sources...');
        
        // Add markers for data points
        sampleDataPoints.forEach(point => {
          // Create a popup
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${point.properties.title}, ${point.properties.state}</h3>
                <p class="text-sm text-gray-600">${point.properties.dataPoint}</p>
                <p class="text-lg font-bold text-red-600">${point.properties.value.toLocaleString()}</p>
                <button class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">
                  Click to see metro
                </button>
              </div>
            `);

          // Create a marker
          const marker = new mapboxgl.Marker({
            color: '#ef4444',
            scale: 1.2
          })
            .setLngLat(point.coordinates)
            .setPopup(popup)
            .addTo(map.current);
        });

        // Add a data source for visualization
        map.current.addSource('data-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: sampleDataPoints.map(point => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: point.coordinates
              },
              properties: point.properties
            }))
          }
        });

        // Add a layer for data visualization
        map.current.addLayer({
          id: 'data-points-layer',
          type: 'circle',
          source: 'data-points',
          paint: {
            'circle-radius': {
              'base': 1.75,
              'stops': [[12, 8], [22, 180]]
            },
            'circle-color': '#ef4444',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        // Mark that data has been added
        map.current._dataAdded = true;
        console.log('Data added successfully!');
      });

      // Update state when map moves
      map.current.on('move', () => {
        setLng(map.current.getCenter().lng.toFixed(4));
        setLat(map.current.getCenter().lat.toFixed(4));
        setZoom(map.current.getZoom().toFixed(2));
      });
    };

    // Wait for container to be ready with a small delay
    const initMap = () => {
      if (!mapContainer.current) {
        console.log('Container not ready, retrying...');
        setTimeout(initMap, 100);
        return;
      }
      initializeMap();
    };

    // Initialize the map with a small delay to ensure container is ready
    setTimeout(initMap, 100);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [lng, lat, zoom]);

  // Check if token is available
  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ width: '100vw', height: '100vh' }}>
      {/* Mapbox Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          width: '100%',
          height: '100%',
          minHeight: '100vh'
        }}
      />
      
      {!hasValidToken && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mapbox Setup Required</h2>
            <p className="text-gray-600 mb-4">
              To see the interactive map, you need to configure your Mapbox access token.
            </p>
            <div className="text-left bg-gray-50 p-4 rounded text-sm">
              <p className="font-semibold mb-2">Steps to setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Go to <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">account.mapbox.com</a></li>
                <li>Sign up or log in</li>
                <li>Copy your access token</li>
                <li>Replace the token in your .env file</li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-medium text-yellow-800">Current token:</p>
              <code className="text-yellow-700">{token || 'Not found'}</code>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Map Info Display */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-3 py-2 text-sm shadow-lg">
        <div className="text-gray-600">
          <div>Longitude: {lng}</div>
          <div>Latitude: {lat}</div>
          <div>Zoom: {zoom}</div>
          <div className="text-green-600 font-bold">Map Status: {map.current ? 'Created' : 'Not Created'}</div>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-sm shadow-lg">
        <div className="text-yellow-800">
          <div>Container: {mapContainer.current ? 'Found' : 'Not Found'}</div>
          <div>Token: {hasValidToken ? 'Valid' : 'Invalid'}</div>
        </div>
      </div>
    </div>
  );
};

export default Map;