import pandas as pd
import json
import re


# --------------------------------------------------
# CONFIG
# --------------------------------------------------
EXCEL_FILE = "schools.xlsx"
INPUT_JSON = "schools.json"
OUTPUT_JSON = "schools_with_fees_over_years2.json"
MIN_YEAR = 2015
MAX_YEAR = 2024


# --------------------------------------------------
# CANONICAL GRADES (standardized output)
# --------------------------------------------------
ALL_GRADES = ["Pre-primary", "KG-1", "KG-2"] + [f"Grade {i}" for i in range(1, 14)]


# --------------------------------------------------
# COMPREHENSIVE GRADE MAPPING
# --------------------------------------------------
GRADE_MAP = {
    # Pre-primary variants
    "pre primary": "Pre-primary",
    "fs 1": "Pre-primary",
    "pre primary/ fs1": "Pre-primary",
    "fs1 / pre-primary": "Pre-primary",
    
    # KG-1 variants
    "kg 1": "KG-1",
    "fs 2": "KG-1",
    "kg1/fs2": "KG-1",
    "fees kg1/ fs2": "KG-1",
    "fees kg1": "KG-1",
    "fs2/kg1": "KG-1",
    
    # KG-2 variants
    "kg 2": "KG-2",
    "year 1": "KG-2",
    "kg2/y1": "KG-2",
    "year1/kg2": "KG-2",
    "fees kg2/ year 1": "KG-2",
    
    # Grade 1-13
    "grade 1": "Grade 1",
    "year 2": "Grade 1",
    "g1/y2": "Grade 1",
    "fees grade 1/ year 2": "Grade 1",
    "year 2/grade 1": "Grade 1",
    
    "grade 2": "Grade 2",
    "year 3": "Grade 2",
    "g2/y3": "Grade 2",
    "fees grade 2/ year 3": "Grade 2",
    "year 3/grade 2": "Grade 2",
    
    "grade 3": "Grade 3",
    "year 4": "Grade 3",
    "g3/y4": "Grade 3",
    "fees grade 3/ year 4": "Grade 3",
    "year 4/grade 3": "Grade 3",
    
    "grade 4": "Grade 4",
    "year 5": "Grade 4",
    "g4/y5": "Grade 4",
    "fees grade 4/ year 5": "Grade 4",
    "year 5/grade 4": "Grade 4",
    
    "grade 5": "Grade 5",
    "year 6": "Grade 5",
    "g5/y6": "Grade 5",
    "fees grade 5/ year 6": "Grade 5",
    "year 6/grade 5": "Grade 5",
    
    "grade 6": "Grade 6",
    "year 7": "Grade 6",
    "g6/y7": "Grade 6",
    "fees grade 6/ year 7": "Grade 6",
    "year 7/grade 6": "Grade 6",
    
    "grade 7": "Grade 7",
    "year 8": "Grade 7",
    "g7/y8": "Grade 7",
    "fees grade 7/ year 8": "Grade 7",
    "year 8/grade 7": "Grade 7",
    
    "grade 8": "Grade 8",
    "year 9": "Grade 8",
    "g8/y9": "Grade 8",
    "fees grade 8/ year 9": "Grade 8",
    "year 9/grade 8": "Grade 8",
    
    "grade 9": "Grade 9",
    "year 10": "Grade 9",
    "g9/y10": "Grade 9",
    "fees grade 9/ year 10": "Grade 9",
    "year 10/grade 9": "Grade 9",
    
    "grade 10": "Grade 10",
    "year 11": "Grade 10",
    "g10/y11": "Grade 10",
    "fees grade 10/ year 11": "Grade 10",
    "year 11/grade 10": "Grade 10",
    
    "grade 11": "Grade 11",
    "year 12": "Grade 11",
    "g11/y12": "Grade 11",
    "fees grade 11/ year 12": "Grade 11",
    "year 12/grade 11": "Grade 11",
    
    "grade 12": "Grade 12",
    "year 13": "Grade 12",
    "g12/y13": "Grade 12",
    "fees grade 12/ year 13": "Grade 12",
    "year 13/grade 12": "Grade 12",
    
    "grade 13": "Grade 13",
    "g13": "Grade 13",
}


# --------------------------------------------------
# HELPERS
# --------------------------------------------------
def normalize_text(text):
    """Remove special chars and normalize spacing"""
    return re.sub(r"[^a-z0-9]", "", str(text).lower())


GRADE_MAP_NORMALIZED = {normalize_text(k): v for k, v in GRADE_MAP.items()}


def normalize_school_name(name):
    return re.sub(r"\s+", " ", str(name).strip().lower())


def extract_year_range(sheet_name):
    """Extract academic year from sheet name like 'Fees 2024-2025'"""
    match = re.search(r"(\d{4})-(\d{4})", sheet_name)
    if match:
        start_year = int(match.group(1))
        return start_year
    return None


def empty_fee_object():
    return {grade: 0 for grade in ALL_GRADES}


def safe_int(value):
    """Safely convert value to int, handling various formats"""
    if pd.isna(value) or value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value) if not pd.isna(value) else 0
    
    value_str = str(value).strip().replace(",", "")
    if value_str in {"", "-", "–", "n/a", "na", "none"}:
        return 0
    try:
        return int(float(value_str))
    except Exception:
        return 0


def map_grade(col_name):
    """Map any column header variation to canonical grade"""
    normalized = normalize_text(col_name)
    return GRADE_MAP_NORMALIZED.get(normalized, None)


# --------------------------------------------------
# LOAD SCHOOLS JSON
# --------------------------------------------------
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    schools = json.load(f)

schools_by_name = {normalize_school_name(s.get("School Name", "")): s for s in schools}

for school in schools:
    school.setdefault("fees", {})

print(f"📚 Loaded {len(schools)} schools from JSON")


# --------------------------------------------------
# READ EXCEL & PROCESS FEE SHEETS
# --------------------------------------------------
xls = pd.ExcelFile(EXCEL_FILE)

# Filter and sort fee sheets
fee_sheets = []
for sheet_name in xls.sheet_names:
    if not sheet_name.lower().startswith("fees"):
        continue
    year = extract_year_range(sheet_name)
    if year and MIN_YEAR <= year <= MAX_YEAR:
        fee_sheets.append((year, sheet_name))

fee_sheets.sort(reverse=True, key=lambda x: x[0])
print(f"\n📄 Processing {len(fee_sheets)} fee sheets (2024-2025 back to 2015-2016)\n")


for year, sheet_name in fee_sheets:
    print(f"▶ {sheet_name} ({year})")
    
    # Read with second row as header (index 1)
    df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name, header=1)
    
    # Normalize column names
    df.columns = [normalize_text(c) for c in df.columns]
    
    processed_count = 0
    
    for _, row in df.iterrows():
        # Get school name from first column
        school_name_raw = row.get("schoolname", "") or row.iloc[0]
        school_key = normalize_school_name(str(school_name_raw))
        
        if not school_key or school_key not in schools_by_name:
            continue
        
        fee_obj = empty_fee_object()
        unmapped = []
        
        # Process each column
        for col_name, value in row.items():
            if col_name == "schoolname" or pd.isna(value):
                continue
            
            grade = map_grade(col_name)
            if grade:
                fee_obj[grade] = safe_int(value)
            else:
                # Track unmapped columns with non-zero values
                if safe_int(value) != 0 and col_name not in {"اسم المدرسة", "average fee"}:
                    unmapped.append(f"'{col_name}'")
        
        # Store fees by year
        schools_by_name[school_key]["fees"][str(year)] = fee_obj
        processed_count += 1
        
        if unmapped:
            print(f"  ⚠️ {school_name_raw}: Unmapped columns: {', '.join(unmapped)}")
    
    print(f"  ✓ Processed {processed_count} schools\n")


# --------------------------------------------------
# SAVE OUTPUT
# --------------------------------------------------
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(schools, f, indent=2, ensure_ascii=False)

print(f"✅ Complete! Output saved to {OUTPUT_JSON}")