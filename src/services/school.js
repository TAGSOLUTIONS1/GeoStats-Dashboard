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
 * Match school location to area name (CNAME)
 * Strict matching - no normalization, exact or contains match only
 */
const matchLocationToArea = (schoolLocation, areaName) => {
  if (!schoolLocation || !areaName) return false;
  
  // Convert both to uppercase for case-insensitive comparison
  const schoolUpper = schoolLocation.toUpperCase().trim();
  const areaUpper = areaName.toUpperCase().trim();
  
  // Exact match (case-insensitive)
  if (schoolUpper === areaUpper) return true;
  
  // Contains match: area name must be contained in school location
  // This handles cases like "Cycle Path, Wadi Al Safa 3, Dubai" containing "WADI AL SAFA 3"
  if (schoolUpper.includes(areaUpper)) {
    return true;
  }
  
  return false;
};

/**
 * Check if a school point is within an area polygon
 * Uses point-in-polygon algorithm
 */
const isPointInPolygon = (point, polygon) => {
  if (!polygon || !polygon.coordinates || !point) return false;
  
  const [lng, lat] = point;
  let inside = false;
  
  // Handle MultiPolygon
  const coordinates = polygon.type === 'MultiPolygon' 
    ? polygon.coordinates[0] 
    : polygon.coordinates;
  
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
 * Count schools per area based on location name matching
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
  
  // Count schools for each area - PRIORITIZE name matching (geostat.address.neighbourhood first, then geostat.display_name), then point-in-polygon as fallback
  schoolsData.forEach(school => {
    // Skip schools without coordinates
    if (!school.Latitude || !school.Longitude) return;
    
    const schoolPoint = [school.Longitude, school.Latitude];
    let matched = false;
    
    // FIRST: Try name matching
    // Priority 1: Check geostat.address.neighbourhood
    // Priority 2: Check if area name appears in geostat.display_name (like "..., area name, ...")
    const neighbourhood = school.geostat?.address?.neighbourhood;
    const displayName = school.geostat?.display_name;
    
    if (neighbourhood || displayName) {
      for (const [areaName] of areaSchoolCounts) {
        // First check neighbourhood
        if (neighbourhood && matchLocationToArea(neighbourhood, areaName)) {
          const currentCount = areaSchoolCounts.get(areaName) || 0;
          areaSchoolCounts.set(areaName, currentCount + 1);
          matched = true;
          break;
        }
        
        // Then check if area name appears in display_name
        if (displayName && matchLocationToArea(displayName, areaName)) {
          const currentCount = areaSchoolCounts.get(areaName) || 0;
          areaSchoolCounts.set(areaName, currentCount + 1);
          matched = true;
          break;
        }
      }
    }
    
    // FALLBACK: If name matching fails, try point-in-polygon
    if (!matched) {
      geojsonFeatures.forEach(feature => {
        if (matched) return; // Already matched, skip
        
        const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
        if (!areaName) return;
        
        if (feature.geometry && isPointInPolygon(schoolPoint, feature.geometry)) {
          areaSchoolCounts.set(areaName, (areaSchoolCounts.get(areaName) || 0) + 1);
          matched = true;
        }
      });
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
 * Get schools by area name
 */
export const getSchoolsByArea = (areaName) => {
  if (!areaName) return [];
  
  return schoolsData.filter(school => {
    // First check geostat.address.neighbourhood, then geostat.display_name
    const neighbourhood = school.geostat?.address?.neighbourhood;
    const displayName = school.geostat?.display_name;
    
    if (neighbourhood && matchLocationToArea(neighbourhood, areaName)) {
      return true;
    }
    
    if (displayName && matchLocationToArea(displayName, areaName)) {
      return true;
    }
    
    return false;
  });
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

