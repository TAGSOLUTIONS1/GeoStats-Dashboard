import pandas as pd
import json
import numpy as np
import requests
import time

HEADERS = {
    "Accept": "*/*"
}

def reverse_geostat(lat, lon):
    if pd.isna(lat) or pd.isna(lon):
        return None

    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "accept-language": "en-US",
        "addressdetails": 1
    }

    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        r.raise_for_status()
        data = r.json()
        print("Geostat fetched:", data.get("display_name"))
        return {
            "display_name": data.get("display_name"),
            "address": data.get("address")
        }

    except Exception:
        return None



# Read Excel WITHOUT headers
df = pd.read_excel("schools.xlsx", header=None)

# Drop banner row
df = df.iloc[1:].reset_index(drop=True)

# Set headers
df.columns = df.iloc[0]
df = df.iloc[1:].reset_index(drop=True)

# Clean column names
df.columns = (
    df.columns.astype(str)
      .str.strip()
      .str.replace("\n", " ")
)

# ----------------------------
# 1️⃣ DSIB RATINGS
# ----------------------------
dsib_rating_cols = [c for c in df.columns if "DSIB Rating" in c]

# Normalize text
df[dsib_rating_cols] = df[dsib_rating_cols].replace({
    "Unsatisfactory - FT": "Unsatisfactory",
    "Not yet inspected": "Not yet inspected"
})


# Fill missing values across years
df[dsib_rating_cols] = df[dsib_rating_cols].ffill(axis=1).bfill(axis=1)

# Rating encoding
RATING_MAP = {
    "Not yet inspected": 0,
    "Unsatisfactory": 1,
    "Acceptable": 2,
    "Good": 3,
    "Very good": 4,
    "Outstanding": 5
}

# Map ratings, unknown values get 0
df[dsib_rating_cols] = df[dsib_rating_cols].applymap(lambda x: RATING_MAP.get(x, 0))


df["geostat"] = None

for i, row in df.iterrows():
    df.at[i, "geostat"] = reverse_geostat(
        row["Latitude"], row["Longitude"]
    )
    time.sleep(1)


# for col in dsib_rating_cols:
#     df[col + "_score"] = df[col].map(RATING_MAP)

# ----------------------------
# 2️⃣ ENROLLMENTS
# ----------------------------
enrollment_cols = [
    c for c in df.columns
    if ("Enrolments" in c or "Enrollments" in c)
]

df[enrollment_cols] = (
    df[enrollment_cols]
      .fillna(0)
    #   .astype(int)
)

# ----------------------------
# 3️⃣ FINAL CLEANUP
# ----------------------------
df = df.where(pd.notnull(df), None)

# Export JSON
with open("schools.json", "w", encoding="utf-8") as f:
    json.dump(df.to_dict(orient="records"), f, indent=2, ensure_ascii=False)
