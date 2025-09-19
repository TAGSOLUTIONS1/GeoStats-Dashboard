import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geojsonData } from '../../data/geoData';

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [lng, setLng] = useState(55.3);
  const [lat, setLat] = useState(25.15);
  const [zoom, setZoom] = useState(8.5);

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

  // const bounds = map.current.getBounds();
  //   console.log('SW:', bounds.getSouthWest().lng, bounds.getSouthWest().lat);
  // console.log('NE:', bounds.getNorthEast().lng, bounds.getNorthEast().lat);

    map.current.on('load', () => {
      // Add GeoJSON source
      map.current.addSource('dubai-communities', {
        type: 'geojson',
        data: geojsonData
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

      // Add outline layer
      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#1976d2',
          'line-width': 2
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
        tooltip.setLngLat(e.lngLat)
          .setHTML(`<strong>${props.CNAME_E}</strong>`)
          .addTo(map.current);
      });

      map.current.on('mouseleave', 'dubai-communities-fill', () => {
        map.current.getCanvas().style.cursor = '';
        tooltip.remove();
      });

      // Click: show detailed info
      map.current.on('click', 'dubai-communities-fill', (e) => {
        const props = e.features[0].properties;
        const infoHtml = `
          <strong>${props.COMMUNITY_E}</strong><br/>
          Sector: ${props.Sector}<br/>
          Area: ${props["Area Sq Km"]} km²<br/>
          Population (2019): ${props["Population 2019"]}
        `;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(infoHtml)
          .addTo(map.current);
      });

      
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