"""Unit tests for SmartHealth Firestore repositories."""

import pytest

from backend.app.models.centre import CentreCreate, FacilityType
from backend.app.models.operations import (
    AttendanceStatus,
    BedStatus,
    DoctorAttendanceCreate,
    DoctorAttendanceEntry,
    FootfallLogCreate,
    LabTestAuditCreate,
    LabTestEntry,
    TestStatus,
)
from backend.app.repositories.attendance_repository import DoctorAttendanceRepository
from backend.app.repositories.bed_repository import BedStatusRepository
from backend.app.repositories.centre_repository import CentreRepository
from backend.app.repositories.footfall_repository import DailyFootfallRepository
from backend.app.repositories.stock_repository import MedicineStockRepository
from backend.app.repositories.test_repository import TestAvailabilityRepository


@pytest.mark.asyncio
async def test_centre_repository():
    repo = CentreRepository()
    centre = await repo.get_centre("phc_001")
    assert centre is not None
    assert centre.id == "phc_001"
    assert centre.facility_type == FacilityType.PHC

    # Test filtering by block
    haveli_centres = await repo.list_centres(block="Haveli")
    assert len(haveli_centres) > 0
    assert all(c.block == "Haveli" for c in haveli_centres)

    # Test filtering by facility type
    chcs = await repo.list_centres(facility_type=FacilityType.CHC)
    assert len(chcs) == 4

    # Test save centre
    new_centre = CentreCreate(
        name="Test New PHC",
        name_hi="टेस्ट नवीन प्रा.आ.के.",
        facility_type=FacilityType.PHC,
        block="Haveli",
        district="Pune",
        state="Maharashtra",
        latitude=18.52,
        longitude=73.85,
        in_charge_doctor="Dr. Test Medical Officer",
        contact_phone="+91-9876543210",
        pincode="412207",
    )
    saved = await repo.save_centre("phc_test_999", new_centre)
    assert saved.id == "phc_test_999"
    assert saved.name == "Test New PHC"

    # Verify retrieval
    retrieved = await repo.get_centre("phc_test_999")
    assert retrieved is not None
    assert retrieved.name == "Test New PHC"


@pytest.mark.asyncio
async def test_stock_repository():
    repo = MedicineStockRepository()
    # List stock for phc_003 (planted problem: chronic stockouts)
    stock = await repo.list_stock_by_centre("phc_003")
    assert len(stock) > 0

    # Critical stockouts
    stockouts = await repo.list_critical_stockouts()
    assert len(stockouts) > 0

    # Get single item
    item_id = stock[0].id
    item = await repo.get_stock_item(item_id)
    assert item is not None
    assert item.id == item_id

    # Update stock quantity
    updated = await repo.update_stock_quantity(item_id, 150)
    assert updated is not None
    assert updated.current_stock == 150

    # Non-existent item
    missing = await repo.get_stock_item("non_existent_item")
    assert missing is None


@pytest.mark.asyncio
async def test_footfall_repository():
    repo = DailyFootfallRepository()
    history = await repo.list_history(centre_id="phc_001", limit=10)
    assert len(history) > 0

    # Record daily footfall
    record = FootfallLogCreate(
        centre_id="phc_001",
        date="2026-10-18",
        total_opd_visits=80,
        emergency_visits=5,
        maternal_child_visits=20,
        ncd_visits=15,
        average_wait_time_minutes=25,
    )
    result = await repo.record_daily_footfall(record)
    assert result.centre_id == "phc_001"
    assert result.total_opd_visits == 80


@pytest.mark.asyncio
async def test_bed_repository():
    repo = BedStatusRepository()
    status = await repo.get_latest_bed_status("phc_001")
    assert status is not None
    assert status.total > 0

    # List all district beds
    district_beds = await repo.list_district_bed_status()
    assert len(district_beds) >= 12

    # Save new bed status
    new_status = BedStatus(
        centre_id="phc_001",
        date="2026-10-19",
        total=8,
        occupied=6,
        available=2,
        occupancy_percent=75.0,
    )
    await repo.save_bed_status(new_status)
    latest = await repo.get_latest_bed_status("phc_001")
    assert latest.occupied == 6


@pytest.mark.asyncio
async def test_attendance_repository():
    repo = DoctorAttendanceRepository()
    history = await repo.list_attendance_history(centre_id="phc_005", limit=10)
    assert len(history) > 0

    # Record attendance
    new_attendance = DoctorAttendanceCreate(
        centre_id="phc_005",
        date="2026-10-18",
        doctors=[
            DoctorAttendanceEntry(
                doctor_id="doc_01",
                name="Dr. Patil",
                designation="Medical Officer",
                shift="morning",
                status=AttendanceStatus.PRESENT,
                check_in_time="09:00:00",
            ),
            DoctorAttendanceEntry(
                doctor_id="doc_02",
                name="Dr. Shinde",
                designation="Medical Officer",
                shift="morning",
                status=AttendanceStatus.UNNOTIFIED_ABSENT,
            ),
        ],
    )
    res = await repo.record_attendance(new_attendance)
    assert res.doctors_present_today == 1


@pytest.mark.asyncio
async def test_test_availability_repository():
    repo = TestAvailabilityRepository()
    audit = await repo.get_latest_audit("phc_001")
    assert audit is not None
    assert len(audit.tests) > 0

    history = await repo.list_audit_history(centre_id="phc_001", limit=5)
    assert len(history) > 0

    # Check unavailable tests for a centre
    unavailable = await repo.list_unavailable_tests("phc_003")
    assert isinstance(unavailable, list)

    # Record a test audit
    new_audit = LabTestAuditCreate(
        centre_id="phc_001",
        audit_date="2026-10-18",
        tests=[
            LabTestEntry(
                test_name="Hemoglobin (Hb)",
                category="haematology",
                status=TestStatus.AVAILABLE,
                equipment_functional=True,
                kits_remaining=100,
            ),
            LabTestEntry(
                test_name="Rapid Malaria Kit",
                category="communicable",
                status=TestStatus.OUT_OF_STOCK,
                equipment_functional=True,
                kits_remaining=0,
            ),
        ],
    )
    saved_audit = await repo.record_audit(new_audit)
    assert saved_audit.available_tests == 1
    assert saved_audit.total_audited_tests == 2
