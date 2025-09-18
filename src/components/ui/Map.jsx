import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { uaeEmirates, uaeDataPoints, getAllAreas, uaeEmiratesGeoJSON } from '../../data/uaeBoundaries';

// Global flag to prevent multiple map initializations
let mapInitialized = false;

const Map = ({ selectedFilter = 'Emirate', searchQuery = '' }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  // UAE center coordinates (between Dubai and Abu Dhabi)
  const [lng, setLng] = useState(54.8);
  const [lat, setLat] = useState(24.5); 
  const [zoom, setZoom] = useState(7);
  const [selectedEmirate, setSelectedEmirate] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [boundariesAdded, setBoundariesAdded] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(selectedFilter);

  // Functions to add boundaries
  const addEmirateBoundaries = () => {
    console.log('addEmirateBoundaries called');
    console.log('map.current exists:', !!map.current);
    console.log('map is style loaded:', map.current?.isStyleLoaded());
    
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer || !map.current.getSource) {
      console.log('Map not ready or methods not available, returning early');
      return;
    }
    
    try {
      // Remove existing emirate boundaries if they exist
      if (map.current.getLayer && map.current.getLayer('uae-emirates-fill')) {
        map.current.removeLayer('uae-emirates-fill');
      }
      if (map.current.getLayer && map.current.getLayer('uae-emirates-stroke')) {
        map.current.removeLayer('uae-emirates-stroke');
      }
      if (map.current.getSource && map.current.getSource('uae-emirates')) {
        map.current.removeSource('uae-emirates');
      }

      // Add emirate boundaries source
      console.log('Adding emirate boundaries source with data:', uaeEmiratesGeoJSON);
      map.current.addSource('uae-emirates', {
        type: 'geojson',
        data: uaeEmiratesGeoJSON
      });

      // Add emirate fill layer
      map.current.addLayer({
        id: 'uae-emirates-fill',
        type: 'fill',
        source: 'uae-emirates',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'emirateId'], selectedEmirate], '#FF6B6B',
            '#4ECDC4'
          ],
          'fill-opacity': 0.8
        }
      });

      // Add emirate stroke layer
      map.current.addLayer({
        id: 'uae-emirates-stroke',
        type: 'line',
        source: 'uae-emirates',
        paint: {
          'line-color': '#2C3E50',
          'line-width': 3
        }
      });

      // Add click handler
      map.current.on('click', 'uae-emirates-fill', (e) => {
        const emirateId = e.features[0].properties.emirateId;
        setSelectedEmirate(emirateId);
        
        // Zoom to the clicked emirate
        const bounds = e.features[0].geometry.type === 'Polygon' 
          ? e.features[0].geometry.coordinates[0]
          : e.features[0].geometry.coordinates[0][0];
        
        const lngs = bounds.map(coord => coord[0]);
        const lats = bounds.map(coord => coord[1]);
        const bbox = [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats)
        ];
        
        map.current.fitBounds(bbox, { padding: 50 });
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'uae-emirates-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'uae-emirates-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });

      console.log('Emirate boundaries added successfully');
      console.log('Layers in map:', map.current.getStyle().layers.map(l => l.id));
      setBoundariesAdded(true);
    } catch (error) {
      console.error('Error adding emirate boundaries:', error);
    }
  };

  const addAreaBoundaries = () => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer || !map.current.getSource) return;
    
    try {
      // Remove existing area boundaries if they exist
      if (map.current.getLayer && map.current.getLayer('uae-areas-fill')) {
        map.current.removeLayer('uae-areas-fill');
      }
      if (map.current.getLayer && map.current.getLayer('uae-areas-stroke')) {
        map.current.removeLayer('uae-areas-stroke');
      }
      if (map.current.getSource && map.current.getSource('uae-areas')) {
        map.current.removeSource('uae-areas');
      }

      // Create area boundaries (simplified circles for now)
      const allAreas = getAllAreas();
      const areaGeoJSON = {
        type: 'FeatureCollection',
        features: allAreas.map(area => ({
          type: 'Feature',
          properties: {
            name: area.name,
            areaId: area.id,
            emirateId: area.emirateId
          },
          geometry: {
            type: 'Point',
            coordinates: area.coordinates
          }
        }))
      };

      // Add area boundaries source
      map.current.addSource('uae-areas', {
        type: 'geojson',
        data: areaGeoJSON
      });

      // Add area circles layer
      map.current.addLayer({
        id: 'uae-areas-fill',
        type: 'circle',
        source: 'uae-areas',
        paint: {
          'circle-radius': 15000,
          'circle-color': [
            'case',
            ['==', ['get', 'areaId'], selectedArea], '#3696A8',
            '#3696A860'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#3696A8'
        }
      });

      // Add click handler
      map.current.on('click', 'uae-areas-fill', (e) => {
        const areaId = e.features[0].properties.areaId;
        setSelectedArea(areaId);
        
        // Zoom to the clicked area
        map.current.flyTo({
          center: e.features[0].geometry.coordinates,
          zoom: 13
        });
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'uae-areas-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'uae-areas-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });

      console.log('Area boundaries added successfully');
      setBoundariesAdded(true);
    } catch (error) {
      console.error('Error adding area boundaries:', error);
    }
  };

  // Update boundary colors when selection changes
  useEffect(() => {
    if (map.current && boundariesAdded && selectedFilter === 'Emirate' && map.current.isStyleLoaded()) {
      // Update the paint properties to reflect the new selection
      try {
        if (map.current.getLayer && map.current.getLayer('uae-emirates-fill')) {
          map.current.setPaintProperty('uae-emirates-fill', 'fill-color', [
            'case',
            ['==', ['get', 'emirateId'], selectedEmirate], '#FF6B6B',
            '#4ECDC4'
          ]);
        }
      } catch (error) {
        console.error('Error updating emirate colors:', error);
      }
    }
  }, [selectedEmirate, boundariesAdded, selectedFilter]);

  // Update area boundary colors when selection changes
  useEffect(() => {
    if (map.current && boundariesAdded && selectedFilter === 'Area' && map.current.isStyleLoaded()) {
      // Update the paint properties to reflect the new selection
      try {
        if (map.current.getLayer && map.current.getLayer('uae-areas-fill')) {
          map.current.setPaintProperty('uae-areas-fill', 'circle-color', [
            'case',
            ['==', ['get', 'areaId'], selectedArea], '#FF6B6B',
            '#4ECDC4'
          ]);
        }
      } catch (error) {
        console.error('Error updating area colors:', error);
      }
    }
  }, [selectedArea, boundariesAdded, selectedFilter]);

  // Global functions for popup buttons
  useEffect(() => {
    window.selectEmirate = (emirateId) => {
      setSelectedEmirate(emirateId);
      const emirate = uaeEmirates[emirateId];
      if (emirate && map.current) {
        map.current.flyTo({
          center: emirate.coordinates,
          zoom: 10
        });
      }
    };

    window.selectArea = (areaId) => {
      setSelectedArea(areaId);
      const allAreas = getAllAreas();
      const area = allAreas.find(a => a.id === areaId);
      if (area && map.current) {
        map.current.flyTo({
          center: area.coordinates,
          zoom: 13
        });
      }
    };

    return () => {
      delete window.selectEmirate;
      delete window.selectArea;
    };
  }, []);

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

      // UAE data points
      const sampleDataPoints = uaeDataPoints;

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
          // Create a popup based on selected filter
          let popupContent = `
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">${point.properties.title}, ${point.properties.emirate}</h3>
              <p class="text-sm text-gray-600">${point.properties.dataPoint}</p>
              <p class="text-lg font-bold text-azure">${point.properties.value.toLocaleString()}</p>`;
          
          if (selectedFilter === 'Emirate') {
            popupContent += `
              <button class="mt-2 bg-azure text-white px-3 py-1 rounded text-xs hover:bg-azure-dark" 
                      onclick="window.selectEmirate('${point.properties.emirate.toLowerCase().replace(/\s+/g, '-')}')">
                Click to see areas
              </button>`;
          } else if (selectedFilter === 'Area') {
            popupContent += `
              <button class="mt-2 bg-azure text-white px-3 py-1 rounded text-xs hover:bg-azure-dark" 
                      onclick="window.selectArea('${point.properties.area.toLowerCase().replace(/\s+/g, '-')}')">
                View area details
              </button>`;
          } else {
            popupContent += `
              <button class="mt-2 bg-azure text-white px-3 py-1 rounded text-xs hover:bg-azure-dark" 
                      onclick="alert('Current level: ${selectedFilter}')">
                View details
              </button>`;
          }
          
          popupContent += `</div>`;

          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(popupContent);

          // Create a marker
          const marker = new mapboxgl.Marker({
            color: '#3696A8',
            scale: 1.2
          })
            .setLngLat(point.coordinates)
            .setPopup(popup)
            .addTo(map.current);
        });

        // Don't add boundaries here - they'll be added when filter changes

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
        
        // Mark that data has been added
        map.current._dataAdded = true;
        console.log('Data added successfully!');
        
        // Add initial boundaries based on current filter
        setTimeout(() => {
          if (map.current && map.current._dataAdded && !boundariesAdded) {
            console.log('Adding initial boundaries for filter:', selectedFilter);
            if (selectedFilter === 'Emirate') {
              addEmirateBoundaries();
            } else if (selectedFilter === 'Area') {
              addAreaBoundaries();
            }
          }
        }, 500);
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

  // Update map when filter changes
  useEffect(() => {
    // Only update if filter actually changed
    if (selectedFilter !== currentFilter) {
      console.log('Filter changed from', currentFilter, 'to', selectedFilter);
      setCurrentFilter(selectedFilter);
      
      if (map.current && map.current._dataAdded && map.current.isStyleLoaded()) {
        // Clear existing boundaries
        clearAllBoundaries();
        
        // Add new boundaries based on filter with a small delay to ensure map is ready
        setTimeout(() => {
          if (map.current && map.current._dataAdded) {
            if (selectedFilter === 'Emirate') {
              addEmirateBoundaries();
            } else if (selectedFilter === 'Area') {
              addAreaBoundaries();
            }
          }
        }, 200);
      }
    }
  }, [selectedFilter, currentFilter]);

  // Add initial boundaries when component mounts and map is ready
  useEffect(() => {
    if (map.current && map.current._dataAdded && map.current.isStyleLoaded() && !boundariesAdded) {
      // Add initial boundaries based on current filter
      setTimeout(() => {
        if (map.current && map.current._dataAdded && !boundariesAdded) {
          console.log('Adding initial boundaries for filter:', selectedFilter);
          if (selectedFilter === 'Emirate') {
            addEmirateBoundaries();
          } else if (selectedFilter === 'Area') {
            addAreaBoundaries();
          }
        }
      }, 300);
    }
  }, [map.current?._dataAdded, boundariesAdded]); // Only run when data is added and boundaries not already added

  // Helper function to clear all boundaries
  const clearAllBoundaries = () => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer || !map.current.getSource) return;
    
    try {
      // Clear emirate boundaries
      if (map.current.getLayer && map.current.getLayer('uae-emirates-fill')) {
        map.current.removeLayer('uae-emirates-fill');
      }
      if (map.current.getLayer && map.current.getLayer('uae-emirates-stroke')) {
        map.current.removeLayer('uae-emirates-stroke');
      }
      if (map.current.getSource && map.current.getSource('uae-emirates')) {
        map.current.removeSource('uae-emirates');
      }

      // Clear area boundaries
      if (map.current.getLayer && map.current.getLayer('uae-areas-fill')) {
        map.current.removeLayer('uae-areas-fill');
      }
      if (map.current.getLayer && map.current.getLayer('uae-areas-stroke')) {
        map.current.removeLayer('uae-areas-stroke');
      }
      if (map.current.getSource && map.current.getSource('uae-areas')) {
        map.current.removeSource('uae-areas');
      }
    } catch (error) {
      console.error('Error clearing boundaries:', error);
    }
    setBoundariesAdded(false);
  };

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
      <div className="absolute top-20 right-4 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-sm shadow-lg">
        <div className="text-yellow-800">
          <div>Container: {mapContainer.current ? 'Found' : 'Not Found'}</div>
          <div>Token: {hasValidToken ? 'Valid' : 'Invalid'}</div>
          <div>Filter: {selectedFilter}</div>
          <div>Boundaries: {boundariesAdded ? 'Added' : 'Not Added'}</div>
          <button 
            onClick={() => {
              console.log('Manual boundary test');
              if (selectedFilter === 'Emirate') {
                addEmirateBoundaries();
              } else if (selectedFilter === 'Area') {
                addAreaBoundaries();
              }
            }}
            className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Boundaries
          </button>
        </div>
      </div>
    </div>
  );
};

export default Map;