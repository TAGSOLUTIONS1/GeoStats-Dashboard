import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { EmiratesData } from '../../data/Emirates';
import { New_Population } from '../../data/new_population';

const MapComponent = ({selectedFilter}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [isDataProcessing, setIsDataProcessing] = useState(false);
  const clickPopupRef = useRef(null); // Track mobile popup
  
  // Cache for processed data to avoid reprocessing
  const processedDataCache = useRef(new Map());
  
  // Performance monitoring
  const performanceStart = useRef(null);
  const performanceEnd = useRef(null);
  
  // Utility function to optimize GeoJSON for performance
  const optimizeGeoJSON = useCallback((geojson) => {
    return {
      ...geojson,
      features: geojson.features.map(feature => ({
        ...feature,
        // Simplify geometry for better performance
        geometry: feature.geometry,
        properties: {
          // Only keep essential properties to reduce payload
          CNAME_E: feature.properties.CNAME_E,
          CNAME_A: feature.properties.CNAME_A,
          COMMUNITY_E: feature.properties.COMMUNITY_E,
          COMMUNITY_A: feature.properties.COMMUNITY_A,
          COMM_NUM: feature.properties.COMM_NUM,
          'Population 2019': feature.properties['Population 2019'],
          'Population 2018': feature.properties['Population 2018'],
          'Area Sq Km': feature.properties['Area Sq Km'],
          Population_New: feature.properties.Population_New,
          Area_New: feature.properties.Area_New,
          PopDensity_New: feature.properties.PopDensity_New,
          Latitude: feature.properties.Latitude,
          Longitude: feature.properties.Longitude
        }
      }))
    };
  }, []);

  // Dubai coordinates
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

  // Detect mobile devices based on screen dimensions
  const isMobile = () => {
    return window.innerWidth <= 780;
  };

  // Memoized function to add population data with caching
  const addPopulation = useCallback((geojson, populationArray) => {
    const cacheKey = `${selectedFilter}-${geojson.features.length}-${populationArray.length}`;
    
    // Check cache first
    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }
    
    setIsDataProcessing(true);
    performanceStart.current = performance.now();
    
    // Create a deep copy to avoid mutating original data
    const processedGeojson = JSON.parse(JSON.stringify(geojson));
    
    // Create a lookup map for faster feature finding
    const featureMap = new Map();
    processedGeojson.features.forEach(feature => {
      if (feature.properties.COMM_NUM) {
        featureMap.set(feature.properties.COMM_NUM, feature);
      }
    });
    
    // Process population data with optimized lookup
    populationArray.forEach(pop => {
      const communityCode = pop["Community Code"];
      const feature = featureMap.get(communityCode);
      
      if (feature) {
        // Clean and parse population data
        const populationStr = (pop["مجموع السكان\nTotal population"] || "0").replace(/,/g, "");
        const population = parseInt(populationStr, 10);
        
        // Add new fields or update if already exist
        feature.properties.Population_New = isNaN(population) ? 0 : population;
        feature.properties.Area_New = parseFloat(pop["المساحة كم2\nArea km2"]) || 0;
        feature.properties.PopDensity_New = parseFloat(
          pop["الكثافة السكانية (فرد/كم2)\nPopulation Density (person/km2)"]
        ) || 0;
        
        // Ensure we have a fallback to existing population data
        if (!feature.properties.Population_New || feature.properties.Population_New === 0) {
          feature.properties.Population_New = feature.properties["Population 2019"] || feature.properties["Population 2018"] || 0;
        }
      }
    });
    
    // Optimize the processed data for better performance
    const optimizedData = optimizeGeoJSON(processedGeojson);
    
    // Cache the processed data
    processedDataCache.current.set(cacheKey, optimizedData);
    
    performanceEnd.current = performance.now();
    const processingTime = performanceEnd.current - performanceStart.current;
    console.log(`Data processing took ${processingTime.toFixed(2)}ms`);
    
    setIsDataProcessing(false);
    
    return optimizedData;
  }, [selectedFilter]);

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!token || token === 'your_mapbox_access_token_here') {
      return;
    }
    mapboxgl.accessToken = token;
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
      // Performance optimizations
      renderWorldCopies: false,
      maxTileCacheSize: 50,
      localIdeographFontFamily: 'Arial Unicode MS, sans-serif',
      // maxBounds: [
      //   [54.13, 24.5],
      //   [56.4, 25.7]
      // ]
    });

    window.map = map.current;

    map.current.on('style.load', () => {
      setIsStyleLoaded(true);
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
      
      // Progressive loading: Load data asynchronously to avoid blocking
      setTimeout(() => {
        const processedData = selectedFilter === 'Area' 
          ? addPopulation(geojsonData, New_Population) 
          : addPopulation(dubaiWEBDATA, New_Population);
        
        // Add GeoJSON source with optimized settings
        map.current.addSource('dubai-communities', {
          type: 'geojson',
          data: processedData,
          // Performance optimizations
          cluster: false,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // Add fill layer with performance optimizations
        map.current.addLayer({
          id: 'dubai-communities-fill',
          type: 'fill',
          source: 'dubai-communities',
          layout: {
            'visibility': 'visible'
          },
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              [
                'case',
                ['has', 'Population_New'],
                ['get', 'Population_New'],
                ['get', 'Population 2019']
              ],
                0,     '#f5f5f5', // very light gray for no data
                1,     '#ffebee', // very light rose for minimal data
                100,   '#ffcdd2', // soft pink
                1000,  '#ffcdd2', // soft pink
                5000,  '#ef9a9a', // light red
                10000, '#e57373', // medium red
                20000, '#d32f2f', // Emirates red
                50000, '#b71c1c'  // deep maroon red
            ],
            'fill-opacity': 0.7,
            'fill-antialias': true
          }
        });

        // Add outline layer with performance optimizations
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

        // Add name + population labels with performance optimizations
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
      }, 100); // Small delay to allow map to render first

      // Helper function to get value labels
      const getValueLabels = (props) => {
        const selected = (typeof window !== 'undefined' && window.selectedDataPoint) ? window.selectedDataPoint : 'population';
        
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

      // MOBILE: Click handler with popup and button
      if (isMobile()) {
        map.current.on('click', 'dubai-communities-fill', (e) => {
          // Close any existing popup
          if (clickPopupRef.current) {
            clickPopupRef.current.remove();
          }

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

          // Create and show popup
          const popup = new mapboxgl.Popup({ 
            closeButton: true, 
            maxWidth: '300px',
            closeOnClick: false
          })
            .setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);

          clickPopupRef.current = popup;

          // Attach button click handler after DOM renders
          setTimeout(() => {
            const btn = document.getElementById('show-graph-btn');
            if (btn) {
              btn.onclick = () => {
                const detail = {
                  placeName,
                  lngLat: e.lngLat,
                };
                window.dispatchEvent(new CustomEvent('map:placeSelected', { detail }));
                popup.remove();
                clickPopupRef.current = null;
              };
            }
          }, 50);
        });
      } 
      // DESKTOP: Hover tooltip + click handler
      else {
        const hoverTooltip = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '300px'
        });

        map.current.on('mousemove', 'dubai-communities-fill', (e) => {
          map.current.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          const { valueLabel, valueLabel2, valueLabel3 } = getValueLabels(props);
          
          const tooltipHTML = `<strong>${props.CNAME_E}</strong>${valueLabel}${valueLabel2}${valueLabel3}`;

          hoverTooltip.setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);
        });

        map.current.on('mouseleave', 'dubai-communities-fill', () => {
          map.current.getCanvas().style.cursor = '';
          hoverTooltip.remove();
        });

        map.current.on('click', 'dubai-communities-fill', (e) => {
          const props = e.features[0].properties;
          const detail = {
            placeName: props.COMMUNITY_E || props.CNAME_E || 'Selected Area',
            lngLat: e.lngLat,
          };
          window.dispatchEvent(new CustomEvent('map:placeSelected', { detail }));
        });
      }

      // Load custom marker image
      map.current.loadImage('/logo/geo_stats.png', (error, image) => {
        if (error) {
          console.error('Error loading marker image:', error);
          return;
        }
        
        map.current.addImage('search-marker', image);

        map.current.addSource('search-result', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
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

      // Expose function to update search marker
      window.highlightSearchResult = (coordinates) => {
        if (!coordinates) return;
        
        map.current.getSource('search-result').setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            properties: {}
          }]
        });
      };

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
        unit: 'metric'
      }), 'bottom-left');
    });

    return () => {
      if (clickPopupRef.current) {
        clickPopupRef.current.remove();
      }
    };
  }, []);

  // Effect 2: update data when filter changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Use cached data if available, otherwise process
    const newData = selectedFilter === 'Area' 
      ? addPopulation(geojsonData, New_Population) 
      : addPopulation(dubaiWEBDATA, New_Population);

    if (map.current.getSource('dubai-communities')) {
      // Batch update to avoid multiple re-renders
      map.current.getSource('dubai-communities').setData(newData);
    }

    // Update fill color dynamically when filter changes
    if (map.current.getLayer('dubai-communities-fill')) {
      if (selectedFilter === 'Area') {
        map.current.setPaintProperty('dubai-communities-fill', 'fill-color', [
          'interpolate',
          ['linear'],
          [
            'case',
            ['has', 'Population_New'],
            ['get', 'Population_New'],
            ['get', 'Population 2019']
          ],
          0, '#f5f5f5', // very light gray for no data
          1, '#ffebee', // very light rose for minimal data
          100, '#ffcdd2', // soft pink
          1000, '#ffcdd2', // soft pink
          5000, '#ef9a9a', // light red
          10000, '#e57373', // medium red
          20000, '#d32f2f', // Emirates red
          50000, '#b71c1c' // deep maroon red
        ]);
      } else if (selectedFilter === 'Emirate') {
        map.current.setPaintProperty('dubai-communities-fill', 'fill-color', [
          'interpolate',
          ['linear'],
          [
            'case',
            ['has', 'Population_New'],
            ['get', 'Population_New'],
            ['get', 'Population 2019']
          ],
          0, '#f5f5f5', // very light gray for no data
          1, '#ffebee', // very light rose for minimal data
          100, '#ffcdd2', // soft pink
          1000, '#ef9a9a', // light red
          5000, '#e57373', // medium red
          10000, '#d32f2f', // Emirates red
          20000, '#b71c1c' // deep maroon red
        ]);
      }
    }
  }, [selectedFilter, isMapLoaded]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full">
      {(!isStyleLoaded || !isMapLoaded || isDataProcessing) && hasValidToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">
              {isDataProcessing ? 'Processing data...' : 'Loading map...'}
            </p>
          </div>
        </div>
      )}
      
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {!hasValidToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
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