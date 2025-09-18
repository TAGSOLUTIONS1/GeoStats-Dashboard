import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { emiratesDataPoints, cityDataPoints, areaDataPoints } from '../../data/emiratesDataPoints';
// Global flag to prevent multiple map initializations
let mapInitialized = false;

const Map = ({ selectedFilter = 'Emirate' }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  // Correct Dubai coordinates
  const [lng, setLng] = useState(55.296249);
  const [lat, setLat] = useState(25.276987); 
  const [zoom, setZoom] = useState(9);

  // Function to get data points based on selected level
  const getDataPointsForLevel = () => {
    // Choose data source based on filter type
    let dataPoints;
    switch (selectedFilter) {
      case 'City':
        dataPoints = cityDataPoints;
        break;
      case 'Area':
        dataPoints = areaDataPoints;
        break;
      case 'Zip':
        dataPoints = areaDataPoints; // Use area data for zip level
        break;
      default:
        dataPoints = emiratesDataPoints; // Default to emirate level
    }
    
    console.log(`Selected filter: ${selectedFilter}, returning ${dataPoints.length} data points`);
    return dataPoints;
  };       

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
          initializeMapData();
        });

        // Fallback: try to initialize data after a delay if load event doesn't fire
        setTimeout(() => {
          if (map.current && !map.current._dataAdded) {
            console.log('Fallback: Initializing data after delay');
            initializeMapData();
          }
        }, 2000);

        const initializeMapData = () => {
          // Check if admin-1 source already exists before adding
          if (!map.current.getSource('admin-1')) {
            // Add a vector source for admin-1 boundaries
            map.current.addSource('admin-1', {
              type: 'vector',
              url: 'mapbox://mapbox.boundaries-adm1-v4',
              promoteId: 'mapbox_id'
            });
            
            // Define a filter for UAE worldview boundaries
            let worldviewFilter = [
              'any',
              ['==', 'all', ['get', 'worldview']],
              ['in', 'AE', ['get', 'worldview']]
            ];
            
            // Add a fill layer for admin boundaries
            map.current.addLayer(
              {
                id: 'admin-1-fill',
                type: 'fill',
                source: 'admin-1',
                'source-layer': 'boundaries_admin_1',
                filter: worldviewFilter,
                paint: {
                  'fill-color': '#3696A8',
                  'fill-opacity': 0.1
                }
              },
              'waterway-label'
            );
            
            // Add a line layer for admin boundaries
            map.current.addLayer(
              {
                id: 'admin-1-line',
                type: 'line',
                source: 'admin-1',
                'source-layer': 'boundaries_admin_1',
                filter: worldviewFilter,
                paint: {
                  'line-color': '#3696A8',
                  'line-width': 2,
                  'line-opacity': 0.8
                }
              },
              'waterway-label'
            );
            
            // Add hover effects for boundaries
            map.current.on('mouseenter', 'admin-1-fill', () => {
              map.current.getCanvas().style.cursor = 'pointer';
            });
            
            map.current.on('mouseleave', 'admin-1-fill', () => {
              map.current.getCanvas().style.cursor = '';
            });
            
            // Add click handler for boundaries
            map.current.on('click', 'admin-1-fill', (e) => {
              const features = map.current.queryRenderedFeatures(e.point, {
                layers: ['admin-1-fill']
              });
              
              if (features.length > 0) {
                const feature = features[0];
                const popup = new mapboxgl.Popup({ offset: 25 })
                  .setLngLat(e.lngLat)
                  .setHTML(`
                    <div class="p-3 bg-white rounded-lg shadow-lg">
                      <h3 class="font-semibold text-gray-900 text-lg">${feature.properties.NAME_1 || 'Administrative Region'}</h3>
                      <p class="text-sm text-gray-600">UAE Administrative Boundary</p>
                      <p class="text-xs text-gray-500 mt-1">Click on data points for property information</p>
                    </div>
                  `)
                  .addTo(map.current);
              }
            });
          }
          
          // Check if data has already been added
          if (map.current._dataAdded) {
            console.log('Data already added, skipping...');
            return;
          }

          console.log('Adding markers and data sources...');
          
          // Get data points for selected level
          const dataPoints = getDataPointsForLevel();
          
          // Data points will be visualized using the circle layer below

          // Add a data source for visualization
          map.current.addSource('data-points', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: dataPoints.map(point => ({
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
                'stops': [[1, 6], [5, 10], [10, 14], [15, 18], [20, 22]]
              },
              'circle-color': '#3696A8',
              'circle-opacity': 0.9,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff'
            }
          });

          // Add symbol layer for labels at higher zoom levels
          map.current.addLayer({
            id: 'data-points-labels',
            type: 'symbol',
            source: 'data-points',
            layout: {
              'text-field': ['get', 'title'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-offset': [0, 1.25],
              'text-anchor': 'top',
              'text-size': {
                'base': 1,
                'stops': [[10, 10], [15, 12], [20, 14]]
              }
            },
            paint: {
              'text-color': '#333333',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2
            },
            minzoom: 10
          });

          // Add hover effects for data points
          map.current.on('mouseenter', 'data-points-layer', () => {
            map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'data-points-layer', () => {
            map.current.getCanvas().style.cursor = '';
          });
          
          // Add click handler for data points
          map.current.on('click', 'data-points-layer', (e) => {
            const features = map.current.queryRenderedFeatures(e.point, {
              layers: ['data-points-layer']
            });
            
            if (features.length > 0) {
              const feature = features[0];
              const properties = feature.properties;
              
              const popup = new mapboxgl.Popup({ offset: 25 })
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 text-lg">${properties.title}, ${properties.emirate}</h3>
                    <p class="text-sm text-gray-600">${properties.dataPoint}</p>
                    <p class="text-lg font-bold text-azure">${properties.value.toLocaleString()}</p>
                    ${properties.population && (
                      `<p class="text-xs text-gray-500">Population: ${properties.population.toLocaleString()}</p>`
                    )}
                    ${properties.area && (
                      `<p class="text-xs text-gray-500">Area: ${properties.area.toLocaleString()} km²</p>`
                    )}
                    ${properties.cities && (
                      `<p class="text-xs text-gray-500">Cities: ${properties.cities}</p>`
                    )}
                    <button class="mt-2 bg-azure text-white px-3 py-1 rounded text-xs hover:bg-azure-dark">
                      Click to see metro
                    </button>
                  </div>
                `)
                .addTo(map.current);
            }
          });
          
          // Mark that data has been added
          map.current._dataAdded = true;
          console.log('Data added successfully!');
        };
        
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
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'bottom-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
      }), 'bottom-left');



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

  // Update map data when filter level changes
  useEffect(() => {
    if (!map.current || !map.current._dataAdded) return;

    const updateMapData = () => {
      // Get data points for selected level
      const dataPoints = getDataPointsForLevel();
      
      // Update data source safely
      try {
        if (map.current.getSource('data-points')) {
          map.current.getSource('data-points').setData({
            type: 'FeatureCollection',
            features: dataPoints.map(point => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: point.coordinates
              },
              properties: point.properties
            }))
          });
          console.log('Data updated with', dataPoints.length, 'points');
        }
      } catch (error) {
        console.log('Source not ready yet, skipping update:', error);
      }
    };

    updateMapData();
  }, [selectedFilter]);

  // Check if token is available
  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full">
      {/* Mapbox Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
          width: '100%',
          height: '100%'
        }}
      />
      
      {!hasValidToken && (
        <div className="absolute inset-0 bg-gradient-to-br from-custom-blue/20 to-green-100 flex items-center justify-center">
          <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mapbox Setup Required</h2>
            <p className="text-gray-600 mb-4">
              To see the interactive map, you need to configure your Mapbox access token.
            </p>
            <div className="text-left bg-gray-50 p-4 rounded text-sm">
              <p className="font-semibold mb-2">Steps to setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Go to <a href="https://account.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-azure hover:underline">account.mapbox.com</a></li>
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
      {/* <div className="absolute top-40 left-4 bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-3 py-2 text-sm shadow-lg">
        <div className="text-gray-600">
          <div>Longitude: {lng}</div>
          <div>Latitude: {lat}</div>
          <div>Zoom: {zoom}</div>
          <div className="text-green-600 font-bold">Map Status: {map.current ? 'Created' : 'Not Created'}</div>
        </div>
      </div> */}
      
      {/* Debug Info */}
      {/* <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-sm shadow-lg">
        <div className="text-yellow-800">
          <div>Container: {mapContainer.current ? 'Found' : 'Not Found'}</div>
          <div>Token: {hasValidToken ? 'Valid' : 'Invalid'}</div>
        </div>
      </div> */}
    </div>
  );
};

export default Map;