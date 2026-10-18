from typing import Any

from backend.app.config import get_settings
from backend.app.data.sample_data import (
    INITIAL_MATERNAL_COHORTS,
    INITIAL_SYNDROMIC_REPORTS,
)
from backend.app.data.synthetic_generator import generate_90_day_history
from backend.app.database import DatabaseClient, get_db
from backend.app.security import RoleEnum, hash_password
from backend.app.services.surveillance_service import SurveillanceService


async def seed_database(db: DatabaseClient | None = None) -> None:
    """Populate default users, 12 centres, 40 medicines, and 90-day historical time-series."""
    database = db or get_db()

    settings = get_settings()

    # 1. Seed Users
    users: list[dict[str, Any]] = [
        {
            "id": "user_admin",
            "username": "admin",
            "hashed_password": hash_password("adminpassword123"),
            "email": "cmo.pune@smarthealth.gov.in",
            "full_name": "Dr. Rajesh Sharma, Chief Medical Officer (CMO)",
            "role": RoleEnum.DISTRICT_ADMIN.value,
            "centre_id": None,
            "district": "Pune",
        },
        {
            "id": "user_wagholi",
            "username": "wagholi_moic",
            "hashed_password": hash_password("staffpassword123"),
            "email": "priya.deshmukh@phc.smarthealth.gov.in",
            "full_name": "Dr. Priya Deshmukh, Medical Officer In-Charge",
            "role": RoleEnum.CENTRE_STAFF.value,
            "centre_id": "phc_001",
            "district": "Pune",
        },
        {
            "id": "user_ghogargaon",
            "username": "ghogargaon_moic",
            "hashed_password": hash_password("staffpassword123"),
            "email": "sandeep.borde@phc.smarthealth.gov.in",
            "full_name": "Dr. Sandeep Borde, Medical Officer In-Charge",
            "role": RoleEnum.CENTRE_STAFF.value,
            "centre_id": "phc_003",
            "district": "Pune",
        },
    ]

    # Seed Demo Users for Evaluators (Idempotent, configurable via settings/.env)
    if settings.enable_demo_login:
        demo_users: list[dict[str, Any]] = [
            {
                "id": "user_demo_worker",
                "username": settings.demo_worker_email,
                "email": settings.demo_worker_email,
                "hashed_password": hash_password(settings.demo_worker_password),
                "full_name": "Anita Patil, Community Health Officer",
                "role": RoleEnum.HEALTH_WORKER.value,
                "centre_id": settings.demo_worker_facility_id,
                "district": "Pune",
            },
            {
                "id": "user_demo_admin",
                "username": settings.demo_admin_email,
                "email": settings.demo_admin_email,
                "hashed_password": hash_password(settings.demo_admin_password),
                "full_name": "Dr. Rajesh Sharma, District Health Officer (DHO)",
                "role": RoleEnum.DISTRICT_ADMIN.value,
                "centre_id": None,
                "district": settings.demo_admin_district,
            },
            {
                "id": "user_demo_state",
                "username": settings.demo_state_email,
                "email": settings.demo_state_email,
                "hashed_password": hash_password(settings.demo_state_password),
                "full_name": "Shri V. K. Deshmukh, State Directorate of Health Services",
                "role": RoleEnum.STATE_VIEWER.value,
                "centre_id": None,
                "district": "All Districts (Maharashtra)",
            },
        ]
        users.extend(demo_users)

    for u in users:
        await database.set_document("users", u["username"], u, merge=True)
        # Also map by email if different from username
        if u.get("email") and u["email"] != u["username"]:
            await database.set_document("users", u["email"], u, merge=True)

    # 2. Generate 90 days of synthetic data for 12 centres, 40 medicines
    data = generate_90_day_history()

    # Seed 12 Centres
    for centre in data["centres"]:
        await database.set_document("centres", centre["id"], centre, merge=True)

    # Seed 40 Medicines inventory
    for inv in data["inventory"]:
        await database.set_document("inventory", inv["id"], inv, merge=True)

    # Seed 90 Days Footfall logs (1080 records)
    for footfall in data["footfall"]:
        await database.set_document("footfall_logs", footfall["id"], footfall, merge=True)

    # Seed 90 Days Doctor Attendance logs (1080 records)
    for att in data["attendance"]:
        await database.set_document("doctor_attendance_logs", att["id"], att, merge=True)

    # Seed 90 Days Bed Status logs
    for bed in data["beds"]:
        await database.set_document("bed_status_logs", bed["id"], bed, merge=True)

    # Seed Test Availability Audits
    for audit in data["test_audits"]:
        await database.set_document("test_availability_audits", audit["id"], audit, merge=True)

    # 3. Seed Maternal Cohorts
    for cohort in INITIAL_MATERNAL_COHORTS:
        cohort_id = str(cohort["id"])
        await database.set_document("maternal_cohorts", cohort_id, cohort, merge=True)

    # 4. Seed Syndromic Reports
    for idx, rep in enumerate(INITIAL_SYNDROMIC_REPORTS):
        rep_id = f"seed_rep_{idx + 1}"
        doc = rep.copy()
        doc["id"] = rep_id
        doc["inpatient_admissions"] = 0
        doc["deaths"] = 0
        doc["notes"] = "Routine syndromic reporting entry"
        doc["created_at"] = "2026-10-18T00:00:00"
        doc["reported_by"] = "system_seed"
        await database.set_document("syndromic_reports", rep_id, doc, merge=True)

    # 5. Evaluate baseline outbreaks
    surveillance_svc = SurveillanceService(db=database)
    from backend.app.models.surveillance import DiseaseType

    await surveillance_svc.evaluate_outbreak_threshold("phc_001", DiseaseType.DENGUE)
    await surveillance_svc.evaluate_outbreak_threshold("phc_003", DiseaseType.ACUTE_DIARRHEAL)
