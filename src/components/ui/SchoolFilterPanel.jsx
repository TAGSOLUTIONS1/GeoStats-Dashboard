import React, { useState, useEffect, useMemo } from 'react';
import { X, GraduationCap, Star, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import schoolsData from '../../data/schools.json';

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
  onRatingChange
}) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState(externalCurriculum || '');
  const [selectedGrade, setSelectedGrade] = useState(externalGrade || '');
  const [selectedRating, setSelectedRating] = useState(externalRating || '');
  const [filteredSchools, setFilteredSchools] = useState([]);
  
  // Sync with external state
  useEffect(() => {
    if (externalCurriculum !== undefined) setSelectedCurriculum(externalCurriculum);
    if (externalGrade !== undefined) setSelectedGrade(externalGrade);
    if (externalRating !== undefined) setSelectedRating(externalRating);
  }, [externalCurriculum, externalGrade, externalRating]);
  
  const handleCurriculumChange = (value) => {
    setSelectedCurriculum(value);
    if (onCurriculumChange) onCurriculumChange(value);
  };
  
  const handleGradeChange = (value) => {
    setSelectedGrade(value);
    if (onGradeChange) onGradeChange(value);
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

  const grades = useMemo(() => {
    const gradeSet = new Set();
    schoolsData.forEach(school => {
      if (school.Grades) {
        // Extract grade ranges like "KG1-G12" or "KG1-G5"
        const gradeMatch = school.Grades.match(/(KG\d+|G\d+)/g);
        if (gradeMatch) {
          gradeMatch.forEach(grade => {
            // Normalize grades
            if (grade.startsWith('KG')) {
              gradeSet.add(grade);
            } else if (grade.startsWith('G')) {
              gradeSet.add(grade);
            }
          });
        }
      }
    });
    return Array.from(gradeSet).sort((a, b) => {
      // Sort KG first, then G grades
      if (a.startsWith('KG') && b.startsWith('G')) return -1;
      if (a.startsWith('G') && b.startsWith('KG')) return 1;
      return a.localeCompare(b);
    });
  }, []);

  // Rating encoding map
  const RATING_MAP = {
    "Not yet inspected": 0,
    "Unsatisfactory": 1,
    "Acceptable": 2,
    "Good": 3,
    "Very Good": 4,
    "Outstanding": 5
  };

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
  }, []);

  // Filter schools based on criteria
  useEffect(() => {
    if (!isOpen) {
      setFilteredSchools([]);
      return;
    }

    let filtered = [...schoolsData];

    // Filter by curriculum
    if (selectedCurriculum) {
      filtered = filtered.filter(school => 
        school.Curriculum && school.Curriculum.includes(selectedCurriculum)
      );
    }

    // Filter by grade
    if (selectedGrade) {
      filtered = filtered.filter(school => {
        if (!school.Grades) return false;
        // Check if the school offers the selected grade
        const gradeRegex = new RegExp(selectedGrade.replace('G', 'G\\d*').replace('KG', 'KG\\d*'));
        return gradeRegex.test(school.Grades);
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
  }, [isOpen, selectedCurriculum, selectedGrade, selectedRating, selectedLocation]);

  // Check if school offers the selected grade
  const schoolOffersGrade = (school, grade) => {
    if (!school.Grades || !grade) return true;
    const gradeRegex = new RegExp(grade.replace('G', 'G\\d*').replace('KG', 'KG\\d*'));
    return gradeRegex.test(school.Grades);
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
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50 flex-shrink-0">
        {/* Curriculum Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Curriculum
          </label>
          <select
            value={selectedCurriculum}
            onChange={(e) => handleCurriculumChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure text-sm"
          >
            <option value="">All Curricula</option>
            {curricula.map((curriculum) => (
              <option key={curriculum} value={curriculum}>
                {curriculum}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azure text-sm"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
          <strong>{filteredSchools.length}</strong> school{filteredSchools.length !== 1 ? 's' : ''} found
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
                  {school.Location && (
                    <p className="flex items-center">
                      <span className="font-medium mr-1">Location:</span>
                      {school.Location}
                    </p>
                  )}
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

export default SchoolFilterPanel;

