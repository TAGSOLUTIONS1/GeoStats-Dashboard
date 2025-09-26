import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';

const Map = ({selectedFilter}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  console.log('Map render - selectedFilter:', selectedFilter);

  // Dubai coordinates
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 8.5;

  useEffect(() => {
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!token || token === 'your_mapbox_access_token_here') {
      return;
    }
    mapboxgl.accessToken = token;
    if (map.current) return;

    // Create refs outside event handlers
    let hoverPopup = null;
    let hoveredStateId = null;
    let hoverTimeout = null;
    

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
      maxBounds: [
        [54.13, 24.5], // Southwest coordinates (approximate for Dubai)
        [56.4, 25.7]  // Northeast coordinates (approximate for Dubai)
      ]
    });

    window.map = map.current; // Expose map instance globally

    map.current.on('load', () => {
      // Add GeoJSON source
      map.current.addSource('dubai-communities', {
        type: 'geojson',
        data: selectedFilter === 'Area' ? geojsonData : dubaiGeoData
      });

      // Add outline layer
      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#1976d2',
          'line-width': 1.5
        }
      });

      // Add fill layer
      map.current.addLayer({
        id: 'dubai-communities-fill',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'Population 2019'],
            0, '#e1f5fe',
            1000, '#81d4fa',
            5000, '#4fc3f7',
            10000, '#29b6f6',
            20000, '#03a9f4',
            50000, '#0288d1'
          ],
          'fill-opacity': 0.3
        }
      });

      // Add name + population labels
        map.current.addLayer({
          id: 'dubai-communities-name',
          type: 'symbol',
          source: 'dubai-communities',
          layout: {
            // Show Community Name and Population
            'text-field': [
              'format',
              ['get', 'CNAME_E'], { 'font-scale': 1.1 },
              '\n', {},
              '', {},
              ['get', 'Population 2019'], { 'font-scale': 0.7 }
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
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

      // Simple hover tooltip
      let tooltip = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
       // Hover events
      map.current.on('mousemove', 'dubai-communities-fill', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const props = e.features[0].properties;
        // Determine selected data point (default to 'population')
        const selected = (typeof window !== 'undefined' && window.selectedDataPoint) ? window.selectedDataPoint : 'population';
        // Map selected key to property in geojson
        let valueLabel = '';
        if (selected === 'population') {
          const val = props['Population 2019'] || props['Population 2018'] || props['Population'] || null;
          valueLabel = val != null ? `<br/>Population: ${val}` : '';
        }

        tooltip.setLngLat(e.lngLat)
          .setHTML(`<strong>${props.CNAME_E}</strong>${valueLabel}`)
          .addTo(map.current);
      });

      map.current.on('mouseleave', 'dubai-communities-fill', () => {
        map.current.getCanvas().style.cursor = '';
        tooltip.remove();
      });

      // Click: dispatch custom event so Layout can open a modal
      map.current.on('click', 'dubai-communities-fill', (e) => {
        const props = e.features[0].properties;
        const detail = {
          placeName: props.COMMUNITY_E || props.CNAME_E || 'Selected Area',
          lngLat: e.lngLat,
        };
        window.dispatchEvent(new CustomEvent('map:placeSelected', { detail }));
      });

      // Load custom marker image
      map.current.loadImage('/logo/geo_stats.png', (error, image) => {
        if (error) throw error;
        
        // Add the image to the map's style
        map.current.addImage('search-marker', image);

        // Add source for search result marker
        map.current.addSource('search-result', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add symbol layer using the custom image
        map.current.addLayer({
          id: 'search-result-marker',
          type: 'symbol',
          source: 'search-result',
          layout: {
            'icon-image': 'search-marker',
            'icon-size': 0.09, // Adjust size as needed
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom' // Places bottom of image at the coordinates
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
      if (hoverTimeout) clearTimeout(hoverTimeout);
      // if (map.current) map.current.remove();
    };
  }, []);

  // Effect 2: update data when filter changes
useEffect(() => {
  if (!map.current) return;

  const newData = selectedFilter === 'Area' ? geojsonData : dubaiGeoData;

  if (map.current.getSource('dubai-communities')) {
    map.current.getSource('dubai-communities').setData(newData);
  }
}, [selectedFilter]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      {!hasValidToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div>
            <h2>Mapbox Setup Required</h2>
            <p>Add your Mapbox token to .env</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;