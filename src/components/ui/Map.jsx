import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { New_Population } from '../../data/new_population';

const MapComponent = ({selectedFilter}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new Map());
  const isProcessing = useRef(false);
  const layersAdded = useRef(false);
  const mountedRef = useRef(true);
  
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 8;

  const isMobile = () => window.innerWidth <= 780;

  // Optimized population merge - no deep clone, shallow copy only
  const addPopulation = useCallback((geojson, populationArray) => {
    if (!geojson || !populationArray) {
      console.warn('Missing data for processing');
      return null;
    }

    const cacheKey = `${selectedFilter}-${geojson.features?.length || 0}`;
    
    if (processedDataCache.current.has(cacheKey)) {
      console.log('Using cached data');
      return processedDataCache.current.get(cacheKey);
    }

    const startTime = performance.now();
    
    try {
      // Build lookup map for population data
      const popMap = new Map();
      populationArray.forEach(pop => {
        const code = pop["Community Code"];
        if (code) {
          const populationStr = (pop["مجموع السكان\nTotal population"] || "0").replace(/,/g, "");
          const population = parseInt(populationStr, 10) || 0;
          
          popMap.set(code, {
            Population_New: population,
            Area_New: parseFloat(pop["المساحة كم2\nArea km2"]) || 0,
            PopDensity_New: parseFloat(pop["الكثافة السكانية (فرد/كم2)\nPopulation Density (person/km2)"]) || 0
          });
        }
      });

      // Shallow copy with merged properties
      const processedGeojson = {
        type: geojson.type,
        features: geojson.features.map(feature => {
          const popData = popMap.get(feature.properties?.COMM_NUM);
          
          if (!popData) return feature;

          const Population_New = popData.Population_New || 
                                 feature.properties["Population 2019"] || 
                                 feature.properties["Population 2018"] || 0;

          return {
            type: feature.type,
            geometry: feature.geometry,
            properties: {
              ...feature.properties,
              Population_New,
              Area_New: popData.Area_New,
              PopDensity_New: popData.PopDensity_New
            }
          };
        })
      };

      processedDataCache.current.set(cacheKey, processedGeojson);
      
      const endTime = performance.now();
      console.log(`Data processing took ${(endTime - startTime).toFixed(2)}ms`);
      
      return processedGeojson;
    } catch (error) {
      console.error('Error processing data:', error);
      return geojson; // Return original data as fallback
    }
  }, [selectedFilter]);

  // Get color scheme based on filter
  const getColorScheme = useCallback((filterType) => {
    const baseExpression = [
      'case',
      ['has', 'Population_New'],
      ['get', 'Population_New'],
      ['get', 'Population 2019']
    ];

    if (filterType === 'Area') {
      return [
        'interpolate',
        ['linear'],
        baseExpression,
        0, '#f5f5f5',
        1, '#ffebee',
        100, '#ffcdd2',
        1000, '#ffcdd2',
        5000, '#ef9a9a',
        10000, '#e57373',
        20000, '#d32f2f',
        50000, '#b71c1c'
      ];
    } else {
      return [
        'interpolate',
        ['linear'],
        baseExpression,
        0, '#f5f5f5',
        1, '#ffebee',
        100, '#ffcdd2',
        1000, '#ef9a9a',
        5000, '#e57373',
        10000, '#d32f2f',
        20000, '#b71c1c'
      ];
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!token || token === 'your_mapbox_access_token_here') {
      setLoadingError('Mapbox token not configured');
      return;
    }
    
    mapboxgl.accessToken = token;
    if (map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: zoom,
        renderWorldCopies: false,
        maxTileCacheSize: 50,
        localIdeographFontFamily: 'Arial Unicode MS, sans-serif',
        preserveDrawingBuffer: true,
        trackResize: true
      });

      window.map = map.current;

      // Add error handler
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        if (mountedRef.current) {
          setLoadingError('Map loading error');
        }
      });

      // Style load handler
      map.current.once('style.load', () => {
        console.log('Map style loaded');
      });

      // Main load handler
      map.current.once('load', () => {
        if (!mountedRef.current) return;
        
        console.log('Map loaded, preparing data...');
        setIsMapLoaded(true);
        
        // Multiple deferred frames to ensure map is fully ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!mountedRef.current || !map.current) return;
              
              try {
                console.log('Starting data processing...');
                
                const processedData = selectedFilter === 'Area' 
                  ? addPopulation(geojsonData, New_Population) 
                  : addPopulation(dubaiWEBDATA, New_Population);

                if (!processedData || !map.current) {
                  console.error('No processed data or map destroyed');
                  return;
                }

                // Check if source already exists (shouldn't happen, but safety check)
                if (map.current.getSource('dubai-communities')) {
                  console.log('Source already exists, removing...');
                  map.current.removeLayer('dubai-communities-name');
                  map.current.removeLayer('dubai-communities-stroke');
                  map.current.removeLayer('dubai-communities-fill');
                  map.current.removeSource('dubai-communities');
                }

                map.current.addSource('dubai-communities', {
                  type: 'geojson',
                  data: processedData,
                  tolerance: 0.5,
                  buffer: 0,
                  maxzoom: 14
                });

                map.current.addLayer({
                  id: 'dubai-communities-fill',
                  type: 'fill',
                  source: 'dubai-communities',
                  layout: {
                    'visibility': 'visible'
                  },
                  paint: {
                    'fill-color': getColorScheme(selectedFilter),
                    'fill-opacity': 0.7,
                    'fill-antialias': true
                  }
                });

                map.current.addLayer({
                  id: 'dubai-communities-stroke',
                  type: 'line',
                  source: 'dubai-communities',
                  layout: {
                    'visibility': 'visible'
                  },
                  paint: {
                    'line-color': '#000000',
                    'line-width': 0.8,
                    'line-opacity': 0.8
                  }
                });

                map.current.addLayer({
                  id: 'dubai-communities-name',
                  type: 'symbol',
                  source: 'dubai-communities',
                  layout: {
                    'text-field': [
                      'format',
                      ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
                      '\n',
                      [
                        'case',
                        ['has', 'Population_New'],
                        [
                          'case',
                          ['>', ['get', 'Population_New'], 0],
                          ['number-format', ['get', 'Population_New'], { 'locale': 'en-US' }],
                          'No Data'
                        ],
                        [
                          'case',
                          ['has', 'Population 2019'],
                          [
                            'case',
                            ['>', ['get', 'Population 2019'], 0],
                            ['number-format', ['get', 'Population 2019'], { 'locale': 'en-US' }],
                            'No Data'
                          ],
                          'No Data'
                        ]
                      ],
                      { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }
                    ],
                    'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                    'text-size': 10,
                    'text-justify': 'center',
                    'text-anchor': 'center',
                    'text-offset': [0, 0],
                    'text-allow-overlap': false,
                    'text-ignore-placement': false,
                    'text-optional': true,
                    'visibility': 'visible'
                  },
                  paint: {
                    'text-color': '#000000',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1,
                    'text-opacity': 0.9
                  }
                });

                layersAdded.current = true;
                console.log('Layers added, setting up interactions...');
                
                setupInteractions();
                setupMarker();
                setupControls();
                
                if (mountedRef.current) {
                  setIsDataLoaded(true);
                }
              } catch (error) {
                console.error('Error setting up map layers:', error);
                if (mountedRef.current) {
                  setLoadingError('Failed to load map data');
                }
              }
            });
          });
        });
      });

      // Timeout fallback - if map doesn't load in 10 seconds, show error
      const timeout = setTimeout(() => {
        if (!isDataLoaded && mountedRef.current) {
          console.error('Map loading timeout');
          setLoadingError('Map loading timeout. Please refresh.');
        }
      }, 10000);

      return () => clearTimeout(timeout);

    } catch (error) {
      console.error('Error initializing map:', error);
      if (mountedRef.current) {
        setLoadingError('Failed to initialize map');
      }
    }

    function setupInteractions() {
      if (!map.current) return;

      const getValueLabels = (props) => {
        const selected = (typeof window !== 'undefined' && window.selectedDataPoint) 
          ? window.selectedDataPoint : 'population';
        
        let valueLabel = '';
        let valueLabel2 = '';
        let valueLabel3 = '';

        if (selected === 'population') {
          const val = props['Population_New'] || props['Area_New'] || props['PopDensity_New'] || null;
          const formatted = new Intl.NumberFormat('en-US').format(val);
          valueLabel = val != null ? `<br/>Population: ${formatted}` : '';
          valueLabel2 = val != null ? `<br/>Area km²: ${props['Area_New']}` : '';
          valueLabel3 = val != null ? `<br/>Population Density: ${props['PopDensity_New']}` : '';
        }

        return { valueLabel, valueLabel2, valueLabel3 };
      };

      if (isMobile()) {
        map.current.on('click', 'dubai-communities-fill', (e) => {
          if (clickPopupRef.current) clickPopupRef.current.remove();

          const props = e.features[0].properties;
          const placeName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
          const { valueLabel, valueLabel2, valueLabel3 } = getValueLabels(props);

          const tooltipHTML = `
            <div style="padding: 8px;">
              <strong style="display: block; margin-bottom: 8px;">${props.CNAME_E}</strong>
              ${valueLabel}${valueLabel2}${valueLabel3}
              <button 
                id="show-graph-btn"
                style="
                  margin-top: 10px;
                  width: 100%;
                  padding: 8px 12px;
                  background-color: #3696A8;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                "
              >
                Show Graph
              </button>
            </div>
          `;

          const popup = new mapboxgl.Popup({ 
            closeButton: true, 
            maxWidth: '300px',
            closeOnClick: false
          })
            .setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);

          clickPopupRef.current = popup;

          setTimeout(() => {
            const btn = document.getElementById('show-graph-btn');
            if (btn) {
              btn.onclick = () => {
                window.dispatchEvent(new CustomEvent('map:placeSelected', {
                  detail: { placeName, lngLat: e.lngLat }
                }));
                popup.remove();
                clickPopupRef.current = null;
              };
            }
          }, 50);
        });
      } else {
        const hoverTooltip = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '300px'
        });

        map.current.on('mousemove', 'dubai-communities-fill', (e) => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          const { valueLabel, valueLabel2, valueLabel3 } = getValueLabels(props);
          
          const tooltipHTML = `<strong>${props.CNAME_E}</strong>${valueLabel}${valueLabel2}${valueLabel3}`;

          hoverTooltip.setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);
        });

        map.current.on('mouseleave', 'dubai-communities-fill', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          hoverTooltip.remove();
        });

        map.current.on('click', 'dubai-communities-fill', (e) => {
          const props = e.features[0].properties;
          window.dispatchEvent(new CustomEvent('map:placeSelected', {
            detail: { 
              placeName: props.COMMUNITY_E || props.CNAME_E || 'Selected Area',
              lngLat: e.lngLat
            }
          }));
        });
      }
    }

    function setupMarker() {
      if (!map.current) return;

      map.current.loadImage('/logo/geo_stats.png', (error, image) => {
        if (error || !map.current) {
          console.error('Error loading marker image:', error);
          return;
        }
        
        map.current.addImage('search-marker', image);
        map.current.addSource('search-result', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        map.current.addLayer({
          id: 'search-result-marker',
          type: 'symbol',
          source: 'search-result',
          layout: {
            'icon-image': 'search-marker',
            'icon-size': 0.09,
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom'
          }
        });
      });

      window.highlightSearchResult = (coordinates) => {
        if (!coordinates || !map.current || !map.current.getSource('search-result')) return;
        map.current.getSource('search-result').setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {}
          }]
        });
      };
    }

    function setupControls() {
      if (!map.current) return;

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'bottom-right'
      );
      map.current.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
      map.current.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-left');
    }

    return () => {
      mountedRef.current = false;
      if (clickPopupRef.current) {
        clickPopupRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update data when filter changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !layersAdded.current || isProcessing.current) return;

    console.log('Filter changed to:', selectedFilter);
    isProcessing.current = true;

    requestAnimationFrame(() => {
      if (!map.current || !mountedRef.current) {
        isProcessing.current = false;
        return;
      }

      try {
        const newData = selectedFilter === 'Area' 
          ? addPopulation(geojsonData, New_Population) 
          : addPopulation(dubaiWEBDATA, New_Population);

        if (!newData) {
          isProcessing.current = false;
          return;
        }

        const source = map.current.getSource('dubai-communities');
        if (source) {
          source.setData(newData);
        }

        const layer = map.current.getLayer('dubai-communities-fill');
        if (layer) {
          map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme(selectedFilter));
        }
      } catch (error) {
        console.error('Error updating filter:', error);
      } finally {
        isProcessing.current = false;
      }
    });
  }, [selectedFilter, isMapLoaded, addPopulation, getColorScheme]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full relative">
      {(!isDataLoaded && hasValidToken && !loadingError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {loadingError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-50">
          <div className="text-center p-4">
            <h2 className="text-xl font-bold mb-2 text-red-600">Error Loading Map</h2>
            <p className="text-gray-600 mb-4">{loadingError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {!hasValidToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="text-center p-4">
            <h2 className="text-xl font-bold mb-2">Mapbox Setup Required</h2>
            <p className="text-gray-600">Add your Mapbox token to .env</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;