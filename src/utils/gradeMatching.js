/**
 * Grade matching utilities
 * Handles grade range matching and category mappings
 */

// Grade category definitions with their equivalent grades
export const GRADE_CATEGORIES = [
  { value: 'KG-1', label: 'KG-1', matches: ['KG1', 'FS1'] },
  { value: 'KG-2', label: 'KG-2', matches: ['KG2', 'FS2'] },
  { value: 'G1-G3', label: 'G1-G3 (Primary Lower)', matches: ['G1', 'G2', 'G3', 'Y1', 'Y2', 'Y3'] },
  { value: 'G4-G5', label: 'G4-G5 (Primary Upper)', matches: ['G4', 'G5', 'Y4', 'Y5'] },
  { value: 'G6-G8', label: 'G6-G8 (Middle)', matches: ['G6', 'G7', 'G8', 'Y6', 'Y7', 'Y8', 'Y9'] },
  { value: 'G9-10', label: 'G9-10 (Secondary Lower)', matches: ['G9', 'G10', 'Y10'] },
  { value: 'G11-12', label: 'G11-12 (Secondary Upper)', matches: ['G11', 'G12', 'Y11', 'Y12', 'Y13'] },
  { value: 'FS1-Y13', label: 'FS1-Y13 (Full Range)', matches: ['FS1', 'FS2', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11', 'Y12', 'Y13'] }
];

/**
 * Convert grade to numeric value for comparison
 * FS1 → 0, FS2 → 1, KG1 → 0, KG2 → 1
 * G1 → 2, G2 → 3, ..., G12 → 13
 * Y1 → 2, Y2 → 3, ..., Y6 → 7, Y7 → 8, Y8 → 9, Y9 → 10, Y10 → 11, Y11 → 12, Y12 → 13, Y13 → 14
 */
const gradeToNumber = (gradeStr) => {
  const match = gradeStr.match(/(KG|G|FS|Y)(\d+)/i);
  if (!match) return null;
  
  const [, prefix, num] = match;
  const numInt = parseInt(num);
  
  if (prefix.toUpperCase() === 'FS' || prefix.toUpperCase() === 'KG') {
    return numInt - 1; // FS1/KG1 → 0, FS2/KG2 → 1
  } else if (prefix.toUpperCase() === 'G') {
    return numInt + 1; // G1 → 2, G2 → 3, ..., G12 → 13
  } else if (prefix.toUpperCase() === 'Y') {
    return numInt + 1; // Y1 → 2, Y2 → 3, ..., Y13 → 14
  }
  
  return null;
};

/**
 * Parse grade range from school grade string
 * Returns { min, max } with numeric values
 */
const parseGradeRange = (gradeString) => {
  if (!gradeString) return null;
  
  const normalized = gradeString.toUpperCase().trim();
  
  // Extract all grade patterns
  const gradePattern = /(KG|G|FS|Y)(\d+)/gi;
  const matches = [...normalized.matchAll(gradePattern)];
  
  if (matches.length === 0) return null;
  
  // Convert all grades to numbers
  const gradeNumbers = matches
    .map(match => {
      const fullGrade = match[0];
      const num = gradeToNumber(fullGrade);
      return { fullGrade, num };
    })
    .filter(g => g.num !== null)
    .sort((a, b) => a.num - b.num);
  
  if (gradeNumbers.length === 0) return null;
  
  return {
    min: gradeNumbers[0].num,
    max: gradeNumbers[gradeNumbers.length - 1].num,
    allGrades: gradeNumbers.map(g => g.fullGrade)
  };
};

/**
 * Check if a grade category matches a school's grade range
 */
export const matchesGradeCategory = (schoolGradeString, categoryValue) => {
  if (!schoolGradeString || !categoryValue) return false;
  
  const category = GRADE_CATEGORIES.find(c => c.value === categoryValue);
  if (!category) return false;
  
  const schoolRange = parseGradeRange(schoolGradeString);
  if (!schoolRange) return false;
  
  // Check if any grade in the category falls within the school's range
  return category.matches.some(categoryGrade => {
    const categoryNum = gradeToNumber(categoryGrade);
    if (categoryNum === null) return false;
    
    // Check if category grade number falls within school's range
    if (categoryNum >= schoolRange.min && categoryNum <= schoolRange.max) {
      return true;
    }
    
    // Also check for direct string match (handles edge cases)
    const normalized = schoolGradeString.toUpperCase().trim();
    if (normalized.includes(categoryGrade)) {
      return true;
    }
    
    return false;
  });
};

