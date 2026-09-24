import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { mapDataPoints, getValuesByCommunity } from '../../services/communityData';
import { New_Population } from '../../data/new_population';


// The value printed under each community name. It follows the selected data
// point so the number always matches what the fill colour is showing.
const buildLabelExpression = (selected) => {
  const cfg = selected ? mapDataPoints[selected] : null;

  const valueExpr = cfg
    ? [
        'case',
        ['has', cfg.property],
        [
          'concat',
          [
            'number-format',
            cfg.labelDivisor
              ? ['/', ['get', cfg.property], cfg.labelDivisor]
              : ['get', cfg.property],
            {
              'locale': 'en-US',
              'min-fraction-digits': cfg.labelDigits ?? 1,
              'max-fraction-digits': cfg.labelDigits ?? 1,
            },
          ],
          cfg.labelSuffix || '',
        ],
        'No Data',
      ]
    : [
        'case',
        ['has', 'Population_New'],
        [
          'case',
          ['>', ['get', 'Population_New'], 0],
          ['number-format', ['get', 'Population_New'], { 'locale': 'en-US' }],
          'No Data',
        ],
        [
          'case',
          ['has', 'Population 2019'],
          [
            'case',
            ['>', ['get', 'Population 2019'], 0],
            ['number-format', ['get', 'Population 2019'], { 'locale': 'en-US' }],
            'No Data',
          ],
          'No Data',
        ],
      ];

  return [
    'format',
    ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
    '\n',
    valueExpr,
    { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] },
  ];
};

const Map = ({ selectedFilter, disableScrollZoom = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new window.Map());
  
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

  const isMobile = () => window.innerWidth <= 780;

  // Track the selected data point so the fill colour can follow it.
  const [activeDataPoint, setActiveDataPoint] = useState(
    typeof window !== 'undefined' ? window.selectedDataPoint : null
  );

  useEffect(() => {
    const onChange = (e) => setActiveDataPoint(e.detail?.dataPointId || null);
    window.addEventListener('sidebar:dataPointSelected', onChange);
    return () => window.removeEventListener('sidebar:dataPointSelected', onChange);
  }, []);

  // Optimized data processing with caching
  const addPopulation = useCallback((geojson, populationArray) => {
    const cacheKey = `${selectedFilter}-${geojson.features?.length || 0}`;
    
    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

     const popMap = new window.Map();
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

    // Per-community OSM metrics, resolved once rather than per feature.
    const osmLayers = Object.keys(mapDataPoints)
      .map((id) => ({
        property: mapDataPoints[id].property,
        values: getValuesByCommunity(id) || {},
      }));

    const processedGeojson = {
      ...geojson,
      features: geojson.features.map(feature => {
        const code = feature.properties?.COMM_NUM;
        const popData = popMap.get(code);
        const osmData = {};
        osmLayers.forEach(({ property, values }) => {
          const value = values[code];
          if (value != null) osmData[property] = value;
        });

        if (!popData && !osmLayers.length) return feature;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...popData,
            ...osmData
          }
        };
      })
    };

    processedDataCache.current.set(cacheKey, processedGeojson);
    return processedGeojson;
  }, [selectedFilter]);

  const getColorScheme = useCallback((filterType) => {
    // If an OSM-backed data point is selected, colour by that metric instead.
    const selected = typeof window !== 'undefined' ? window.selectedDataPoint : null;
    const osmCfg = selected ? mapDataPoints[selected] : null;
    if (osmCfg) {
      const palette = osmCfg.palette;
      const stops = [];
      osmCfg.stops.forEach((stop, i) => stops.push(stop, palette[i]));
      return [
        'case',
        ['has', osmCfg.property],
        ['interpolate', ['linear'], ['get', osmCfg.property], ...stops],
        '#e0e0e0'
      ];
    }

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

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
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

    window.map = map.current;

    map.current.on('load', () => {
      if (!map.current) return;
      
      setIsMapLoaded(true);

      const processedData = selectedFilter === 'Area' 
        ? addPopulation(geojsonData, New_Population) 
        : addPopulation(dubaiWEBDATA, New_Population);

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
          'text-field': buildLabelExpression(
            typeof window !== 'undefined' ? window.selectedDataPoint : null
          ),
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

        const osmCfg = mapDataPoints[selected];
        if (osmCfg) {
          const value = props[osmCfg.property];
          if (value == null) {
            valueLabel = `<br/>${osmCfg.label}: no data`;
          } else {
            valueLabel = `<br/>${osmCfg.label}: ${Number(value).toFixed(2)}`;
            valueLabel2 = `<br/>Area km²: ${props['Area Sq Km'] ? Number(props['Area Sq Km']).toFixed(1) : 'n/a'}`;
            valueLabel3 = `<br/><span style="opacity:.7">Source: ${osmCfg.source}</span>`;
          }
          return { valueLabel, valueLabel2, valueLabel3 };
        }

        if (selected === 'population') {
          const val = props['Population_New'] || props['Area_New'] || props['PopDensity_New'] || null;
          const formatted = new Intl.NumberFormat('en-US').format(val);
          valueLabel = val != null ? `<br/>Population: ${formatted}` : '';
          valueLabel2 = val != null ? `<br/>Area km²: ${props['Area_New']}` : '';
          valueLabel3 = val != null ? `<br/>Population Density: ${props['PopDensity_New']}` : '';
        }

        return { valueLabel, valueLabel2, valueLabel3 };
      };

      // Phone card: the painted value as the headline figure, supporting
      // numbers as chips, and the source spelled out. Structure rather than a
      // run of <br/> lines, so it can be styled (.geo-popup-* in index.css).
      const getValueParts = (props) => {
        const selected = (typeof window !== 'undefined' && window.selectedDataPoint)
          ? window.selectedDataPoint : 'population';
        const num = (v, digits) => Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });
        const ok = (v) => v != null && v !== '' && Number.isFinite(Number(v));
        const chips = [];
        const areaKm = ok(props['Area Sq Km']) ? props['Area Sq Km'] : props['Area_New'];
        if (ok(areaKm)) chips.push(['Area', `${num(areaKm, 1)} km²`]);

        const osmCfg = mapDataPoints[selected];
        if (osmCfg) {
          const value = props[osmCfg.property];
          return {
            label: osmCfg.label,
            value: ok(value) ? num(value, 2) : null,
            chips,
            source: osmCfg.source,
          };
        }

        if (ok(props['PopDensity_New'])) chips.push(['Density', `${num(props['PopDensity_New'], 0)} /km²`]);
        return {
          label: 'Residents',
          value: ok(props['Population_New']) ? num(props['Population_New'], 0) : null,
          chips,
          source: 'Dubai Statistics Center',
        };
      };

      const buildCardHTML = (title, parts, ctaLabel, ctaId) => `
        <div class="geo-popup-card">
          <div class="geo-popup-head">
            <div class="geo-popup-eyebrow">Community</div>
            <div class="geo-popup-title">${title}</div>
          </div>
          <div class="geo-popup-body">
            <div class="geo-popup-metric-label">${parts.label}</div>
            ${parts.value == null
              ? '<div class="geo-popup-value geo-popup-value--empty">No data for this community</div>'
              : `<div class="geo-popup-value">${parts.value}</div>`}
            ${parts.chips.length
              ? `<div class="geo-popup-rows">${parts.chips
                  .map(([k, v]) => `<span class="geo-popup-chip">${k} <b>${v}</b></span>`)
                  .join('')}</div>`
              : ''}
            ${parts.source ? `<div class="geo-popup-source">Source: ${parts.source}</div>` : ''}
            <button id="${ctaId}" class="geo-popup-cta" type="button">
              ${ctaLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      `;

      if (isMobile()) {
        map.current.on('click', 'dubai-communities-fill', (e) => {
          if (clickPopupRef.current) clickPopupRef.current.remove();

          const props = e.features[0].properties;
          const placeName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
          const tooltipHTML = buildCardHTML(
            props.CNAME_E,
            getValueParts(props),
            'View price history',
            'show-graph-btn'
          );

          const popup = new mapboxgl.Popup({ 
            closeButton: true, 
            maxWidth: '300px',
            closeOnClick: false,
            className: 'geo-popup'
          })
            .setLngLat(e.lngLat)
            .setHTML(tooltipHTML)
            .addTo(map.current);

          clickPopupRef.current = popup;

          const closeLabel = popup.getElement()?.querySelector('.mapboxgl-popup-close-button');
          if (closeLabel) closeLabel.setAttribute('aria-label', 'Close');

          // The card is taller than the map's own controls, so nudge the map
          // when it would open under the header or the bottom bar rather than
          // letting it sit half off screen.
          const keepCardInView = () => {
            const el = popup.getElement();
            if (!el || !map.current) return;
            const r = el.getBoundingClientRect();
            const c = map.current.getContainer().getBoundingClientRect();
            const inset = { top: 104, bottom: 96, side: 10 }; // header, bottom bar, gutters
            let dx = 0;
            let dy = 0;
            if (r.left < c.left + inset.side) dx = r.left - (c.left + inset.side);
            else if (r.right > c.right - inset.side) dx = r.right - (c.right - inset.side);
            if (r.top < c.top + inset.top) dy = r.top - (c.top + inset.top);
            else if (r.bottom > c.bottom - inset.bottom) dy = r.bottom - (c.bottom - inset.bottom);
            if (dx || dy) map.current.panBy([dx, dy], { duration: 320 });
          };
          setTimeout(keepCardInView, 60);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, addPopulation, getColorScheme]);

  // Update data when filter changes. The features already carry every data
  // point's value (addPopulation merges them once per filter), so a change of
  // data point does not need the GeoJSON re-uploaded.
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const newData = selectedFilter === 'Area' 
      ? addPopulation(geojsonData, New_Population) 
      : addPopulation(dubaiWEBDATA, New_Population);

    const source = map.current.getSource('dubai-communities');
    if (source) {
      source.setData(newData);
    }
  }, [selectedFilter, isMapLoaded, addPopulation]);

  // Recolour and relabel when the data point (or filter) changes. Deferred by
  // one task so that a drawer or menu closed by the same tap paints its first
  // frame before the map restyle starts.
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const id = setTimeout(() => {
      if (!map.current) return;
      if (map.current.getLayer('dubai-communities-fill')) {
        map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme(selectedFilter));
      }

      // Keep the printed number in step with the fill colour.
      if (map.current.getLayer('dubai-communities-name')) {
        map.current.setLayoutProperty(
          'dubai-communities-name',
          'text-field',
          buildLabelExpression(typeof window !== 'undefined' ? window.selectedDataPoint : null)
        );
      }
    }, 0);
    return () => clearTimeout(id);
  }, [selectedFilter, isMapLoaded, getColorScheme, activeDataPoint]);

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