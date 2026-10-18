"""Unit and integration tests for Haversine Lateral Redistribution & Gemini Clinical Justification."""

import pytest
from fastapi import status

from backend.app.models.inventory import ExecuteRebalanceRequest
from backend.app.services.inventory_service import haversine_distance_km


def test_haversine_distance_identical_coordinates():
    """Haversine distance between the exact same coordinates must be 0.0 km."""
    dist = haversine_distance_km(18.5204, 73.8567, 18.5204, 73.8567)
    assert dist == 0.0


def test_haversine_distance_known_distance_and_symmetry():
    """Haversine distance calculation matches expected geographic range and is strictly symmetric."""
    # Pune (18.5204, 73.8567) to Mumbai Gateway of India (18.9220, 72.8347)
    pune_lat, pune_lon = 18.5204, 73.8567
    mumbai_lat, mumbai_lon = 18.9220, 72.8347

    dist_pune_mumbai = haversine_distance_km(pune_lat, pune_lon, mumbai_lat, mumbai_lon)
    dist_mumbai_pune = haversine_distance_km(mumbai_lat, mumbai_lon, pune_lat, pune_lon)

    # Great-circle distance Pune to Mumbai is ~118-122 km
    assert 115.0 < dist_pune_mumbai < 125.0
    assert dist_pune_mumbai == dist_mumbai_pune


def test_optimize_lateral_rebalance_antivenom(client):
    """Test Haversine redistribution ranking and Gemini justification for acute antivenom stockout."""
    payload = {
        "target_centre_id": "phc_003",  # Velhe PHC (Chronic antivenom shortage)
        "drug_name": "Polyvalent Snake Antivenom",
        "language": "en",
    }
    response = client.post("/api/v1/inventory/rebalance/optimize", json=payload)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["target_centre_id"] == "phc_003"
    assert data["distance_algorithm"] == "Haversine (Great-Circle)"
    assert data["deficit_quantity"] > 0
    assert len(data["candidates"]) >= 1

    # Verify candidates are sorted by distance ascending
    distances = [c["distance_km"] for c in data["candidates"]]
    assert distances == sorted(distances)

    top_donor = data["top_donor"]
    assert top_donor is not None
    assert top_donor["donor_centre_id"] == data["candidates"][0]["donor_centre_id"]
    assert top_donor["distance_km"] == distances[0]
    assert top_donor["recommended_transfer_quantity"] > 0

    # Donor safety reserve guarantee: retained stock must be >= reorder_level
    assert top_donor["donor_remaining_stock"] >= top_donor["reorder_level"]

    # Gemini explanation must be present in both English and Hindi
    assert len(data["gemini_explanation"]) > 20
    assert len(data["gemini_explanation_hi"]) > 20
    assert "Polyvalent Snake Antivenom" in data["gemini_explanation"]


def test_optimize_rebalance_target_not_found(client):
    """Optimizing for an invalid health centre returns 404."""
    payload = {
        "target_centre_id": "non_existent_phc_999",
        "drug_name": "Paracetamol 500mg",
        "language": "en",
    }
    response = client.post("/api/v1/inventory/rebalance/optimize", json=payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_optimize_rebalance_no_donor_surplus(client):
    """When a drug has no surplus across any district centre, returns empty candidates with alert."""
    payload = {
        "target_centre_id": "phc_001",
        "drug_name": "RareExperimentalDrugNotFound123",
        "language": "en",
    }
    response = client.post("/api/v1/inventory/rebalance/optimize", json=payload)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["candidates"] == []
    assert data["top_donor"] is None
    assert (
        "warehouse" in data["gemini_explanation"].lower()
        or "no surplus" in data["gemini_explanation"].lower()
    )


def test_execute_lateral_rebalance_success(client):
    """Test executing a valid peer stock transfer atomically updates source and target inventories."""
    # First inspect current stock of target and donor
    items_res = client.get("/api/v1/inventory/items?category=anti_venom")
    assert items_res.status_code == status.HTTP_200_OK
    items = items_res.json()

    # Find donor (e.g. chc_002) and target (phc_003)
    target_item = next(
        (i for i in items if i["centre_id"] == "phc_003" and "Antivenom" in i["drug_name"]), None
    )
    donor_item = next(
        (i for i in items if i["centre_id"] == "chc_002" and "Antivenom" in i["drug_name"]), None
    )

    assert target_item is not None
    assert donor_item is not None

    initial_target_stock = target_item["current_stock"]
    initial_donor_stock = donor_item["current_stock"]
    transfer_qty = 10

    execute_payload = {
        "source_centre_id": "chc_002",
        "target_centre_id": "phc_003",
        "drug_name": "Polyvalent Snake Antivenom",
        "quantity": transfer_qty,
        "reason": "Milestone 2 Haversine peer lateral dispatch",
    }
    res = client.post("/api/v1/inventory/rebalance/execute", json=execute_payload)
    assert res.status_code == status.HTTP_200_OK

    result = res.json()
    assert result["status"] == "completed"
    assert result["quantity_transferred"] == transfer_qty
    assert result["source_new_stock"] == initial_donor_stock - transfer_qty
    assert result["target_new_stock"] == initial_target_stock + transfer_qty
    assert "transfer_id" in result


def test_execute_lateral_rebalance_insufficient_stock(client):
    """Executing a transfer with quantity exceeding donor stock returns 400 Bad Request."""
    execute_payload = {
        "source_centre_id": "chc_002",
        "target_centre_id": "phc_003",
        "drug_name": "Polyvalent Snake Antivenom",
        "quantity": 99999,  # Unrealistic quantity
        "reason": "Excessive transfer attempt",
    }
    res = client.post("/api/v1/inventory/rebalance/execute", json=execute_payload)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "insufficient" in res.json()["detail"].lower()


def test_execute_lateral_rebalance_invalid_drug(client):
    """Executing transfer for a non-existent medicine at donor returns 400 Bad Request."""
    execute_payload = {
        "source_centre_id": "chc_002",
        "target_centre_id": "phc_003",
        "drug_name": "NonExistentMedicineX",
        "quantity": 5,
        "reason": "Invalid drug test",
    }
    res = client.post("/api/v1/inventory/rebalance/execute", json=execute_payload)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
