import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geojsonData } from '../../data/geoData';

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [lng, setLng] = useState(55.296249);
  const [lat, setLat] = useState(25.276987);
  const [zoom, setZoom] = useState(10);

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
      zoom: zoom
    });

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
          'fill-opacity': 0.6
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

      // Add hover layer
      map.current.addLayer({
        id: 'dubai-communities-hover',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': '#ff6b6b',
          'fill-opacity': 0.3
        },
        filter: ['==', 'COMM_NUM', '']
      });

      // Add popup on click
      map.current.on('click', 'dubai-communities-fill', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${props.CNAME_E}</strong><br/>Population: ${props['Population 2019']}`)
          .addTo(map.current);
      });

      // Hover effect
      map.current.on('mouseenter', 'dubai-communities-fill', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          map.current.setFilter('dubai-communities-hover', ['==', 'COMM_NUM', e.features[0].properties.COMM_NUM]);
        }
      });
      map.current.on('mouseleave', 'dubai-communities-fill', () => {
        map.current.getCanvas().style.cursor = '';
        map.current.setFilter('dubai-communities-hover', ['==', 'COMM_NUM', '']);
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [lng, lat, zoom]);

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