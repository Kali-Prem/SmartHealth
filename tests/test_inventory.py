"""Tests for Medicine & Vaccine Inventory, Stock Rebalancing and Forecasting."""

from fastapi import status


def test_get_inventory_summary(client):
    """Test retrieving district inventory overview."""
    response = client.get("/api/v1/inventory/summary")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_tracked_medicines"] > 0
    assert data["total_stockouts"] >= 1
    assert "stock_by_category" in data
    assert "urgent_alerts" in data


def test_list_stock_items_filters(client):
    """Test filtering stock items by category and status."""
    response = client.get("/api/v1/inventory/items?category=anti_venom")
    assert response.status_code == status.HTTP_200_OK
    items = response.json()
    assert len(items) >= 2
    for item in items:
        assert item["category"] == "anti_venom"


def test_stock_status_computation(client):
    """Test that zero stock correctly computes as stockout status."""
    response = client.get("/api/v1/inventory/items?status_filter=stockout")
    assert response.status_code == status.HTTP_200_OK
    items = response.json()
    assert len(items) >= 1
    assert items[0]["current_stock"] == 0
    assert items[0]["stock_status"] == "stockout"


def test_rebalancing_options_query(client):
    """Test finding candidate surplus donor centres for an antivenom shortage."""
    response = client.get(
        "/api/v1/inventory/rebalance-options?target_centre_id=phc_003&drug_name=Polyvalent Snake Antivenom"
    )
    assert response.status_code == status.HTTP_200_OK
    options = response.json()
    assert len(options) >= 1
    # Uruli Kanchan CHC has 65 vials (surplus)
    assert options[0]["recommended_transfer_quantity"] > 0


def test_create_and_complete_stock_transfer(client):
    """Test initiating and completing an inter-facility stock transfer."""
    transfer_payload = {
        "source_centre_id": "chc_002",
        "target_centre_id": "phc_003",
        "drug_name": "Polyvalent Snake Antivenom",
        "quantity": 15,
        "reason": "Emergency tribal stockout replenishment",
    }
    response = client.post("/api/v1/inventory/transfer", json=transfer_payload)
    assert response.status_code == status.HTTP_200_OK
    transfer = response.json()
    transfer_id = transfer["id"]
    assert transfer["status"] == "pending"

    # Complete the transfer
    complete_res = client.patch(f"/api/v1/inventory/transfer/{transfer_id}?new_status=completed")
    assert complete_res.status_code == status.HTTP_200_OK
    assert complete_res.json()["status"] == "completed"

    # Verify inventory at target was increased
    items = client.get("/api/v1/inventory/items?centre_id=phc_003&category=anti_venom").json()
    assert items[0]["current_stock"] == 15


def test_demand_forecast(client):
    """Test AI demand forecasting with seasonal multipliers."""
    response = client.get("/api/v1/inventory/forecast")
    assert response.status_code == status.HTTP_200_OK
    forecasts = response.json()
    assert len(forecasts) > 0
    antivenom = next((f for f in forecasts if "Antivenom" in f["drug_name"]), None)
    assert antivenom is not None
    assert antivenom["predicted_monthly_consumption"] > 0
    assert antivenom["risk_level"] in ["high", "medium", "safe"]
    assert len(antivenom["rationale"]) > 10


def test_inventory_schema_compatibility_with_frontend(client):
    """Regression test: verify inventory response contains frontend-compatible aliases and centre metadata."""
    response = client.get("/api/v1/inventory")
    assert response.status_code == status.HTTP_200_OK
    items = response.json()
    assert len(items) > 0

    first_item = items[0]
    # Primary schema fields
    assert "drug_name" in first_item
    assert "minimum_reorder_level" in first_item
    assert "stock_status" in first_item
    assert "days_of_stock_remaining" in first_item

    # Frontend-compatible aliases that prevent undefined runtime crashes
    assert "item_name" in first_item
    assert first_item["item_name"] == first_item["drug_name"]
    assert "item_name_hi" in first_item
    assert first_item["item_name_hi"] == first_item["drug_name_hi"]
    assert "reorder_level" in first_item
    assert first_item["reorder_level"] == first_item["minimum_reorder_level"]
    assert "status" in first_item
    assert first_item["status"] == first_item["stock_status"]
    assert "days_of_supply_remaining" in first_item
    assert first_item["days_of_supply_remaining"] == first_item["days_of_stock_remaining"]

    # Centre enrichment
    assert "centre_name" in first_item
    assert first_item["centre_name"] is not None
    assert "block" in first_item
    assert first_item["block"] is not None
