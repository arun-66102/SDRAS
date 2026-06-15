# SDRAS — Smart Disaster Resource Allocation System

SDRAS is a decision-support and predictive analytics web application designed to optimize the allocation of relief resources (food, medical kits, and shelter units) from regional NDRF depots to disaster hotspots in real-time.

---

## 🚀 Features & Workflow

1. **Authentication & Role-Based Access Control (RBAC)**: Support for Admin, Officer, and NGO user roles.
2. **Predictive Resource Modelling**: Utilizes three trained ML models (XGBoost, Random Forest, Linear Regression) to forecast relief demands based on disaster severity, population affected, and environmental features.
3. **Automated Resource Allocation**: Evaluates real-time warehouse inventories and runs Haversine calculations to allocate resources from the closest depots, splitting loads across multiple warehouses when necessary.
4. **Decision Support & Alerts**: Generates live emergency alerts, phased relief timelines, and action recommendations for critical disasters.
5. **Interactive Operations Dashboard**: Built-in maps showing active disaster hotspots, warehouse locations, and data visualization charts.

---

## 🛠️ Technology Stack

* **Backend**: Flask (Python 3) & SQLAlchemy
* **Database**: PostgreSQL (Neon Serverless compatibility with pre-pinging/pool recycle optimized configuration)
* **Machine Learning**: Scikit-Learn & XGBoost (Pre-trained models loaded at startup)
* **Frontend**: HTML5, Vanilla CSS (Premium Minimalist Light Theme), Lucide Icons, Leaflet Maps, Chart.js

---

## 💻 Quick Start & Installation

### 1. Install Dependencies
Make sure you have Python 3 installed. Run:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Set up your database connection in a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://your_db_credentials
SECRET_KEY=your_secret_key
```

### 3. Run the Server
Start the Flask application:
```bash
python app.py
```
The server will pre-load the ML models and start at **`http://localhost:5000`**.

---

## 🔑 Demo Access Credentials

| Role | Username | Password | Permitted Actions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Access (Create, Allocate, Predict, View Reports) |
| **Officer** | `officer` | `officer123` | Operations Access (Create, Allocate, Predict, View Reports) |
| **NGO** | `ngo` | `ngo123` | Read-only Access (Dashboard, Warehouses, Reports) |
