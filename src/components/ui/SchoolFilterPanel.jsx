import React, { useState, useEffect, useMemo } from 'react';
import { X, GraduationCap, Star, Filter } from 'lucide-react';
import schoolsData from '../../data/schools.json';

const SchoolFilterPanel = ({ isOpen, onClose, selectedArea, selectedLocation, sidebarOpen = true }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [filteredSchools, setFilteredSchools] = useState([]);

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

  const ratings = [
    { value: '1', label: 'Outstanding (1)' },
    { value: '2', label: 'Very Good (2)' },
    { value: '3', label: 'Good (3)' },
    { value: '4', label: 'Acceptable (4)' },
    { value: '5', label: 'Unsatisfactory (5)' }
  ];

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
      const ratingNum = parseInt(selectedRating);
      filtered = filtered.filter(school => {
        const latestRating = school['Latest DSIB Rating'];
        return latestRating === ratingNum;
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
    const ratingMap = {
      1: 'Outstanding',
      2: 'Very Good',
      3: 'Good',
      4: 'Acceptable',
      5: 'Unsatisfactory'
    };
    return ratingMap[rating] || 'N/A';
  };

  const getRatingColor = (rating) => {
    const colorMap = {
      1: 'text-green-600 bg-green-100',
      2: 'text-blue-600 bg-blue-100',
      3: 'text-yellow-600 bg-yellow-100',
      4: 'text-orange-600 bg-orange-100',
      5: 'text-red-600 bg-red-100'
    };
    return colorMap[rating] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 bottom-0 right-0 w-96 bg-white shadow-xl z-30 flex flex-col pointer-events-auto transition-all duration-300">
      {/* Header */}
      <div className="bg-azure text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5" />
          <h2 className="text-lg font-semibold">School Filter</h2>
        </div>
        <button
          onClick={() => {
            // Dispatch event to close the school landscape section
            window.dispatchEvent(new CustomEvent('sidebar:closeSection', { detail: 'dubai-school-landscape' }));
            if (onClose) onClose();
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50">
        {/* Curriculum Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Curriculum
          </label>
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
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
            onChange={(e) => setSelectedGrade(e.target.value)}
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
            onChange={(e) => setSelectedRating(e.target.value)}
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
      <div className="flex-1 overflow-y-auto p-4">
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
                  // Center map on school location
                  if (window.map && school.Latitude && school.Longitude) {
                    window.map.flyTo({
                      center: [school.Longitude, school.Latitude],
                      zoom: 15,
                      duration: 1500
                    });
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
  );
};

export default SchoolFilterPanel;

