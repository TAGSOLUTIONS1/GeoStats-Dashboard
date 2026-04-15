import schoolsData from '../data/schools/schools.json';
import schoolsWithFeesData from '../data/schools/schools_with_fees.json';
import schoolsWithFeesOverYearsData from '../data/schools/schools_with_fees_over_years.json';

// Merge schools data with fees data
const mergeSchoolsWithFees = () => {
  const feesMap = new Map();
  schoolsWithFeesData.forEach(school => {
    if (school['School Name']) {
      feesMap.set(school['School Name'], school.fees || null);
    }
  });
  
  // Also merge fees over years data
  const feesOverYearsMap = new Map();
  schoolsWithFeesOverYearsData.forEach(school => {
    if (school['School Name']) {
      feesOverYearsMap.set(school['School Name'], school.fees || null);
    }
  });
  
  return schoolsData.map(school => {
    const fees = feesMap.get(school['School Name']);
    const feesOverYears = feesOverYearsMap.get(school['School Name']);
    return {
      ...school,
      fees: fees || null,
      feesOverYears: feesOverYears || null
    };
  });
};

const mergedSchoolsData = mergeSchoolsWithFees();

// Cache for reverse geocoding results
const locationCache = new Map();

/**
 * Get location address from coordinates using geostat.display_name from data
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
 * Calculate school statistics per area (count and average rating)
 * Uses school lat/lng and area geometry from geoData
 */
export const calculateAreaSchoolStats = (geojsonFeatures) => {
  const areaStats = new Map();
  
  // Initialize all areas
  geojsonFeatures.forEach(feature => {
    const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    if (areaName) {
      areaStats.set(areaName, {
        count: 0,
        ratings: [],
        enrollments: [],
        fees: []
      });
    }
  });
  
  // Process schools for each area using point-in-polygon
  mergedSchoolsData.forEach(school => {
    // Skip schools without coordinates
    if (!school.Latitude || !school.Longitude) return;
    
    const schoolPoint = [school.Longitude, school.Latitude];
    const rating = school['Latest DSIB Rating'];
    const enrollment = school['2024/25 Enrollments'];
    const fees = school.fees;
    
    // Calculate average fee for this school (average of all grade fees, excluding 0)
    let schoolAverageFee = null;
    if (fees && typeof fees === 'object') {
      const feeValues = Object.values(fees).filter(fee => 
        typeof fee === 'number' && fee > 0
      );
      if (feeValues.length > 0) {
        schoolAverageFee = feeValues.reduce((sum, fee) => sum + fee, 0) / feeValues.length;
      }
    }
    
    // Check which area polygon contains this school point
    for (const feature of geojsonFeatures) {
      if (!feature.geometry) continue;
      
      const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
      if (!areaName) continue;
      
      if (isPointInPolygon(schoolPoint, feature.geometry)) {
        const stats = areaStats.get(areaName);
        stats.count += 1;
        
        // Add rating if available (only numeric ratings)
        if (rating !== null && rating !== undefined && rating !== '') {
          const ratingNum = typeof rating === 'number' ? rating : Number(rating);
          if (!isNaN(ratingNum)) {
            stats.ratings.push(ratingNum);
          }
        }
        
        // Add enrollment if available
        if (enrollment !== null && enrollment !== undefined && enrollment !== '') {
          const enrollmentNum = typeof enrollment === 'number' ? enrollment : Number(enrollment);
          if (!isNaN(enrollmentNum) && enrollmentNum > 0) {
            stats.enrollments.push(enrollmentNum);
          }
        }
        
        // Add average fee if available
        if (schoolAverageFee !== null && !isNaN(schoolAverageFee) && schoolAverageFee > 0) {
          stats.fees.push(schoolAverageFee);
        }
        break; // School can only be in one area
      }
    }
  });
  
  // Calculate average ratings, total enrollments, and average fees
  const result = new Map();
  areaStats.forEach((stats, areaName) => {
    const avgRating = stats.ratings.length > 0
      ? stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length
      : null;
    
    const totalEnrollment = stats.enrollments.length > 0
      ? stats.enrollments.reduce((sum, e) => sum + e, 0)
      : null;
    
    const avgFee = stats.fees.length > 0
      ? stats.fees.reduce((sum, f) => sum + f, 0) / stats.fees.length
      : null;
    
    result.set(areaName, {
      count: stats.count,
      averageRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null, // Round to 2 decimal places
      totalEnrollment: totalEnrollment !== null ? Math.round(totalEnrollment) : null,
      averageFee: avgFee !== null ? Math.round(avgFee) : null // Round to nearest integer
    });
  });
  
  return result;
};

/**
 * Count schools per area using point-in-polygon matching
 * Uses school lat/lng and area geometry from geoData
 * @deprecated Use calculateAreaSchoolStats instead
 */
export const countSchoolsByArea = (geojsonFeatures) => {
  const stats = calculateAreaSchoolStats(geojsonFeatures);
  const counts = new Map();
  stats.forEach((stat, areaName) => {
    counts.set(areaName, stat.count);
  });
  return counts;
};

/**
 * Add school statistics (count and average rating) to GeoJSON features
 */
export const addSchoolCountsToGeoJSON = (geojson) => {
  if (!geojson || !geojson.features) {
    return geojson;
  }
  
  const areaStats = calculateAreaSchoolStats(geojson.features);
  
  const processedFeatures = geojson.features.map(feature => {
    const areaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    const stats = areaStats.get(areaName) || { count: 0, averageRating: null, totalEnrollment: null, averageFee: null };
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        SchoolCount: stats.count,
        AverageRating: stats.averageRating,
        TotalEnrollment: stats.totalEnrollment,
        AverageFee: stats.averageFee
      }
    };
  });
  
  return {
    ...geojson,
    features: processedFeatures
  };
};

/**
 * Get all schools in a specific area by area name
 * @param {string} areaName - The area name (CNAME_E or COMMUNITY_E)
 * @param {Array} geojsonFeatures - GeoJSON features array
 * @returns {Array} - Array of school objects in that area
 */
export const getSchoolsInArea = (areaName, geojsonFeatures) => {
  if (!areaName || !geojsonFeatures) return [];
  
  // Find the feature for this area
  const areaFeature = geojsonFeatures.find(feature => {
    const featureAreaName = feature.properties?.CNAME_E || feature.properties?.COMMUNITY_E || '';
    return featureAreaName === areaName;
  });
  
  if (!areaFeature || !areaFeature.geometry) return [];
  
  // Get all schools in this area using point-in-polygon
  const schoolsInArea = [];
  
  mergedSchoolsData.forEach(school => {
    if (!school.Latitude || !school.Longitude) return;
    
    const schoolPoint = [school.Longitude, school.Latitude];
    if (isPointInPolygon(schoolPoint, areaFeature.geometry)) {
      schoolsInArea.push(school);
    }
  });
  
  return schoolsInArea;
};

/**
 * Process enrollment data over years for schools in an area
 * @param {Array} schools - Array of school objects
 * @returns {Array} - Array of { year, enrollment, date } objects
 */
export const processEnrollmentData = (schools) => {
  if (!schools || schools.length === 0) return [];
  
  const enrollmentByYear = new Map();
  
  schools.forEach(school => {
    // Extract enrollment fields (format: "2010/11 Enrolments", "2015/16 Enrollments", etc.)
    Object.keys(school).forEach(key => {
      if (key.includes('Enrol') && typeof school[key] === 'number' && school[key] > 0) {
        // Extract year from key (e.g., "2010/11 Enrolments" -> 2010)
        const yearMatch = key.match(/(\d{4})\//);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const enrollment = school[key];
          
          if (!enrollmentByYear.has(year)) {
            enrollmentByYear.set(year, []);
          }
          enrollmentByYear.get(year).push(enrollment);
        }
      }
    });
  });
  
  // Calculate average enrollment per year
  const result = [];
  enrollmentByYear.forEach((enrollments, year) => {
    const avgEnrollment = enrollments.reduce((sum, e) => sum + e, 0) / enrollments.length;
    const totalEnrollment = enrollments.reduce((sum, e) => sum + e, 0);
    
    result.push({
      year: year,
      enrollment: Math.round(avgEnrollment),
      totalEnrollment: Math.round(totalEnrollment),
      schoolCount: enrollments.length,
      date: new Date(year, 6, 1).toISOString() // Mid-year date
    });
  });
  
  return result.sort((a, b) => a.year - b.year);
};

/**
 * Process rating distribution for schools in an area
 * @param {Array} schools - Array of school objects
 * @returns {Array} - Array of { rating, count, percentage } objects
 */
export const processRatingDistribution = (schools) => {
  if (!schools || schools.length === 0) return [];
  
  const ratingCounts = {
    0: { label: 'Not yet inspected', count: 0 },
    1: { label: 'Unsatisfactory', count: 0 },
    2: { label: 'Acceptable', count: 0 },
    3: { label: 'Good', count: 0 },
    4: { label: 'Very Good', count: 0 },
    5: { label: 'Outstanding', count: 0 }
  };
  
  let totalWithRating = 0;
  
  schools.forEach(school => {
    const rating = school['Latest DSIB Rating'];
    if (rating !== null && rating !== undefined && rating !== '') {
      const ratingNum = typeof rating === 'number' ? rating : Number(rating);
      if (!isNaN(ratingNum) && ratingCounts[ratingNum] !== undefined) {
        ratingCounts[ratingNum].count += 1;
        totalWithRating += 1;
      }
    }
  });
  
  // Convert to array format
  const result = Object.entries(ratingCounts).map(([rating, data]) => ({
    rating: parseInt(rating),
    label: data.label,
    count: data.count,
    percentage: totalWithRating > 0 ? Math.round((data.count / totalWithRating) * 100) : 0
  }));
  
  return result;
};

/**
 * Process rating data over years for schools in an area
 * @param {Array} schools - Array of school objects
 * @returns {Array} - Array of { year, averageRating, schoolCount } objects
 */
export const processRatingOverYears = (schools) => {
  if (!schools || schools.length === 0) return [];
  
  const ratingByYear = new Map();
  
  schools.forEach(school => {
    // Extract rating fields (format: "2008/09 DSIB Rating", "2019/20 DSIB Rating", etc.)
    Object.keys(school).forEach(key => {
      if (key.includes('DSIB Rating') && key !== 'Latest DSIB Rating' && typeof school[key] === 'number') {
        // Extract year from key (e.g., "2008/09 DSIB Rating" -> 2008)
        const yearMatch = key.match(/(\d{4})\//);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const rating = school[key];
          
          if (!isNaN(rating) && rating >= 0 && rating <= 5) {
            if (!ratingByYear.has(year)) {
              ratingByYear.set(year, []);
            }
            ratingByYear.get(year).push(rating);
          }
        }
      }
    });
  });
  
  // Calculate average rating per year
  const result = [];
  ratingByYear.forEach((ratings, year) => {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    result.push({
      year: year,
      averageRating: Math.round(avgRating * 100) / 100,
      schoolCount: ratings.length,
      date: new Date(year, 6, 1).toISOString() // Mid-year date
    });
  });
  
  return result.sort((a, b) => a.year - b.year);
};

/**
 * Process rating over years for a single school
 * @param {Object} school - School object
 * @returns {Array} - Array of { year, rating } objects
 */
export const processSchoolRatingOverYears = (school) => {
  if (!school) return [];
  
  const ratings = [];
  
  // Extract rating fields (format: "2008/09 DSIB Rating", "2019/20 DSIB Rating", etc.)
  Object.keys(school).forEach(key => {
    if (key.includes('DSIB Rating') && key !== 'Latest DSIB Rating' && typeof school[key] === 'number') {
      // Extract year from key (e.g., "2008/09 DSIB Rating" -> 2008)
      const yearMatch = key.match(/(\d{4})\//);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const rating = school[key];
        
        if (!isNaN(rating) && rating >= 0 && rating <= 5) {
          ratings.push({
            year: year,
            rating: rating,
            date: new Date(year, 6, 1).toISOString()
          });
        }
      }
    }
  });
  
  return ratings.sort((a, b) => a.year - b.year);
};

/**
 * Process enrollment data over years for a single school
 * @param {Object} school - School object
 * @returns {Array} - Array of { year, enrollment, date } objects
 */
export const processSchoolEnrollmentOverYears = (school) => {
  if (!school) return [];
  
  // Map to store enrollment data by year
  // Key: year, Value: { enrollment, isAnnual }
  const enrollmentByYear = new Map();
  
  // Extract enrollment fields (format: "2010/11 Enrolments", "2015/16 Enrollments", etc.)
  Object.keys(school).forEach(key => {
    if (key.includes('Enrol') && typeof school[key] === 'number' && school[key] > 0) {
      // Extract year from key (e.g., "2010/11 Enrolments" -> 2010)
      const yearMatch = key.match(/(\d{4})\//);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const enrollment = school[key];
        
        if (!isNaN(enrollment) && enrollment > 0) {
          // Check if this is an annual enrollment (not seasonal: Autumn, Spring, Summer)
          const isAnnual = !key.includes('Autumn') && !key.includes('Spring') && !key.includes('Summer');
          
          // If we already have data for this year
          if (enrollmentByYear.has(year)) {
            const existing = enrollmentByYear.get(year);
            // Prioritize annual enrollment over seasonal
            if (isAnnual || !existing.isAnnual) {
              enrollmentByYear.set(year, {
                enrollment: enrollment,
                isAnnual: isAnnual
              });
            }
          } else {
            enrollmentByYear.set(year, {
              enrollment: enrollment,
              isAnnual: isAnnual
            });
          }
        }
      }
    }
  });
  
  // Convert map to array and sort by year
  const enrollments = Array.from(enrollmentByYear.entries()).map(([year, data]) => ({
    year: year,
    enrollment: data.enrollment,
    date: new Date(year, 6, 1).toISOString()
  }));
  
  return enrollments.sort((a, b) => a.year - b.year);
};

/**
 * Process fees data over years for schools in an area
 * @param {Array} schools - Array of school objects
 * @returns {Array} - Array of { year, averageFee, totalFee, schoolCount, date } objects
 */
export const processFeesOverYears = (schools) => {
  if (!schools || schools.length === 0) return [];
  
  const feesByYear = new Map();
  
  schools.forEach(school => {
    const feesOverYears = school.feesOverYears || school.fees;
    if (!feesOverYears || typeof feesOverYears !== 'object') return;
    
    // Process each year in feesOverYears
    Object.keys(feesOverYears).forEach(yearStr => {
      const year = parseInt(yearStr);
      if (isNaN(year)) return;
      
      const yearFees = feesOverYears[yearStr];
      if (!yearFees || typeof yearFees !== 'object') return;
      
      // Calculate average fee for this year (average of all grade fees, excluding 0)
      const feeValues = Object.values(yearFees).filter(fee => 
        typeof fee === 'number' && fee > 0
      );
      
      if (feeValues.length > 0) {
        const averageFee = feeValues.reduce((sum, fee) => sum + fee, 0) / feeValues.length;
        
        if (!feesByYear.has(year)) {
          feesByYear.set(year, []);
        }
        feesByYear.get(year).push(averageFee);
      }
    });
  });
  
  // Calculate average fee per year
  const result = [];
  feesByYear.forEach((fees, year) => {
    const avgFee = fees.reduce((sum, f) => sum + f, 0) / fees.length;
    const totalFee = fees.reduce((sum, f) => sum + f, 0);
    
    result.push({
      year: year,
      averageFee: Math.round(avgFee),
      totalFee: Math.round(totalFee),
      schoolCount: fees.length,
      date: new Date(year, 6, 1).toISOString() // Mid-year date
    });
  });
  
  return result.sort((a, b) => a.year - b.year);
};

/**
 * Process fees data over years for a single school
 * @param {Object} school - School object
 * @returns {Array} - Array of { year, averageFee, date } objects
 */
export const processSchoolFeesOverYears = (school) => {
  if (!school) return [];
  
  const feesOverYears = school.feesOverYears || school.fees;
  if (!feesOverYears || typeof feesOverYears !== 'object') return [];
  
  const fees = [];
  
  // Process each year in feesOverYears
  Object.keys(feesOverYears).forEach(yearStr => {
    const year = parseInt(yearStr);
    if (isNaN(year)) return;
    
    const yearFees = feesOverYears[yearStr];
    if (!yearFees || typeof yearFees !== 'object') return;
    
    // Calculate average fee for this year (average of all grade fees, excluding 0)
    const feeValues = Object.values(yearFees).filter(fee => 
      typeof fee === 'number' && fee > 0
    );
    
    if (feeValues.length > 0) {
      const averageFee = feeValues.reduce((sum, fee) => sum + fee, 0) / feeValues.length;
      
      fees.push({
        year: year,
        averageFee: Math.round(averageFee),
        date: new Date(year, 6, 1).toISOString()
      });
    }
  });
  
  return fees.sort((a, b) => a.year - b.year);
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

