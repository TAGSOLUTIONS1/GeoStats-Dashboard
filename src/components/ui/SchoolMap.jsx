import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import schoolsData from '../../data/schools.json';
import { addSchoolCountsToGeoJSON } from '../../services/school';

const SchoolMap = ({ selectedFilter, disableScrollZoom = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new window.Map());
  
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

  const isMobile = () => window.innerWidth <= 780;

  // Process GeoJSON with school counts
  const processGeoJSONWithSchools = useCallback((geojson) => {
    const cacheKey = `schools-${selectedFilter}-${geojson.features?.length || 0}`;
    
    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

    const processed = addSchoolCountsToGeoJSON(geojson);
    processedDataCache.current.set(cacheKey, processed);
    return processed;
  }, [selectedFilter]);

  // Color scheme for school counts
  const getSchoolColorScheme = useCallback(() => {
    return [
      'interpolate',
      ['linear'],
      ['get', 'SchoolCount'],
      0, '#e3f2fd',      // Light blue for 0 schools
      1, '#bbdefb',      // Light blue for 1-2 schools
      3, '#90caf9',      // Medium blue for 3-5 schools
      6, '#64b5f6',      // Blue for 6-10 schools
      11, '#42a5f5',     // Medium blue for 11-20 schools
      21, '#2196f3',     // Blue for 21-30 schools
      31, '#1e88e5',     // Darker blue for 31-50 schools
      51, '#1976d2',     // Dark blue for 51+ schools
      100, '#1565c0'     // Very dark blue for 100+ schools
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

      // Process GeoJSON with school counts
      const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
      const processedData = processGeoJSONWithSchools(baseGeoJSON);

      map.current.addSource('dubai-communities', {
        type: 'geojson',
        data: processedData,
      });

      // Fill layer for areas
      map.current.addLayer({
        id: 'dubai-communities-fill',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': getSchoolColorScheme(),
          'fill-opacity': 0.7
        }
      });

      // Stroke layer
      map.current.addLayer({
        id: 'dubai-communities-stroke',
        type: 'line',
        source: 'dubai-communities',
        paint: {
          'line-color': '#000000',
          'line-width': 0.8
        }
      });

      // Text layer showing school counts
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
              ['has', 'SchoolCount'],
              [
                'case',
                ['>', ['get', 'SchoolCount'], 0],
                [
                  'concat',
                  ['number-format', ['get', 'SchoolCount'], { 'locale': 'en-US' }],
                  ' Schools'
                ],
                'No Schools'
              ],
              'No Data'
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
      setupSchoolMarkers();
      setupMarker();
      setupControls();
    });

    function setupInteractions() {
      if (!map.current) return;

      const getSchoolLabels = (props) => {
        const schoolCount = props['SchoolCount'] || 0;
        const formatted = new Intl.NumberFormat('en-US').format(schoolCount);
        return {
          valueLabel: `<br/>Schools: ${formatted}`,
          valueLabel2: '',
          valueLabel3: ''
        };
      };

      if (isMobile()) {
        map.current.on('click', 'dubai-communities-fill', (e) => {
          if (clickPopupRef.current) clickPopupRef.current.remove();

          const props = e.features[0].properties;
          const placeName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
          const { valueLabel } = getSchoolLabels(props);

          const tooltipHTML = `
            <div style="padding: 8px;">
              <strong style="display: block; margin-bottom: 8px;">${props.CNAME_E}</strong>
              ${valueLabel}
              <button 
                id="show-schools-btn"
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
                View Schools
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
            const btn = document.getElementById('show-schools-btn');
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
          const { valueLabel } = getSchoolLabels(props);
          
          const tooltipHTML = `<strong>${props.CNAME_E}</strong>${valueLabel}`;

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

    function setupSchoolMarkers() {
      if (!map.current) return;

      // Create GeoJSON from schools data
      const schoolsGeoJSON = {
        type: 'FeatureCollection',
        features: schoolsData
          .filter(school => school.Latitude && school.Longitude)
          .map(school => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [school.Longitude, school.Latitude]
            },
            properties: {
              name: school['School Name'],
              location: school.Location,
              curriculum: school.Curriculum,
              grades: school.Grades,
              rating: school['Latest DSIB Rating'],
              enrollment: school['2024/25 Enrollments'],
              schoolId: school['School Name'] // Use name as unique ID
            }
          }))
      };

      // Add school markers source
      map.current.addSource('schools', {
        type: 'geojson',
        data: schoolsGeoJSON
      });

      // Add school markers layer
      map.current.addLayer({
        id: 'schools',
        type: 'circle',
        source: 'schools',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3696A8',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // Add selected school marker source
      map.current.addSource('selected-school', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add pulsing circle for selected school (behind the marker)
      map.current.addLayer({
        id: 'selected-school-pulse',
        type: 'circle',
        source: 'selected-school',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 15,
            1, 25
          ],
          'circle-color': '#FF6B35',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 0.4,
            1, 0
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FF6B35',
          'circle-stroke-opacity': 0.6
        }
      });

      // Add selected school marker (larger, highlighted circle)
      map.current.addLayer({
        id: 'selected-school-marker',
        type: 'circle',
        source: 'selected-school',
        paint: {
          'circle-radius': 12,
          'circle-color': '#FF6B35',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });

      // Try to load a school icon
      // map.current.loadImage('/logo/geo_stats.png', (error, image) => {
      //   if (!error && image && map.current) {
      //     map.current.addImage('school-icon', image);
          
      //     map.current.addLayer({
      //       id: 'selected-school-icon',
      //       type: 'symbol',
      //       source: 'selected-school',
      //       layout: {
      //         'icon-image': 'school-icon',
      //         'icon-size': 0.12,
      //         'icon-allow-overlap': true,
      //         'icon-ignore-placement': true,
      //         'icon-anchor': 'center'
      //       }
      //     });
      //   }
      // });

      // Add click handler for schools
      map.current.on('click', 'schools', (e) => {
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        
        // Highlight the clicked school
        if (window.highlightSchool) {
          window.highlightSchool(props.name, coordinates);
        }
        
        // Create popup content
        const popupHTML = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${props.name}</h3>
            ${props.location ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">📍 ${props.location}</p>` : ''}
            ${props.curriculum ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">📚 ${props.curriculum}</p>` : ''}
            ${props.grades ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">🎓 ${props.grades}</p>` : ''}
            ${props.rating ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">⭐ Rating: ${props.rating}</p>` : ''}
            ${props.enrollment ? `<p style="font-size: 12px; color: #666;">👥 Enrollment: ${props.enrollment.toLocaleString()}</p>` : ''}
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupHTML)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'schools', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'schools', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Function to highlight a selected school
      window.highlightSchool = (schoolName, coordinates) => {
        if (!map.current || !coordinates) return;
        
        const [lng, lat] = coordinates;
        
        // Update selected school marker
        const selectedSource = map.current.getSource('selected-school');
        if (selectedSource) {
          selectedSource.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: { name: schoolName, pulse: 0 }
            }]
          });
        }

        // Note: We use a separate layer for the selected school instead of modifying the schools layer

        // Animate pulse effect
        let pulseValue = 0;
        const pulseInterval = setInterval(() => {
          if (!map.current) {
            clearInterval(pulseInterval);
            return;
          }
          
          pulseValue = (pulseValue + 0.05) % 1;
          const selectedSource = map.current.getSource('selected-school');
          if (selectedSource) {
            const currentData = selectedSource._data;
            if (currentData.features.length > 0) {
              selectedSource.setData({
                ...currentData,
                features: [{
                  ...currentData.features[0],
                  properties: {
                    ...currentData.features[0].properties,
                    pulse: pulseValue
                  }
                }]
              });
            }
          }
        }, 50);

        // Store interval to clear it later
        if (!window.schoolPulseInterval) {
          window.schoolPulseInterval = pulseInterval;
        } else {
          clearInterval(window.schoolPulseInterval);
          window.schoolPulseInterval = pulseInterval;
        }
      };

      // Function to clear school highlight
      window.clearSchoolHighlight = () => {
        if (!map.current) return;
        
        const selectedSource = map.current.getSource('selected-school');
        if (selectedSource) {
          selectedSource.setData({ type: 'FeatureCollection', features: [] });
        }

        // Selection is cleared by removing the selected-school marker

        // Clear pulse interval
        if (window.schoolPulseInterval) {
          clearInterval(window.schoolPulseInterval);
          window.schoolPulseInterval = null;
        }
      };
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
  }, [selectedFilter, processGeoJSONWithSchools, getSchoolColorScheme]);

  // Update data when filter changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
    const newData = processGeoJSONWithSchools(baseGeoJSON);

    const source = map.current.getSource('dubai-communities');
    if (source) {
      source.setData(newData);
    }

    const layer = map.current.getLayer('dubai-communities-fill');
    if (layer) {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getSchoolColorScheme());
    }

    // Update text layer
    const textLayer = map.current.getLayer('dubai-communities-name');
    if (textLayer) {
      map.current.setLayoutProperty('dubai-communities-name', 'text-field', [
        'format',
        ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
        '\n',
        [
          'case',
          ['has', 'SchoolCount'],
          [
            'case',
            ['>', ['get', 'SchoolCount'], 0],
            [
              'concat',
              ['number-format', ['get', 'SchoolCount'], { 'locale': 'en-US' }],
              ' Schools'
            ],
            // 'No Schools'
          ],
          'No Data'
        ],
        { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }
      ]);
    }
  }, [selectedFilter, isMapLoaded, processGeoJSONWithSchools, getSchoolColorScheme]);

  const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  const hasValidToken = token && token !== 'your_mapbox_access_token_here';

  return (
    <div className="w-full h-full relative" style={{ pointerEvents: 'auto' }}>
      {!isMapLoaded && hasValidToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading school map...</p>
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

export default SchoolMap;

