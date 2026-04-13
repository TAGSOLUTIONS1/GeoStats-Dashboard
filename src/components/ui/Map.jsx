import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geojsonData } from '../../data/geoData';
import { dubaiWEBDATA } from '../../data/DubaiData';
import { New_Population } from '../../data/new_population';
import propertyInsights from '../../data/properties/insights.json';
import propertyListings from '../../data/properties/listings.json';
import { addPropertyMetricsToGeoJSON, filterPropertyListings, getPropertyPointsGeoJSON, getPropertyPointsGeoJSONWithSelections } from '../../services/property';

const PROPERTY_DATA_POINT_IDS = [
  'property-combo-counts',
  'property-type-counts',
  'property-furnishing-counts',
  'property-avg-rent-beds-type',
  'property-avg-rent-baths-type',
  'property-rent-per-sqft-location',
];

const PROPERTY_VIEW_MODES = ['points-only', 'area-insights-only', 'combined'];
const PROPERTY_COMBO_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f766e', '#9333ea', '#0891b2'];
const PROPERTY_TYPE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0f766e', '#9333ea', '#0891b2', '#ea580c', '#0d9488', '#4f46e5', '#be185d'];
const PROPERTY_FURNISHING_COLORS = {
  furnished: '#16a34a',
  unfurnished: '#f59e0b',
  mixed: '#6366f1',
  unknown: '#e0e0e0',
};

const toNumber = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatMoney = (value, fractionDigits = 0) => {
  if (value === null || value === undefined) return 'No Data';
  return `AED ${new Intl.NumberFormat('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value)}`;
};

const getSelectionKey = (selection, index) => selection?.selectionId || `selection-${index}`;

const getSelectionLabel = (selection) => selection?.label || 'Selected Group';

const parseStructuredProperty = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const getPropertySummary = (listings) => {
  const summary = {
    totalListings: listings.length,
    averageRent: null,
    averageRentPerSqft: null,
    mostCommonType: null,
    furnishingDistribution: [],
  };

  if (!listings.length) return summary;

  let rentTotal = 0;
  let rentCount = 0;
  let rentPerSqftTotal = 0;
  let rentPerSqftCount = 0;
  const typeCounts = new window.Map();
  const furnishingCounts = new window.Map();

  listings.forEach((listing) => {
    const rent = toNumber(listing?.Rent);
    const rentPerSqft = toNumber(listing?.Rent_per_sqft);

    if (rent !== null) {
      rentTotal += rent;
      rentCount += 1;
    }

    if (rentPerSqft !== null) {
      rentPerSqftTotal += rentPerSqft;
      rentPerSqftCount += 1;
    }

    const type = listing?.Type || 'Unknown';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

    const furnishing = listing?.Furnishing || 'Unknown';
    furnishingCounts.set(furnishing, (furnishingCounts.get(furnishing) || 0) + 1);
  });

  summary.averageRent = rentCount > 0 ? rentTotal / rentCount : null;
  summary.averageRentPerSqft = rentPerSqftCount > 0 ? rentPerSqftTotal / rentPerSqftCount : null;
  summary.mostCommonType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  summary.furnishingDistribution = [...furnishingCounts.entries()]
    .map(([label, count]) => ({ label, count, share: (count / listings.length) * 100 }))
    .sort((a, b) => b.count - a.count);

  return summary;
};

const Map = ({
  selectedFilter,
  disableScrollZoom = false,
  selectedDataPoint = null,
  propertyExplorerConfig = {},
  onAreaSelect,
  onPointSelect,
  onExplorerSummaryChange,
  onSearchResultsChange,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const clickPopupRef = useRef(null);
  const processedDataCache = useRef(new window.Map());
  const lastSearchKeyRef = useRef('');
  const onAreaSelectRef = useRef(onAreaSelect);
  const onPointSelectRef = useRef(onPointSelect);
  const onExplorerSummaryChangeRef = useRef(onExplorerSummaryChange);
  const onSearchResultsChangeRef = useRef(onSearchResultsChange);

  const lng = 55.3;
  const lat = 25.15;
  const zoom = 7;
  const isPropertyMode = PROPERTY_DATA_POINT_IDS.includes(selectedDataPoint);
  const explorerEnabled = propertyExplorerConfig.enabled !== false && (propertyExplorerConfig.enabled || isPropertyMode);
  const viewMode = PROPERTY_VIEW_MODES.includes(propertyExplorerConfig.viewMode)
    ? propertyExplorerConfig.viewMode
    : (explorerEnabled ? 'combined' : 'area-insights-only');
  const selectedAreaKey = propertyExplorerConfig.selectedAreaKey || null;
  const propertyFilters = useMemo(() => propertyExplorerConfig.filters || {}, [propertyExplorerConfig.filters]);
  const selectedComboSelections = useMemo(
    () => (Array.isArray(propertyFilters.comboSelections) ? propertyFilters.comboSelections : []),
    [propertyFilters],
  );
  const comboColorMeta = useMemo(
    () => selectedComboSelections.map((combo, index) => ({
      key: getSelectionKey(combo, index),
      label: getSelectionLabel(combo),
      color: PROPERTY_COMBO_COLORS[index % PROPERTY_COMBO_COLORS.length],
      index,
    })),
    [selectedComboSelections],
  );
  const selectedTypeNames = useMemo(
    () => selectedComboSelections.map((selection) => selection?.type).filter((type) => Boolean(type)),
    [selectedComboSelections],
  );
  const selectedFurnishingClasses = useMemo(
    () => selectedComboSelections.map((selection) => selection?.furnishingClass).filter((value) => Boolean(value)),
    [selectedComboSelections],
  );
  const dominantTypeColorMeta = useMemo(() => {
    const typeRows = Array.isArray(propertyInsights?.type_counts) ? propertyInsights.type_counts : [];
    const uniqueTypes = [];
    const seenTypes = new Set();

    typeRows.forEach((row) => {
      const typeName = row?.Type ? String(row.Type) : null;
      if (!typeName || seenTypes.has(typeName)) return;
      seenTypes.add(typeName);
      uniqueTypes.push(typeName);
    });

    return uniqueTypes.map((typeName, index) => ({
      type: typeName,
      color: PROPERTY_TYPE_COLORS[index % PROPERTY_TYPE_COLORS.length],
    }));
  }, []);
  const isTypeDistributionMode = selectedDataPoint === 'property-type-counts';
  const searchQuery = propertyExplorerConfig.searchQuery || '';
  const searchQueryText = searchQuery.trim();

  const isMobile = () => window.innerWidth <= 780;

  const filteredPropertyListings = useMemo(() => {
    if (!explorerEnabled) return propertyListings;
    return filterPropertyListings(propertyListings, propertyFilters);
  }, [explorerEnabled, propertyFilters]);

  const areaAggregationListings = useMemo(() => {
    if (!explorerEnabled) return propertyListings;
    if (!['property-type-counts', 'property-furnishing-counts'].includes(selectedDataPoint)) {
      return filteredPropertyListings;
    }

    const { comboSelections, ...baseFilters } = propertyFilters;
    return filterPropertyListings(propertyListings, baseFilters);
  }, [explorerEnabled, selectedDataPoint, filteredPropertyListings, propertyFilters]);

  const searchablePropertyListings = useMemo(() => {
    if (!searchQueryText) return [];
    return filterPropertyListings(filteredPropertyListings, { searchQuery: searchQueryText });
  }, [filteredPropertyListings, searchQueryText]);

  const propertyPointsGeoJSON = useMemo(() => {
    if (!comboColorMeta.length) return getPropertyPointsGeoJSON(filteredPropertyListings);
    return getPropertyPointsGeoJSONWithSelections(filteredPropertyListings, selectedComboSelections);
  }, [filteredPropertyListings, comboColorMeta.length, selectedComboSelections]);

  const allPropertyPointsGeoJSON = useMemo(() => getPropertyPointsGeoJSON(propertyListings), []);

  const searchPointsGeoJSON = useMemo(() => getPropertyPointsGeoJSON(searchablePropertyListings), [searchablePropertyListings]);

  const propertyAreaGeoJSON = useMemo(() => {
    const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
    if (!explorerEnabled) return baseGeoJSON;
    return addPropertyMetricsToGeoJSON(baseGeoJSON, areaAggregationListings, propertyInsights);
  }, [explorerEnabled, areaAggregationListings, selectedFilter]);

  const explorerSummary = useMemo(() => getPropertySummary(filteredPropertyListings), [filteredPropertyListings]);

  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect;
  }, [onAreaSelect]);

  useEffect(() => {
    onPointSelectRef.current = onPointSelect;
  }, [onPointSelect]);

  useEffect(() => {
    onExplorerSummaryChangeRef.current = onExplorerSummaryChange;
  }, [onExplorerSummaryChange]);

  useEffect(() => {
    onSearchResultsChangeRef.current = onSearchResultsChange;
  }, [onSearchResultsChange]);

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

  const getMapData = useCallback(() => {
    const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
    return isPropertyMode ? propertyAreaGeoJSON : addPopulation(baseGeoJSON, New_Population);
  }, [selectedFilter, isPropertyMode, addPopulation, propertyAreaGeoJSON]);

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
      const furnishingExpression = [
        'match', ['coalesce', ['get', 'property_dominant_furnishing'], 'unknown'],
        'furnished', PROPERTY_FURNISHING_COLORS.furnished,
        'unfurnished', PROPERTY_FURNISHING_COLORS.unfurnished,
        'mixed', PROPERTY_FURNISHING_COLORS.mixed,
        PROPERTY_FURNISHING_COLORS.unknown,
      ];
      if (selectedFurnishingClasses.length > 0) {
        return [
          'case',
          ['in', ['coalesce', ['get', 'property_dominant_furnishing'], 'unknown'], ['literal', selectedFurnishingClasses]],
          furnishingExpression,
          '#e5e7eb',
        ];
      }
      return furnishingExpression;
    }

    if (selectedDataPoint === 'property-type-counts') {
      const expression = ['match', ['coalesce', ['get', 'property_dominant_type'], 'Unknown']];
      dominantTypeColorMeta.forEach((entry) => {
        expression.push(entry.type, entry.color);
      });
      expression.push('#d1d5db');
      if (selectedTypeNames.length > 0) {
        return [
          'case',
          ['in', ['coalesce', ['get', 'property_dominant_type'], 'Unknown'], ['literal', selectedTypeNames]],
          expression,
          '#e5e7eb',
        ];
      }
      return expression;
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
  }, [isPropertyMode, selectedDataPoint, dominantTypeColorMeta, selectedTypeNames, selectedFurnishingClasses]);

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
    } else if (selectedDataPoint === 'property-type-counts') {
      valueExpr = ['case', ['!=', ['get', 'property_dominant_type'], null], ['concat', 'Dominant: ', ['get', 'property_dominant_type']], 'No Data'];
    } else if (selectedDataPoint === 'property-furnishing-counts') {
      valueExpr = ['case', ['!=', ['get', 'property_dominant_furnishing'], null], ['concat', 'Dominant: ', ['get', 'property_dominant_furnishing']], 'No Data'];
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

  const initialMapDataRef = useRef(null);
  const initialAreaColorRef = useRef(null);
  const initialTextFieldRef = useRef(null);

  if (initialMapDataRef.current === null) {
    const baseGeoJSON = selectedFilter === 'Area' ? geojsonData : dubaiWEBDATA;
    initialMapDataRef.current = isPropertyMode ? propertyAreaGeoJSON : addPopulation(baseGeoJSON, New_Population);
  }

  if (initialAreaColorRef.current === null) {
    initialAreaColorRef.current = getColorScheme();
  }

  if (initialTextFieldRef.current === null) {
    initialTextFieldRef.current = getTextFieldExpression();
  }

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
        data: initialMapDataRef.current,
      });
    
      map.current.addLayer({
        id: 'dubai-communities-fill',
        type: 'fill',
        source: 'dubai-communities',
        paint: {
          'fill-color': initialAreaColorRef.current,
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
          'text-field': initialTextFieldRef.current,
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
    
      if (!map.current.getSource('property-points')) {
        map.current.addSource('property-all-points', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.current.addSource('property-points', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 48,
        });

        map.current.addSource('property-search-results', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.current.addLayer({
          id: 'property-all-points-dot',
          type: 'circle',
          source: 'property-all-points',
          layout: {
            visibility: 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 1.7,
              9, 2.4,
              12, 3.3,
              15, 4.1,
            ],
            'circle-color': '#0f172a',
            'circle-opacity': 0.55,
          },
        });

        map.current.addLayer({
          id: 'property-points-clusters',
          type: 'circle',
          source: 'property-points',
          filter: ['has', 'point_count'],
          layout: {
            visibility: 'none',
          },
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#c5cae9', 25, '#9575cd', 100, '#5e35b1'],
            'circle-radius': ['step', ['get', 'point_count'], 18, 25, 24, 100, 32],
            'circle-opacity': 0.88,
          },
        });

        map.current.addLayer({
          id: 'property-points-cluster-count',
          type: 'symbol',
          source: 'property-points',
          filter: ['has', 'point_count'],
          layout: {
            visibility: 'none',
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        map.current.addLayer({
          id: 'property-points-unclustered',
          type: 'circle',
          source: 'property-points',
          filter: ['!', ['has', 'point_count']],
          layout: {
            visibility: 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 2.5,
              10, 4.5,
              14, 7,
            ],
            'circle-color': '#1976d2',
            'circle-opacity': 0.9,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.25,
          },
        });

        map.current.addLayer({
          id: 'property-search-results-layer',
          type: 'circle',
          source: 'property-search-results',
          layout: {
            visibility: 'none',
          },
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 5,
              14, 10,
            ],
            'circle-color': '#ff6f00',
            'circle-opacity': 0.95,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        });
      }

      setupInteractions();
      setupMarker();
      setupControls();
    });

    function setupInteractions() {
      if (!map.current) return;

      const dispatchAreaSelectionEvent = (props, lngLat) => {
        const placeName = props.COMMUNITY_E || props.CNAME_E || 'Selected Area';
        const areaKey = props.COMM_NUM || props.CNAME_E || props.COMMUNITY_E || placeName;
        const areaSelection = {
          areaName: placeName,
          areaKey,
          selectedDataPoint,
          lngLat,
          areaMetrics: {
            listingCount: props.property_listing_count,
            avgRent: props.property_avg_rent,
            avgRentPerSqft: props.property_avg_rent_per_sqft,
            furnishedShare: props.property_furnished_share,
            unfurnishedShare: props.property_unfurnished_share,
            furnishedCount: props.property_furnished_count,
            unfurnishedCount: props.property_unfurnished_count,
            dominantType: props.property_dominant_type,
            matchedLocation: props.property_source_location,
            typeCounts: parseStructuredProperty(props.property_type_counts, {}),
            typeMetrics: parseStructuredProperty(props.property_type_metrics, {}),
            furnishingCounts: parseStructuredProperty(props.property_furnishing_counts, {}),
            bedsCounts: parseStructuredProperty(props.property_beds_counts, {}),
            bathsCounts: parseStructuredProperty(props.property_baths_counts, {}),
            comboCounts: parseStructuredProperty(props.property_combo_counts, []),
            comboMetrics: parseStructuredProperty(props.property_combo_metrics, []),
          },
        };

        if (isPropertyMode) {
          if (onAreaSelectRef.current) {
            onAreaSelectRef.current(areaSelection);
          }

          window.dispatchEvent(new CustomEvent('property:areaClicked', {
            detail: areaSelection,
          }));
          return;
        }

        if (onAreaSelectRef.current) {
          onAreaSelectRef.current(areaSelection);
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
        const furnishedShareRaw = toNumber(props.property_furnished_share);
        const unfurnishedShareRaw = toNumber(props.property_unfurnished_share);
        const furnishedShare = furnishedShareRaw;
        const unfurnishedShare = unfurnishedShareRaw !== null
          ? unfurnishedShareRaw
          : (furnishedShareRaw !== null ? Math.max(0, 100 - furnishedShareRaw) : null);
        const dominantType = props.property_dominant_type;
        const sourceLocation = props.property_source_location;

        let valueLabel = '';
        let valueLabel2 = '';
        let valueLabel3 = '';
        if (selectedDataPoint === 'property-rent-per-sqft-location') {
          valueLabel = avgRentSqft != null ? `<br/>Rent/sqft: AED ${Number(avgRentSqft).toFixed(2)}` : '<br/>Rent/sqft: No Data';
          valueLabel2 = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '';
        } else if (selectedDataPoint === 'property-furnishing-counts') {
          valueLabel = furnishedShare != null ? `<br/>Furnished Share: ${Number(furnishedShare).toFixed(1)}%` : '<br/>Furnished Share: No Data';
          valueLabel2 = unfurnishedShare != null ? `<br/>Unfurnished Share: ${Number(unfurnishedShare).toFixed(1)}%` : '<br/>Unfurnished Share: No Data';
          valueLabel3 = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '';
        } else if (selectedDataPoint === 'property-avg-rent-beds-type' || selectedDataPoint === 'property-avg-rent-baths-type') {
          valueLabel = avgRent != null ? `<br/>Avg Rent: AED ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(avgRent)}` : '<br/>Avg Rent: No Data';
          valueLabel2 = dominantType ? `<br/>Dominant Type: ${dominantType}` : '';
        } else {
          valueLabel = listingCount != null ? `<br/>Listings: ${new Intl.NumberFormat('en-US').format(listingCount)}` : '<br/>Listings: No Data';
          valueLabel2 = dominantType ? `<br/>Dominant Type: ${dominantType}` : '';
        }

        if (sourceLocation) {
          valueLabel3 = `${valueLabel3}<br/>Matched Location: ${sourceLocation}`;
        }
        return { valueLabel, valueLabel2, valueLabel3 };
      };

      const showPropertyPointPopup = (feature) => {
        if (!feature?.geometry || !map.current) return;

        if (clickPopupRef.current) clickPopupRef.current.remove();

        const properties = feature.properties || {};
        const listing = properties.listing || {};
        const rent = toNumber(listing.Rent ?? properties.rent);
        const beds = listing.Beds ?? properties.beds;
        const baths = listing.Baths ?? properties.baths;
        const type = listing.Type ?? properties.type;
        const location = listing.Location ?? properties.location;
        const furnishing = listing.Furnishing ?? properties.furnishing;

        const popupHTML = `
          <div style="padding: 10px; min-width: 240px; max-width: 300px;">
            <strong style="display:block; margin-bottom: 8px; font-size: 14px;">${listing.Address || location || 'Property Listing'}</strong>
            <div style="font-size: 13px; line-height: 1.55; color: #1f2937;">
              <div><strong>Rent:</strong> ${rent !== null ? formatMoney(rent) : 'No Data'}</div>
              <div><strong>Beds / Baths:</strong> ${beds ?? 'N/A'} / ${baths ?? 'N/A'}</div>
              <div><strong>Type:</strong> ${type || 'N/A'}</div>
              <div><strong>Furnishing:</strong> ${furnishing || 'N/A'}</div>
              <div><strong>Location:</strong> ${location || 'N/A'}</div>
              <div><strong>Rent / sqft:</strong> ${toNumber(listing.Rent_per_sqft) !== null ? `AED ${Number(listing.Rent_per_sqft).toFixed(2)}` : 'No Data'}</div>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(popupHTML)
          .addTo(map.current);

        clickPopupRef.current = popup;

        if (onPointSelectRef.current) {
          onPointSelectRef.current({
            listing,
            coordinates: feature.geometry.coordinates,
            rent,
            beds,
            baths,
            type,
            furnishing,
            location,
          });
        }
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

      if (isPropertyMode) {
        map.current.on('click', 'property-points-clusters', (event) => {
          const features = map.current.queryRenderedFeatures(event.point, { layers: ['property-points-clusters'] });
          const cluster = features[0];
          if (!cluster) return;

          const clusterSource = map.current.getSource('property-points');
          clusterSource.getClusterExpansionZoom(cluster.properties.cluster_id, (error, expansionZoom) => {
            if (error) return;
            map.current.easeTo({
              center: cluster.geometry.coordinates,
              zoom: expansionZoom,
              duration: 600,
            });
          });
        });

        const pointClickHandler = (event) => {
          const features = map.current.queryRenderedFeatures(event.point, { layers: ['property-points-unclustered', 'property-search-results-layer'] });
          const feature = features[0];
          if (!feature) return;
          showPropertyPointPopup(feature);
        };

        map.current.on('click', 'property-points-unclustered', pointClickHandler);
        map.current.on('click', 'property-search-results-layer', pointClickHandler);

        map.current.on('mouseenter', 'property-points-unclustered', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'property-points-unclustered', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
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
  }, [disableScrollZoom, selectedDataPoint, isPropertyMode]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const resizeMap = () => {
      if (!map.current) return;
      map.current.resize();
    };

    resizeMap();
    const rafId = window.requestAnimationFrame(resizeMap);
    const timeoutShort = window.setTimeout(resizeMap, 80);
    const timeoutLong = window.setTimeout(resizeMap, 260);

    window.addEventListener('resize', resizeMap);

    let resizeObserver;
    if (window.ResizeObserver && mapContainer.current) {
      resizeObserver = new window.ResizeObserver(() => {
        resizeMap();
      });
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutShort);
      window.clearTimeout(timeoutLong);
      window.removeEventListener('resize', resizeMap);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const timeoutId = window.setTimeout(() => {
      if (!map.current) return;
      map.current.resize();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isMapLoaded, selectedFilter, selectedDataPoint, viewMode, explorerEnabled]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const source = map.current.getSource('dubai-communities');
    if (source) {
      source.setData(getMapData());
    }

    if (map.current.getLayer('dubai-communities-fill')) {
      map.current.setPaintProperty('dubai-communities-fill', 'fill-color', getColorScheme());
      if (isPropertyMode && selectedDataPoint === 'property-type-counts' && selectedTypeNames.length > 0) {
        map.current.setPaintProperty(
          'dubai-communities-fill',
          'fill-opacity',
          [
            'case',
            ['in', ['coalesce', ['get', 'property_dominant_type'], 'Unknown'], ['literal', selectedTypeNames]],
            0.82,
            0.25,
          ],
        );
      } else {
        map.current.setPaintProperty(
          'dubai-communities-fill',
          'fill-opacity',
          isPropertyMode && selectedDataPoint === 'property-furnishing-counts' && selectedFurnishingClasses.length > 0
            ? [
                'case',
                ['in', ['coalesce', ['get', 'property_dominant_furnishing'], 'unknown'], ['literal', selectedFurnishingClasses]],
                0.82,
                0.25,
              ]
            : isPropertyMode && explorerEnabled
            ? ['case', ['==', ['get', 'COMM_NUM'], selectedAreaKey], 0.9, 0.48]
            : 0.7,
        );
      }
      map.current.setPaintProperty(
        'dubai-communities-fill',
        'fill-outline-color',
        isPropertyMode && selectedAreaKey ? '#111827' : '#000000',
      );
    }

    if (map.current.getLayer('dubai-communities-name')) {
      map.current.setLayoutProperty('dubai-communities-name', 'text-field', getTextFieldExpression());
    }

    if (map.current.getSource('property-points')) {
      map.current.getSource('property-points').setData(propertyPointsGeoJSON);
    }

    if (map.current.getSource('property-all-points')) {
      map.current.getSource('property-all-points').setData(allPropertyPointsGeoJSON);
    }

    if (map.current.getLayer('property-points-unclustered')) {
      let unclusteredColor = '#1976d2';
      if (comboColorMeta.length > 1) {
        const matchExpression = ['match', ['get', 'selection_index']];
        comboColorMeta.forEach((entry) => {
          matchExpression.push(entry.index, entry.color);
        });
        matchExpression.push('#1976d2');
        unclusteredColor = matchExpression;
      } else if (comboColorMeta.length === 1) {
        unclusteredColor = comboColorMeta[0].color;
      }

      map.current.setPaintProperty('property-points-unclustered', 'circle-color', unclusteredColor);
    }

    if (map.current.getSource('property-search-results')) {
      map.current.getSource('property-search-results').setData(searchPointsGeoJSON);
    }

    const propertyLayersVisible = isPropertyMode && viewMode !== 'area-insights-only';
    const searchLayerVisible = propertyLayersVisible && searchQueryText && searchPointsGeoJSON.features.length > 0;

    ['property-points-clusters', 'property-points-cluster-count', 'property-points-unclustered'].forEach((layerId) => {
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(layerId, 'visibility', propertyLayersVisible ? 'visible' : 'none');
      }
    });

    if (map.current.getLayer('property-all-points-dot')) {
      map.current.setLayoutProperty('property-all-points-dot', 'visibility', isPropertyMode ? 'visible' : 'none');
    }

    if (map.current.getLayer('property-search-results-layer')) {
      map.current.setLayoutProperty('property-search-results-layer', 'visibility', searchLayerVisible ? 'visible' : 'none');
    }

    if (onExplorerSummaryChangeRef.current) {
      onExplorerSummaryChangeRef.current({
        ...explorerSummary,
        searchQuery: searchQueryText,
        searchMatchCount: searchPointsGeoJSON.features.length,
        selectedAreaKey,
        viewMode,
      });
    }

    if (onSearchResultsChangeRef.current) {
      onSearchResultsChangeRef.current(searchPointsGeoJSON.features.map((feature) => feature.properties?.listing || feature.properties || {}));
    }

    const searchKey = `${searchQueryText}:${searchPointsGeoJSON.features.length}`;
    if (searchLayerVisible && lastSearchKeyRef.current !== searchKey) {
      const bounds = new mapboxgl.LngLatBounds();
      searchPointsGeoJSON.features.forEach((feature) => {
        const coordinates = feature.geometry?.coordinates;
        if (coordinates) bounds.extend(coordinates);
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 120, bottom: 80, left: 80, right: 80 },
          duration: 700,
          maxZoom: 14,
        });
      }

      lastSearchKeyRef.current = searchKey;
    }

    if (!searchLayerVisible) {
      lastSearchKeyRef.current = '';
    }

  }, [
    isMapLoaded,
    getMapData,
    getColorScheme,
    getTextFieldExpression,
    isPropertyMode,
    selectedDataPoint,
    explorerEnabled,
    selectedAreaKey,
    viewMode,
    propertyPointsGeoJSON,
    allPropertyPointsGeoJSON,
    searchPointsGeoJSON,
    searchQueryText,
    explorerSummary,
    comboColorMeta,
    selectedTypeNames,
    selectedFurnishingClasses,
    onExplorerSummaryChange,
    onSearchResultsChange,
  ]);

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

      {isPropertyMode && comboColorMeta.length > 0 && (
        <div className="absolute bottom-4 left-4 z-40 max-w-xs rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-800 mb-2">
            {comboColorMeta.length > 1 ? 'Selected Groups (Color Coded)' : 'Selected Group'}
          </p>
          <div className="space-y-1.5">
            {comboColorMeta.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.label}</span>
              </div>
            ))}
          </div>
          {comboColorMeta.length > 1 && (
            <p className="text-[11px] text-gray-500 mt-2">Zoom in to view individual colored points when clusters are merged.</p>
          )}
        </div>
      )}

      {isPropertyMode && isTypeDistributionMode && dominantTypeColorMeta.length > 0 && (
        <div className="absolute top-28 right-4 z-40 max-w-xs rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-800 mb-2">Dominant Property Type Colors</p>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {dominantTypeColorMeta.map((entry) => (
              <div key={entry.type} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPropertyMode && selectedDataPoint === 'property-furnishing-counts' && (
        <div className="absolute top-28 right-4 z-40 max-w-xs rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-800 mb-2">Furnishing Colors</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_FURNISHING_COLORS.furnished }} />
              <span>Furnished</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_FURNISHING_COLORS.unfurnished }} />
              <span>Unfurnished</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_FURNISHING_COLORS.mixed }} />
              <span>Mixed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROPERTY_FURNISHING_COLORS.unknown }} />
              <span>No Data</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
