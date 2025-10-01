import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { EmiratesData } from '../../data/Emirates';
import { New_Population } from '../../data/new_population';

const Map = ({selectedFilter}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);


  // Dubai coordinates
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

    function addPopulation(geojson, populationArray) {
      populationArray.forEach(pop => {
        const communityCode = pop["Community Code"];
        
        // Find matching feature by COMM_NUM
        const feature = geojson.features.find(f => f.properties.COMM_NUM === communityCode);
        
        if (feature) {
          // Add new fields or update if already exist
          feature.properties.Population_New = parseInt(
            (pop["مجموع السكان\nTotal population"] || "0").replace(/,/g, ""),
            10
          );
          feature.properties.Area_New = parseFloat(pop["المساحة كم2\nArea km2"]) || 0;
          feature.properties.PopDensity_New = parseFloat(
            pop["الكثافة السكانية (فرد/كم2)\nPopulation Density (person/km2)"]
          ) || 0;
        }
      });
      return geojson;
    }

    // Example usage:
    // const mergedGeojson = addPopulation(geojsonData, New_Population);
    // console.log("cobmined " , mergedGeojson);

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
        // data: selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA ,
        data: selectedFilter === 'Area' ? addPopulation(geojsonData, New_Population) : addPopulation(dubaiWEBDATA,New_Population),
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
              0,     '#ffebee', // very light rose
              1000,  '#ffcdd2', // soft pink
              5000,  '#ef9a9a', // light red
              10000, '#e57373', // medium red
              20000, '#d32f2f', // Emirates red
              50000, '#b71c1c'  // deep maroon red
          ],
          'fill-opacity': 0.7
        }
      });

            // Add outline layer
      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8
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
            ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
            '\n',
            ['number-format', ['get', 'Population_New'], { 'locale': 'en-US' }],
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
        let valueLabel2 = '';
        let valueLabel3 = '';

        if (selected === 'population') {
          const val = props['Population_New'] || props['Area_New'] || props['PopDensity_New'] || null;
          const formatted = new Intl.NumberFormat('en-US').format(val);
          valueLabel = val != null ? `<br/>Population: ${formatted}` : '';
          valueLabel2 = val != null ? `<br/>Area km\u00B2: ${props['Area_New']}` : '';
          valueLabel3 = val != null ? `<br/>Population Density: ${props['PopDensity_New']}` : '';
        }

        tooltip.setLngLat(e.lngLat)
          .setHTML(`<strong>${props.CNAME_E}</strong>${valueLabel}</strong>${valueLabel2}</strong>${valueLabel3}`)
          .addTo(map.current);
      });

      map.current.on('mouseleave', 'dubai-communities-fill', () => {
        map.current.getCanvas().style.cursor = '';
        tooltip.remove();
      });

      // Click: dispatch custom event so Layout can open a modal
      map.current.on('click', 'dubai-communities-fill', (e) => {
        const props = e.features[0].properties;
        // const population=features
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

  const newData = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;

  if (map.current.getSource('dubai-communities')) {
    map.current.getSource('dubai-communities').setData(newData);
  }

  // ✅ Update fill color dynamically when filter changes
  if (map.current.getLayer('dubai-communities-fill')) {
    if (selectedFilter === 'Area') {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'Population 2019'],
        0, '#ffebee',
        1000, '#ffcdd2',
        5000, '#ef9a9a',
        10000, '#e57373',
        20000, '#d32f2f',
        50000, '#b71c1c'
      ]);
    } else if (selectedFilter === 'Emirate') {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'Population 2019'],
        0, '#ef9a9a',
  ]);
    }
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