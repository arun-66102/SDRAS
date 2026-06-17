"""
Smart Disaster Resource Allocation System — Flask Application
==============================================================
Main entry point. Implements all routes for the 11-module workflow.

Run:  python app.py
URL:  http://localhost:5000
"""
import json
import os
import sys

from functools import wraps
from flask import Flask, abort, flash, jsonify, redirect, render_template, request, url_for
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)

from config import Config
from models import Allocation, Disaster, User, Warehouse, db


# ─────────────────────────────────────────────────────────────────────────────
# ROLE-BASED ACCESS CONTROL
# ─────────────────────────────────────────────────────────────────────────────
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ─────────────────────────────────────────────────────────────────────────────
# APP FACTORY
# ─────────────────────────────────────────────────────────────────────────────
login_manager = LoginManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialise extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "login"
    login_manager.login_message_category = "warning"

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    return app


app = create_app()


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# ─────────────────────────────────────────────────────────────────────────────
# ML ENGINE — lazy loading
# ─────────────────────────────────────────────────────────────────────────────
_ml_engine = None


def get_ml_engine():
    global _ml_engine
    if _ml_engine is None:
        from ml_engine import ml_engine as eng

        if not eng.is_trained:
            eng.load_models()
        _ml_engine = eng
    return _ml_engine


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES — Authentication (Module ①)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            flash(f"Welcome back, {user.full_name}!", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard"))
        else:
            flash("Invalid username or password.", "error")

    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Dashboard (Module ⑩)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/dashboard")
@login_required
def dashboard():
    disasters = Disaster.query.order_by(Disaster.id.desc()).all()
    warehouses = Warehouse.query.all()
    allocations = Allocation.query.all()

    # Stats
    stats = {
        "total_disasters": len(disasters),
        "critical_count": sum(1 for d in disasters if d.severity >= 8),
        "total_warehouses": len(warehouses),
        "total_population": sum(d.population_affected for d in disasters),
        "total_allocations": len(set(a.disaster_id for a in allocations)),
    }

    # Chart data
    type_counts = {}
    for d in disasters:
        type_counts[d.disaster_type] = type_counts.get(d.disaster_type, 0) + 1

    severity_counts = {}
    for d in disasters:
        severity_counts[d.severity] = severity_counts.get(d.severity, 0) + 1

    chart_data = {
        "type_distribution": {
            "labels": list(type_counts.keys()),
            "values": list(type_counts.values()),
        },
        "resource_totals": {
            "food": sum(d.food_required for d in disasters if d.status == "Active"),
            "medical": sum(d.medical_required for d in disasters if d.status == "Active"),
            "water": sum(d.water_required for d in disasters if d.status == "Active"),
            "clothing": sum(d.clothing_required for d in disasters if d.status == "Active"),
        },
        "resource_allocated": {
            "food": sum(a.food_allocated for a in allocations),
            "medical": sum(a.medical_allocated for a in allocations),
            "water": sum(a.water_allocated for a in allocations),
            "clothing": sum(a.clothing_allocated for a in allocations),
        },
        "severity_distribution": {
            "labels": sorted(severity_counts.keys()),
            "values": [severity_counts[k] for k in sorted(severity_counts.keys())],
        },
    }

    # JSON for map
    disasters_json = json.dumps(
        [
            {
                "id": d.id,
                "disaster_type": d.disaster_type,
                "severity": d.severity,
                "population_affected": d.population_affected,
                "district": d.district,
                "state": d.state,
                "latitude": d.latitude,
                "longitude": d.longitude,
                "status": d.status,
            }
            for d in disasters
        ]
    )

    warehouses_json = json.dumps(
        [
            {
                "warehouse_id": w.warehouse_id,
                "warehouse_name": w.warehouse_name,
                "district": w.district,
                "state": w.state,
                "latitude": w.latitude,
                "longitude": w.longitude,
                "food_stock": w.food_stock,
                "medical_stock": w.medical_stock,
                "water_stock": w.water_stock,
                "clothing_stock": w.clothing_stock,
            }
            for w in warehouses
        ]
    )

    recent_disasters = disasters[:20]

    return render_template(
        "dashboard.html",
        active_page="dashboard",
        stats=stats,
        chart_data=json.dumps(chart_data),
        disasters_json=disasters_json,
        warehouses_json=warehouses_json,
        recent_disasters=recent_disasters,
    )


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Disaster Input (Module ②) + Prediction (Module ⑤)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/disaster/new", methods=["GET", "POST"])
@login_required
@role_required("admin", "officer")
def disaster_form():
    if request.method == "POST":
        try:
            disaster_type = request.form["disaster_type"]
            severity = int(request.form["severity"])
            population_affected = int(request.form["population_affected"])
            temperature_c = float(request.form["temperature_c"])
            duration = int(request.form["disaster_duration_days"])
            district = request.form["district"]
            state = request.form["state"]
            latitude = float(request.form["latitude"])
            longitude = float(request.form["longitude"])

            # Rainfall: required only for weather-related disasters
            if disaster_type in Config.RAINFALL_REQUIRED_DISASTERS:
                rainfall_mm = float(request.form["rainfall_mm"])
            else:
                rainfall_raw = request.form.get("rainfall_mm", "").strip()
                rainfall_mm = float(rainfall_raw) if rainfall_raw else 0.0

            # Run ML prediction
            engine = get_ml_engine()
            predictions = engine.predict(
                disaster_type, severity, population_affected,
                rainfall_mm, temperature_c, duration
            )

            # Use best model's predictions
            best_model = engine.get_best_model("food_required")
            best_preds = predictions.get(best_model, list(predictions.values())[0])

            # Save disaster
            disaster = Disaster(
                disaster_type=disaster_type,
                severity=severity,
                population_affected=population_affected,
                rainfall_mm=rainfall_mm,
                temperature_c=temperature_c,
                disaster_duration_days=duration,
                district=district,
                state=state,
                latitude=latitude,
                longitude=longitude,
                food_required=best_preds["food_required"],
                medical_required=best_preds["medical_required"],
                water_required=best_preds["water_required"],
                clothing_required=best_preds["clothing_required"],
                status="Active",
                created_by=current_user.id,
            )
            db.session.add(disaster)
            db.session.commit()

            flash(
                f"Disaster #{disaster.id} reported! Predicted — "
                f"Food: {best_preds['food_required']:,}, "
                f"Medical: {best_preds['medical_required']:,}, "
                f"Water: {best_preds['water_required']:,}, "
                f"Clothing: {best_preds['clothing_required']:,}",
                "success",
            )
            return redirect(url_for("dashboard"))

        except Exception as e:
            db.session.rollback()
            flash(f"Error: {str(e)}", "error")

    return render_template(
        "disaster_form.html",
        active_page="disaster_form",
        disaster_types=Config.DISASTER_TYPES,
        districts=Config.DISTRICTS,
        rainfall_required_disasters=json.dumps(Config.RAINFALL_REQUIRED_DISASTERS),
    )


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Predictions Page (Module ④)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/predictions")
@login_required
def predictions_page():
    engine = get_ml_engine()
    metrics = engine.get_all_metrics()

    return render_template(
        "predictions.html",
        active_page="predictions",
        metrics=metrics,
        disaster_types=Config.DISASTER_TYPES,
    )


# ═══════════════════════════════════════════════════════════════════════════
# API — Predict (AJAX endpoint)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/api/predict", methods=["POST"])
@login_required
def api_predict():
    try:
        data = request.get_json()
        engine = get_ml_engine()

        predictions = engine.predict(
            disaster_type=data["disaster_type"],
            severity=int(data["severity"]),
            population_affected=int(data["population_affected"]),
            rainfall_mm=float(data.get("rainfall_mm", 0)),
            temperature_c=float(data["temperature_c"]),
            disaster_duration_days=int(data["disaster_duration_days"]),
        )

        best_model = engine.get_best_model("food_required")
        metrics = engine.get_all_metrics()

        return jsonify(
            {
                "predictions": predictions,
                "best_model": best_model,
                "metrics": metrics,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Allocations (Module ⑧ + ⑨)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/allocations")
@login_required
def allocations_page():
    allocations = Allocation.query.order_by(Allocation.id.desc()).all()

    unique_disaster_ids = list(set(a.disaster_id for a in allocations))
    disaster_statuses = {}
    for a in allocations:
        if a.disaster_id not in disaster_statuses:
            disaster_statuses[a.disaster_id] = a.status

    stats = {
        "total": len(unique_disaster_ids),
        "allocated": sum(1 for status in disaster_statuses.values() if status == "Allocated"),
        "dispatched": sum(1 for status in disaster_statuses.values() if status == "Dispatched"),
        "pending": sum(1 for status in disaster_statuses.values() if status == "Pending"),
    }

    return render_template(
        "allocations.html",
        active_page="allocations",
        allocations=allocations,
        stats=stats,
    )


# ═══════════════════════════════════════════════════════════════════════════
# API — Allocate Resources (AJAX endpoint)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/api/allocate", methods=["POST"])
@login_required
@role_required("admin", "officer")
def api_allocate():
    try:
        from allocation_engine import allocate_resources

        data = request.get_json()
        disaster_id = int(data["disaster_id"])

        disaster = db.session.get(Disaster, disaster_id)
        if not disaster:
            return jsonify({"error": "Disaster not found"}), 404

        # Get all warehouses
        warehouses = Warehouse.query.all()
        warehouses_list = [
            {
                "id": w.id,
                "warehouse_id": w.warehouse_id,
                "warehouse_name": w.warehouse_name,
                "district": w.district,
                "latitude": w.latitude,
                "longitude": w.longitude,
                "food_stock": w.food_stock,
                "medical_stock": w.medical_stock,
                "water_stock": w.water_stock,
                "clothing_stock": w.clothing_stock,
                # Include thresholds for allocation engine
                "min_food_threshold": w.min_food_threshold,
                "min_medical_threshold": w.min_medical_threshold,
                "min_water_threshold": w.min_water_threshold,
                "min_clothing_threshold": w.min_clothing_threshold,
            }
            for w in warehouses
        ]

        predicted_needs = {
            "food_required": disaster.food_required,
            "medical_required": disaster.medical_required,
            "water_required": disaster.water_required,
            "clothing_required": disaster.clothing_required,
        }

        disaster_dict = {
            "id": disaster.id,
            "latitude": disaster.latitude,
            "longitude": disaster.longitude,
            "severity": disaster.severity,
            "disaster_type": disaster.disaster_type,
        }

        result = allocate_resources(disaster_dict, warehouses_list, predicted_needs)

        # Save allocations to database
        priority = result["summary"]["priority"]
        for alloc in result["allocations"]:
            allocation = Allocation(
                disaster_id=disaster.id,
                warehouse_pk=alloc["warehouse_pk"],
                food_allocated=alloc["food_allocated"],
                medical_allocated=alloc["medical_allocated"],
                water_allocated=alloc["water_allocated"],
                clothing_allocated=alloc["clothing_allocated"],
                distance_km=alloc["distance_km"],
                status="Allocated",
                priority=priority,
            )
            db.session.add(allocation)

            # Deduct stock from warehouse
            wh = db.session.get(Warehouse, alloc["warehouse_pk"])
            if wh:
                wh.food_stock = max(0, wh.food_stock - alloc["food_allocated"])
                wh.medical_stock = max(0, wh.medical_stock - alloc["medical_allocated"])
                wh.water_stock = max(0, wh.water_stock - alloc["water_allocated"])
                wh.clothing_stock = max(0, wh.clothing_stock - alloc["clothing_allocated"])

        # Update disaster status in database to Allocated
        disaster.status = "Allocated"

        db.session.commit()

        return jsonify(
            {
                "message": f"Resources {result['status']} from {result['summary']['warehouses_used']} warehouse(s).",
                "summary": result["summary"],
                "status": result["status"],
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Warehouses (Module ⑥)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/warehouses")
@login_required
def warehouses_page():
    warehouses = Warehouse.query.all()

    total_food = sum(w.food_stock for w in warehouses)
    total_medical = sum(w.medical_stock for w in warehouses)
    total_water = sum(w.water_stock for w in warehouses)
    total_clothing = sum(w.clothing_stock for w in warehouses)

    warehouses_json = json.dumps(
        [
            {
                "warehouse_id": w.warehouse_id,
                "warehouse_name": w.warehouse_name,
                "district": w.district,
                "state": w.state,
                "latitude": w.latitude,
                "longitude": w.longitude,
                "food_stock": w.food_stock,
                "medical_stock": w.medical_stock,
                "water_stock": w.water_stock,
                "clothing_stock": w.clothing_stock,
            }
            for w in warehouses
        ]
    )

    districts_json = json.dumps(Config.DISTRICTS)

    return render_template(
        "warehouses.html",
        active_page="warehouses",
        warehouses=warehouses,
        total_food=total_food,
        total_medical=total_medical,
        total_water=total_water,
        total_clothing=total_clothing,
        warehouses_json=warehouses_json,
        districts_json=districts_json,
    )


# ═══════════════════════════════════════════════════════════════════════════
# API — Update Warehouse Stock (Feature 1: Resource Modification)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/api/warehouse/<int:wh_id>/stock", methods=["PUT"])
@login_required
@role_required("admin", "officer")
def api_update_warehouse_stock(wh_id):
    """Update stock levels for an existing warehouse."""
    try:
        wh = db.session.get(Warehouse, wh_id)
        if not wh:
            return jsonify({"error": "Warehouse not found"}), 404

        data = request.get_json()

        # Validate: no negative values
        for field in ["food_stock", "medical_stock", "water_stock", "clothing_stock"]:
            if field in data:
                val = int(data[field])
                if val < 0:
                    return jsonify({"error": f"{field} cannot be negative"}), 400

        # Update stock levels
        if "food_stock" in data:
            wh.food_stock = int(data["food_stock"])
        if "medical_stock" in data:
            wh.medical_stock = int(data["medical_stock"])
        if "water_stock" in data:
            wh.water_stock = int(data["water_stock"])
        if "clothing_stock" in data:
            wh.clothing_stock = int(data["clothing_stock"])

        db.session.commit()

        return jsonify({
            "message": f"Stock updated for warehouse {wh.warehouse_id}",
            "warehouse": {
                "id": wh.id,
                "warehouse_id": wh.warehouse_id,
                "food_stock": wh.food_stock,
                "medical_stock": wh.medical_stock,
                "water_stock": wh.water_stock,
                "clothing_stock": wh.clothing_stock,
            },
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════
# API — Update Warehouse Thresholds (Feature 4: Minimum Threshold)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/api/warehouse/<int:wh_id>/threshold", methods=["PUT"])
@login_required
@role_required("admin")
def api_update_warehouse_threshold(wh_id):
    """Set minimum stock thresholds for a warehouse (admin only)."""
    try:
        wh = db.session.get(Warehouse, wh_id)
        if not wh:
            return jsonify({"error": "Warehouse not found"}), 404

        data = request.get_json()

        # Validate: no negative or zero values for thresholds
        for field in ["min_food_threshold", "min_medical_threshold",
                      "min_water_threshold", "min_clothing_threshold"]:
            if field in data:
                val = int(data[field])
                if val <= 0:
                    return jsonify({"error": f"{field} must be a positive value (> 0)"}), 400

        # Update thresholds
        if "min_food_threshold" in data:
            wh.min_food_threshold = int(data["min_food_threshold"])
        if "min_medical_threshold" in data:
            wh.min_medical_threshold = int(data["min_medical_threshold"])
        if "min_water_threshold" in data:
            wh.min_water_threshold = int(data["min_water_threshold"])
        if "min_clothing_threshold" in data:
            wh.min_clothing_threshold = int(data["min_clothing_threshold"])

        db.session.commit()

        return jsonify({
            "message": f"Thresholds updated for warehouse {wh.warehouse_id}",
            "warehouse": {
                "id": wh.id,
                "warehouse_id": wh.warehouse_id,
                "min_food_threshold": wh.min_food_threshold,
                "min_medical_threshold": wh.min_medical_threshold,
                "min_water_threshold": wh.min_water_threshold,
                "min_clothing_threshold": wh.min_clothing_threshold,
            },
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════
# API — Create New Warehouse (Feature 2: Admin Only)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/api/warehouse/new", methods=["POST"])
@login_required
@role_required("admin")
def api_create_warehouse():
    """Create a new warehouse (admin only)."""
    try:
        data = request.get_json()

        # Auto-generate warehouse_id if not provided
        warehouse_id = data.get("warehouse_id", "").strip()
        if not warehouse_id:
            last_wh = Warehouse.query.order_by(Warehouse.id.desc()).first()
            next_num = (last_wh.id + 1) if last_wh else 1
            warehouse_id = f"WH{str(next_num).zfill(3)}"

        # Check uniqueness
        existing = Warehouse.query.filter_by(warehouse_id=warehouse_id).first()
        if existing:
            return jsonify({"error": f"Warehouse ID '{warehouse_id}' already exists"}), 400

        # Validate required fields
        required_fields = ["warehouse_name", "district", "state", "latitude", "longitude"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"'{field}' is required"}), 400

        # Validate stock values are non-negative
        stock_fields = ["food_stock", "medical_stock", "water_stock", "clothing_stock"]
        for field in stock_fields:
            val = int(data.get(field, 0))
            if val < 0:
                return jsonify({"error": f"{field} cannot be negative"}), 400

        # Validate threshold values are positive (> 0)
        threshold_fields = {
            "min_food_threshold": Config.DEFAULT_MIN_THRESHOLD["food"],
            "min_medical_threshold": Config.DEFAULT_MIN_THRESHOLD["medical"],
            "min_water_threshold": Config.DEFAULT_MIN_THRESHOLD["water"],
            "min_clothing_threshold": Config.DEFAULT_MIN_THRESHOLD["clothing"],
        }
        for field, default_val in threshold_fields.items():
            val = int(data.get(field, default_val))
            if val <= 0:
                return jsonify({"error": f"{field} must be a positive value (> 0)"}), 400

        wh = Warehouse(
            warehouse_id=warehouse_id,
            warehouse_name=data["warehouse_name"],
            district=data["district"],
            state=data["state"],
            latitude=float(data["latitude"]),
            longitude=float(data["longitude"]),
            food_stock=int(data.get("food_stock", 0)),
            medical_stock=int(data.get("medical_stock", 0)),
            water_stock=int(data.get("water_stock", 0)),
            clothing_stock=int(data.get("clothing_stock", 0)),
            min_food_threshold=int(data.get("min_food_threshold", threshold_fields["min_food_threshold"])),
            min_medical_threshold=int(data.get("min_medical_threshold", threshold_fields["min_medical_threshold"])),
            min_water_threshold=int(data.get("min_water_threshold", threshold_fields["min_water_threshold"])),
            min_clothing_threshold=int(data.get("min_clothing_threshold", threshold_fields["min_clothing_threshold"])),
        )
        db.session.add(wh)
        db.session.commit()

        return jsonify({
            "message": f"Warehouse {warehouse_id} created successfully!",
            "warehouse": {
                "id": wh.id,
                "warehouse_id": wh.warehouse_id,
                "warehouse_name": wh.warehouse_name,
                "district": wh.district,
                "state": wh.state,
            },
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# ═══════════════════════════════════════════════════════════════════════════
# ROUTE — Decision Support / Reports (Module ⑪)
# ═══════════════════════════════════════════════════════════════════════════
@app.route("/reports")
@login_required
def reports_page():
    from decision_support import (
        generate_emergency_alerts,
        generate_recommendations,
        generate_relief_plan,
    )

    # Get the most critical active disaster
    active_disaster = (
        Disaster.query.filter_by(status="Active")
        .order_by(Disaster.severity.desc())
        .first()
    )

    alerts = []
    recommendations = []
    relief_plan = []

    if active_disaster:
        alerts = generate_emergency_alerts(
            {
                "severity": active_disaster.severity,
                "disaster_type": active_disaster.disaster_type,
                "district": active_disaster.district,
                "state": active_disaster.state,
                "population_affected": active_disaster.population_affected,
            }
        )

        predicted_needs = {
            "food_required": active_disaster.food_required,
            "medical_required": active_disaster.medical_required,
            "water_required": active_disaster.water_required,
            "clothing_required": active_disaster.clothing_required,
        }

        # Get latest allocation for this disaster
        latest_alloc = Allocation.query.filter_by(disaster_id=active_disaster.id).first()
        alloc_result = {
            "summary": {
                "food_deficit": 0,
                "medical_deficit": 0,
                "water_deficit": 0,
                "clothing_deficit": 0,
            }
        }

        recommendations = generate_recommendations(
            {
                "severity": active_disaster.severity,
                "disaster_type": active_disaster.disaster_type,
                "district": active_disaster.district,
            },
            predicted_needs,
            alloc_result,
        )

        relief_plan = generate_relief_plan(
            {
                "severity": active_disaster.severity,
                "population_affected": active_disaster.population_affected,
                "disaster_duration_days": active_disaster.disaster_duration_days,
            },
            predicted_needs,
        )

    return render_template(
        "reports.html",
        active_page="reports",
        alerts=alerts,
        recommendations=recommendations,
        relief_plan=relief_plan,
        active_disaster=active_disaster,
    )


# ═══════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("[INFO] Pre-loading ML models at startup...")
    get_ml_engine()
    print("[INFO] ML models pre-loaded successfully. Starting Flask development server...")
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)
