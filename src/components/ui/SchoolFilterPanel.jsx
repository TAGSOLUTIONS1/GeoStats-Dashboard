import React, { useState, useEffect, useMemo } from 'react';
import { X, GraduationCap, Star, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import schoolsData from '../../data/schools/schools.json';
import { getLocationFromCoordinates } from '../../services/school';
import { GRADE_CATEGORIES, matchesGradeCategory } from '../../utils/gradeMatching';

const SchoolFilterPanel = ({ 
  isOpen, 
  onClose, 
  selectedArea, 
  selectedLocation,
  selectedCurriculum: externalCurriculum,
  selectedGrade: externalGrade,
  selectedRating: externalRating,
  onCurriculumChange,
  onGradeChange,
  onRatingChange,
  onFilteredSchoolsChange
}) => {
  const [selectedCurricula, setSelectedCurricula] = useState(
    externalCurriculum ? (Array.isArray(externalCurriculum) ? externalCurriculum : [externalCurriculum]) : []
  );
  const [selectedGrades, setSelectedGrades] = useState(
    externalGrade ? (Array.isArray(externalGrade) ? externalGrade : [externalGrade]) : []
  );
  const [selectedRating, setSelectedRating] = useState(externalRating || '');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  
  // Sync with external state
  useEffect(() => {
    if (externalCurriculum !== undefined) {
      setSelectedCurricula(Array.isArray(externalCurriculum) ? externalCurriculum : (externalCurriculum ? [externalCurriculum] : []));
    }
    if (externalGrade !== undefined) {
      setSelectedGrades(Array.isArray(externalGrade) ? externalGrade : (externalGrade ? [externalGrade] : []));
    }
    if (externalRating !== undefined) setSelectedRating(externalRating);
  }, [externalCurriculum, externalGrade, externalRating]);
  
  const handleCurriculumToggle = (curriculum) => {
    setSelectedCurricula(prev => {
      const newSelection = prev.includes(curriculum)
        ? prev.filter(c => c !== curriculum)
        : [...prev, curriculum];
      if (onCurriculumChange) onCurriculumChange(newSelection);
      return newSelection;
    });
  };
  
  const handleGradeToggle = (grade) => {
    setSelectedGrades(prev => {
      const newSelection = prev.includes(grade)
        ? prev.filter(g => g !== grade)
        : [...prev, grade];
      if (onGradeChange) onGradeChange(newSelection);
      return newSelection;
    });
  };
  
  const handleRatingChange = (value) => {
    setSelectedRating(value);
    if (onRatingChange) onRatingChange(value);
  };

  // Get unique values for filters
  const curricula = useMemo(() => {
    const unique = [...new Set(schoolsData.map(school => school.Curriculum).filter(Boolean))];
    return unique.sort();
  }, []);


  // Reverse map: numeric value to text
  const RATING_REVERSE_MAP = {
    0: "Not yet inspected",
    1: "Unsatisfactory",
    2: "Acceptable",
    3: "Good",
    4: "Very Good",
    5: "Outstanding"
  };

  const ratings = useMemo(() => {
    // Extract unique numeric ratings from Latest DSIB Rating column
    const ratingSet = new Set();
    schoolsData.forEach(school => {
      const rating = school['Latest DSIB Rating'];
      if (rating !== null && rating !== undefined && rating !== '') {
        ratingSet.add(rating);
      }
    });
    
    // Convert to array and sort by numeric value (descending: Outstanding first)
    const ratingArray = Array.from(ratingSet)
      .filter(r => typeof r === 'number' || !isNaN(Number(r)))
      .map(r => Number(r))
      .sort((a, b) => b - a);
    
    return ratingArray.map(ratingNum => {
      const ratingText = RATING_REVERSE_MAP[ratingNum] || `Rating ${ratingNum}`;
      return {
        value: String(ratingNum), // Store as string for select value
        label: ratingText // Show descriptive text
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter schools based on criteria
  useEffect(() => {
    if (!isOpen) {
      setFilteredSchools([]);
      return;
    }

    let filtered = [...schoolsData];

    // Filter by curriculum (multiple selection)
    if (selectedCurricula.length > 0) {
      filtered = filtered.filter(school => 
        school.Curriculum && selectedCurricula.some(curriculum => 
          school.Curriculum.includes(curriculum)
        )
      );
    }

    // Filter by grade (multiple selection with category matching)
    if (selectedGrades.length > 0) {
      filtered = filtered.filter(school => {
        if (!school.Grades) return false;
        // Check if the school matches any of the selected grade categories
        return selectedGrades.some(gradeCategory => 
          matchesGradeCategory(school.Grades, gradeCategory)
        );
      });
    }

    // Filter by rating
    if (selectedRating) {
      const ratingNum = Number(selectedRating); // Convert selected string to number
      filtered = filtered.filter(school => {
        const latestRating = school['Latest DSIB Rating'];
        // Compare numeric values - handle both number and string cases
        const schoolRatingNum = typeof latestRating === 'number' ? latestRating : Number(latestRating);
        return !isNaN(schoolRatingNum) && schoolRatingNum === ratingNum;
      });
    }

    // Filter by location if selected
    if (selectedLocation && selectedLocation.lngLat) {
      // Filter schools within a reasonable distance from selected location
      // For now, we'll show all schools and let the map handle proximity
      // You can add distance calculation here if needed
    }

    setFilteredSchools(filtered);
    
    // Notify parent component of filtered schools
    if (onFilteredSchoolsChange) {
      onFilteredSchoolsChange(filtered);
    }
  }, [isOpen, selectedCurricula, selectedGrades, selectedRating, selectedLocation, onFilteredSchoolsChange]);
  
  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCurricula([]);
    setSelectedGrades([]);
    setSelectedRating('');
    if (onCurriculumChange) onCurriculumChange([]);
    if (onGradeChange) onGradeChange([]);
    if (onRatingChange) onRatingChange('');
  };


  const getRatingLabel = (rating) => {
    // Rating is numeric, convert to text using reverse map
    const ratingNum = typeof rating === 'number' ? rating : Number(rating);
    return RATING_REVERSE_MAP[ratingNum] || rating || 'N/A';
  };

  const getRatingColor = (rating) => {
    // Rating is numeric, use directly for color mapping
    const ratingNum = typeof rating === 'number' ? rating : Number(rating);
    const colorMap = {
      5: 'text-green-600 bg-green-100',      // Outstanding
      4: 'text-blue-600 bg-blue-100',        // Very Good
      3: 'text-yellow-600 bg-yellow-100',     // Good
      2: 'text-orange-600 bg-orange-100',     // Acceptable
      1: 'text-red-600 bg-red-100',          // Unsatisfactory
      0: 'text-gray-600 bg-gray-100'         // Not yet inspected
    };
    return colorMap[ratingNum] || 'text-gray-600 bg-gray-100';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={isOpen ? { opacity: 1, height: "80%" } : { opacity: 1, height: 0 }}
        transition={{ duration: 0.75, ease: "easeInOut" }}
        className="fixed top-16 right-10 w-80 bg-white shadow-2xl z-50 overflow-hidden mobile-scroll-fix"
        onClick={onClose}
      >
        <div 
          className="h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-azure" />
              <h2 className="text-base font-semibold text-gray-900">School Filter</h2>
            </div>
            <div className="flex items-center space-x-2">
              {(selectedCurricula.length > 0 || selectedGrades.length > 0 || selectedRating) && (
                <button
                  onClick={handleClearFilters}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Clear filters"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Filters - Scrollable */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 overflow-y-auto" style={{ maxHeight: '40vh' }}>
            <div className="p-4 space-y-3">
              {/* Curriculum Filter - Collapsible Multi-select */}
              <div>
                <button
                  onClick={() => setIsCurriculumOpen(!isCurriculumOpen)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-azure"
                >
                  <span className="flex items-center">
                    <Filter className="w-4 h-4 mr-1" />
                    Curriculum {selectedCurricula.length > 0 && `(${selectedCurricula.length})`}
                  </span>
                  {isCurriculumOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {isCurriculumOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 max-h-32 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-sm"
                  >
                    {curricula.map((curriculum) => (
                      <label
                        key={curriculum}
                        className="flex items-center px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCurricula.includes(curriculum)}
                          onChange={() => handleCurriculumToggle(curriculum)}
                          className="w-3.5 h-3.5 text-azure focus:ring-azure border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700">{curriculum}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Grade Filter - Collapsible Multi-select with categories */}
              <div>
                <button
                  onClick={() => setIsGradeOpen(!isGradeOpen)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-azure"
                >
                  <span>
                    Grade Level {selectedGrades.length > 0 && `(${selectedGrades.length})`}
                  </span>
                  {isGradeOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {isGradeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 max-h-32 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-sm"
                  >
                    {GRADE_CATEGORIES.map((category) => (
                      <label
                        key={category.value}
                        className="flex items-center px-2.5 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGrades.includes(category.value)}
                          onChange={() => handleGradeToggle(category.value)}
                          className="w-3.5 h-3.5 text-azure focus:ring-azure border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700">{category.label}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Star className="w-4 h-4 inline mr-1" />
                  DSIB Rating
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure text-sm"
                >
                  <option value="">All Ratings</option>
                  {ratings.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="text-xs text-gray-600 pt-1.5 border-t border-gray-200">
                <strong>{filteredSchools.length}</strong> school{filteredSchools.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          {/* Schools List */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {filteredSchools.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No schools match your criteria</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchools.map((school, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  // Center map on school location and highlight it
                  if (window.map && school.Latitude && school.Longitude) {
                    const coordinates = [school.Longitude, school.Latitude];
                    
                    // Fly to school location
                    window.map.flyTo({
                      center: coordinates,
                      zoom: 15,
                      duration: 1500
                    });

                    // Highlight the school after a short delay to ensure map has moved
                    setTimeout(() => {
                      if (window.highlightSchool) {
                        window.highlightSchool(school['School Name'], coordinates);
                      }
                    }, 1600);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">
                    {school['School Name']}
                  </h3>
                  {school['Latest DSIB Rating'] && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(
                        school['Latest DSIB Rating']
                      )}`}
                    >
                      {getRatingLabel(school['Latest DSIB Rating'])}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  {school.Latitude && school.Longitude ? (
                    <SchoolLocation 
                      lat={school.Latitude} 
                      lng={school.Longitude}
                      fallback={school.Location}
                    />
                  ) : school.Location ? (
                    <p className="flex items-center">
                      <span className="font-medium mr-1">Location:</span>
                      {school.Location}
                    </p>
                  ) : null}
                  {school.Curriculum && (
                    <p>
                      <span className="font-medium mr-1">Curriculum:</span>
                      {school.Curriculum}
                    </p>
                  )}
                  {school.Grades && (
                    <p>
                      <span className="font-medium mr-1">Grades:</span>
                      {school.Grades}
                    </p>
                  )}
                  {school['2024/25 Enrollments'] && (
                    <p>
                      <span className="font-medium mr-1">Enrollment:</span>
                      {school['2024/25 Enrollments'].toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Component to fetch and display location from coordinates
const SchoolLocation = ({ lat, lng, fallback }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      if (!lat || !lng) {
        setLocation(fallback);
        setLoading(false);
        return;
      }

      try {
        const fetchedLocation = await getLocationFromCoordinates(lat, lng);
        setLocation(fetchedLocation || fallback);
      } catch (error) {
        console.error('Error fetching location:', error);
        setLocation(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [lat, lng, fallback]);

  if (loading) {
    return (
      <p className="flex items-center">
        <span className="font-medium mr-1">Location:</span>
        <span className="text-gray-400">Loading...</span>
      </p>
    );
  }

  return (
    <p className="flex items-center">
      <span className="font-medium mr-1">Location:</span>
      {location || 'Location not available'}
    </p>
  );
};

export default SchoolFilterPanel;

