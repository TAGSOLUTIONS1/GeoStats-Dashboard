import schoolsData from '../data/schools.json';

// Cache for reverse geocoding results
const locationCache = new Map();

/**
 * Get location address from coordinates using geostat.display_name from schools data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} - Location address string
 */
export const getLocationFromCoordinates = async (lat, lon) => {
  if (!lat || !lon) return null;
  
  // Create cache key
  const cacheKey = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
  
  // Check cache first
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }
  
  // Find school by matching coordinates (with small tolerance for floating point differences)
  const tolerance = 0.0001; // Approximately 11 meters
  const school = schoolsData.find(s => {
    if (!s.Latitude || !s.Longitude) return false;
    const latDiff = Math.abs(s.Latitude - lat);
    const lonDiff = Math.abs(s.Longitude - lon);
    return latDiff < tolerance && lonDiff < tolerance;
  });
  
  // Get location from geostat.display_name if available
  let location = null;
  if (school && school.geostat && school.geostat.display_name) {
    location = school.geostat.display_name;
  } else if (school && school.Location) {
    // Fallback to Location field if geostat.display_name is not available
    location = school.Location;
  }
  
  // Cache the result
  if (location) {
    locationCache.set(cacheKey, location);
  }
  
  return location;
};


/**
 * Check if a school point is within an area polygon
 * Uses point-in-polygon algorithm
 */
const isPointInPolygon = (point, polygon) => {
  if (!polygon || !polygon.coordinates || !point) return false;
  
  const [lng, lat] = point;
  let inside = false;
  
  // Handle Polygon and MultiPolygon coordinate structures
  // Polygon: coordinates = [[[lng, lat], ...]] - array of rings
  // MultiPolygon: coordinates = [[[[lng, lat], ...]], ...] - array of polygons, each with rings
  let coordinates;
  if (polygon.type === 'MultiPolygon') {
    // MultiPolygon: get first polygon's first ring
    if (!polygon.coordinates[0] || !polygon.coordinates[0][0]) return false;
    coordinates = polygon.coordinates[0][0];
  } else if (polygon.type === 'Polygon') {
    // Polygon: get first ring (outer boundary)
    if (!polygon.coordinates[0]) return false;
    coordinates = polygon.coordinates[0];
  } else {
    return false;
  }
  
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const [xi, yi] = coordinates[i];
    const [xj, yj] = coordinates[j];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Count schools per area using point-in-polygon matching
 * Uses school lat/lng and area geometry from geoData
 */
export const countSchoolsByArea = (geojsonFeatures) => {
  const areaSchoolCounts = new Map();
  
  // Initialize all areas with 0 schools
  geojsonFeatures.forEach(feature => {
    const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    if (areaName) {
      areaSchoolCounts.set(areaName, 0);
    }
  });
  
  // Count schools for each area using point-in-polygon
  schoolsData.forEach(school => {
    // Skip schools without coordinates
    if (!school.Latitude || !school.Longitude) return;
    
    const schoolPoint = [school.Longitude, school.Latitude];
    
    // Check which area polygon contains this school point
    for (const feature of geojsonFeatures) {
      if (!feature.geometry) continue;
      
      const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
      if (!areaName) continue;
      
      if (isPointInPolygon(schoolPoint, feature.geometry)) {
        areaSchoolCounts.set(areaName, (areaSchoolCounts.get(areaName) || 0) + 1);
        break; // School can only be in one area
      }
    }
  });
  
  return areaSchoolCounts;
};

/**
 * Add school counts to GeoJSON features
 */
export const addSchoolCountsToGeoJSON = (geojson) => {
  if (!geojson || !geojson.features) {
    return geojson;
  }
  
  const schoolCounts = countSchoolsByArea(geojson.features);
  
  const processedFeatures = geojson.features.map(feature => {
    const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    const schoolCount = schoolCounts.get(areaName) || 0;
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        SchoolCount: schoolCount
      }
    };
  });
  
  return {
    ...geojson,
    features: processedFeatures
  };
};

/**
 * Get schools by area name using point-in-polygon
 */
export const getSchoolsByArea = (areaName, geojsonFeatures) => {
  if (!areaName || !geojsonFeatures) {
    console.log('getSchoolsByArea: Missing parameters', { areaName, hasFeatures: !!geojsonFeatures });
    return [];
  }
  
  // Find the feature for this area
  const areaFeature = geojsonFeatures.find(feature => {
    const featureAreaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    return featureAreaName === areaName;
  });
  
  console.log('getSchoolsByArea called:', {
    areaName,
    areaFeatureFound: !!areaFeature,
    hasGeometry: !!areaFeature?.geometry,
    totalFeatures: geojsonFeatures.length
  });
  
  if (!areaFeature || !areaFeature.geometry) {
    console.log('getSchoolsByArea: Area feature not found or has no geometry');
    return [];
  }
  
  // Filter schools that fall within this area's polygon
  const schoolsInArea = schoolsData.filter(school => {
    if (!school.Latitude || !school.Longitude) return false;
    const schoolPoint = [school.Longitude, school.Latitude];
    return isPointInPolygon(schoolPoint, areaFeature.geometry);
  });
  
  console.log('getSchoolsByArea result:', {
    areaName,
    schoolsFound: schoolsInArea.length
  });
  
  return schoolsInArea;
};

/**
 * Get all unique locations from schools
 */
export const getAllSchoolLocations = () => {
  const locations = new Set();
  schoolsData.forEach(school => {
    // Prefer geostat.address.neighbourhood, then geostat.display_name
    const neighbourhood = school.geostat?.address?.neighbourhood;
    const displayName = school.geostat?.display_name;
    
    if (neighbourhood) {
      locations.add(neighbourhood);
    } else if (displayName) {
      locations.add(displayName);
    }
  });
  return Array.from(locations).sort();
};

/**
 * Get schools within a bounding box
 */
export const getSchoolsInBounds = (bounds) => {
  if (!bounds || !Array.isArray(bounds) || bounds.length !== 2) return [];
  
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  
  return schoolsData.filter(school => {
    if (!school.Longitude || !school.Latitude) return false;
    return school.Longitude >= minLng &&
           school.Longitude <= maxLng &&
           school.Latitude >= minLat &&
           school.Latitude <= maxLat;
  });
};

/**
 * Get schools near a point (within radius in km)
 */
export const getSchoolsNearPoint = (lng, lat, radiusKm = 5) => {
  if (!lng || !lat) return [];
  
  return schoolsData
    .filter(school => school.Longitude && school.Latitude)
    .map(school => {
      const distance = calculateDistance(lat, lng, school.Latitude, school.Longitude);
      return { ...school, distance };
    })
    .filter(school => school.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Calculate distance between two points using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * TEST FUNCTION: Find which area a school falls into based on coordinates
 * Uses point-in-polygon algorithm to determine the area
 * @param {number} lat - School latitude
 * @param {number} lng - School longitude
 * @param {Array} geojsonFeatures - Array of GeoJSON features with polygons
 * @returns {string|null} - Area name (CNAME_E) or null if not found
 */
export const findAreaForSchool = (lat, lng, geojsonFeatures) => {
  if (!lat || !lng || !geojsonFeatures || !Array.isArray(geojsonFeatures)) {
    return null;
  }
  
  const schoolPoint = [lng, lat];
  
  for (const feature of geojsonFeatures) {
    if (!feature.geometry) continue;
    
    const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    if (!areaName) continue;
    
    if (isPointInPolygon(schoolPoint, feature.geometry)) {
      return areaName;
    }
  }
  
  return null;
};

