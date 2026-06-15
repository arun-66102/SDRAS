"""
Smart Disaster Resource Allocation System Using Predictive Analytics
=====================================================================
Synthetic Dataset Generator
Generates realistic training data for XGBoost, Random Forest, and Linear Regression models.

Author  : Arunkumar K R
Version : 1.0.0
Seed    : 42
"""

import numpy as np
import pandas as pd
from faker import Faker
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 0. CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
SEED        = 42
N_ROWS      = 5000
N_WAREHOUSES = 30
OUTPUT_CSV  = "smart_disaster_dataset.csv"
WAREHOUSE_CSV = "warehouse_dataset.csv"

np.random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)

# ─────────────────────────────────────────────────────────────────────────────
# 1. DISTRICT MASTER TABLE  (25+ Indian districts with coordinates)
# ─────────────────────────────────────────────────────────────────────────────
DISTRICTS = [
    # (district_name, state, lat, lon)
    ("Mumbai",          "Maharashtra",       19.0760,  72.8777),
    ("Chennai",         "Tamil Nadu",        13.0827,  80.2707),
    ("Kolkata",         "West Bengal",       22.5726,  88.3639),
    ("Delhi",           "Delhi",             28.7041,  77.1025),
    ("Bangalore",       "Karnataka",         12.9716,  77.5946),
    ("Hyderabad",       "Telangana",         17.3850,  78.4867),
    ("Ahmedabad",       "Gujarat",           23.0225,  72.5714),
    ("Pune",            "Maharashtra",       18.5204,  73.8567),
    ("Jaipur",          "Rajasthan",         26.9124,  75.7873),
    ("Lucknow",         "Uttar Pradesh",     26.8467,  80.9462),
    ("Bhopal",          "Madhya Pradesh",    23.2599,  77.4126),
    ("Patna",           "Bihar",             25.5941,  85.1376),
    ("Bhubaneswar",     "Odisha",            20.2961,  85.8245),
    ("Guwahati",        "Assam",             26.1445,  91.7362),
    ("Thiruvananthapuram","Kerala",           8.5241,  76.9366),
    ("Chandigarh",      "Punjab",            30.7333,  76.7794),
    ("Dehradun",        "Uttarakhand",       30.3165,  78.0322),
    ("Shimla",          "Himachal Pradesh",  31.1048,  77.1734),
    ("Gangtok",         "Sikkim",            27.3389,  88.6065),
    ("Imphal",          "Manipur",           24.8170,  93.9368),
    ("Aizawl",          "Mizoram",           23.7307,  92.7173),
    ("Itanagar",        "Arunachal Pradesh", 27.0844,  93.6053),
    ("Kohima",          "Nagaland",          25.6701,  94.1077),
    ("Port Blair",      "Andaman & Nicobar",  11.6234,  92.7265),
    ("Panaji",          "Goa",               15.4909,  73.8278),
    ("Raipur",          "Chhattisgarh",      21.2514,  81.6296),
    ("Ranchi",          "Jharkhand",         23.3441,  85.3096),
    ("Agartala",        "Tripura",           23.8315,  91.2868),
    ("Srinagar",        "Jammu & Kashmir",   34.0837,  74.7973),
    ("Leh",             "Ladakh",            34.1526,  77.5771),
    ("Visakhapatnam",   "Andhra Pradesh",    17.6868,  83.2185),
    ("Coimbatore",      "Tamil Nadu",        11.0168,  76.9558),
    ("Surat",           "Gujarat",           21.1702,  72.8311),
    ("Nagpur",          "Maharashtra",       21.1458,  79.0882),
    ("Indore",          "Madhya Pradesh",    22.7196,  75.8577),
]

district_df = pd.DataFrame(DISTRICTS, columns=["district", "state", "latitude", "longitude"])

# ─────────────────────────────────────────────────────────────────────────────
# 2. DISASTER TYPE METADATA
# ─────────────────────────────────────────────────────────────────────────────
DISASTER_TYPES = ["Flood", "Cyclone", "Earthquake", "Fire", "Landslide", "Tsunami"]

# Multipliers for resource formulas per disaster type
#   food_mult | medical_mult | shelter_mult
DISASTER_MULTIPLIERS = {
    "Flood":      (1.3,  1.1,  1.2),
    "Cyclone":    (1.2,  1.2,  1.3),
    "Earthquake": (1.1,  1.2,  1.6),
    "Fire":       (0.9,  1.8,  1.0),
    "Landslide":  (1.0,  1.2,  1.3),
    "Tsunami":    (1.4,  1.3,  1.5),
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. GENERATE BASE FEATURES
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("  Smart Disaster Resource Allocation — Dataset Generator")
print("=" * 60)
print(f"\n[1/5] Generating {N_ROWS} base feature rows ...")

# Sample districts (with replacement)
district_indices = np.random.choice(len(district_df), size=N_ROWS, replace=True)
selected_districts = district_df.iloc[district_indices].reset_index(drop=True)

# Disaster type — slightly weighted toward more common disasters
disaster_weights = [0.25, 0.20, 0.20, 0.15, 0.12, 0.08]
disaster_type = np.random.choice(DISASTER_TYPES, size=N_ROWS, p=disaster_weights)

severity              = np.random.randint(1, 11, size=N_ROWS)                # 1–10
population_affected   = np.random.randint(100, 100_001, size=N_ROWS)        # 100–100 000
rainfall_mm           = np.round(np.random.uniform(0, 1000, size=N_ROWS), 2) # 0–1000 mm
temperature_c         = np.round(np.random.uniform(10, 45, size=N_ROWS), 1)  # 10–45 °C
disaster_duration_days= np.random.randint(1, 31, size=N_ROWS)               # 1–30 days

# Small coordinate jitter (±0.3°) to simulate sub-district granularity
lat_jitter = np.random.uniform(-0.3, 0.3, size=N_ROWS)
lon_jitter = np.random.uniform(-0.3, 0.3, size=N_ROWS)
latitude  = np.round(selected_districts["latitude"].values  + lat_jitter, 4)
longitude = np.round(selected_districts["longitude"].values + lon_jitter, 4)

# ─────────────────────────────────────────────────────────────────────────────
# 4. GENERATE TARGET VARIABLES WITH REALISTIC FORMULAS
# ─────────────────────────────────────────────────────────────────────────────
print("[2/5] Computing target variables using domain formulas ...")

# Pre-compute per-row multipliers from disaster type
fm = np.array([DISASTER_MULTIPLIERS[d][0] for d in disaster_type])  # food
mm = np.array([DISASTER_MULTIPLIERS[d][1] for d in disaster_type])  # medical
sm = np.array([DISASTER_MULTIPLIERS[d][2] for d in disaster_type])  # shelter

# Rainfall influence (normalised 0-1); relevant mainly for Flood/Cyclone/Tsunami
rain_norm = rainfall_mm / 1000.0

# ── 4a. food_required ───────────────────────────────────────────────────────
# Base: every affected person needs ~0.5 kg food per day; severity scales
# up demand (people miss meals, logistics disrupted).
# Rainfall slightly increases food spoilage → more required.
food_base = (
    population_affected * 0.5              # 0.5 unit per person
    * (1 + 0.15 * severity)               # severity boost
    * (1 + 0.10 * rain_norm)              # rainfall spoilage effect
    * fm                                   # disaster-type multiplier
    * disaster_duration_days * 0.08       # duration scaling
)
noise_food = np.random.normal(1.0, 0.08, size=N_ROWS)   # ±8% noise
food_required = np.maximum(0, food_base * noise_food).astype(int)

# ── 4b. medical_required ────────────────────────────────────────────────────
# Fires cause burns/smoke inhalation → high medical; Earthquakes → trauma.
# Severity has the strongest single effect.
medical_base = (
    population_affected * 0.04             # 4% base injury rate
    * (1 + 0.25 * severity)               # severity is primary driver
    * (1 + 0.05 * rain_norm)              # wet conditions → infections
    * mm                                   # disaster-type multiplier
    * (1 + 0.02 * temperature_c)          # heat stress adds medical load
)
noise_med = np.random.normal(1.0, 0.10, size=N_ROWS)    # ±10% noise
medical_required = np.maximum(0, medical_base * noise_med).astype(int)

# ── 4c. shelter_required ────────────────────────────────────────────────────
# Earthquakes/Tsunamis destroy structures → very high shelter need.
# Longer duration → more temporary shelters needed.
shelter_base = (
    population_affected * 0.30             # 30% base displacement rate
    * (1 + 0.12 * severity)               # severity increases displacement
    * sm                                   # disaster-type multiplier
    * (1 + 0.05 * disaster_duration_days) # longer disaster → more shelters
)
noise_shelter = np.random.normal(1.0, 0.09, size=N_ROWS) # ±9% noise
shelter_required = np.maximum(0, shelter_base * noise_shelter).astype(int)

# ─────────────────────────────────────────────────────────────────────────────
# 5. ASSEMBLE DATAFRAME
# ─────────────────────────────────────────────────────────────────────────────
print("[3/5] Assembling DataFrame ...")

df = pd.DataFrame({
    "disaster_type"         : disaster_type,
    "severity"              : severity,
    "population_affected"   : population_affected,
    "rainfall_mm"           : rainfall_mm,
    "temperature_c"         : temperature_c,
    "disaster_duration_days": disaster_duration_days,
    "district"              : selected_districts["district"].values,
    "state"                 : selected_districts["state"].values,
    "latitude"              : latitude,
    "longitude"             : longitude,
    # Targets
    "food_required"         : food_required,
    "medical_required"      : medical_required,
    "shelter_required"      : shelter_required,
})

# ─────────────────────────────────────────────────────────────────────────────
# 6. VALIDATION
# ─────────────────────────────────────────────────────────────────────────────
print("[4/5] Validating dataset ...")

# 6a. No missing values
assert df.isnull().sum().sum() == 0, "ERROR: Missing values detected!"

# 6b. No negative values in numeric columns
numeric_cols = df.select_dtypes(include=[np.number]).columns
neg_check = (df[numeric_cols] < 0).sum().sum()
assert neg_check == 0, f"ERROR: {neg_check} negative values detected!"

# 6c. Target columns must be integers
for col in ["food_required", "medical_required", "shelter_required"]:
    assert df[col].dtype in [np.int32, np.int64, int], f"ERROR: {col} is not integer!"

# 6d. Severity within range
assert df["severity"].between(1, 10).all(), "Severity out of range!"

# 6e. Disaster type valid
assert set(df["disaster_type"].unique()).issubset(set(DISASTER_TYPES)), "Unknown disaster type!"

print("    ✓ No missing values")
print("    ✓ No negative values")
print("    ✓ All target variables are integers")
print("    ✓ All categorical values valid")

# ─────────────────────────────────────────────────────────────────────────────
# 7. SAVE MAIN DATASET
# ─────────────────────────────────────────────────────────────────────────────
df.to_csv(OUTPUT_CSV, index=False)
print(f"\n[✓] Saved: {OUTPUT_CSV}")

# ─────────────────────────────────────────────────────────────────────────────
# 8. GENERATE WAREHOUSE DATASET
# ─────────────────────────────────────────────────────────────────────────────
print("\n[5/5] Generating warehouse dataset ...")

# Select 30 districts (allow repeats if < 30 unique)
wh_district_indices = np.random.choice(len(district_df), size=N_WAREHOUSES, replace=False)
wh_districts = district_df.iloc[wh_district_indices].reset_index(drop=True)

wh_lat_jitter = np.random.uniform(-0.15, 0.15, size=N_WAREHOUSES)
wh_lon_jitter = np.random.uniform(-0.15, 0.15, size=N_WAREHOUSES)

# Stock levels: realistic government/NGO strategic reserves
# Base stock scaled to district population proxy + random spread
food_stock    = np.random.randint(50_000,  500_001, size=N_WAREHOUSES)  # food packets
medical_stock = np.random.randint(5_000,   100_001, size=N_WAREHOUSES)  # medical kits
shelter_stock = np.random.randint(1_000,    50_001, size=N_WAREHOUSES)  # shelter units

warehouse_names = [
    f"NDRF Regional Depot — {row['district']}"
    for _, row in wh_districts.iterrows()
]

warehouse_df = pd.DataFrame({
    "warehouse_id"   : [f"WH{str(i+1).zfill(3)}" for i in range(N_WAREHOUSES)],
    "warehouse_name" : warehouse_names,
    "district"       : wh_districts["district"].values,
    "state"          : wh_districts["state"].values,
    "latitude"       : np.round(wh_districts["latitude"].values  + wh_lat_jitter, 4),
    "longitude"      : np.round(wh_districts["longitude"].values + wh_lon_jitter, 4),
    "food_stock"     : food_stock,
    "medical_stock"  : medical_stock,
    "shelter_stock"  : shelter_stock,
})

warehouse_df.to_csv(WAREHOUSE_CSV, index=False)
print(f"[✓] Saved: {WAREHOUSE_CSV}")

# ─────────────────────────────────────────────────────────────────────────────
# 9. CONSOLE REPORT
# ─────────────────────────────────────────────────────────────────────────────
SEP = "─" * 60

print(f"\n{SEP}")
print("  MAIN DATASET REPORT")
print(SEP)
print(f"  Shape         : {df.shape}")
print(f"  Columns ({len(df.columns)})  : {list(df.columns)}")

print(f"\n{'─'*60}")
print("  FIRST 10 ROWS")
print(f"{'─'*60}")
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 160)
print(df.head(10).to_string(index=False))

print(f"\n{'─'*60}")
print("  STATISTICAL SUMMARY (numeric columns)")
print(f"{'─'*60}")
print(df.describe().round(2).to_string())

print(f"\n{'─'*60}")
print("  DISASTER TYPE DISTRIBUTION")
print(f"{'─'*60}")
print(df["disaster_type"].value_counts().to_string())

print(f"\n{'─'*60}")
print("  WAREHOUSE DATASET (first 10 rows)")
print(f"{'─'*60}")
print(warehouse_df.head(10).to_string(index=False))

print(f"\n{SEP}")
print("  TARGET VARIABLE RANGES")
print(SEP)
for col in ["food_required", "medical_required", "shelter_required"]:
    print(f"  {col:<22}: min={df[col].min():>10,}  max={df[col].max():>12,}  mean={df[col].mean():>12,.0f}")

print(f"\n{'─'*60}")
print("  FILES GENERATED")
print(f"{'─'*60}")
print(f"  • {OUTPUT_CSV}   — {N_ROWS} rows × {len(df.columns)} columns")
print(f"  • {WAREHOUSE_CSV} — {N_WAREHOUSES} rows × {len(warehouse_df.columns)} columns")
print(f"\n  Ready for: XGBoost Regressor | Random Forest | Linear Regression")
print(SEP)