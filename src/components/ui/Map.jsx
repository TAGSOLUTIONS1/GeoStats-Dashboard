import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { New_Population } from '../../data/new_population';
import propertyInsights from '../../data/properties/insights.json';
import propertyListings from '../../data/properties/listings.json';
import { addPropertyMetricsToGeoJSON } from '../../services/property';

const PROPERTY_DATA_POINT_IDS = [
  'property-combo-counts',
  'property-type-counts',
  'property-furnishing-counts',
  'property-avg-rent-beds-type',
  'property-avg-rent-baths-type',
  'property-rent-per-sqft-location',
];

const Map = ({ selectedFilter, disableScrollZoom = false, selectedDataPoint = null }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new window.Map());

  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;
  const isPropertyMode = PROPERTY_DATA_POINT_IDS.includes(selectedDataPoint);

  const isMobile = () => window.innerWidth <= 780;

  const addPopulation = useCallback((geojson, populationArray) => {
    const cacheKey = `population-${selectedFilter}-${geojson.features?.length || 0}`;

    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

    const popMap = new window.Map();
    populationArray.forEach((pop) => {
      const code = pop['Community Code'];
      if (code) {
        const populationStr = (pop['مجموع السكان\nTotal population'] || '0').replace(/,/g, '');
        popMap.set(code, {
          Population_New: parseInt(populationStr, 10) || 0,
          Area_New: parseFloat(pop['المساحة كم2\nArea km2']) || 0,
          PopDensity_New: parseFloat(pop['الكثافة السكانية (فرد/كم2)\nPopulation Density (person/km2)']) || 0,
        });
      }
    });

    const processedGeojson = {
      ...geojson,
      features: geojson.features.map((feature) => {
        const popData = popMap.get(feature.properties?.COMM_NUM);
        if (!popData) return feature;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...popData,
          },
        };
      }),
    };

    processedDataCache.current.set(cacheKey, processedGeojson);
    return processedGeojson;
  }, [selectedFilter]);

  const addPropertyInsights = useCallback((geojson) => {
    const cacheKey = `property-${selectedFilter}-${geojson.features?.length || 0}`;
    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

    const processed = addPropertyMetricsToGeoJSON(geojson, propertyListings, propertyInsights);
    processedDataCache.current.set(cacheKey, processed);
    return processed;
  }, [selectedFilter]);

  const getMapData = useCallback(() => {
    const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
    return isPropertyMode ? addPropertyInsights(baseGeoJSON) : addPopulation(baseGeoJSON, New_Population);
  }, [selectedFilter, isPropertyMode, addPopulation, addPropertyInsights]);

  const getColorScheme = useCallback(() => {
    if (!isPropertyMode) {
      const baseExpression = ['case', ['has', 'Population_New'], ['get', 'Population_New'], ['get', 'Population 2019']];
      return [
        'interpolate', ['linear'], baseExpression,
        0, '#ffebee',
        1000, '#ffcdd2',
        5000, '#ef9a9a',
        10000, '#e57373',
        20000, '#d32f2f',
        50000, '#b71c1c',
      ];
    }

    if (selectedDataPoint === 'property-rent-per-sqft-location') {
      return [
        'case', ['==', ['get', 'property_avg_rent_per_sqft'], null], '#e0e0e0',
        ['interpolate', ['linear'], ['get', 'property_avg_rent_per_sqft'],
          0, '#e3f2fd', 80, '#90caf9', 140, '#42a5f5', 220, '#1e88e5', 300, '#0d47a1'
        ],
      ];
    }

    if (selectedDataPoint === 'property-furnishing-counts') {
      return [
        'case', ['==', ['get', 'property_furnished_share'], null], '#e0e0e0',
        ['interpolate', ['linear'], ['get', 'property_furnished_share'],
          0, '#fff3e0', 25, '#ffcc80', 50, '#ffb74d', 75, '#fb8c00', 100, '#e65100'
        ],
      ];
    }

    if (selectedDataPoint === 'property-avg-rent-beds-type' || selectedDataPoint === 'property-avg-rent-baths-type') {
      return [
        'case', ['==', ['get', 'property_avg_rent'], null], '#e0e0e0',
        ['interpolate', ['linear'], ['get', 'property_avg_rent'],
          0, '#e8f5e9', 80000, '#a5d6a7', 160000, '#66bb6a', 240000, '#43a047', 320000, '#1b5e20'
        ],
      ];
    }

    return [
      'case', ['==', ['get', 'property_listing_count'], null], '#e0e0e0',
      ['interpolate', ['linear'], ['get', 'property_listing_count'],
        0, '#ede7f6', 20, '#d1c4e9', 60, '#b39ddb', 120, '#7e57c2', 200, '#512da8'
      ],
    ];
  }, [isPropertyMode, selectedDataPoint]);

  const getTextFieldExpression = useCallback(() => {
    if (!isPropertyMode) {
      return [
        'format',
        ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
        '\n',
        [
          'case',
          ['has', 'Population_New'],
          ['case', ['>', ['get', 'Population_New'], 0], ['number-format', ['get', 'Population_New'], { 'locale': 'en-US' }], 'No Data'],
          ['case', ['has', 'Population 2019'], ['case', ['>', ['get', 'Population 2019'], 0], ['number-format', ['get', 'Population 2019'], { 'locale': 'en-US' }], 'No Data'], 'No Data'],
        ],
        { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] },
      ];
    }

    let valueExpr;
    if (selectedDataPoint === 'property-rent-per-sqft-location') {
      valueExpr = ['case', ['!=', ['get', 'property_avg_rent_per_sqft'], null], ['concat', 'AED ', ['number-format', ['get', 'property_avg_rent_per_sqft'], { 'locale': 'en-US', 'min-fraction-digits': 1, 'max-fraction-digits': 1 }], '/sqft'], 'No Data'];
    } else if (selectedDataPoint === 'property-furnishing-counts') {
      valueExpr = ['case', ['!=', ['get', 'property_furnished_share'], null], ['concat', ['number-format', ['get', 'property_furnished_share'], { 'locale': 'en-US', 'min-fraction-digits': 0, 'max-fraction-digits': 1 }], '% Furnished'], 'No Data'];
    } else if (selectedDataPoint === 'property-avg-rent-beds-type' || selectedDataPoint === 'property-avg-rent-baths-type') {
      valueExpr = ['case', ['!=', ['get', 'property_avg_rent'], null], ['concat', 'AED ', ['number-format', ['get', 'property_avg_rent'], { 'locale': 'en-US', 'max-fraction-digits': 0 }]], 'No Data'];
    } else {
      valueExpr = ['case', ['!=', ['get', 'property_listing_count'], null], ['concat', ['number-format', ['get', 'property_listing_count'], { 'locale': 'en-US' }], ' Listings'], 'No Data'];
    }

    return [
      'format',
      ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
      '\n',
      valueExpr,
      { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] },
    ];
  }, [isPropertyMode, selectedDataPoint]);

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!token || token === 'your_mapbox_access_token_here' || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom,
      maxBounds: [[54.13, 24.5], [56.4, 25.7]],
      scrollZoom: !disableScrollZoom,
    });

    window.map = map.current;

    map.current.on('load', () => {
      if (!map.current) return;
      setIsMapLoaded(true);

      map.current.addSource('dubai-communities', {
        type: 'geojson',
        data: getMapData(),
      });

      map.current.addLayer({
        id: 'dubai-communities-fill',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': getColorScheme(),
          'fill-opacity': 0.7,
        },
      });

      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8,
        },
      });

      map.current.addLayer({
        id: 'dubai-communities-name',
        type: 'symbol',
        source: 'dubai-communities',
        layout: {
          'text-field': getTextFieldExpression(),
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-justify': 'center',
          'text-anchor': 'center',
          'text-offset': [0, 0],
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
      });

      setupInteractions();
      setupMarker();
      setupControls();
    });

    function setupInteractions() {
      if (!map.current) return;

      const dispatchAreaSelectionEvent = (props, lngLat) => {
        const placeName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';

        if (isPropertyMode) {
          window.dispatchEvent(new CustomEvent('property:areaClicked', {
            detail: {
              areaName: placeName,
              selectedDataPoint,
              lngLat,
              areaMetrics: {
                listingCount: props.property_listing_count,
                avgRent: props.property_avg_rent,
                avgRentPerSqft: props.property_avg_rent_per_sqft,
                furnishedShare: props.property_furnished_share,
                dominantType: props.property_dominant_type,
                matchedLocation: props.property_source_location,
              },
            },
          }));
          return;
        }

        window.dispatchEvent(new CustomEvent('map:placeSelected', {
          detail: { placeName, lngLat },
        }));
      };

      const getValueLabels = (props) => {
        if (!isPropertyMode) {
          const val = props['Population_New'] || props['Area_New'] || props['PopDensity_New'] || null;
          const formatted = new Intl.NumberFormat('en-US').format(val);
          return {
            valueLabel: val != null ? `<br/>Population: ${formatted}` : '',
            valueLabel2: val != null ? `<br/>Area km²: ${props['Area_New']}` : '',
            valueLabel3: val != null ? `<br/>Population Density: ${props['PopDensity_New']}` : '',
          };
        }

        const listingCount = props.property_listing_count;
        const avgRent = props.property_avg_rent;
        const avgRentSqft = props.property_avg_rent_per_sqft;
        const furnishedShare = props.property_furnished_share;
        const dominantType = props.property_dominant_type;
        const sourceLocation = props.property_source_location;

        let valueLabel = '';
        let valueLabel2 = '';
        if (selectedDataPoint === 'property-rent-per-sqft-location') {
          valueLabel = avgRentSqft != null ? `<br/>Rent/sqft: AED ${Number(avgRentSqft).toFixed(2)}` : '<br/>Rent/sqft: No Data';
          valueLabel2 = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '';
        } else if (selectedDataPoint === 'property-furnishing-counts') {
          valueLabel = furnishedShare != null ? `<br/>Furnished Share: ${Number(furnishedShare).toFixed(1)}%` : '<br/>Furnished Share: No Data';
          valueLabel2 = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '';
        } else if (selectedDataPoint === 'property-avg-rent-beds-type' || selectedDataPoint === 'property-avg-rent-baths-type') {
          valueLabel = avgRent != null ? `<br/>Avg Rent: AED ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(avgRent)}` : '<br/>Avg Rent: No Data';
          valueLabel2 = dominantType ? `<br/>Dominant Type: ${dominantType}` : '';
        } else {
          valueLabel = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '<br/>Listings: No Data';
          valueLabel2 = dominantType ? `<br/>Dominant Type: ${dominantType}` : '';
        }

        const valueLabel3 = sourceLocation ? `<br/>Matched Location: ${sourceLocation}` : '';
        return { valueLabel, valueLabel2, valueLabel3 };
      };

      if (isMobile()) {
        map.current.on('click', 'dubai-communities-fill', (e) => {
          if (clickPopupRef.current) clickPopupRef.current.remove();

          const props = e.features[0].properties;
          const { valueLabel, valueLabel2, valueLabel3 } = getValueLabels(props);

          const buttonHtml = `
            <button id="show-graph-btn" style="margin-top:10px;width:100%;padding:8px 12px;background-color:#3696A8;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;">
              Show Graph
            </button>
          `;

          const tooltipHTML = `
            <div style="padding: 8px;">
              <strong style="display: block; margin-bottom: 8px;">${props.CNAME_E}</strong>
              ${valueLabel}${valueLabel2}${valueLabel3}
              ${buttonHtml}
            </div>
          `;

          const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '320px', closeOnClick: false })
            .setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);

          clickPopupRef.current = popup;

          setTimeout(() => {
            const btn = document.getElementById('show-graph-btn');
            if (btn) {
              btn.onclick = () => {
                dispatchAreaSelectionEvent(props, e.lngLat);
                popup.remove();
                clickPopupRef.current = null;
              };
            }
          }, 50);
        });
      } else {
        const hoverTooltip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '320px' });

        map.current.on('mousemove', 'dubai-communities-fill', (e) => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          const { valueLabel, valueLabel2, valueLabel3 } = getValueLabels(props);
          hoverTooltip.setLngLat(e.lngLat).setHTML(`<strong>${props.CNAME_E}</strong>${valueLabel}${valueLabel2}${valueLabel3}`).addTo(map.current);
        });

        map.current.on('mouseleave', 'dubai-communities-fill', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          hoverTooltip.remove();
        });

        map.current.on('click', 'dubai-communities-fill', (e) => {
          const props = e.features[0].properties;
          dispatchAreaSelectionEvent(props, e.lngLat);
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
          data: { type: 'FeatureCollection', features: [] },
        });

        map.current.addLayer({
          id: 'search-result-marker',
          type: 'symbol',
          source: 'search-result',
          layout: {
            'icon-image': 'search-marker',
            'icon-size': 0.09,
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
          },
        });
      });

      window.highlightSearchResult = (coordinates) => {
        if (!coordinates || !map.current || !map.current.getSource('search-result')) return;
        map.current.getSource('search-result').setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {},
          }],
        });
      };
    }

    function setupControls() {
      if (!map.current) return;
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }), 'bottom-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
      map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    }

    return () => {
      if (clickPopupRef.current) clickPopupRef.current.remove();
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, [disableScrollZoom, getMapData, getColorScheme, getTextFieldExpression, isPropertyMode, selectedDataPoint]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const source = map.current.getSource('dubai-communities');
    if (source) {
      source.setData(getMapData());
    }

    const layer = map.current.getLayer('dubai-communities-fill');
    if (layer) {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme());
    }

    const labelLayer = map.current.getLayer('dubai-communities-name');
    if (labelLayer) {
      map.current.setLayoutProperty('dubai-communities-name', 'text-field', getTextFieldExpression());
    }
  }, [isMapLoaded, getMapData, getColorScheme, getTextFieldExpression]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
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

      <div ref={mapContainer} className="w-full h-full" />

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
