import pandas as pd
import json
import re

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
EXCEL_FILE = "schools.xlsx"
INPUT_JSON = "schools.json"
OUTPUT_JSON = "schools_with_fees_over_years.json"
MIN_YEAR = 2016  # Earliest academic year to include
MAX_YEAR = 2024  # Latest academic year to include

# --------------------------------------------------
# CANONICAL GRADES
# --------------------------------------------------
ALL_GRADES = ["FS1", "FS2"] + [f"Year {i}" for i in range(1, 14)]

# --------------------------------------------------
# GRADE NORMALIZATION MAP
# --------------------------------------------------
GRADE_MAP = {
    # Pre-primary
    "Pre primary": "Pre-primary",
    "FS 1": "Pre-primary",
    "Pre primary/ FS1" : "Pre-primary",
    "FS1 /Pre-primary": "Pre-primary",
    # "Pre-primary" : "Pre-primary",
    # "FS1": "Pre-primary",

    # KG
    "KG 1": "KG-1",
    "FS 2": "KG-1",
    "KG1/FS2": "KG-1",
    "FS2/KG1": "KG-1",
    "Fees KG1/FS2": "KG-1",
    "Fees KG1": "KG-1",
    # "KG1 / FS2": "KG-1",

    "KG 2": "KG-2",
    "YEAR 1": "KG-2",
    "KG2/Y1": "KG-2",
    "Fees KG2/Y1": "KG-2",
    "Year 1/KG 2": "KG-2",

    # Grades
    "GRADE 1": "Grade 1",
    "YEAR 2": "Grade 1",
    "G1/Y2": "Grade 1",
    "Fees GRADE 1/ YEAR 2": "Grade 1",
    "Year 2/Grade 1": "Grade 1",

    "GRADE 2": "Grade 2",
    "YEAR 3": "Grade 2",
    "G2/Y3": "Grade 2",
    "Fees GRADE 2/ YEAR 3": "Grade 2",
    "Year 3/Grade 2": "Grade 2",

    "GRADE 3": "Grade 3",
    "YEAR 4": "Grade 3",
    "G3/Y4": "Grade 3",
    "Fees GRADE 3/ YEAR 4": "Grade 3",
    "Year 4/Grade 3": "Grade 3",

    "GRADE 4": "Grade 4",
    "YEAR 5": "Grade 4",
    "G4/Y5": "Grade 4",
    "Fees GRADE 4/ YEAR 5": "Grade 4",
    "Year 5/Grade 4": "Grade 4",

    "GRADE 5": "Grade 5",
    "YEAR 6": "Grade 5",
    "G5/Y6": "Grade 5",
    "Fees GRADE 5/ YEAR 6": "Grade 5",
    "Year 6/Grade 5": "Grade 5",

    "GRADE 6": "Grade 6",
    "YEAR 7": "Grade 6",
    "G6/Y7": "Grade 6",
    "Fees GRADE 6/ YEAR 7": "Grade 6",
    "Year 7/Grade 6": "Grade 6",

    "GRADE 7": "Grade 7",
    "YEAR 8": "Grade 7",
    "G7/Y8": "Grade 7",
    "Fees GRADE 7/ YEAR 8": "Grade 7",
    "Year 8/Grade 7": "Grade 7",

    "GRADE 8": "Grade 8",
    "YEAR 9": "Grade 8",
    "G8/Y9": "Grade 8",
    "Fees GRADE 8/ YEAR 9": "Grade 8",
    "Year 9/Grade 8": "Grade 8",

    "GRADE 9": "Grade 9",
    "YEAR 10": "Grade 9",
    "G9/Y10": "Grade 9",
    "Fees GRADE 9/ YEAR 10": "Grade 9",
    "Year 10/Grade 9": "Grade 9",

    "GRADE 10": "Grade 10",
    "YEAR 11": "Grade 10",
    "G10/Y11": "Grade 10",
    "Fees GRADE 10/ YEAR 11": "Grade 10",
    "Year 11/Grade 10": "Grade 10",

    "GRADE 11": "Grade 11",
    "YEAR 12": "Grade 11",
    "G11/Y12": "Grade 11",
    "Fees GRADE 11/ YEAR 12": "Grade 11",
    "Year 12/Grade 11": "Grade 11",

    "GRADE 12": "Grade 12",
    "YEAR 13": "Grade 12",
    "G12/Y13": "Grade 12",
    "Fees GRADE 12/ YEAR 13": "Grade 12",
    "Year 13/Grade 12": "Grade 12",

    "GRADE 13": "Grade 13",
    "G13": "Grade 13",
}

# --------------------------------------------------
# HELPERS
# --------------------------------------------------
def normalize_header(text):
    return re.sub(r"[^a-z0-9]", "", str(text).lower())

GRADE_MAP_NORMALIZED = {normalize_header(k): v for k,v in GRADE_MAP.items()}

def normalize_school_name(name):
    return re.sub(r"\s+", " ", str(name).strip().lower())

def extract_year(sheet_name):
    match = re.search(r"(\d{4})-(\d{4})", sheet_name)
    if match:
        start_year = int(match.group(1))
        return match.group(), start_year
    return sheet_name, None

def empty_fee_object():
    return {grade: 0 for grade in ALL_GRADES}

def safe_int(value):
    if pd.isna(value):
        return 0
    if isinstance(value, str):
        value = value.strip().replace(",", "")
        if value in {"", "-", "–", "N/A", "NA"}:
            return 0
    try:
        return int(float(value))
    except Exception:
        return 0

# --------------------------------------------------
# LOAD SCHOOLS JSON
# --------------------------------------------------
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    schools = json.load(f)

schools_by_name = {normalize_school_name(s.get("School Name", "")): s for s in schools}

for school in schools:
    school.setdefault("fees", {})

# --------------------------------------------------
# READ EXCEL & PROCESS FEE SHEETS
# --------------------------------------------------
xls = pd.ExcelFile(EXCEL_FILE)

# Filter sheets starting with "Fees" and within year range
fee_sheets = []
for s in xls.sheet_names:
    if not s.lower().startswith("fees"):
        continue
    _, start_year = extract_year(s)
    if start_year and MIN_YEAR <= start_year <= MAX_YEAR:
        fee_sheets.append((start_year, s))

# Sort descending: latest year first
fee_sheets.sort(reverse=True, key=lambda x: x[0])
fee_sheets = [s[1] for s in fee_sheets]

print("📄 Fee sheets to process:", fee_sheets)

for sheet in fee_sheets:
    academic_year, _ = extract_year(sheet)
    print(f"\n▶ Processing {sheet} ({academic_year})")

    df = pd.read_excel(EXCEL_FILE, sheet_name=sheet, header=None)

    # Drop first banner row
    df = df.iloc[1:].reset_index(drop=True)

    # Set headers
    df.columns = df.iloc[0]
    df = df.iloc[1:].reset_index(drop=True)

    df.columns = [normalize_header(c) for c in df.columns]

    for _, row in df.iterrows():
        school_name_raw = row.get("schoolname", "")
        school_key = normalize_school_name(school_name_raw)

        if not school_key or school_key not in schools_by_name:
            continue

        fee_obj = empty_fee_object()

        for col, value in row.items():
            if col in GRADE_MAP_NORMALIZED:
                fee_obj[GRADE_MAP_NORMALIZED[col]] = safe_int(value)
            else:
                if col not in {"schoolname"} and safe_int(value) != 0:
                    print(f"⚠️ Unmapped column '{col}' with value '{value}' in school '{school_name_raw}'")

        schools_by_name[school_key]["fees"][academic_year] = fee_obj

# --------------------------------------------------
# SAVE OUTPUT
# --------------------------------------------------
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(schools, f, indent=2, ensure_ascii=False)

print("\n✅ Fee merging complete (2024 → 2016)")
print(f"📄 Output file: {OUTPUT_JSON}")
