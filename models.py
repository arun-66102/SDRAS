"""
SQLAlchemy Models for Smart Disaster Resource Allocation System
================================================================
Tables: User, Disaster, Warehouse, Allocation
"""
from datetime import datetime, timezone

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


# ─────────────────────────────────────────────────────────────────────────────
# USER MODEL
# ─────────────────────────────────────────────────────────────────────────────
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(30), nullable=False, default="officer")
    # Roles: admin, officer, ngo
    full_name = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


# ─────────────────────────────────────────────────────────────────────────────
# DISASTER MODEL
# ─────────────────────────────────────────────────────────────────────────────
class Disaster(db.Model):
    __tablename__ = "disasters"

    id = db.Column(db.Integer, primary_key=True)
    disaster_type = db.Column(db.String(30), nullable=False, index=True)
    severity = db.Column(db.Integer, nullable=False)
    population_affected = db.Column(db.Integer, nullable=False)
    rainfall_mm = db.Column(db.Float, nullable=False)
    temperature_c = db.Column(db.Float, nullable=False)
    disaster_duration_days = db.Column(db.Integer, nullable=False)
    district = db.Column(db.String(80), nullable=False, index=True)
    state = db.Column(db.String(80), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    # Predicted resource requirements
    food_required = db.Column(db.Integer, default=0)
    medical_required = db.Column(db.Integer, default=0)
    shelter_required = db.Column(db.Integer, default=0)

    # Metadata
    status = db.Column(db.String(30), default="Active")
    # Status: Active, Resolved, Archived
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # Relationships
    allocations = db.relationship("Allocation", backref="disaster", lazy=True)

    def __repr__(self):
        return f"<Disaster {self.id}: {self.disaster_type} @ {self.district}>"


# ─────────────────────────────────────────────────────────────────────────────
# WAREHOUSE MODEL
# ─────────────────────────────────────────────────────────────────────────────
class Warehouse(db.Model):
    __tablename__ = "warehouses"

    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.String(10), unique=True, nullable=False, index=True)
    warehouse_name = db.Column(db.String(200), nullable=False)
    district = db.Column(db.String(80), nullable=False)
    state = db.Column(db.String(80), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    # Current stock levels
    food_stock = db.Column(db.Integer, default=0)
    medical_stock = db.Column(db.Integer, default=0)
    shelter_stock = db.Column(db.Integer, default=0)

    # Relationships
    allocations = db.relationship("Allocation", backref="warehouse", lazy=True)

    def __repr__(self):
        return f"<Warehouse {self.warehouse_id}: {self.warehouse_name}>"


# ─────────────────────────────────────────────────────────────────────────────
# ALLOCATION MODEL
# ─────────────────────────────────────────────────────────────────────────────
class Allocation(db.Model):
    __tablename__ = "allocations"

    id = db.Column(db.Integer, primary_key=True)
    disaster_id = db.Column(db.Integer, db.ForeignKey("disasters.id"), nullable=False, index=True)
    warehouse_pk = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=False, index=True)

    # Allocated quantities
    food_allocated = db.Column(db.Integer, default=0)
    medical_allocated = db.Column(db.Integer, default=0)
    shelter_allocated = db.Column(db.Integer, default=0)

    # Distance from disaster to warehouse (km)
    distance_km = db.Column(db.Float, default=0.0)

    # Status: Pending, Allocated, Dispatched, Delivered
    status = db.Column(db.String(30), default="Pending")
    priority = db.Column(db.Integer, default=5)  # 1=highest, 10=lowest

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<Allocation {self.id}: Disaster#{self.disaster_id} ← WH#{self.warehouse_pk}>"
