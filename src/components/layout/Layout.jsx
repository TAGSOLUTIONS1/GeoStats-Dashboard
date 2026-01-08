'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, LogIn, Share2, Table, MessageCircle, Menu, X, ArrowLeft, MapPin, GraduationCap, RotateCcw, Ruler } from 'lucide-react';
import Sidebar from './Sidebar';
import FilterPanel from '../ui/FilterPanel';
import TableViewModal from '../ui/TableViewModal';
import DatePicker from '../ui/DatePicker';
import TooltipToggle from '../ui/TooltipToggle';
import FeedbackModal from '../ui/FeedbackModal';
import ShareModal from '../ui/ShareModal';
import Map from '../ui/Map';
import SchoolMap from '../ui/SchoolMap';
import GraphModal from '../ui/GraphModal';
import SchoolGraphModal from '../ui/SchoolGraphModal';
import AreasMap from "../../data/average_meter_price/forecasts/Areas_id.json";
import ExploreDataPointsModal from '../ui/ExploreDataPointsModal';
import SchoolFilterPanel from '../ui/SchoolFilterPanel';
import ColorLegend from '../ui/ColorLegend';
import { useSidebar } from '../../hooks/useSidebar';
import schoolsData from '../../data/schools/schools.json';

const Layout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Area');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSchoolFilterPanelOpen, setIsSchoolFilterPanelOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Jul 2025');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [graphPlace, setGraphPlace] = useState('');
  const [isSchoolGraphOpen, setIsSchoolGraphOpen] = useState(false);
  const [schoolGraphData, setSchoolGraphData] = useState({
    areaName: '',
    visualizationMode: 'rating',
    ratingData: [],
    enrollmentData: [],
    schools: []
  });

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop
  const [isDesktop, setIsDesktop] = useState(false); // Will be set in useEffect
  const searchTimeoutRef = useRef(null);
  const isDesktopRef = useRef(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // School filter states
  const [selectedCurriculum, setSelectedCurriculum] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState([]);
  const [selectedRating, setSelectedRating] = useState('');
  const [filteredSchools, setFilteredSchools] = useState(null);
  
  // Measurement states
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const measurementPointsRef = useRef([]);
  const isMeasurementModeRef = useRef(false);
  
  // Access sidebar state to detect school landscape selection
  const { activeItem, selectedDataPoint, setActiveItem } = useSidebar();
  
  // School-related data point IDs
  const schoolDataPointIds = [
    'distribution-and-quality-analysis',
    'rating-distribution',
    'fee-distribution',
    'enrollment-growth'
  ];
  
  // State to track selected data point from window (since Sidebar and Layout use separate hook instances)
  const [windowDataPoint, setWindowDataPoint] = useState(
    typeof window !== 'undefined' ? window.selectedDataPoint : null
  );

  // Listen for data point selection changes from sidebar
  useEffect(() => {
    const handleDataPointChange = (e) => {
      const dataPointId = e.detail?.dataPointId;
      if (dataPointId) {
        setWindowDataPoint(dataPointId);
        if (schoolDataPointIds.includes(dataPointId)) {
          // Switch to school map if school data point is selected
          if (activeItem !== 'dubai-school-landscape') {
            setActiveItem('dubai-school-landscape');
          }
        } else {
          // Switch away from school map if non-school data point is selected
          if (activeItem === 'dubai-school-landscape') {
            // Find the section that contains this data point and switch to it
            // For now, we'll just clear the school landscape selection
            // The sidebar will handle which section to show
            setActiveItem(null);
          }
        }
      }
    };
    
    // Also poll window.selectedDataPoint in case event doesn't fire
    const checkWindowDataPoint = () => {
      if (typeof window !== 'undefined' && window.selectedDataPoint !== windowDataPoint) {
        const dp = window.selectedDataPoint;
        setWindowDataPoint(dp);
        if (dp) {
          if (schoolDataPointIds.includes(dp)) {
            // Switch to school map if school data point is selected
            if (activeItem !== 'dubai-school-landscape') {
              setActiveItem('dubai-school-landscape');
            }
          } else {
            // Switch away from school map if non-school data point is selected
            if (activeItem === 'dubai-school-landscape') {
              setActiveItem(null);
            }
          }
        }
      }
    };
    
    window.addEventListener('sidebar:dataPointSelected', handleDataPointChange);
    const interval = setInterval(checkWindowDataPoint, 100); // Check every 100ms
    
    return () => {
      window.removeEventListener('sidebar:dataPointSelected', handleDataPointChange);
      clearInterval(interval);
    };
  }, [activeItem, setActiveItem, windowDataPoint]);
  
  // Auto-expand school landscape section when a school data point is selected
  useEffect(() => {
    const currentDataPoint = windowDataPoint || selectedDataPoint;
    if (currentDataPoint) {
      if (schoolDataPointIds.includes(currentDataPoint)) {
        // Switch to school map if school data point is selected
        if (activeItem !== 'dubai-school-landscape') {
          setActiveItem('dubai-school-landscape');
        }
      } else {
        // Switch away from school map if non-school data point is selected
        if (activeItem === 'dubai-school-landscape') {
          setActiveItem(null);
        }
      }
    }
  }, [selectedDataPoint, windowDataPoint, activeItem, setActiveItem]);
  
  // Check if school filter panel should be open
  const currentDataPoint = windowDataPoint || selectedDataPoint;
  // Show school map if:
  // 1. The active section is school landscape, OR
  // 2. A school data point is currently selected
  // Otherwise show population map
  const isSchoolPanelOpen = activeItem === 'dubai-school-landscape' || 
    (currentDataPoint && schoolDataPointIds.includes(currentDataPoint));

  // Determine visualization mode for color legend
  const getVisualizationMode = () => {
    if (!currentDataPoint) return null;
    const ratingDataPoints = ['rating-distribution'];
    const enrollmentDataPoints = ['enrollment-growth'];
    const feeDataPoints = ['fee-distribution'];
    const countDataPoints = ['distribution-and-quality-analysis'];
    
    if (ratingDataPoints.includes(currentDataPoint)) {
      return 'rating';
    } else if (enrollmentDataPoints.includes(currentDataPoint)) {
      return 'enrollment';
    } else if (feeDataPoints.includes(currentDataPoint)) {
      return 'fee';
    } else if (countDataPoints.includes(currentDataPoint)) {
      return 'count';
    }
    return null;
  };

  const filterOptions = ['Emirate', 'Area'];

  useEffect(() => {
    const onPlaceSelected = (e) => {
      const { placeName, lngLat } = e.detail || {};
      
      // If school panel is open, update selected location instead of opening graph
      if (isSchoolPanelOpen) {
        setSelectedLocation({ placeName: placeName || 'Selected Area', lngLat });
      } else {
      setGraphPlace(placeName || 'Selected Area');
      setIsGraphOpen(true);
      }
    };
    window.addEventListener('map:placeSelected', onPlaceSelected);
    
    // Listen for school area clicks
    const onSchoolAreaClicked = (e) => {
      const { areaName, visualizationMode, ratingData, enrollmentData, schools } = e.detail;
      
      // Close regular graph modal if open
      setIsGraphOpen(false);
      
      setSchoolGraphData({
        areaName,
        visualizationMode,
        ratingData,
        enrollmentData,
        schools: schools || []
      });
      setIsSchoolGraphOpen(true);
    };
    
    window.addEventListener('school:areaClicked', onSchoolAreaClicked);
    return () => {
      window.removeEventListener('map:placeSelected', onPlaceSelected);
      window.removeEventListener('school:areaClicked', onSchoolAreaClicked);
    };
  }, [isSchoolPanelOpen]);

  // Close sidebar when clicking outside on mobile only
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle click outside on mobile
      if (!isDesktop && isSidebarOpen) {
        // Check if click is inside sidebar (including all nested elements)
        const sidebarElement = event.target.closest('.sidebar-container') || 
                               event.target.closest('.sidebar-content');
        
        // Check if click is on hamburger menu
        const isClickOnHamburger = event.target.closest('.hamburger-menu');
        
        // Don't close if clicking inside sidebar or on hamburger menu
        if (!sidebarElement && !isClickOnHamburger) {
        setIsSidebarOpen(false);
        }
      }
    };

    if (isSidebarOpen && !isDesktop) {
      document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    }
  }, [isSidebarOpen, isDesktop]);

  // Track screen size for responsive behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      const wasDesktop = isDesktopRef.current;
      isDesktopRef.current = desktop;
      setIsDesktop(desktop);
      // Auto-close sidebar when resizing from desktop to mobile
      if (wasDesktop && !desktop) {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isSidebarOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isSidebarOpen, isDesktop]);

  const handleFilterPanel = () => {
    if (isSchoolPanelOpen) {
      // If school map is active, toggle school filter panel
      setIsSchoolFilterPanelOpen(!isSchoolFilterPanelOpen);
      // Close regular filter panel if open
      if (isFilterPanelOpen) setIsFilterPanelOpen(false);
    } else {
      // Otherwise, toggle regular filter panel
    setIsFilterPanelOpen(!isFilterPanelOpen);
      // Close school filter panel if open
      if (isSchoolFilterPanelOpen) setIsSchoolFilterPanelOpen(false);
    }
  };

  const handleClear = () => {
    // Clear selected school highlight
    if (window.clearSchoolHighlight) {
      window.clearSchoolHighlight();
    }
    
    // Clear search result marker
    if (window.map) {
      const searchSource = window.map.getSource('search-result');
      if (searchSource) {
        searchSource.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      
      // Remove any open popups
      const popups = document.querySelectorAll('.mapboxgl-popup');
      popups.forEach(popup => popup.remove());
    }
    
    // Clear selected location state
    setSelectedLocation(null);
    
    // Clear measurement
    clearMeasurement();
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1, coord2) => {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(2)} km`;
  };

  const setupMeasurement = () => {
    if (!window.map) return;

    // Add measurement source and layers if they don't exist
    if (!window.map.getSource('measurement-lines')) {
      window.map.addSource('measurement-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      window.map.addLayer({
        id: 'measurement-lines',
        type: 'line',
        source: 'measurement-lines',
        paint: {
          'line-color': '#FF6B35',
          'line-width': 4,
          'line-dasharray': [2, 2]
        }
      });
    }

    if (!window.map.getSource('measurement-points')) {
      window.map.addSource('measurement-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      window.map.addLayer({
        id: 'measurement-points',
        type: 'circle',
        source: 'measurement-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#FF6B35',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    // Add measurement labels source
    if (!window.map.getSource('measurement-labels')) {
      window.map.addSource('measurement-labels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add background circles for labels (box effect)
      window.map.addSource('measurement-label-bg', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      window.map.addLayer({
        id: 'measurement-label-bg',
        type: 'circle',
        source: 'measurement-label-bg',
        paint: {
          'circle-radius': 0,
          'circle-color': '#FF6B35',
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      window.map.addLayer({
        id: 'measurement-labels',
        type: 'symbol',
        source: 'measurement-labels',
        layout: {
          'text-field': ['get', 'distance'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 13,
          'text-offset': [0, 0],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#FF6B35',
          'text-halo-width': 2,
          'text-halo-blur': 1
        }
      });
    }
  };

  const updateMeasurementDisplay = (points) => {
    if (!window.map) return;

    const linesSource = window.map.getSource('measurement-lines');
    const pointsSource = window.map.getSource('measurement-points');
    const labelsSource = window.map.getSource('measurement-labels');
    const labelBgSource = window.map.getSource('measurement-label-bg');

    if (points.length === 0) {
      if (linesSource) linesSource.setData({ type: 'FeatureCollection', features: [] });
      if (pointsSource) pointsSource.setData({ type: 'FeatureCollection', features: [] });
      if (labelsSource) labelsSource.setData({ type: 'FeatureCollection', features: [] });
      if (labelBgSource) labelBgSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    // Create line features
    const lineFeatures = [];
    for (let i = 0; i < points.length - 1; i++) {
      const distance = calculateDistance(points[i], points[i + 1]);
      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [points[i], points[i + 1]]
        },
        properties: {
          distance: formatDistance(distance),
          index: i
        }
      });
    }

    // Create point features
    const pointFeatures = points.map((point, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: point
      },
      properties: {
        index: index
      }
    }));

    // Create label features (midpoint of each segment with cumulative distance)
    const labelFeatures = [];
    const labelBgFeatures = [];
    let cumulativeDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const segmentDistance = calculateDistance(points[i], points[i + 1]);
      cumulativeDistance += segmentDistance;
      
      const midPoint = [
        (points[i][0] + points[i + 1][0]) / 2,
        (points[i][1] + points[i + 1][1]) / 2
      ];
      
      // Background circle for label (box effect)
      labelBgFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midPoint
        },
        properties: {
          index: i
        }
      });
      
      // Show cumulative distance
      labelFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midPoint
        },
        properties: {
          distance: formatDistance(cumulativeDistance),
          index: i
        }
      });
    }

    if (linesSource) linesSource.setData({ type: 'FeatureCollection', features: lineFeatures });
    if (pointsSource) pointsSource.setData({ type: 'FeatureCollection', features: pointFeatures });
    if (labelBgSource) labelBgSource.setData({ type: 'FeatureCollection', features: labelBgFeatures });
    if (labelsSource) labelsSource.setData({ type: 'FeatureCollection', features: labelFeatures });
  };

  const clearMeasurement = () => {
    setMeasurementPoints([]);
    measurementPointsRef.current = [];
    updateMeasurementDisplay([]);
    setIsMeasurementMode(false);
    isMeasurementModeRef.current = false;
    
    if (window.map) {
      // Restore area/emirate layers and school markers visibility
      const layersToShow = ['dubai-communities-fill', 'dubai-communities-stroke', 'dubai-communities-name', 'schools'];
      layersToShow.forEach(layerId => {
        if (window.map.getLayer(layerId)) {
          window.map.setLayoutProperty(layerId, 'visibility', 'visible');
        }
      });
      
      // Remove click handler using stored reference
      if (window._measurementClickHandler) {
        window.map.off('click', window._measurementClickHandler);
        window._measurementClickHandler = null;
      }
      window.map.off('click', handleMeasurementClick);
      window.map.off('mousemove', handleMeasurementMouseMove);
      window.map.getCanvas().style.cursor = '';
      
      // Clear temp line
      const tempSource = window.map.getSource('measurement-temp-line');
      if (tempSource) {
        tempSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  };

  const handleMeasurementClick = (e) => {
    // Use ref to check mode to avoid stale closure
    if (!isMeasurementModeRef.current || !window.map) {
      return;
    }
    
    // Check if clicking on an existing measurement point to remove it
    // Only query measurement-points layer to avoid checking all markers
    const features = window.map.queryRenderedFeatures(e.point, {
      layers: ['measurement-points']
    });
    
    if (features.length > 0) {
      const clickedIndex = features[0].properties.index;
      const newPoints = measurementPointsRef.current.filter((_, i) => i !== clickedIndex);
      measurementPointsRef.current = newPoints;
      setMeasurementPoints(newPoints);
      updateMeasurementDisplay(newPoints);
      return;
    }
    
    // Add new point - allow clicking anywhere when in measurement mode
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    const newPoints = [...measurementPointsRef.current, coordinates];
    measurementPointsRef.current = newPoints;
    setMeasurementPoints(newPoints);
    updateMeasurementDisplay(newPoints);
  };

  const handleMeasurementMouseMove = (e) => {
    if (!isMeasurementModeRef.current || !window.map) return;
    
    // Check if hovering over a measurement point
    const features = window.map.queryRenderedFeatures(e.point, {
      layers: ['measurement-points']
    });
    
    if (features.length > 0) {
      window.map.getCanvas().style.cursor = 'pointer';
      // Clear temp line when hovering over point
      const tempSource = window.map.getSource('measurement-temp-line');
      if (tempSource) {
        tempSource.setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }
    
    // Show crosshair when measuring
    window.map.getCanvas().style.cursor = 'crosshair';
    
    // Show distance from last point if there are points
    if (measurementPointsRef.current.length > 0) {
      const currentPoint = [e.lngLat.lng, e.lngLat.lat];
      const lastPoint = measurementPointsRef.current[measurementPointsRef.current.length - 1];
      const distance = calculateDistance(lastPoint, currentPoint);
      
      // Create or update temporary line to cursor
      if (!window.map.getSource('measurement-temp-line')) {
        window.map.addSource('measurement-temp-line', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        
        window.map.addLayer({
          id: 'measurement-temp-line',
          type: 'line',
          source: 'measurement-temp-line',
          paint: {
            'line-color': '#3696A8',
            'line-width': 1,
            'line-opacity': 0.5,
            'line-dasharray': [1, 1]
          }
        });
      }
      
      const tempSource = window.map.getSource('measurement-temp-line');
      if (tempSource) {
        tempSource.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [lastPoint, currentPoint]
            },
            properties: {
              distance: formatDistance(distance)
            }
          }]
        });
      }
    } else {
      // Clear temp line when no points
      const tempSource = window.map.getSource('measurement-temp-line');
      if (tempSource) {
        tempSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  };

  const toggleMeasurement = () => {
    const newMode = !isMeasurementMode;
    setIsMeasurementMode(newMode);
    isMeasurementModeRef.current = newMode;
    
    if (newMode) {
      // Wait for map to be ready
      if (!window.map) {
        console.warn('Map not ready for measurement');
        setIsMeasurementMode(false);
        return;
      }
      
      // Immediately register click handlers for instant response (don't wait for setup)
      const clickHandler = (e) => {
        if (isMeasurementModeRef.current) {
          handleMeasurementClick(e);
        }
      };
      
      // Register handlers immediately for instant feedback
      window.map.on('click', clickHandler);
      window.map.on('mousemove', handleMeasurementMouseMove);
      window.map.getCanvas().style.cursor = 'crosshair';
      window._measurementClickHandler = clickHandler;
      
      // Reset measurement points immediately
      measurementPointsRef.current = [];
      setMeasurementPoints([]);
      
      // Setup layers and hide other layers asynchronously (non-blocking, happens in background)
      requestAnimationFrame(() => {
        if (!window.map || !isMeasurementModeRef.current) return;
        
        setupMeasurement();
        
        // Hide area/emirate layers and school markers when measuring
        const layersToHide = ['dubai-communities-fill', 'dubai-communities-stroke', 'dubai-communities-name', 'schools'];
        layersToHide.forEach(layerId => {
          if (window.map.getLayer(layerId)) {
            window.map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      });
    } else {
      clearMeasurement();
    }
  };

  // Cleanup measurement on unmount
  useEffect(() => {
    return () => {
      if (window.map) {
        window.map.off('click', handleMeasurementClick);
        window.map.off('mousemove', handleMeasurementMouseMove);
      }
    };
  }, [isMeasurementMode]);

  const handleTableView = () => {
    setIsTableViewOpen(!isTableViewOpen);
  };

  const handleTooltipToggle = () => {
    setIsTooltipEnabled(!isTooltipEnabled);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleFeedback = () => {
    setIsFeedbackOpen(!isFeedbackOpen);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query) {
      setSearchSuggestions([]);
      return;
    }

    // Debounce the API call
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN}&` +
          `bbox=54.13,24.5,56.4,25.7` // Restrict to Dubai area
        );
        const data = await response.json();
        setSearchSuggestions(data.features);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSelection = (feature) => {
    setSearchQuery(feature.place_name);
    setSearchSuggestions([]);
    
    const coordinates = feature.center || feature.geometry.coordinates;
    
    if (window.map) {
      // Fly to location
      window.map.flyTo({
        center: coordinates,
        zoom: 15,
        essential: true,
        duration: 2000
      });

      // Highlight the location
      window.highlightSearchResult(coordinates);
    }
  };

  const [series, setSeries] = useState([]);
  const [pastSeries, setPastSeries] = useState([]);

  console.log("graph place is " , graphPlace);
  useEffect(() => {
    if (!graphPlace) return;

    // extract municipality_number 915 from "AL YUFRAH 1 - 915"
    const municipalityNumber = graphPlace.split("-").pop().trim();

    // lookup area_id from Areas_id.json
    const areaEntry = AreasMap.find(
      (area) => String(area.municipality_number) === municipalityNumber
    );

    if (!areaEntry) {
      console.error("No matching area found for", municipalityNumber);
      return;
    }

    const areaId = areaEntry.area_id;

    // dynamic import forecast JSON using the area_id
    import(
      `../../data/average_meter_price/forecasts/xgb/forecast_area_${areaId}_2010onwards.json`
    )
      .then((module) => {
        setSeries(module.default);
      })
      .catch((err) => {
        console.error("Error loading forecast for area:", areaId, err);
        setSeries([]);
      });

    //past series
     import(
      `../../data/average_meter_price/historical_data/avg_meter_price_${areaId}_2010onwards.json`
    )
      .then((module) => {
        setPastSeries(module.default);
      })
      .catch((err) => {
        console.error("Error loading historical data for area:", areaId, err);
        setPastSeries([]);
      });
  }, [graphPlace]);


   useEffect(() => {
        const handleOpenModal = (e) => {
            if (e.detail === 'explore') {
                setIsExploreModalOpen(true);
                // Don't close sidebar when opening explore modal - users should be able to see both
            }
            // Only close sidebar for other modals on mobile, not for explore modal
            if (!isDesktop && e.detail !== 'explore') { 
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('modal:open', handleOpenModal);
        // Removes the listener when the component unmounts
        return () => window.removeEventListener('modal:open', handleOpenModal);
    }, [isDesktop]);
    
  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block relative transition-all duration-300 ease-in-out overflow-hidden ${
        isSidebarOpen ? 'w-72' : 'w-0'
      }`}>
        <div className="absolute left-0 top-0 h-full w-72 sidebar-content">
          <div className="relative">
        <Sidebar />
            {/* Close button for desktop sidebar */}
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors z-30"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`sidebar-container fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out lg:hidden mobile-scroll-fix ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="relative sidebar-content">
          <Sidebar />
          {/* Close button for mobile sidebar */}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* School Filter Panel */}
      {isSchoolPanelOpen && (
        <SchoolFilterPanel
          isOpen={isSchoolFilterPanelOpen}
          onClose={() => setIsSchoolFilterPanelOpen(false)}
          selectedArea={graphPlace}
          selectedLocation={selectedLocation}
          selectedCurriculum={selectedCurriculum}
          selectedGrade={selectedGrade}
          selectedRating={selectedRating}
          onCurriculumChange={setSelectedCurriculum}
          onGradeChange={setSelectedGrade}
          onRatingChange={setSelectedRating}
          onFilteredSchoolsChange={setFilteredSchools}
        />
      )}
      
      {/* Background Map - Fixed behind main content only */}
      <div className="absolute inset-0 w-full h-full">
        {isSchoolPanelOpen ? (
          <SchoolMap 
            selectedFilter={selectedFilter}
            selectedDataPoint={currentDataPoint}
            filteredSchools={filteredSchools}
          />
        ) : (
          <Map 
            selectedFilter={selectedFilter}
          />
        )}
      </div>
      
      <main className="flex-1 relative z-20 flex flex-col pointer-events-none">
        {/* Top Header */}
        <div className="bg-white/95 mt-2 mx-1 sm:mx-2 md:mx-4 lg:mx-6 border-b border-gray-200 px-1 sm:px-2 md:px-4 lg:px-6 py-1.5 flex flex-col sm:flex-row justify-between pointer-events-auto items-stretch sm:items-center rounded-lg gap-2 sm:gap-0 overflow-hidden">
          {/* Left side with back button, logo, hamburger and search */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-3 flex-1 min-w-0">
            
            {/* Hamburger Menu - Visible on mobile and desktop when sidebar is closed */}
            <button
              onClick={toggleSidebar}
              className={`hamburger-menu p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ${
                isDesktop && isSidebarOpen ? 'lg:hidden' : ''
              }`}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>

            {!isSidebarOpen && (
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
                <img src="/logo/geo_stats.png" alt="Logo" className="w-auto h-8 sm:h-10" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-orange font-tomorrow whitespace-nowrap">GeoStats</h1>
            </div>
            )}
            
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0 max-w-sm lg:max-w-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations in Dubai"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure w-full"
              />
              
              {/* Search suggestions dropdown */}
              {searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => handleSearchSelection(feature)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">{feature.text}</p>
                      <p className="text-xs text-gray-500 truncate">{feature.place_name}</p>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-gray-300 border-t-azure"></div>
                </div>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5 lg:space-x-3 flex-shrink-0">
            {/* Filter Options - Always show */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
              {filterOptions.map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="filter-desktop"
                    value={option}
                    checked={selectedFilter === option}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="text-azure w-3 h-3"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5 lg:space-x-2">
              <button 
                onClick={handleClear}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300"
                title="Clear markers"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              </button>
              <button 
                onClick={toggleMeasurement}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300 ${
                  isMeasurementMode 
                    ? 'bg-azure text-white hover:bg-azure-dark' 
                    : 'hover:bg-gray-100'
                }`}
                title="Measure distance"
              >
                <Ruler className={`w-3 h-3 sm:w-4 sm:h-4 ${isMeasurementMode ? 'text-white' : 'text-gray-600'}`} />
              </button>
              <button 
                onClick={handleShare}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
              </button>
              {/* Filter Button - Opens appropriate filter based on active map */}
              <button 
                onClick={handleFilterPanel}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1 border border-gray-300"
              >
                {isSchoolPanelOpen ? (
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                ) : (
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                )}
                <p className="text-xs sm:text-sm hidden sm:block">Filter</p>
              </button>
              <button className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-azure hover:text-azure-dark transition-colors hidden sm:block">
                Sign up
              </button>
              <button className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-azure text-white text-[10px] sm:text-xs font-medium rounded-lg hover:bg-azure-dark transition-colors flex items-center space-x-1">
                <LogIn className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:block">Login</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Filter Options - Show when filter options are hidden */}
        <div className="md:hidden bg-white/95 mx-2 sm:mx-4 mt-1 px-4 py-2 rounded-lg pointer-events-auto">
          <div className="flex flex-wrap gap-4">
            {filterOptions.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="filter-mobile"
                  value={option}
                  checked={selectedFilter === option}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="text-azure w-3 h-3"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Main Content Area - Only render if there are actual children */}
        {children && React.Children.count(children) > 0 && (
          <div className="flex-1 overflow-y-auto bg-transparent pointer-events-none">
            <div className="pointer-events-auto">
              {children}
            </div>
          </div>
        )}
        
        {/* Spacer to push bottom controls down when no children */}
        {(!children || React.Children.count(children) === 0) && (
          <div className="flex-1"></div>
        )}

        {/* Bottom Control Bar */}
        <div className="px-1 sm:px-2 md:px-4 lg:px-6 py-2 flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 pointer-events-auto flex-wrap gap-1.5 sm:gap-2 overflow-x-auto">
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={handleTableView}
              className="flex bg-white px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 rounded-3xl hover:bg-gray-50 items-center space-x-1.5 sm:space-x-2 transition-colors"
            >
              <Table className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Table View</span>
            </button>
          </div>
          <div className="flex-shrink-0">
              <DatePicker 
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
          
          {/* Color Legend - Show when school data point is selected */}
          {schoolDataPointIds.includes(currentDataPoint) && (
            <div className="flex-shrink-0 min-w-0 overflow-x-auto">
              <ColorLegend mode={getVisualizationMode()} />
            </div>
          )}
          
          {/* Mobile Date Picker */}
          {/* <div className="sm:hidden">
            <DatePicker 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div> */}
        </div>
      </main>
      
      {/* Feedback Button - Floating above map controls */}
      <div className="absolute bottom-40 right-2 sm:right-4 pointer-events-auto z-10">
        <button 
          onClick={handleFeedback}
          className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all duration-200 ease-in-out hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center -space-x-5">
            <MessageCircle className="w-4 h-4 text-gray-600 -rotate-90 mt-1 z-10" />
            <MessageCircle className="w-4 h-4 text-gray-600 rotate-6 fill-white z-20" />
          </div>
          <span className="text-sm text-gray-700 ml-6 hidden sm:block">Feedback</span>
        </button>
      </div>
      
      {/* Filter Panel */}
      <FilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={handleFilterPanel} 
      />
      
      {/* Table View Modal */}
      <TableViewModal 
        isOpen={isTableViewOpen} 
        onClose={handleTableView}
        mode={isSchoolPanelOpen ? 'schools' : 'community'}
        data={isSchoolPanelOpen ? (filteredSchools || schoolsData) : []}
      />
      
      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={handleFeedback} 
      />
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
      
      {/* Graph Modal (opens on map click) */}
      <GraphModal 
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        placeName={graphPlace}
        pastSeries={pastSeries}
        series={series}
      />

       <ExploreDataPointsModal
          isOpen={isExploreModalOpen}
          onClose={() => setIsExploreModalOpen(false)}
      />
      
      {/* School Graph Modal (opens on area click in school visualizations) */}
      <SchoolGraphModal
        isOpen={isSchoolGraphOpen}
        onClose={() => setIsSchoolGraphOpen(false)}
        areaName={schoolGraphData.areaName}
        visualizationMode={schoolGraphData.visualizationMode}
        ratingData={schoolGraphData.ratingData}
        enrollmentData={schoolGraphData.enrollmentData}
        schools={schoolGraphData.schools}
      />
    </div>
  );
}

export default Layout;