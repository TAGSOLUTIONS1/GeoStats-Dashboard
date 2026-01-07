'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = ({ selectedFilter, disableScrollZoom = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(typeof window !== 'undefined' ? new window.Map() : null);
  const dataRef = useRef({ geojsonData: null, dubaiWEBDATA: null, New_Population: null });
  
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 780;

  // Optimized data processing with caching
  const addPopulation = useCallback((geojson, populationArray) => {
    // Initialize cache if not already done (client-side only)
    if (!processedDataCache.current && typeof window !== 'undefined') {
      processedDataCache.current = new window.Map();
    }
    
    const cacheKey = `${selectedFilter}-${geojson.features?.length || 0}`;
    
    if (processedDataCache.current && processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

    const popMap = typeof window !== 'undefined' ? new window.Map() : new Map();
    populationArray.forEach(pop => {
      const code = pop["Community Code"];
      if (code) {
        const populationStr = (pop["مجموع السكان\nTotal population"] || "0").replace(/,/g, "");
        popMap.set(code, {
          Population_New: parseInt(populationStr, 10) || 0,
          Area_New: parseFloat(pop["المساحة كم2\nArea km2"]) || 0,
          PopDensity_New: parseFloat(pop["الكثافة السكانية (فرد/كم2)\nPopulation Density (person/km2)"]) || 0
        });
      }
    });

    const processedGeojson = {
      ...geojson,
      features: geojson.features.map(feature => {
        const popData = popMap.get(feature.properties?.COMM_NUM);
        if (!popData) return feature;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...popData
          }
        };
      })
    };

    if (processedDataCache.current) {
      processedDataCache.current.set(cacheKey, processedGeojson);
    }
    return processedGeojson;
  }, [selectedFilter]);

  const getColorScheme = useCallback((filterType) => {
    const baseExpression = [
      'case',
      ['has', 'Population_New'],
      ['get', 'Population_New'],
      ['get', 'Population 2019']
    ];

    return [
      'interpolate',
      ['linear'],
      baseExpression,
      0, '#ffebee',
      1000, '#ffcdd2',
      5000, '#ef9a9a',
      10000, '#e57373',
      20000, '#d32f2f',
      50000, '#b71c1c'
    ];
  }, []);

  // Load data asynchronously
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { dubaiGeoData: importedDubaiGeoData, geojsonData: importedGeojsonData },
          { dubaiWEBDATA: importedDubaiWEBDATA },
          { New_Population: importedNewPopulation }
        ] = await Promise.all([
          import('../../data/geoData'),
          import('../../data/DubaiData'),
          import('../../data/new_population')
        ]);
        dataRef.current = {
          geojsonData: importedGeojsonData,
          dubaiWEBDATA: importedDubaiWEBDATA,
          New_Population: importedNewPopulation
        };
        setDataLoaded(true);
      } catch (error) {
        console.error("Failed to load map data:", error);
        // Still set dataLoaded to true to allow map to render even if data fails
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return; // Wait for data to load

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
    if (!token || token === 'your_mapbox_access_token_here' || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
      maxBounds: [[54.13, 24.5], [56.4, 25.7]],
      scrollZoom: !disableScrollZoom
    });

    if (typeof window !== 'undefined') {
      window.map = map.current;
    }

    map.current.on('load', () => {
      if (!map.current) return;
      
      setIsMapLoaded(true);

      const processedData = selectedFilter === 'Area' 
        ? addPopulation(dataRef.current.geojsonData, dataRef.current.New_Population) 
        : addPopulation(dataRef.current.dubaiWEBDATA, dataRef.current.New_Population);

      map.current.addSource('dubai-communities', {
        type: 'geojson',
        data: processedData,
      });

      map.current.addLayer({
        id: 'dubai-communities-fill',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': getColorScheme(selectedFilter),
          'fill-opacity': 0.7
        }
      });

      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8
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
          'text-offset': [0, 0]
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      setupInteractions();
      setupMarker();
      setupControls();
    });

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
        if (error || !map.current) return;
        
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
      if (clickPopupRef.current) clickPopupRef.current.remove();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [selectedFilter, dataLoaded, disableScrollZoom, addPopulation, getColorScheme]);

  // Update data when filter changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !dataLoaded) return;

    const newData = selectedFilter === 'Area' 
      ? addPopulation(dataRef.current.geojsonData, dataRef.current.New_Population) 
      : addPopulation(dataRef.current.dubaiWEBDATA, dataRef.current.New_Population);

    const source = map.current.getSource('dubai-communities');
    if (source) {
      source.setData(newData);
    }

    const layer = map.current.getLayer('dubai-communities-fill');
    if (layer) {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme(selectedFilter));
    }
  }, [selectedFilter, isMapLoaded, dataLoaded, addPopulation, getColorScheme]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full relative" style={{ pointerEvents: 'auto' }}>
      {!isMapLoaded && hasValidToken && (
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
      />
      
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

export default Map;