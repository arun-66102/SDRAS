"""
Database Seeder — Initialize database with CSV data and default users
======================================================================
Run: python seed_db.py
"""
import sys
import os

# Ensure the project root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
from app import create_app
from models import db, User, Warehouse, Disaster
from config import Config


def seed():
    app = create_app()

    with app.app_context():
        db.drop_all()
        db.create_all()
        print("[SEED] Database tables created.\n")

        # ── 1. Create Default Users ──────────────────────────────────────
        users = [
            {
                "username": "admin",
                "email": "admin@ndrf.gov.in",
                "password": "admin123",
                "role": "admin",
                "full_name": "System Administrator",
            },
            {
                "username": "officer",
                "email": "officer@ndrf.gov.in",
                "password": "officer123",
                "role": "officer",
                "full_name": "Disaster Officer",
            },
            {
                "username": "ngo",
                "email": "ngo@relief.org",
                "password": "ngo123",
                "role": "ngo",
                "full_name": "NGO Coordinator",
            },
        ]

        for u in users:
            user = User(
                username=u["username"],
                email=u["email"],
                role=u["role"],
                full_name=u["full_name"],
            )
            user.set_password(u["password"])
            db.session.add(user)

        db.session.commit()
        print(f"[SEED] Created {len(users)} default users:")
        for u in users:
            print(f"       • {u['username']} / {u['password']}  ({u['role']})")

        # ── 2. Load Warehouse Data ────────────────────────────────────────
        wh_df = pd.read_csv(Config.WAREHOUSE_PATH)
        for _, row in wh_df.iterrows():
            wh = Warehouse(
                warehouse_id=row["warehouse_id"],
                warehouse_name=row["warehouse_name"],
                district=row["district"],
                state=row["state"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                food_stock=int(row["food_stock"]),
                medical_stock=int(row["medical_stock"]),
                shelter_stock=int(row["shelter_stock"]),
            )
            db.session.add(wh)

        db.session.commit()
        print(f"\n[SEED] Loaded {len(wh_df)} warehouses from {Config.WAREHOUSE_PATH}")

        # ── 3. Load Sample Disasters (first 50 for demo) ─────────────────
        disaster_df = pd.read_csv(Config.DATASET_PATH)
        sample = disaster_df.head(50)
        for _, row in sample.iterrows():
            d = Disaster(
                disaster_type=row["disaster_type"],
                severity=int(row["severity"]),
                population_affected=int(row["population_affected"]),
                rainfall_mm=float(row["rainfall_mm"]),
                temperature_c=float(row["temperature_c"]),
                disaster_duration_days=int(row["disaster_duration_days"]),
                district=row["district"],
                state=row["state"],
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
                food_required=int(row["food_required"]),
                medical_required=int(row["medical_required"]),
                shelter_required=int(row["shelter_required"]),
                status="Active",
            )
            db.session.add(d)

        db.session.commit()
        print(f"[SEED] Loaded {len(sample)} sample disasters from {Config.DATASET_PATH}")

        print("\n[OK] Database seeding complete!")
        print(f"    Database: {Config.SQLALCHEMY_DATABASE_URI}")


if __name__ == "__main__":
    seed()
