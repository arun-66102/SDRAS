"""
Geolocation & Distance Calculation Module
==========================================
Implements the Haversine formula to compute great-circle distances
between disaster locations and warehouse coordinates.

Module ⑦ in the workflow.
"""
import math


# ─────────────────────────────────────────────────────────────────────────────
# HAVERSINE FORMULA
# ─────────────────────────────────────────────────────────────────────────────
EARTH_RADIUS_KM = 6371.0


def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points
    on Earth using the Haversine formula.

    Parameters
    ----------
    lat1, lon1 : float — Latitude/Longitude of point 1 (degrees)
    lat2, lon2 : float — Latitude/Longitude of point 2 (degrees)

    Returns
    -------
    float — Distance in kilometres
    """
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


# ─────────────────────────────────────────────────────────────────────────────
# NEAREST WAREHOUSE FINDER
# ─────────────────────────────────────────────────────────────────────────────
def find_nearest_warehouses(disaster_lat, disaster_lon, warehouses, n=5):
    """
    Find the N nearest warehouses to a disaster location.

    Parameters
    ----------
    disaster_lat : float — Disaster latitude
    disaster_lon : float — Disaster longitude
    warehouses   : list[dict] — Each dict must have 'id', 'latitude', 'longitude'
                   plus stock fields
    n            : int  — Number of nearest warehouses to return

    Returns
    -------
    list[dict] — Sorted by distance (nearest first), each entry augmented
                 with 'distance_km'
    """
    results = []
    for wh in warehouses:
        dist = haversine(disaster_lat, disaster_lon, wh["latitude"], wh["longitude"])
        entry = dict(wh)
        entry["distance_km"] = round(dist, 2)
        results.append(entry)

    results.sort(key=lambda x: x["distance_km"])
    return results[:n]


def compute_distance_matrix(disaster_lat, disaster_lon, warehouses):
    """
    Compute distance from the disaster location to every warehouse.

    Returns
    -------
    list[dict] — All warehouses with 'distance_km' field, sorted by distance.
    """
    return find_nearest_warehouses(
        disaster_lat, disaster_lon, warehouses, n=len(warehouses)
    )
