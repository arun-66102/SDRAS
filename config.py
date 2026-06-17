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

    # Disasters that require rainfall input (weather-related)
    RAINFALL_REQUIRED_DISASTERS = ["Flood", "Cyclone", "Tsunami", "Landslide"]

    # Default minimum threshold values for new warehouses
    # These represent reserved stock for local emergency supply
    DEFAULT_MIN_THRESHOLD = {
        "food": 500,
        "medical": 100,
        "water": 200,
        "clothing": 100,
    }

    # District coordinates for auto-fill
    # Dynamic generation of districts coordinates based on provided India States & Districts
    india_states_districts = {
        "Andhra Pradesh": [
            "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
            "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram",
            "West Godavari", "YSR Kadapa"
        ],
        "Arunachal Pradesh": [
            "Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey",
            "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang",
            "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley",
            "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"
        ],
        "Assam": [
            "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
            "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara",
            "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan",
            "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur",
            "Majuli", "Morigaon", "Nagaon", "Nalbari", "Dima Hasao", "Sivasagar",
            "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"
        ],
        "Bihar": [
            "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur",
            "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj",
            "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj",
            "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur",
            "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa",
            "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan",
            "Supaul", "Vaishali", "West Champaran"
        ],
        "Chandigarh (UT)": ["Chandigarh"],
        "Chhattisgarh": [
            "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
            "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband",
            "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)",
            "Kondagaon", "Korba", "Korea (Koriya)", "Mahasamund", "Mungeli", "Narayanpur",
            "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur ", "Surguja"
        ],
        "Dadra and Nagar Haveli (UT)": ["Dadra & Nagar Haveli"],
        "Daman and Diu (UT)": ["Daman", "Diu"],
        "Delhi (NCT)": [
            "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
            "North West Delhi", "Shahdara", "South Delhi", "South East Delhi",
            "South West Delhi", "West Delhi"
        ],
        "Goa": ["North Goa", "South Goa"],
        "Gujarat": [
            "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha (Palanpur)",
            "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dangs (Ahwa)",
            "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh",
            "Kachchh", "Kheda (Nadiad)", "Mahisagar", "Mehsana", "Morbi",
            "Narmada (Rajpipla)", "Navsari", "Panchmahal (Godhra)", "Patan", "Porbandar",
            "Rajkot", "Sabarkantha (Himmatnagar)", "Surat", "Surendranagar", "Tapi (Vyara)",
            "Vadodara", "Valsad"
        ],
        "Haryana": [
            "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon",
            "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra",
            "Mahendragarh", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari",
            "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"
        ],
        "Himachal Pradesh": [
            "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu",
            "Lahaul & Spiti", "Mandi", "Shimla", "Sirmaur (Sirmour)", "Solan", "Una"
        ],
        "Jammu and Kashmir": [
            "Anantnag", "Bandipore", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu",
            "Kargil", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Leh", "Poonch",
            "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar",
            "Udhampur"
        ],
        "Jharkhand": [
            "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa",
            "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma",
            "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj",
            "Seraikela-Kharsawan", "Simdega", "West Singhbhum"
        ],
        "Karnataka": [
            "Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural",
            "Bengaluru (Bangalore) Urban", "Bidar", "Chamarajanagar", "Chikballapur",
            "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada", "Davangere",
            "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu",
            "Kolar", "Koppal", "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara",
            "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi", "Uttara Kannada (Karwar)",
            "Vijayapura (Bijapur)", "Yadgir"
        ],
        "Kerala": [
            "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
            "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram",
            "Thrissur", "Wayanad"
        ],
        "Lakshadweep (UT)": [
            "Agatti", "Amini", "Androth", "Bithra", "Chethlath", "Kavaratti", "Kadmath",
            "Kalpeni", "Kilthan", "Minicoy"
        ],
        "Madhya Pradesh": [
            "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
            "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh",
            "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad",
            "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla",
            "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh",
            "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur",
            "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria",
            "Vidisha"
        ],
        "Maharashtra": [
            "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana",
            "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna",
            "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
            "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad",
            "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha",
            "Washim", "Yavatmal"
        ],
        "Manipur": [
            "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam",
            "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati",
            "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
        ],
        "Meghalaya": [
            "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills",
            "Ri Bhoi", "South Garo Hills", "South West Garo Hills ", "South West Khasi Hills",
            "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
        ],
        "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
        "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
        "Odisha": [
            "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack",
            "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur",
            "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)",
            "Khordha", "Koraput", "Malkangiri", "Mayurbanj", "Nabarangpur", "Nayagarh",
            "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundargarh"
        ],
        "Puducherry (UT)": ["Karaikal", "Mahe", "Pondicherry", "Yanam"],
        "Punjab": [
            "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
            "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
            "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot",
            "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar (Mohali)", "Sangrur", "Tarn Taran"
        ],
        "Rajasthan": [
            "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara",
            "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
            "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
            "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand",
            "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
        ],
        "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
        "Tamil Nadu": [
            "Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
            "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai",
            "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
            "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni",
            "Thoothukudi (Tuticorin)", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
            "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
        ],
        "Telangana": [
            "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon",
            "Jayashankar Bhoopalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
            "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial",
            "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad",
            "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet",
            "Suryapet", "Vikarabad", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)",
            "Yadadri Bhuvanagiri"
        ],
        "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
        "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
        "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kanshiram Nagar (Kasganj)", "Kaushambi", "Kushinagar (Padrauna)", "Lakhimpur - Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "RaeBareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamali (Prabuddh Nagar)", "Shravasti", "Siddharth Nagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
        "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Burdwan (Bardhaman)", "Cooch Behar", "Dakshin Dinajpur (South Dinajpur)", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Medinipur (West Medinipur)", "Purba Medinipur (East Medinipur)", "Purulia", "South 24 Parganas", "Uttar Dinajpur (North Dinajpur)"]
    }

    STATE_CENTERS = {
        "Andhra Pradesh": (16.5062, 80.6480),
        "Arunachal Pradesh": (27.0844, 93.6053),
        "Assam": (26.1445, 91.7362),
        "Bihar": (25.5941, 85.1376),
        "Chandigarh (UT)": (30.7333, 76.7794),
        "Chhattisgarh": (21.2514, 81.6296),
        "Dadra and Nagar Haveli (UT)": (20.2765, 73.0083),
        "Daman and Diu (UT)": (20.3974, 72.8328),
        "Delhi (NCT)": (28.7041, 77.1025),
        "Goa": (15.4909, 73.8278),
        "Gujarat": (23.0225, 72.5714),
        "Haryana": (29.0588, 76.0856),
        "Himachal Pradesh": (31.1048, 77.1734),
        "Jammu and Kashmir": (34.0837, 74.7973),
        "Jharkhand": (23.3441, 85.3096),
        "Karnataka": (12.9716, 77.5946),
        "Kerala": (8.5241, 76.9366),
        "Lakshadweep (UT)": (10.5667, 72.6369),
        "Madhya Pradesh": (23.2599, 77.4126),
        "Maharashtra": (19.0760, 72.8777),
        "Manipur": (24.8170, 93.9368),
        "Meghalaya": (25.5788, 91.8831),
        "Mizoram": (23.7307, 92.7173),
        "Nagaland": (25.6701, 94.1077),
        "Odisha": (20.2961, 85.8245),
        "Puducherry (UT)": (11.9416, 79.8083),
        "Punjab": (31.3260, 75.5762),
        "Rajasthan": (26.9124, 75.7873),
        "Sikkim": (27.3389, 88.6065),
        "Tamil Nadu": (13.0827, 80.2707),
        "Telangana": (17.3850, 78.4867),
        "Tripura": (23.8315, 91.2868),
        "Uttarakhand": (30.3165, 78.0322),
        "Uttar Pradesh": (26.8467, 80.9462),
        "West Bengal": (22.5726, 88.3639),
    }

    import math
    _districts_list = []
    for state, dist_names in india_states_districts.items():
        base_lat, base_lon = STATE_CENTERS.get(state, (20.0, 78.0))
        n = len(dist_names)
        for i, dist in enumerate(dist_names):
            if n > 1:
                angle = i * (137.5 * math.pi / 180.0)
                radius = 0.15 + (i / n) * 0.45
                lat = round(base_lat + math.sin(angle) * radius, 4)
                lon = round(base_lon + math.cos(angle) * radius, 4)
            else:
                lat = base_lat
                lon = base_lon
            
            _districts_list.append({
                "district": dist,
                "state": state,
                "lat": lat,
                "lon": lon
            })

    DISTRICTS = _districts_list

    DISASTER_TYPES = ["Flood", "Cyclone", "Earthquake", "Fire", "Landslide", "Tsunami"]
