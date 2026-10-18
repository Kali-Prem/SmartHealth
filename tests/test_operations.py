"""Tests for Operations Service and API Endpoints (Footfall, Attendance, Test Audits, Underperformance)."""

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.models.operations import (
    AttendanceStatus,
    DoctorAttendanceCreate,
    DoctorAttendanceEntry,
    FootfallLogCreate,
    LabTestAuditCreate,
    LabTestEntry,
    TestStatus,
)
from backend.app.security import create_access_token
from backend.app.services.operations_service import get_operations_service


@pytest.fixture
def auth_headers():
    token = create_access_token(
        data={"sub": "admin_user", "role": "district_admin", "centre_id": None}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_operations_summary():
    service = get_operations_service()
    summary = await service.get_operations_summary()

    assert summary.total_daily_opd_footfall > 0
    assert summary.district_doctor_attendance_percent > 0
    assert summary.total_beds_available > 0
    assert summary.district_bed_occupancy_percent >= 0
    assert isinstance(summary.underperforming_centres_count, int)


@pytest.mark.asyncio
async def test_planted_problems_detection():
    service = get_operations_service()

    # Planted problem 1: 3 centres with chronic stockouts (e.g. phc_003)
    vuln_phc003 = await service.calculate_facility_vulnerability("phc_003")
    assert vuln_phc003 is not None
    assert vuln_phc003.stockout_rate >= 30.0

    # Planted problem 2: 2 centres with high doctor absence (e.g. phc_005, phc_006)
    vuln_phc005 = await service.calculate_facility_vulnerability("phc_005")
    assert vuln_phc005 is not None
    assert vuln_phc005.doctor_absence_rate >= 40.0

    # Planted problem 3: 1 overloaded centre (phc_001)
    vuln_phc001 = await service.calculate_facility_vulnerability("phc_001")
    assert vuln_phc001 is not None

    # List underperforming centres
    flagged = await service.get_underperforming_centres()
    flagged_ids = [c.centre_id for c in flagged]
    assert len(flagged_ids) >= 1
    assert "phc_003" in flagged_ids or "phc_005" in flagged_ids or "phc_001" in flagged_ids


@pytest.mark.asyncio
async def test_operations_api_endpoints(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/v1/operations/summary
        res = await client.get("/api/v1/operations/summary")
        assert res.status_code == 200
        data = res.json()
        assert "total_daily_opd_footfall" in data
        assert "district_doctor_attendance_percent" in data

        # GET /api/v1/operations/underperforming
        res = await client.get("/api/v1/operations/underperforming")
        assert res.status_code == 200
        flagged = res.json()
        assert len(flagged) >= 1

        # GET /api/v1/operations/vulnerability/{centre_id}
        res = await client.get("/api/v1/operations/vulnerability/phc_001")
        assert res.status_code == 200
        assert res.json()["centre_id"] == "phc_001"

        # GET /api/v1/operations/footfall/{centre_id}
        res = await client.get("/api/v1/operations/footfall/phc_001?limit=7")
        assert res.status_code == 200
        assert len(res.json()) > 0

        # POST /api/v1/operations/footfall
        new_footfall = {
            "centre_id": "phc_001",
            "date": "2026-10-18",
            "total_opd_visits": 110,
            "emergency_visits": 12,
            "maternal_child_visits": 25,
            "ncd_visits": 20,
            "average_wait_time_minutes": 35,
        }
        res = await client.post(
            "/api/v1/operations/footfall", json=new_footfall, headers=auth_headers
        )
        assert res.status_code == 200
        assert res.json()["total_opd_visits"] == 110

        # GET /api/v1/operations/attendance/{centre_id}
        res = await client.get("/api/v1/operations/attendance/phc_005")
        assert res.status_code == 200
        assert res.json()["centre_id"] == "phc_005"

        # POST /api/v1/operations/attendance
        new_att = {
            "centre_id": "phc_005",
            "date": "2026-10-18",
            "doctors": [
                {
                    "doctor_id": "doc_01",
                    "name": "Dr. Patil",
                    "designation": "Medical Officer",
                    "shift": "morning",
                    "status": "present",
                }
            ],
        }
        res = await client.post("/api/v1/operations/attendance", json=new_att, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["doctors_present_today"] == 1

        # GET /api/v1/operations/tests/{centre_id}
        res = await client.get("/api/v1/operations/tests/phc_001")
        assert res.status_code == 200
        assert res.json()["centre_id"] == "phc_001"

        # POST /api/v1/operations/tests
        new_audit = {
            "centre_id": "phc_001",
            "audit_date": "2026-10-18",
            "tests": [
                {
                    "test_name": "Blood Glucose (RBS)",
                    "category": "biochemistry",
                    "status": "available",
                    "equipment_functional": True,
                    "kits_remaining": 80,
                }
            ],
        }
        res = await client.post("/api/v1/operations/tests", json=new_audit, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["available_tests"] == 1


@pytest.mark.asyncio
async def test_operations_404_handling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Non-existent centre for vulnerability
        res = await client.get("/api/v1/operations/vulnerability/non_existent_id")
        assert res.status_code == 404

        # Non-existent centre for attendance
        res = await client.get("/api/v1/operations/attendance/non_existent_id")
        assert res.status_code == 404

        # Non-existent centre for test audit
        res = await client.get("/api/v1/operations/tests/non_existent_id")
        assert res.status_code == 404
