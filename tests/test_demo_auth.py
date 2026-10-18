"""Pytest suite for Demo Login, Role-Based Access Control, and Demo Mode Safety."""

from fastapi import status


def test_demo_status_endpoint(client):
    """Test demo status endpoint returns demo credentials and role configs."""
    response = client.get("/api/v1/auth/demo-status")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["enable_demo_login"] is True
    assert len(data["roles"]) == 3
    roles = {r["role"]: r for r in data["roles"]}
    assert "health_worker" in roles
    assert "district_admin" in roles
    assert "state_viewer" in roles
    assert roles["health_worker"]["email"] == "worker@smarthealth.demo"
    assert roles["district_admin"]["email"] == "admin@smarthealth.demo"
    assert roles["state_viewer"]["email"] == "state@smarthealth.demo"


def test_health_worker_demo_login(client):
    """Test Health Worker demo login returns valid token, assigned centre and proper role."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "worker@smarthealth.demo", "password": "Demo@1234"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "health_worker"
    assert data["centre_id"] == "phc_003"
    assert "access_token" in data

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /auth/me
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.json()["role"] == "health_worker"
    assert me_resp.json()["centre_id"] == "phc_003"

    # Verify Health Worker cannot access admin endpoints
    forbidden_register = client.post(
        "/api/v1/auth/register",
        json={"username": "fake_user", "password": "pwd", "role": "district_admin"},
        headers=headers,
    )
    assert forbidden_register.status_code == status.HTTP_403_FORBIDDEN

    # Verify Health Worker cannot execute lateral rebalance
    forbidden_rebalance = client.post(
        "/api/v1/inventory/rebalance/execute",
        json={
            "source_centre_id": "phc_001",
            "target_centre_id": "phc_003",
            "drug_name": "Paracetamol 500mg",
            "quantity": 100,
        },
        headers=headers,
    )
    assert forbidden_rebalance.status_code == status.HTTP_403_FORBIDDEN

    # Verify Health Worker cannot execute doctor deputation
    forbidden_deputation = client.post(
        "/api/v1/operations/deputation/execute",
        json={
            "target_centre_id": "phc_003",
            "donor_centre_id": "phc_001",
            "doctor_id": "doc_001",
            "doctor_name": "Dr. Ramesh",
            "date": "2026-10-18",
        },
        headers=headers,
    )
    assert forbidden_deputation.status_code == status.HTTP_403_FORBIDDEN


def test_district_admin_demo_login(client):
    """Test District Admin demo login returns valid token with administrative permissions."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin@smarthealth.demo", "password": "Demo@1234"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "district_admin"
    assert "access_token" in data

    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.json()["role"] == "district_admin"


def test_state_viewer_demo_login_and_read_only_restriction(client):
    """Test State Viewer demo login can view state data but is strictly blocked from writes."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "state@smarthealth.demo", "password": "Demo@1234"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "state_viewer"
    assert "access_token" in data

    headers = {"Authorization": f"Bearer {data['access_token']}"}

    # Allowed read endpoints
    summary_resp = client.get("/api/v1/inventory/summary", headers=headers)
    assert summary_resp.status_code == status.HTTP_200_OK

    ops_resp = client.get("/api/v1/operations/summary", headers=headers)
    assert ops_resp.status_code == status.HTTP_200_OK

    # Forbidden write endpoints
    footfall_resp = client.post(
        "/api/v1/operations/footfall",
        json={
            "centre_id": "phc_001",
            "date": "2026-10-18",
            "total_opd_visits": 50,
            "emergency_visits": 5,
            "maternal_child_visits": 10,
            "ncd_visits": 5,
            "average_wait_time_minutes": 20,
        },
        headers=headers,
    )
    assert footfall_resp.status_code == status.HTTP_403_FORBIDDEN
    assert "Read-Only" in footfall_resp.json()["detail"]

    attendance_resp = client.post(
        "/api/v1/operations/attendance",
        json={
            "centre_id": "phc_001",
            "date": "2026-10-18",
            "doctors": [
                {
                    "doctor_id": "doc_001",
                    "name": "Dr. Anita",
                    "status": "present",
                    "shift": "morning",
                }
            ],
        },
        headers=headers,
    )
    assert attendance_resp.status_code == status.HTTP_403_FORBIDDEN
    assert "Read-Only" in attendance_resp.json()["detail"]

    tests_resp = client.post(
        "/api/v1/operations/tests",
        json={
            "centre_id": "phc_001",
            "audit_date": "2026-10-18",
            "tests": [
                {
                    "test_name": "Rapid Malaria Antigen",
                    "status": "available",
                    "kits_remaining": 40,
                }
            ],
        },
        headers=headers,
    )
    assert tests_resp.status_code == status.HTTP_403_FORBIDDEN
    assert "Read-Only" in tests_resp.json()["detail"]

    syndromic_resp = client.post(
        "/api/v1/surveillance/report",
        json={
            "centre_id": "phc_001",
            "disease": "acute_diarrheal",
            "new_cases": 15,
            "reporting_date": "2026-10-18",
        },
        headers=headers,
    )
    assert syndromic_resp.status_code == status.HTTP_403_FORBIDDEN
    assert "Read-Only" in syndromic_resp.json()["detail"]

    # Blocked from lateral rebalance execution
    rebalance_resp = client.post(
        "/api/v1/inventory/rebalance/execute",
        json={
            "source_centre_id": "phc_001",
            "target_centre_id": "phc_002",
            "drug_name": "Paracetamol 500mg",
            "quantity": 50,
        },
        headers=headers,
    )
    assert rebalance_resp.status_code == status.HTTP_403_FORBIDDEN


def test_login_rate_limiting(client):
    """Test brute-force rate limiter blocks requests exceeding threshold."""
    status_codes = []
    for _ in range(45):
        resp = client.post(
            "/api/v1/auth/login",
            json={"username": "fake_attempt@smarthealth.demo", "password": "WrongPassword"},
        )
        status_codes.append(resp.status_code)

    assert status.HTTP_429_TOO_MANY_REQUESTS in status_codes


def test_demo_mode_disabled(client, monkeypatch):
    """Test when enable_demo_login is False, demo-status returns empty role list."""
    from backend.app.config import Settings, get_settings
    from backend.app.main import app

    disabled_settings = Settings(enable_demo_login=False)
    app.dependency_overrides[get_settings] = lambda: disabled_settings
    try:
        resp = client.get("/api/v1/auth/demo-status")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["enable_demo_login"] is False
        assert data["roles"] == []
    finally:
        app.dependency_overrides.pop(get_settings, None)
