"""Tests for Health Centre Directory, filtering, pagination and updating."""

from fastapi import status


def test_list_centres_default(client):
    """Test listing centres with default pagination."""
    response = client.get("/api/v1/centres")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "items" in data
    assert data["total"] >= 6
    assert data["page"] == 1
    assert "stats_summary" in data


def test_list_centres_filter_by_block(client):
    """Test filtering centres by block."""
    response = client.get("/api/v1/centres?block=Haveli")
    assert response.status_code == status.HTTP_200_OK
    items = response.json()["items"]
    assert len(items) >= 2
    for item in items:
        assert item["block"] == "Haveli"


def test_list_centres_filter_by_status(client):
    """Test filtering centres by operational status."""
    response = client.get("/api/v1/centres?status=critical")
    assert response.status_code == status.HTTP_200_OK
    items = response.json()["items"]
    for item in items:
        assert item["operational_status"] == "critical"


def test_get_single_centre(client):
    """Test getting single centre by ID."""
    response = client.get("/api/v1/centres/phc_001")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == "phc_001"
    assert "Wagholi" in data["name"]
    assert "वाघोली" in data["name_hi"]
    assert "active_alerts_count" in data


def test_get_nonexistent_centre(client):
    """Test 404 for unknown centre ID."""
    response = client.get("/api/v1/centres/phc_unknown_999")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_centre_admin(client, admin_headers):
    """Test creating a new centre as district admin."""
    new_centre = {
        "name": "Manchar Primary Health Centre",
        "name_hi": "मंचर प्राथमिक स्वास्थ्य केंद्र",
        "facility_type": "PHC",
        "district": "Pune",
        "block": "Ambegaon (Tribal)",
        "pincode": "410503",
        "latitude": 19.0123,
        "longitude": 73.9456,
        "catchment_population": 29000,
        "in_charge_doctor": "Dr. Ramesh Kale, MBBS",
        "phone_number": "+91 2133 223344",
        "operational_status": "normal",
    }
    response = client.post("/api/v1/centres", json=new_centre, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "Manchar" in data["name"]


def test_update_centre_by_assigned_staff(client, staff_headers):
    """Test staff updating their own assigned centre."""
    update_payload = {"phone_number": "+91 20 9999 8888"}
    response = client.put("/api/v1/centres/phc_001", json=update_payload, headers=staff_headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["phone_number"] == "+91 20 9999 8888"


def test_update_centre_forbidden_other_facility(client, staff_headers):
    """Test staff attempting to update a centre they are NOT assigned to returns 403."""
    update_payload = {"phone_number": "+91 20 9999 8888"}
    # Staff is assigned to phc_001, attempts to update phc_003
    response = client.put("/api/v1/centres/phc_003", json=update_payload, headers=staff_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
