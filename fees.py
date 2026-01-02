import pandas as pd
import json

# ----------------------------
# CONFIG
# ----------------------------
EXCEL_FILE = "schools.xlsx"
FEES_SHEET = "Fees 2024-2025"
INPUT_JSON = "schools.json"
OUTPUT_JSON = "schools_with_fees.json"

# ----------------------------
# GRADE NORMALIZATION MAP
# ----------------------------
GRADE_MAP = {
    "Pre primary": "Pre-primary",

    "KG 1": "KG-1",
    "KG 2": "KG-2",
    "FS 1": "KG-1",
    "FS 2": "KG-2",

    "GRADE 1": "Grade 1",
    "GRADE 2": "Grade 2",
    "GRADE 3": "Grade 3",
    "GRADE 4": "Grade 4",
    "GRADE 5": "Grade 5",
    "GRADE 6": "Grade 6",
    "GRADE 7": "Grade 7",
    "GRADE 8": "Grade 8",
    "GRADE 9": "Grade 9",
    "GRADE 10": "Grade 10",
    "GRADE 11": "Grade 11",
    "GRADE 12": "Grade 12",
    "GRADE 13": "Grade 13",

    "YEAR 1": "Grade 1",
    "YEAR 2": "Grade 2",
    "YEAR 3": "Grade 3",
    "YEAR 4": "Grade 4",
    "YEAR 5": "Grade 5",
    "YEAR 6": "Grade 6",
    "YEAR 7": "Grade 7",
    "YEAR 8": "Grade 8",
    "YEAR 9": "Grade 9",
    "YEAR 10": "Grade 10",
    "YEAR 11": "Grade 11",
    "YEAR 12": "Grade 12",
    "YEAR 13": "Grade 13"
}

# Build complete grade list (for default zeros)
ALL_GRADES = sorted(set(GRADE_MAP.values()),
                    key=lambda x: (
                        0 if x.startswith("KG") else
                        int(x.split()[-1]) if "Grade" in x else 99
                    ))

# ----------------------------
# LOAD FEES SHEET
# ----------------------------
fees_df = pd.read_excel(EXCEL_FILE, sheet_name=FEES_SHEET, header=None)

# Ignore first row
fees_df = fees_df.iloc[1:].reset_index(drop=True)

# Set headers
fees_df.columns = fees_df.iloc[0]
fees_df = fees_df.iloc[1:].reset_index(drop=True)

# Clean column names
fees_df.columns = fees_df.columns.astype(str).str.strip()

# ----------------------------
# BUILD FEES LOOKUP
# ----------------------------
fees_lookup = {}

for _, row in fees_df.iterrows():
    school_name = str(row.get("School Name", "")).strip()
    if not school_name:
        continue

    fee_obj = {grade: 0 for grade in ALL_GRADES}

    for excel_col, standard_grade in GRADE_MAP.items():
        value = row.get(excel_col, 0)
        if pd.notna(value):
            fee_obj[standard_grade] = int(value)

    fees_lookup[school_name] = fee_obj

# ----------------------------
# LOAD EXISTING JSON
# ----------------------------
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    schools = json.load(f)

# ----------------------------
# MERGE FEES INTO SCHOOLS
# ----------------------------
for school in schools:
    name = str(school.get("School Name", "")).strip()
    school["fees"] = fees_lookup.get(
        name,
        {grade: 0 for grade in ALL_GRADES}
    )

# ----------------------------
# SAVE UPDATED JSON
# ----------------------------
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(schools, f, indent=2, ensure_ascii=False)

print("✅ Fees merged successfully!")
print(f"📄 Output file: {OUTPUT_JSON}")
