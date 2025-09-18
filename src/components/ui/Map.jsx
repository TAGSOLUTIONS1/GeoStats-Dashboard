import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { uaeEmirates, uaeCities, getBoundaryData } from '../../data/uaeBoundaries';

// Global flag to prevent multiple map initializations
let mapInitialized = false;

const Map = ({ boundaryLevel = 'emirates' }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const boundaryTimeoutRef = useRef(null);
  
  // Correct Dubai coordinates
  const [lng, setLng] = useState(55.296249);
  const [lat, setLat] = useState(25.276987); 
  const [zoom, setZoom] = useState(7);       

  // Debounced function to add UAE boundaries
  const addUAEBoundariesDebounced = (level) => {
    if (boundaryTimeoutRef.current) {
      clearTimeout(boundaryTimeoutRef.current);
    }
    
    boundaryTimeoutRef.current = setTimeout(() => {
      addUAEBoundaries(level);
    }, 500);
  };

  // Function to add UAE boundaries
  const addUAEBoundaries = (level) => {
    console.log('=== ADDING UAE BOUNDARIES ===');
    console.log('Level:', level);
    
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready or style not loaded');
      return;
    }

    const boundaryData = getBoundaryData(level);
    console.log('Boundary data features count:', boundaryData.features.length);
    
    // Try to update existing data first to avoid flickering
    if (map.current.getSource('uae-boundaries')) {
      console.log('Updating existing boundary data...');
      try {
        map.current.getSource('uae-boundaries').setData(boundaryData);
        console.log('✅ Updated existing boundary data');
        return;
      } catch (error) {
        console.log('Error updating existing data:', error);
      }
    }

    // Only recreate layers if source doesn't exist
    try {
      // Remove existing layers first
      if (map.current.getLayer('uae-boundaries-fill')) {
        map.current.removeLayer('uae-boundaries-fill');
      }
      if (map.current.getLayer('uae-boundaries-stroke')) {
        map.current.removeLayer('uae-boundaries-stroke');
      }
      if (map.current.getSource('uae-boundaries')) {
        map.current.removeSource('uae-boundaries');
      }
    } catch (error) {
      console.log('Error removing existing layers:', error);
    }

    // Wait a moment then add new layers
    setTimeout(() => {
      addBoundaryLayers(level, boundaryData);
    }, 100);
  };

  // Separate function to add boundary layers
  const addBoundaryLayers = (level, boundaryData) => {
    console.log('=== ADDING BOUNDARY LAYERS ===');
    console.log('Level:', level);
    
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready for adding layers');
      return;
    }

    // Always add boundary source
    try {
      console.log('Creating boundary source...');
      map.current.addSource('uae-boundaries', {
        type: 'geojson',
        data: boundaryData
      });
      console.log('✅ Successfully added boundary source');
    } catch (error) {
      console.log('❌ Error adding boundary source:', error);
      return;
    }

    try {
      if (level === 'emirates') {
        console.log('Adding emirate boundaries as polygons');
        // Add emirate boundaries as polygons
        map.current.addLayer({
            id: 'uae-boundaries-fill',
            type: 'fill',
            source: 'uae-boundaries',
            minzoom: 0,
            maxzoom: 22,
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'emirate'], 'Abu Dhabi'], '#FF6B6B',
                ['==', ['get', 'emirate'], 'Dubai'], '#4ECDC4',
                ['==', ['get', 'emirate'], 'Sharjah'], '#45B7D1',
                ['==', ['get', 'emirate'], 'Ajman'], '#96CEB4',
                ['==', ['get', 'emirate'], 'Ras Al Khaimah'], '#FFEAA7',
                ['==', ['get', 'emirate'], 'Fujairah'], '#DDA0DD',
                ['==', ['get', 'emirate'], 'Umm Al Quwain'], '#98D8C8',
                '#CCCCCC'
              ],
              'fill-opacity': 0.8
            }
          });

        map.current.addLayer({
            id: 'uae-boundaries-stroke',
            type: 'line',
            source: 'uae-boundaries',
            minzoom: 0,
            maxzoom: 22,
            paint: {
              'line-color': '#000000',
              'line-width': 3
            }
          });
        console.log('Successfully added emirate layers');
      } else {
        console.log('Adding cities/areas as circles');
        // Add cities/areas as circles
        map.current.addLayer({
          id: 'uae-boundaries-fill',
          type: 'circle',
          source: 'uae-boundaries',
          minzoom: 0,
          maxzoom: 22,
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'type'], 'Capital'], 15,
              ['==', ['get', 'type'], 'Major City'], 12,
              ['==', ['get', 'type'], 'City'], 10,
              ['==', ['get', 'type'], 'Town'], 8,
              ['==', ['get', 'type'], 'Industrial Area'], 10,
              ['==', ['get', 'type'], 'Coastal City'], 9,
              8
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'type'], 'Capital'], '#FF6B6B',
              ['==', ['get', 'type'], 'Major City'], '#4ECDC4',
              ['==', ['get', 'type'], 'City'], '#45B7D1',
              ['==', ['get', 'type'], 'Town'], '#96CEB4',
              ['==', ['get', 'type'], 'Industrial Area'], '#FFEAA7',
              ['==', ['get', 'type'], 'Coastal City'], '#DDA0DD',
              '#CCCCCC'
            ],
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        console.log('Successfully added city layers');
      }
    } catch (error) {
      console.log('Error adding boundary layers:', error);
      return;
    }

    // Add click handler for boundaries (only if not already added)
    if (!map.current._boundaryClickHandlerAdded && map.current.getContainer()) {
      map.current.on('click', 'uae-boundaries-fill', (e) => {
      try {
        const feature = e.features[0];
        if (!feature || !feature.properties) {
          console.log('No feature or properties found');
          return;
        }
        
        const properties = feature.properties;
        
        // Create popup with error handling
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false
        });
        
        popup.setLngLat(e.lngLat);
        popup.setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-gray-900">${properties.name || 'Unknown'}</h3>
            ${properties.emirate ? `<p class="text-sm text-gray-600">Emirate: ${properties.emirate}</p>` : ''}
            ${properties.population ? `<p class="text-sm text-gray-600">Population: ${properties.population.toLocaleString()}</p>` : ''}
            ${properties.area ? `<p class="text-sm text-gray-600">Area: ${properties.area.toLocaleString()} km²</p>` : ''}
            ${properties.type ? `<p class="text-sm text-gray-600">Type: ${properties.type}</p>` : ''}
          </div>
        `);
        
        // Only add to map if it's ready
        if (map.current && map.current.getContainer()) {
          popup.addTo(map.current);
        } else {
          console.log('Map container not ready for popup');
        }
      } catch (error) {
        console.log('Error creating popup:', error);
      }
      });
      
      // Mark click handler as added
      map.current._boundaryClickHandlerAdded = true;
    }

    // Change cursor on hover (only if not already added)
    if (!map.current._boundaryHoverHandlersAdded && map.current.getContainer()) {
      map.current.on('mouseenter', 'uae-boundaries-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'uae-boundaries-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });
      
      // Mark hover handlers as added
      map.current._boundaryHoverHandlersAdded = true;
    }
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
                <p class="text-lg font-bold text-azure">${point.properties.value.toLocaleString()}</p>
                <button class="mt-2 bg-azure text-white px-3 py-1 rounded text-xs hover:bg-azure-dark">
                  Click to see metro
                </button>
              </div>
            `);

          // Create a marker
          const marker = new mapboxgl.Marker({
            color: '#3696A8',
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
            'circle-color': '#3696A8',
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Add UAE boundaries after a short delay to ensure map is ready
        setTimeout(() => {
          addUAEBoundaries(boundaryLevel);
        }, 1000);


        // Re-add boundaries when style loads (in case of style changes)
        map.current.on('styledata', () => {
          if (map.current.isStyleLoaded()) {
            setTimeout(() => {
              addUAEBoundariesDebounced(boundaryLevel);
            }, 1000);
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

      // Re-add boundaries on map interactions to ensure they stay visible (less frequent)
      map.current.on('moveend', () => {
        if (map.current.isStyleLoaded()) {
          setTimeout(() => {
            addUAEBoundariesDebounced(boundaryLevel);
          }, 500);
        }
      });

      map.current.on('zoomend', () => {
        if (map.current.isStyleLoaded()) {
          setTimeout(() => {
            addUAEBoundariesDebounced(boundaryLevel);
          }, 500);
        }
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

  // Effect to handle boundary level changes
  useEffect(() => {
    if (map.current && map.current._dataAdded && map.current.isStyleLoaded()) {
      // Always add boundaries when level changes
      addUAEBoundaries(boundaryLevel);
    }
  }, [boundaryLevel]);


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