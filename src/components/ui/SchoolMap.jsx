import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dubaiGeoData, geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import schoolsData from '../../data/schools/schools.json';
import { addSchoolCountsToGeoJSON, getSchoolsInArea, processEnrollmentData, processRatingDistribution } from '../../services/school';

const SchoolMap = ({ selectedFilter, disableScrollZoom = false, selectedDataPoint = null, filteredSchools = null }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new window.Map());
  
  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;

  const isMobile = () => window.innerWidth <= 780;

  // Rating mapping: number to text
  const RATING_MAP = {
    0: "Not yet inspected",
    1: "Unsatisfactory",
    2: "Acceptable",
    3: "Good",
    4: "Very Good",
    5: "Outstanding"
  };

  // Convert numeric rating to text
  const getRatingText = (rating) => {
    if (rating === null || rating === undefined || rating === '') return null;
    const ratingNum = typeof rating === 'number' ? rating : Number(rating);
    return RATING_MAP[ratingNum] || null;
  };

  // Determine visualization mode based on selected data point
  const visualizationMode = useMemo(() => {
    // Rating-related data points show average rating
    const ratingDataPoints = ['rating-distribution'];
    // Enrollment-related data points show total enrollment
    const enrollmentDataPoints = ['enrollment-growth'];
    // Fee-related data points show average fee
    const feeDataPoints = ['fee-distribution'];
    // Count-related data points show school count
    const countDataPoints = ['distribution-and-quality-analysis'];
    
    if (selectedDataPoint) {
      if (ratingDataPoints.includes(selectedDataPoint)) {
        return 'rating';
      } else if (enrollmentDataPoints.includes(selectedDataPoint)) {
        return 'enrollment';
      } else if (feeDataPoints.includes(selectedDataPoint)) {
        return 'fee';
      } else if (countDataPoints.includes(selectedDataPoint)) {
        return 'count';
      }
    }
    // Default to rating if no specific data point selected
    return 'rating';
  }, [selectedDataPoint]);

  // Process GeoJSON with school counts
  const processGeoJSONWithSchools = useCallback((geojson) => {
    const cacheKey = `schools-${selectedFilter}-${visualizationMode}-${geojson.features?.length || 0}`;
    
    if (processedDataCache.current.has(cacheKey)) {
      return processedDataCache.current.get(cacheKey);
    }

    const processed = addSchoolCountsToGeoJSON(geojson);
    processedDataCache.current.set(cacheKey, processed);
    return processed;
  }, [selectedFilter, visualizationMode]);

  // Color scheme for average ratings with improved gradient
  const getRatingColorScheme = useCallback(() => {
    return [
      'case',
      // If no rating or null, use light gray
      ['==', ['get', 'AverageRating'], null],
      '#e0e0e0',  // Light gray for no rating
      [
        'interpolate',
        ['linear'],
        ['get', 'AverageRating'],
        0, '#d32f2f',      // Deep red for 0 (Unsatisfactory)
        1, '#f57c00',      // Orange for 1 (Unsatisfactory)
        2, '#fbc02d',      // Yellow-orange for 2 (Acceptable)
        3, '#689f38',      // Green for 3 (Good)
        4, '#1976d2',      // Blue for 4 (Very Good)
        5, '#00796b'       // Teal-green for 5 (Outstanding)
      ]
    ];
  }, []);

  // Color scheme for school counts
  const getCountColorScheme = useCallback(() => {
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

  // Color scheme for total enrollments
  const getEnrollmentColorScheme = useCallback(() => {
    return [
      'case',
      // If no enrollment or null, use light gray
      ['==', ['get', 'TotalEnrollment'], null],
      '#e0e0e0',  // Light gray for no enrollment data
      [
        'interpolate',
        ['linear'],
        ['get', 'TotalEnrollment'],
        0, '#fff3e0',      // Light orange for 0 enrollments
        100, '#ffe0b2',    // Light orange for 100
        500, '#ffcc80',    // Orange for 500
        1000, '#ffb74d',   // Medium orange for 1,000
        2500, '#ff9800',   // Orange for 2,500
        5000, '#f57c00',   // Dark orange for 5,000
        10000, '#e65100'   // Deep orange for 10,000+
      ]
    ];
  }, []);

  // Color scheme for average fees
  const getFeeColorScheme = useCallback(() => {
    return [
      'case',
      // If no fee or null, use light gray
      ['==', ['get', 'AverageFee'], null],
      '#e0e0e0',  // Light gray for no fee data
      [
        'interpolate',
        ['linear'],
        ['get', 'AverageFee'],
        0, '#e8f5e9',      // Light green for 0
        10000, '#c8e6c9',  // Light green for 10K
        25000, '#a5d6a7',  // Green for 25K
        50000, '#81c784',  // Medium green for 50K
        75000, '#66bb6a',  // Green for 75K
        100000, '#4caf50', // Dark green for 100K
        150000, '#388e3c'  // Very dark green for 150K+
      ]
    ];
  }, []);

  // Get current color scheme based on visualization mode
  const getColorScheme = useCallback(() => {
    if (visualizationMode === 'rating') {
      return getRatingColorScheme();
    } else if (visualizationMode === 'enrollment') {
      return getEnrollmentColorScheme();
    } else if (visualizationMode === 'fee') {
      return getFeeColorScheme();
    } else {
      return getCountColorScheme();
    }
  }, [visualizationMode, getRatingColorScheme, getEnrollmentColorScheme, getFeeColorScheme, getCountColorScheme]);

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
          'fill-color': getColorScheme(),
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
            visualizationMode === 'rating'
              ? [
                  'case',
                  ['has', 'AverageRating'],
                  [
                    'case',
                    ['!=', ['get', 'AverageRating'], null],
                    [
                      'concat',
                      'Rating: ',
                      ['number-format', ['get', 'AverageRating'], { 'locale': 'en-US', 'min-fraction-digits': 1, 'max-fraction-digits': 2 }]
                    ],
                    ''
                  ],
                  'No Data'
                ]
              : visualizationMode === 'enrollment'
              ? [
                  'case',
                  ['has', 'TotalEnrollment'],
                  [
                    'case',
                    ['!=', ['get', 'TotalEnrollment'], null],
                    [
                      'concat',
                      'Enrollment: ',
                      ['number-format', ['get', 'TotalEnrollment'], { 'locale': 'en-US' }]
                    ],
                    ''
                  ],
                  'No Data'
                ]
              : visualizationMode === 'fee'
              ? [
                  'case',
                  ['has', 'AverageFee'],
                  [
                    'case',
                    ['!=', ['get', 'AverageFee'], null],
                    [
                      'concat',
                      'Avg Fee: ',
                      ['number-format', ['get', 'AverageFee'], { 'locale': 'en-US' }],
                      ' AED'
                    ],
                    ''
                  ],
                  'No Data'
                ]
              : [
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
                    ''
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

      // Helper function to dispatch school graph event
      // Access visualizationMode from the component scope (closure)
      const dispatchSchoolGraphEvent = (areaName, feature) => {
        // Clean area name - remove municipality number if present (format: "AREA NAME - NUMBER")
        const cleanAreaName = areaName.split(' - ')[0].trim();
        
        if (visualizationMode && (visualizationMode === 'rating' || visualizationMode === 'enrollment' || visualizationMode === 'fee')) {
          const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
          const processedGeoJSON = addSchoolCountsToGeoJSON(baseGeoJSON);
          const schoolsInArea = getSchoolsInArea(cleanAreaName, processedGeoJSON.features);
          
          if (schoolsInArea.length > 0) {
            const ratingData = processRatingDistribution(schoolsInArea);
            const enrollmentData = processEnrollmentData(schoolsInArea);
            
            window.dispatchEvent(new CustomEvent('school:areaClicked', {
              detail: {
                areaName: cleanAreaName,
                visualizationMode: visualizationMode,
                ratingData: ratingData,
                enrollmentData: enrollmentData,
                schools: schoolsInArea
              }
            }));
          } else {
            // Still dispatch event even if no schools, so user can see the empty state
            window.dispatchEvent(new CustomEvent('school:areaClicked', {
              detail: {
                areaName: cleanAreaName,
                visualizationMode: visualizationMode,
                ratingData: [],
                enrollmentData: [],
                schools: []
              }
            }));
          }
        }
      };

      const getSchoolLabels = (props) => {
        const schoolCount = props['SchoolCount'] || 0;
        const avgFee = props['AverageFee'];
        
        // Format fee display
        const feeDisplay = avgFee !== null && avgFee !== undefined
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(avgFee)
          : null;
        
        // Build fee info string
        const feeInfo = feeDisplay ? `<br/>Avg Fee: ${feeDisplay}` : '';
        
        if (visualizationMode === 'rating') {
          // Show average rating
          const avgRating = props['AverageRating'];
          const ratingText = avgRating !== null && avgRating !== undefined 
            ? getRatingText(Math.round(avgRating))
            : 'No rating data';
          const ratingDisplay = avgRating !== null && avgRating !== undefined
            ? `${ratingText} (${avgRating.toFixed(2)})`
            : ratingText;
          return {
            valueLabel: `<br/>Avg Rating: ${ratingDisplay}${schoolCount > 0 ? `<br/>Schools: ${schoolCount}` : ''}${feeInfo}`,
            valueLabel2: '',
            valueLabel3: ''
          };
        } else if (visualizationMode === 'enrollment') {
          // Show total enrollment
          const totalEnrollment = props['TotalEnrollment'];
          const enrollmentDisplay = totalEnrollment !== null && totalEnrollment !== undefined
            ? new Intl.NumberFormat('en-US').format(totalEnrollment)
            : 'No enrollment data';
          return {
            valueLabel: `<br/>Total Enrollment: ${enrollmentDisplay}${schoolCount > 0 ? `<br/>Schools: ${schoolCount}` : ''}${feeInfo}`,
            valueLabel2: '',
            valueLabel3: ''
          };
        } else if (visualizationMode === 'fee') {
          // Show average fee
          return {
            valueLabel: `<br/>Avg Fee: ${feeDisplay || 'No fee data'}${schoolCount > 0 ? `<br/>Schools: ${schoolCount}` : ''}`,
            valueLabel2: '',
            valueLabel3: ''
          };
        } else {
          // Show school count
          const formatted = new Intl.NumberFormat('en-US').format(schoolCount);
          return {
            valueLabel: `<br/>Schools: ${formatted}${feeInfo}`,
            valueLabel2: '',
            valueLabel3: ''
          };
        }
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
                // Clean area name - remove municipality number
                const cleanPlaceName = placeName.split(' - ')[0].trim();
                window.dispatchEvent(new CustomEvent('map:placeSelected', {
                  detail: { placeName: cleanPlaceName, lngLat: e.lngLat }
                }));
                // Dispatch school graph event
                dispatchSchoolGraphEvent(cleanPlaceName, e.features[0]);
                popup.remove();
                clickPopupRef.current = null;
              };
            }
          }, 50);
          
          // Also dispatch on direct click (not just button)
          dispatchSchoolGraphEvent(placeName, e.features[0]);
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
          // Extract area name without municipality number
          let areaName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
          // Remove municipality number if present (format: "AREA NAME - NUMBER")
          areaName = areaName.split(' - ')[0].trim();
          
          window.dispatchEvent(new CustomEvent('map:placeSelected', {
            detail: { 
              placeName: areaName,
              lngLat: e.lngLat
            }
          }));
          
          // Dispatch school graph event
          dispatchSchoolGraphEvent(areaName, e.features[0]);
        });
      }
    }

    function setupSchoolMarkers() {
      if (!map.current) return;

      // Use filtered schools if provided, otherwise use all schools
      const schoolsToDisplay = filteredSchools && filteredSchools.length > 0 
        ? filteredSchools 
        : schoolsData;

      // Create GeoJSON from schools data
      const schoolsGeoJSON = {
        type: 'FeatureCollection',
        features: schoolsToDisplay
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
              geostatDisplayName: school.geostat?.display_name || null,
              curriculum: school.Curriculum,
              grades: school.Grades,
              rating: school['Latest DSIB Rating'],
              enrollment: school['2024/25 Enrollments'],
              schoolId: school['School Name'], // Use name as unique ID
              latitude: school.Latitude,
              longitude: school.Longitude
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
      map.current.on('click', 'schools', async (e) => {
        const props = e.features[0].properties;
        const coordinates = e.features[0].geometry.coordinates.slice();
        // Use lat/lng from properties if available, otherwise from coordinates
        const lat = props.latitude || coordinates[1];
        const lng = props.longitude || coordinates[0];
        
        // Highlight the clicked school
        if (window.highlightSchool) {
          window.highlightSchool(props.name, coordinates);
        }
        
        // Get location from geostat.display_name if available, otherwise use Location field
        let displayLocation = props.geostatDisplayName || props.location || 'Location not available';
        
        // Convert rating to text
        const ratingText = getRatingText(props.rating);
        
        // Create popup content
        const popupHTML = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${props.name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">📍 ${displayLocation}</p>
            ${props.curriculum ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">📚 ${props.curriculum}</p>` : ''}
            ${props.grades ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">🎓 ${props.grades}</p>` : ''}
            ${ratingText ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">⭐ Rating: ${ratingText}</p>` : ''}
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
  }, [selectedFilter, processGeoJSONWithSchools, getRatingColorScheme]);

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
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme());
    }

    // Update text layer based on visualization mode
    const textLayer = map.current.getLayer('dubai-communities-name');
    if (textLayer) {
      map.current.setLayoutProperty('dubai-communities-name', 'text-field', [
        'format',
        ['get', 'CNAME_E'], { 'font-scale': 1.1, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
        '\n',
        visualizationMode === 'rating'
          ? [
              'case',
              ['has', 'AverageRating'],
              [
                'case',
                ['!=', ['get', 'AverageRating'], null],
                [
                  'concat',
                  'Rating: ',
                  ['number-format', ['get', 'AverageRating'], { 'locale': 'en-US', 'min-fraction-digits': 1, 'max-fraction-digits': 2 }]
                ],
                ''
              ],
              'No Data'
            ]
          : visualizationMode === 'enrollment'
          ? [
              'case',
              ['has', 'TotalEnrollment'],
              [
                'case',
                ['!=', ['get', 'TotalEnrollment'], null],
                [
                  'concat',
                  'Enrollment: ',
                  ['number-format', ['get', 'TotalEnrollment'], { 'locale': 'en-US' }]
                ],
                ''
              ],
              'No Data'
            ]
          : visualizationMode === 'fee'
          ? [
              'case',
              ['has', 'AverageFee'],
              [
                'case',
                ['!=', ['get', 'AverageFee'], null],
                [
                  'concat',
                  'Avg Fee: ',
                  ['number-format', ['get', 'AverageFee'], { 'locale': 'en-US' }],
                  ' AED'
                ],
                ''
              ],
              'No Data'
            ]
          : [
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
                ''
              ],
              'No Data'
            ],
        { 'font-scale': 1.2, 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'] }
      ]);
    }
  }, [selectedFilter, isMapLoaded, processGeoJSONWithSchools, getColorScheme, visualizationMode]);

  // Re-setup click handlers when visualizationMode changes to ensure they have the latest value
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove old click handlers
    map.current.off('click', 'dubai-communities-fill');
    
    // Helper function to dispatch school graph event with current visualizationMode
    const dispatchSchoolGraphEvent = (areaName, feature) => {
      // Clean area name - remove municipality number if present (format: "AREA NAME - NUMBER")
      const cleanAreaName = areaName.split(' - ')[0].trim();
      
      if (visualizationMode && (visualizationMode === 'rating' || visualizationMode === 'enrollment' || visualizationMode === 'fee')) {
        const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
        const processedGeoJSON = addSchoolCountsToGeoJSON(baseGeoJSON);
        const schoolsInArea = getSchoolsInArea(cleanAreaName, processedGeoJSON.features);
        
        if (schoolsInArea.length > 0) {
          const ratingData = processRatingDistribution(schoolsInArea);
          const enrollmentData = processEnrollmentData(schoolsInArea);
          
          window.dispatchEvent(new CustomEvent('school:areaClicked', {
            detail: {
              areaName: cleanAreaName,
              visualizationMode: visualizationMode,
              ratingData: ratingData,
              enrollmentData: enrollmentData,
              schools: schoolsInArea
            }
          }));
        } else {
          // Still dispatch event even if no schools, so user can see the empty state
          window.dispatchEvent(new CustomEvent('school:areaClicked', {
            detail: {
              areaName: cleanAreaName,
              visualizationMode: visualizationMode,
              ratingData: [],
              enrollmentData: [],
              schools: []
            }
          }));
        }
      }
    };

    // Add new click handler with current visualizationMode
    map.current.on('click', 'dubai-communities-fill', (e) => {
      const props = e.features[0].properties;
      // Extract area name without municipality number
      let areaName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
      // Remove municipality number if present (format: "AREA NAME - NUMBER")
      areaName = areaName.split(' - ')[0].trim();
      
      window.dispatchEvent(new CustomEvent('map:placeSelected', {
        detail: { 
          placeName: areaName,
          lngLat: e.lngLat
        }
      }));
      
      // Dispatch school graph event
      dispatchSchoolGraphEvent(areaName, e.features[0]);
    });
  }, [visualizationMode, selectedDataPoint, selectedFilter, isMapLoaded]);

  // Update school markers when filtered schools change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    const schoolsToDisplay = filteredSchools && filteredSchools.length > 0 
      ? filteredSchools 
      : schoolsData;
    
    const schoolsGeoJSON = {
      type: 'FeatureCollection',
      features: schoolsToDisplay
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
            geostatDisplayName: school.geostat?.display_name || null,
            curriculum: school.Curriculum,
            grades: school.Grades,
            rating: school['Latest DSIB Rating'],
            enrollment: school['2024/25 Enrollments'],
            schoolId: school['School Name'],
            latitude: school.Latitude,
            longitude: school.Longitude
          }
        }))
    };
    
    const source = map.current.getSource('schools');
    if (source) {
      source.setData(schoolsGeoJSON);
    }
  }, [filteredSchools, isMapLoaded]);

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

