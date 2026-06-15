"""
Configuration for Smart Disaster Resource Allocation System
"""
import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load environment variables from .env file
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path)

print(f"[DEBUG] Dotenv path: {dotenv_path}")
print(f"[DEBUG] DATABASE_URL in os.environ: {os.environ.get('DATABASE_URL')}")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "smart-disaster-allocation-key-2024")
    
    db_uri = os.environ.get("DATABASE_URL")
    if db_uri:
        if db_uri.startswith("postgres://"):
            db_uri = db_uri.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = db_uri
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'disaster_allocation.db')}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # Paths
    DATASET_PATH = os.path.join(BASE_DIR, "smart_disaster_dataset.csv")
    WAREHOUSE_PATH = os.path.join(BASE_DIR, "warehouse_dataset.csv")
    MODEL_DIR = os.path.join(BASE_DIR, "ml_models")

    # ML Settings
    RANDOM_STATE = 42
    TEST_SIZE = 0.2

    # District coordinates for auto-fill
    DISTRICTS = [
        {"district": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
        {"district": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
        {"district": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
        {"district": "Delhi", "state": "Delhi", "lat": 28.7041, "lon": 77.1025},
        {"district": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
        {"district": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867},
        {"district": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714},
        {"district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
        {"district": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
        {"district": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
        {"district": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126},
        {"district": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376},
        {"district": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lon": 85.8245},
        {"district": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362},
        {"district": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lon": 76.9366},
        {"district": "Chandigarh", "state": "Punjab", "lat": 30.7333, "lon": 76.7794},
        {"district": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lon": 78.0322},
        {"district": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734},
        {"district": "Gangtok", "state": "Sikkim", "lat": 27.3389, "lon": 88.6065},
        {"district": "Imphal", "state": "Manipur", "lat": 24.8170, "lon": 93.9368},
        {"district": "Aizawl", "state": "Mizoram", "lat": 23.7307, "lon": 92.7173},
        {"district": "Itanagar", "state": "Arunachal Pradesh", "lat": 27.0844, "lon": 93.6053},
        {"district": "Kohima", "state": "Nagaland", "lat": 25.6701, "lon": 94.1077},
        {"district": "Port Blair", "state": "Andaman & Nicobar", "lat": 11.6234, "lon": 92.7265},
        {"district": "Panaji", "state": "Goa", "lat": 15.4909, "lon": 73.8278},
        {"district": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lon": 81.6296},
        {"district": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lon": 85.3096},
        {"district": "Agartala", "state": "Tripura", "lat": 23.8315, "lon": 91.2868},
        {"district": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.0837, "lon": 74.7973},
        {"district": "Leh", "state": "Ladakh", "lat": 34.1526, "lon": 77.5771},
        {"district": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185},
        {"district": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558},
        {"district": "Surat", "state": "Gujarat", "lat": 21.1702, "lon": 72.8311},
        {"district": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lon": 79.0882},
        {"district": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lon": 75.8577},
    ]

    DISASTER_TYPES = ["Flood", "Cyclone", "Earthquake", "Fire", "Landslide", "Tsunami"]
