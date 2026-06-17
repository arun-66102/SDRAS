"""
Decision Support System
========================
Module ⑪ in the workflow.

Provides:
  • Resource recommendations
  • Emergency alerts (severity ≥ 8)
  • Relief planning (phased timeline)
"""
from datetime import datetime, timedelta, timezone


def generate_recommendations(disaster, predicted_needs, allocation_result):
    """
    Generate resource recommendations based on disaster parameters
    and allocation results.

    Returns
    -------
    list[dict] — Each recommendation has: type, priority, message, action
    """
    recommendations = []
    severity = disaster.get("severity", 5)
    dtype = disaster.get("disaster_type", "Unknown")
    district = disaster.get("district", "Unknown")
    summary = allocation_result.get("summary", {})

    # ── Critical shortage warnings ────────────────────────────────────────
    if summary.get("food_deficit", 0) > 0:
        recommendations.append({
            "type": "shortage",
            "priority": "high",
            "icon": "package",
            "message": f"Food deficit of {summary['food_deficit']:,} units for {district}",
            "action": "Request emergency food supplies from neighbouring districts or central reserves.",
        })

    if summary.get("medical_deficit", 0) > 0:
        recommendations.append({
            "type": "shortage",
            "priority": "critical",
            "icon": "heart",
            "message": f"Medical kit deficit of {summary['medical_deficit']:,} units",
            "action": "Deploy mobile medical teams and request additional kits from NDRF HQ.",
        })

    if summary.get("water_deficit", 0) > 0:
        recommendations.append({
            "type": "shortage",
            "priority": "critical",
            "icon": "droplet",
            "message": f"Water supply deficit of {summary['water_deficit']:,} units",
            "action": "Deploy water purification units and request emergency water tankers from neighbouring districts.",
        })

    if summary.get("clothing_deficit", 0) > 0:
        recommendations.append({
            "type": "shortage",
            "priority": "high",
            "icon": "shirt",
            "message": f"Clothing deficit of {summary['clothing_deficit']:,} units",
            "action": "Request emergency clothing supplies from NGOs and central relief warehouses.",
        })

    # ── Disaster-type-specific recommendations ────────────────────────────
    type_advice = {
        "Flood": {
            "icon": "droplet",
            "message": "Deploy water rescue teams and water purification units.",
            "action": "Establish elevated relief camps; coordinate with Navy/NDRF for boat rescue.",
        },
        "Cyclone": {
            "icon": "wind",
            "message": "Ensure structural reinforcement of relief shelters.",
            "action": "Pre-position generators and communication equipment; evacuate coastal zones.",
        },
        "Earthquake": {
            "icon": "alert-circle",
            "message": "Deploy search-and-rescue teams with heavy equipment.",
            "action": "Establish triage centres; check infrastructure stability before re-entry.",
        },
        "Fire": {
            "icon": "flame",
            "message": "Prioritise burn treatment kits and fire suppression resources.",
            "action": "Set up burn treatment wards; coordinate with fire services for containment.",
        },
        "Landslide": {
            "icon": "mountain",
            "message": "Clear access roads and deploy earth-moving equipment.",
            "action": "Restrict access to unstable zones; use helicopter support for remote areas.",
        },
        "Tsunami": {
            "icon": "droplet",
            "message": "Initiate coastal evacuation and deploy desalination units.",
            "action": "Provide water purification systems; assess coastal infrastructure damage.",
        },
    }

    if dtype in type_advice:
        advice = type_advice[dtype]
        recommendations.append({
            "type": "tactical",
            "priority": "medium",
            "icon": advice["icon"],
            "message": advice["message"],
            "action": advice["action"],
        })

    # ── Severity-based escalation ─────────────────────────────────────────
    if severity >= 8:
        recommendations.append({
            "type": "escalation",
            "priority": "critical",
            "icon": "shield-alert",
            "message": f"CRITICAL: Severity {severity}/10 — Activate national-level response.",
            "action": "Notify NDMA, request military assistance, activate all NDRF battalions in region.",
        })
    elif severity >= 5:
        recommendations.append({
            "type": "escalation",
            "priority": "high",
            "icon": "alert-triangle",
            "message": f"HIGH ALERT: Severity {severity}/10 — State-level coordination required.",
            "action": "Activate SDRF, coordinate with state emergency operations centre.",
        })

    return recommendations


def generate_emergency_alerts(disaster):
    """
    Generate emergency alerts for high-severity disasters.

    Returns
    -------
    list[dict] — Alert objects with level, message, timestamp
    """
    alerts = []
    severity = disaster.get("severity", 5)
    dtype = disaster.get("disaster_type", "Unknown")
    district = disaster.get("district", "Unknown")
    state = disaster.get("state", "Unknown")
    population = disaster.get("population_affected", 0)

    now = datetime.now(timezone.utc)

    if severity >= 8:
        alerts.append({
            "level": "CRITICAL",
            "color": "#FF4444",
            "title": f"CRITICAL: {dtype} in {district}, {state}",
            "message": (
                f"Severity {severity}/10 disaster affecting {population:,} people. "
                f"Immediate national-level response required. "
                f"All available NDRF teams must be deployed."
            ),
            "timestamp": now.isoformat(),
            "actions": [
                "Activate all NDRF battalions within 500 km",
                "Request military airlift support",
                "Establish forward operating base",
                "Deploy satellite communication systems",
            ],
        })
    elif severity >= 6:
        alerts.append({
            "level": "WARNING",
            "color": "#FF8800",
            "title": f"WARNING: {dtype} in {district}, {state}",
            "message": (
                f"Severity {severity}/10 disaster affecting {population:,} people. "
                f"State-level emergency coordination activated."
            ),
            "timestamp": now.isoformat(),
            "actions": [
                "Deploy nearest SDRF teams",
                "Open emergency shelters",
                "Activate medical response teams",
            ],
        })
    elif severity >= 3:
        alerts.append({
            "level": "ADVISORY",
            "color": "#FFD700",
            "title": f"ADVISORY: {dtype} in {district}, {state}",
            "message": (
                f"Severity {severity}/10 disaster affecting {population:,} people. "
                f"District-level response initiated."
            ),
            "timestamp": now.isoformat(),
            "actions": [
                "Alert local emergency services",
                "Prepare relief materials",
            ],
        })

    return alerts


def generate_relief_plan(disaster, predicted_needs):
    """
    Generate a phased relief plan.

    Returns
    -------
    list[dict] — Phases with timeline, objectives, and resources
    """
    severity = disaster.get("severity", 5)
    population = disaster.get("population_affected", 0)
    duration = disaster.get("disaster_duration_days", 7)
    now = datetime.now(timezone.utc)

    phases = [
        {
            "phase": "Phase 1 — Immediate Response",
            "duration": "0–72 hours",
            "start": now.isoformat(),
            "end": (now + timedelta(hours=72)).isoformat(),
            "color": "#FF4444",
            "objectives": [
                "Search and rescue operations",
                "Emergency medical treatment",
                "Evacuate high-risk areas",
                "Establish communication lines",
            ],
            "resources": {
                "food": int(predicted_needs.get("food_required", 0) * 0.3),
                "medical": int(predicted_needs.get("medical_required", 0) * 0.5),
                "water": int(predicted_needs.get("water_required", 0) * 0.5),
                "clothing": int(predicted_needs.get("clothing_required", 0) * 0.3),
            },
        },
        {
            "phase": "Phase 2 — Short-term Relief",
            "duration": "3–14 days",
            "start": (now + timedelta(days=3)).isoformat(),
            "end": (now + timedelta(days=14)).isoformat(),
            "color": "#FF8800",
            "objectives": [
                "Distribute food and water supplies",
                "Set up temporary camps and distribution centres",
                "Provide ongoing medical care",
                "Restore basic infrastructure",
            ],
            "resources": {
                "food": int(predicted_needs.get("food_required", 0) * 0.5),
                "medical": int(predicted_needs.get("medical_required", 0) * 0.35),
                "water": int(predicted_needs.get("water_required", 0) * 0.35),
                "clothing": int(predicted_needs.get("clothing_required", 0) * 0.5),
            },
        },
        {
            "phase": "Phase 3 — Long-term Recovery",
            "duration": "14–90 days",
            "start": (now + timedelta(days=14)).isoformat(),
            "end": (now + timedelta(days=90)).isoformat(),
            "color": "#44BB44",
            "objectives": [
                "Rebuild permanent shelters",
                "Restore public services and utilities",
                "Psychological support and counselling",
                "Livelihood restoration programmes",
            ],
            "resources": {
                "food": int(predicted_needs.get("food_required", 0) * 0.2),
                "medical": int(predicted_needs.get("medical_required", 0) * 0.15),
                "water": int(predicted_needs.get("water_required", 0) * 0.15),
                "clothing": int(predicted_needs.get("clothing_required", 0) * 0.2),
            },
        },
    ]

    return phases
