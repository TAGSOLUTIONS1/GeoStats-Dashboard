import schoolsData from '../data/schools.json';

/**
 * Normalize location names for matching
 * Removes common variations and standardizes format
 */
const normalizeLocationName = (name) => {
  if (!name) return '';
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/^(AL|AL-)/, 'AL ') // Standardize AL prefix
    .replace(/\s+(FIRST|SECOND|THIRD|1ST|2ND|3RD)$/i, '') // Remove ordinal suffixes for matching
    .trim();
};

/**
 * Match school location to area name
 * Tries multiple matching strategies
 */
const matchLocationToArea = (schoolLocation, areaName) => {
  if (!schoolLocation || !areaName) return false;
  
  const normalizedSchool = normalizeLocationName(schoolLocation);
  const normalizedArea = normalizeLocationName(areaName);
  
  // Exact match
  if (normalizedSchool === normalizedArea) return true;
  
  // Contains match (e.g., "AL QUSAIS FIRST" matches "AL QUSAIS")
  if (normalizedSchool.includes(normalizedArea) || normalizedArea.includes(normalizedSchool)) {
    return true;
  }
  
  // Remove common prefixes and match
  const schoolWithoutPrefix = normalizedSchool.replace(/^(AL|AL-)\s*/i, '');
  const areaWithoutPrefix = normalizedArea.replace(/^(AL|AL-)\s*/i, '');
  
  if (schoolWithoutPrefix === areaWithoutPrefix) return true;
  if (schoolWithoutPrefix.includes(areaWithoutPrefix) || areaWithoutPrefix.includes(schoolWithoutPrefix)) {
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
  
  // Count schools for each area
  schoolsData.forEach(school => {
    if (!school.Location || !school.Latitude || !school.Longitude) return;
    
    // Try to match by location name
    let matched = false;
    for (const [areaName] of areaSchoolCounts) {
      if (matchLocationToArea(school.Location, areaName)) {
        areaSchoolCounts.set(areaName, (areaSchoolCounts.get(areaName) || 0) + 1);
        matched = true;
        break;
      }
    }
    
    // If name matching fails, try point-in-polygon
    if (!matched) {
      const schoolPoint = [school.Longitude, school.Latitude];
      
      geojsonFeatures.forEach(feature => {
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
  if (!geojson || !geojson.features) return geojson;
  
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
    if (!school.Location) return false;
    return matchLocationToArea(school.Location, areaName);
  });
};

/**
 * Get all unique locations from schools
 */
export const getAllSchoolLocations = () => {
  const locations = new Set();
  schoolsData.forEach(school => {
    if (school.Location) {
      locations.add(school.Location);
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

