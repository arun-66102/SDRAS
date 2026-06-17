"""
Resource Allocation Engine
===========================
Module ⑧ in the workflow.

Matches predicted resource demand with warehouse supply using:
  • Priority allocation based on disaster severity
  • Shortest distance preference (Haversine)
  • Stock validation and multi-warehouse splitting
  • Minimum threshold enforcement — reserves stock for local emergency supply
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
                             food_stock, medical_stock, water_stock, clothing_stock,
                             min_food_threshold, min_medical_threshold,
                             min_water_threshold, min_clothing_threshold
    predicted_needs : dict
        {food_required: int, medical_required: int, water_required: int, clothing_required: int}

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

    # Resource types to allocate: (key, demand_key, stock_key, threshold_key)
    resource_types = [
        ("food", "food_required", "food_stock", "min_food_threshold"),
        ("medical", "medical_required", "medical_stock", "min_medical_threshold"),
        ("water", "water_required", "water_stock", "min_water_threshold"),
        ("clothing", "clothing_required", "clothing_stock", "min_clothing_threshold"),
    ]

    # Track remaining demand
    remaining = {
        "food": predicted_needs.get("food_required", 0),
        "medical": predicted_needs.get("medical_required", 0),
        "water": predicted_needs.get("water_required", 0),
        "clothing": predicted_needs.get("clothing_required", 0),
    }

    # Track allocations per warehouse
    wh_allocations = {}  # warehouse_id -> allocation details

    for res_key, demand_key, stock_key, threshold_key in resource_types:
        if remaining[res_key] <= 0:
            continue

        for wh in sorted_warehouses:
            wh_id = wh["id"]
            total_stock = wh.get(stock_key, 0)
            threshold = wh.get(threshold_key, 0)

            # Available stock = total stock minus reserved threshold
            available = max(0, total_stock - threshold)

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
                    "water_allocated": 0,
                    "clothing_allocated": 0,
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
    total_water = sum(a["water_allocated"] for a in allocations)
    total_clothing = sum(a["clothing_allocated"] for a in allocations)

    # Determine allocation status
    food_met = total_food >= predicted_needs.get("food_required", 0)
    medical_met = total_medical >= predicted_needs.get("medical_required", 0)
    water_met = total_water >= predicted_needs.get("water_required", 0)
    clothing_met = total_clothing >= predicted_needs.get("clothing_required", 0)

    if food_met and medical_met and water_met and clothing_met:
        status = "Fully Allocated"
    elif total_food > 0 or total_medical > 0 or total_water > 0 or total_clothing > 0:
        status = "Partially Allocated"
    else:
        status = "Insufficient Stock"

    # Priority based on severity (1 = highest priority for sev 10)
    priority = max(1, 11 - disaster.get("severity", 5))

    summary = {
        "total_food_allocated": total_food,
        "total_medical_allocated": total_medical,
        "total_water_allocated": total_water,
        "total_clothing_allocated": total_clothing,
        "food_demand": predicted_needs.get("food_required", 0),
        "medical_demand": predicted_needs.get("medical_required", 0),
        "water_demand": predicted_needs.get("water_required", 0),
        "clothing_demand": predicted_needs.get("clothing_required", 0),
        "food_deficit": max(0, predicted_needs.get("food_required", 0) - total_food),
        "medical_deficit": max(0, predicted_needs.get("medical_required", 0) - total_medical),
        "water_deficit": max(0, predicted_needs.get("water_required", 0) - total_water),
        "clothing_deficit": max(0, predicted_needs.get("clothing_required", 0) - total_clothing),
        "warehouses_used": len(allocations),
        "priority": priority,
        "status": status,
    }

    return {
        "allocations": allocations,
        "summary": summary,
        "status": status,
    }
