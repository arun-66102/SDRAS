# SDRAS - Smart Disaster Resource Allocation System

SDRAS is an enterprise-grade, real-time decision-support and predictive analytics web application. It is designed to optimize the allocation of emergency relief resources from regional NDRF (National Disaster Response Force) depots to disaster hotspots by leveraging machine learning forecasting models and geographical proximity calculations.

---

## 🏗️ System Architecture

The following diagram illustrates the relationship and data flow between the React SPA frontend, the Flask backend, the machine learning models, and the database layer:

```mermaid
graph TD
    subgraph Frontend [React SPA - Vite & CSS]
        UI[Interactive UI Pages]
        Context[Auth & Flash Contexts]
        Client[API Client client.js]
    end

    subgraph Backend [Flask Web Server]
        Routes[Flask Router app.py]
        Config[App Settings config.py]
        ML[Predictive Analytics ml_engine.py]
        Alloc[Allocation Engine allocation_engine.py]
        Geo[Geospatial Utils geo_utils.py]
        DS[Decision Support decision_support.py]
    end

    subgraph Database [Data & Models Layer]
        Models[SQLAlchemy Models models.py]
        Storage[(PostgreSQL / SQLite)]
        MLModels[(ML Model Files ml_models/*.pkl)]
    end

    UI <--> Context
    UI <--> Client
    Client <-->|REST JSON APIs| Routes
    Routes <--> Models
    Routes <--> ML
    Routes <--> Alloc
    Routes <--> DS
    Alloc <--> Geo
    ML <-->|Load / Save PKL| MLModels
    Models <--> Storage
```

---

## 📦 Core Codebase Modules & Architecture

### Backend Modules (Python)

1. **`app.py`**: The application bootstrap and REST API router. It initializes the Flask application, manages user authentication/sessions via `Flask-Login`, configures the database, and exposes 20+ functional API endpoints that control the entire workflow.
2. **`models.py`**: Defines the database schema and relationships using SQLAlchemy.
   - **`User`**: Admin, officer, and NGO accounts, including secure password hashing using `werkzeug.security`.
   - **`Disaster`**: Hotspot details, severity, environmental factors, and predicted resource requirements.
   - **`Warehouse`**: Depots containing local stocks and admin-defined minimum thresholds.
   - **`Allocation`**: Tracks resource shipments from warehouses to disasters (status: `Pending`, `Allocated`, `Dispatched`, `Delivered`).
3. **`config.py`**: Centralizes application configurations. It automatically loads environment variables from a `.env` file, defines lists of states and districts in India (along with pre-calculated geographical centers for automatic coordinates fill), and stores model training settings.
4. **`ml_engine.py`**: Handles the machine learning pipeline. It preprocesses raw records, builds interactive features (e.g., `pop_severity`, `severity_duration`), and trains/evaluates three regression algorithms (XGBoost, Random Forest, and Linear Regression) to predict resource demands (Food, Medical, Water, Clothing).
5. **`allocation_engine.py`**: Implements resource allocation algorithm. It matches disaster requirements with available depot inventories, supports multi-warehouse inventory splitting when a single warehouse cannot fulfill demand, and respects minimum thresholds (safety stock reserves).
6. **`geo_utils.py`**: Uses the Haversine formula to compute great-circle distances in kilometers between disasters and warehouses using their latitude/longitude coordinates. It handles sorting and filtering of nearest depots.
7. **`decision_support.py`**: Generates emergency response assets for critical events, including colored advisory/warning alerts, tactical action checklists (tailored to the specific disaster type), and phased relief plans (Phase 1: Immediate, Phase 2: Short-term, Phase 3: Long-term).

### Frontend Modules (React + Vite)

The frontend is a single-page application built with React, Vite, and Vanilla CSS:
* **Contexts**: `AuthContext.jsx` manages active user credentials and session scopes; `FlashContext.jsx` provides global, styled toast alerts.
* **Telemetry Dashboard (`DashboardPage.jsx`)**: Displays dynamic Leaflet maps plotting disasters and warehouses, operational metrics (R² scores, total allocations), and ChartJS analytics showing disaster distribution.
* **Resource Directory (`WarehousesPage.jsx` & `AllocationsPage.jsx`)**: Allows real-time viewing of warehouse inventories and allocation statuses. Admins can adjust safety thresholds, add new warehouses, and monitor current supply chains.
* **User Management (`UserManagementPage.jsx`)**: Lets administrators create users, promote roles, and assign specific warehouses to Regional Warehouse Officers.

---

## 🗃️ Database Schema & Relationships

The relational database structure uses a junction table to map multiple officers to multiple warehouses, creating a robust, multi-tenant scope control:

* **`users`**: `id` (PK), `username`, `email`, `password_hash`, `role` (admin, officer, ngo), `full_name`, `created_at`.
* **`warehouses`**: `id` (PK), `warehouse_id` (unique code), `warehouse_name`, `district`, `state`, `latitude`, `longitude`, `food_stock`, `medical_stock`, `water_stock`, `clothing_stock`, `min_food_threshold`, `min_medical_threshold`, `min_water_threshold`, `min_clothing_threshold`.
* **`user_warehouse`**: `user_id` (FK -> users.id), `warehouse_id` (FK -> warehouses.id). Maps warehouse officers to their assigned depots.
* **`disasters`**: `id` (PK), `disaster_type`, `severity` (1-10), `population_affected`, `rainfall_mm`, `temperature_c`, `disaster_duration_days`, `district`, `state`, `latitude`, `longitude`, `food_required`, `medical_required`, `water_required`, `clothing_required`, `status` (Active, Resolved, Archived), `created_at`, `created_by`.
* **`allocations`**: `id` (PK), `disaster_id` (FK -> disasters.id), `warehouse_pk` (FK -> warehouses.id), `food_allocated`, `medical_allocated`, `water_allocated`, `clothing_allocated`, `distance_km`, `status` (Pending, Allocated, Dispatched, Delivered), `priority` (1-10), `created_at`, `updated_at`.

---

## 🚦 REST API Specifications

| HTTP Method | API Path | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Public | Authenticates credentials. Bootstraps an administrator if the users table is empty. |
| **POST** | `/api/auth/logout` | Authenticated | Clears the active session and logs out the user. |
| **GET** | `/api/auth/me` | Authenticated | Returns information about the currently logged-in user. |
| **GET** | `/api/dashboard` | Authenticated | Retreives all metrics, map pins, and data visualizations for the dashboard. |
| **GET** | `/api/disaster/form-data` | admin, officer, ngo | Returns valid districts, disaster types, and configuration defaults. |
| **POST** | `/api/disaster/new` | admin, officer, ngo | Logs a new disaster, runs ML predictions, and saves the record. |
| **GET** | `/api/predictions` | Authenticated | Returns the training metrics (MAE, RMSE, R²) for all machine learning models. |
| **POST** | `/api/predict` | Authenticated | Returns predictions on demand for given inputs (without storing in database). |
| **GET** | `/api/allocations` | Authenticated | Lists all resource allocations (restricted to assigned warehouses for officers). |
| **POST** | `/api/allocate` | admin, officer | Computes allocations using the allocation engine and deducts inventory stocks. |
| **GET** | `/api/warehouses` | Authenticated | Returns all warehouses and total accumulated resources. |
| **PUT** | `/api/warehouse/<int:wh_id>/stock` | admin, officer | Updates the active stock levels for a specific warehouse. |
| **PUT** | `/api/warehouse/<int:wh_id>/threshold` | admin | Configures minimum safety stock thresholds for a warehouse. |
| **POST** | `/api/warehouse/new` | admin | Creates a new regional warehouse depot. |
| **GET** | `/api/reports` | Authenticated | Generates decision support data (alerts, advice, phased timelines). |
| **GET** | `/api/admin/dashboard` | admin | Summarizes administrative telemetry (low stock alerts, user statistics). |
| **GET** | `/api/admin/users` | admin | Lists all registered accounts and their assigned warehouses. |
| **POST** | `/api/admin/users` | admin | Creates a new user account with specified roles and warehouse scopes. |
| **PUT** | `/api/admin/users/<int:user_id>` | admin | Modifies user roles and reassigns warehouse scopes. |

---

## ⚙️ Installation & Developer Guide

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher with npm

---

### Step 1: Clone the Codebase & Install Backend Dependencies
In the root directory of the project, run:
```bash
pip install -r requirements.txt
```

### Step 2: Configure the Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://neondb_owner:password@endpoint-pooler.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=your-custom-secure-secret-key-123456
```
> [!NOTE]
> If `DATABASE_URL` is omitted, the application will automatically fall back to creating a local SQLite database file named `disaster_allocation.db` in the root folder.

### Step 3: Run the Machine Learning Training Pipeline
Before running the application for the first time, you must train the predictive models. This will generate model artifacts inside the `ml_models/` folder:
```bash
python ml_engine.py
```
This script will:
1. Load `smart_disaster_dataset.csv`.
2. Clean data and engineer interaction features.
3. Train **XGBoost** (or GradientBoosting fallback), **Random Forest**, and **Linear Regression** models for each target variable.
4. Save the trained models, label encoder, and performance metrics inside the `ml_models/` directory.

### Step 4: Run the Backend Flask Web Server
To start the backend server, execute:
```bash
python app.py
```
On startup, the server pre-loads all machine learning model files from the `ml_models/` folder and starts listening on `http://localhost:5000`.

### Step 5: Install Frontend Dependencies & Run the Development Server
Navigate to the `frontend/` directory, install packages, and spin up the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The React frontend will start at `http://localhost:5173`. It is configured to proxy API requests to the backend server at `http://localhost:5000`.

### Step 6: Initial Administrator Bootstrap
When starting with an empty database:
1. Open the frontend in your browser.
2. Enter your desired administrator credentials on the login screen.
3. The system will detect that the `users` table is empty and automatically bootstrap your credentials as the primary **Administrator** (assigned the `admin` role).

---

## 🛠️ Build & Production Deployment

If you want to bundle the React application and serve it statically directly through Flask:

1. Build the production assets:
   ```bash
   cd frontend
   npm run build
   ```
   This compiles the React SPA into static HTML, JS, and CSS files under `frontend/dist/`.
2. The Flask catch-all routes will automatically serve `index.html` and static files from `frontend/dist/` for any non-API routes. You can run `python app.py` and access the entire system directly on `http://localhost:5000`.
