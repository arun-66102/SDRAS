"""
Resource Allocation Engine
===========================
Module ⑧ in the workflow.

Matches predicted resource demand with warehouse supply using:
  • Priority allocation based on disaster severity
  • Shortest distance preference (Haversine)
  • Stock validation and multi-warehouse splitting
"""
from geo_utils import find_nearest_warehouses


def allocate_resources(disaster, warehouses_list, predicted_needs):
    """
    Allocate resources from nearest warehouses to meet predicted demand.

    Parameters
    ----------
    disaster : dict
        Must include: latitude, longitude, severity, id
    warehouses_list : list[dict]
        Each warehouse dict: id, warehouse_id, latitude, longitude,
                             food_stock, medical_stock, shelter_stock
    predicted_needs : dict
        {food_required: int, medical_required: int, shelter_required: int}

    Returns
    -------
    dict with keys:
        allocations   : list[dict] — per-warehouse allocation details
        summary       : dict       — overall allocation summary
        status        : str        — Fully Allocated | Partially Allocated | Insufficient Stock
    """
    # Find nearest warehouses (all of them, sorted by distance)
    sorted_warehouses = find_nearest_warehouses(
        disaster["latitude"],
        disaster["longitude"],
        warehouses_list,
        n=len(warehouses_list),
    )

    # Resource types to allocate
    resource_types = [
        ("food", "food_required", "food_stock"),
        ("medical", "medical_required", "medical_stock"),
        ("shelter", "shelter_required", "shelter_stock"),
    ]

    # Track remaining demand
    remaining = {
        "food": predicted_needs.get("food_required", 0),
        "medical": predicted_needs.get("medical_required", 0),
        "shelter": predicted_needs.get("shelter_required", 0),
    }

    # Track allocations per warehouse
    wh_allocations = {}  # warehouse_id -> allocation details

    for res_key, demand_key, stock_key in resource_types:
        if remaining[res_key] <= 0:
            continue

        for wh in sorted_warehouses:
            wh_id = wh["id"]
            available = wh.get(stock_key, 0)

            if available <= 0:
                continue

            # Determine allocation amount
            allocate_amount = min(remaining[res_key], available)

            # Create or update warehouse allocation entry
            if wh_id not in wh_allocations:
                wh_allocations[wh_id] = {
                    "warehouse_id": wh.get("warehouse_id", wh_id),
                    "warehouse_pk": wh_id,
                    "warehouse_name": wh.get("warehouse_name", ""),
                    "distance_km": wh.get("distance_km", 0),
                    "food_allocated": 0,
                    "medical_allocated": 0,
                    "shelter_allocated": 0,
                }

            alloc_key = f"{res_key}_allocated"
            wh_allocations[wh_id][alloc_key] += allocate_amount

            # Deduct from warehouse stock (in-memory)
            wh[stock_key] -= allocate_amount
            remaining[res_key] -= allocate_amount

            if remaining[res_key] <= 0:
                break

    # Build allocations list
    allocations = list(wh_allocations.values())

    # Calculate totals
    total_food = sum(a["food_allocated"] for a in allocations)
    total_medical = sum(a["medical_allocated"] for a in allocations)
    total_shelter = sum(a["shelter_allocated"] for a in allocations)

    # Determine allocation status
    food_met = total_food >= predicted_needs.get("food_required", 0)
    medical_met = total_medical >= predicted_needs.get("medical_required", 0)
    shelter_met = total_shelter >= predicted_needs.get("shelter_required", 0)

    if food_met and medical_met and shelter_met:
        status = "Fully Allocated"
    elif total_food > 0 or total_medical > 0 or total_shelter > 0:
        status = "Partially Allocated"
    else:
        status = "Insufficient Stock"

    # Priority based on severity (1 = highest priority for sev 10)
    priority = max(1, 11 - disaster.get("severity", 5))

    summary = {
        "total_food_allocated": total_food,
        "total_medical_allocated": total_medical,
        "total_shelter_allocated": total_shelter,
        "food_demand": predicted_needs.get("food_required", 0),
        "medical_demand": predicted_needs.get("medical_required", 0),
        "shelter_demand": predicted_needs.get("shelter_required", 0),
        "food_deficit": max(0, predicted_needs.get("food_required", 0) - total_food),
        "medical_deficit": max(0, predicted_needs.get("medical_required", 0) - total_medical),
        "shelter_deficit": max(0, predicted_needs.get("shelter_required", 0) - total_shelter),
        "warehouses_used": len(allocations),
        "priority": priority,
        "status": status,
    }

    return {
        "allocations": allocations,
        "summary": summary,
        "status": status,
    }
