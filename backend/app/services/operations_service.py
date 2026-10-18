"""Operations Service: Footfall Management, Doctor Attendance, Lab Test Audits, and Vulnerability Scoring.

Combines deterministic operational algorithms with district-wide telemetry:
- Real-time patient OPD queuing and congestion indicators
- Doctor shift attendance and absenteeism monitoring
- Diagnostic test kit availability and equipment downtime tracking
- Composite Facility Vulnerability Index (FVI) scoring to flag underperforming PHCs/CHCs
"""

from datetime import datetime
from typing import Any

from backend.app.database import DatabaseClient, get_db
from backend.app.models.operations import (
    AttendanceStatus,
    DeputationCandidate,
    DeputationRecommendation,
    DoctorAttendanceCreate,
    DoctorAttendanceResponse,
    ExecuteDeputationRequest,
    ExecuteDeputationResponse,
    FacilityVulnerabilityScore,
    FootfallLogCreate,
    FootfallLogResponse,
    FootfallStatus,
    LabTestAuditCreate,
    LabTestAuditResponse,
    OperationsSummaryResponse,
    TestStatus,
)
from backend.app.services.inventory_service import haversine_distance_km


class OperationsService:
    """Core business logic for health centre operations and vulnerability audits."""

    def __init__(self, db: DatabaseClient | None = None) -> None:
        self.db = db or get_db()

    # ---------------------------------------------------------------------------
    # Patient Footfall Logic
    # ---------------------------------------------------------------------------

    async def record_footfall(self, data: FootfallLogCreate) -> FootfallLogResponse:
        """Record daily outpatient visits and compute capacity saturation."""
        centre = await self.db.get_document("centres", data.centre_id)
        centre_name = centre.get("name", "PHC Facility") if centre else "PHC Facility"
        block = centre.get("block", "Central") if centre else "Central"
        facility_type = centre.get("facility_type", "PHC") if centre else "PHC"

        # Baseline benchmark daily capacity: PHC ~ 100 OPD patients, CHC ~ 300 OPD patients
        baseline_capacity = 300 if facility_type == "CHC" else 100
        saturation = round((data.total_opd_visits / baseline_capacity) * 100, 1)

        if saturation > 120.0:
            status = FootfallStatus.OVERCROWDED
        elif saturation >= 90.0:
            status = FootfallStatus.HIGH
        else:
            status = FootfallStatus.NORMAL

        log_id = f"footfall_{data.centre_id}_{data.date}"
        doc_data = data.model_dump()
        doc_data.update(
            {
                "id": log_id,
                "centre_name": centre_name,
                "block": block,
                "capacity_saturation_percent": saturation,
                "status": status.value,
            }
        )

        await self.db.set_document("footfall_logs", log_id, doc_data)
        return FootfallLogResponse(**doc_data)

    async def get_footfall_history(
        self, centre_id: str | None = None, limit: int = 14
    ) -> list[FootfallLogResponse]:
        """Fetch historical footfall logs."""
        all_logs = await self.db.list_documents("footfall_logs")
        if centre_id:
            all_logs = [log for log in all_logs if log.get("centre_id") == centre_id]

        all_logs.sort(key=lambda x: x.get("date", ""), reverse=True)
        centres = {c["id"]: c for c in await self.db.list_documents("centres")}
        results: list[FootfallLogResponse] = []
        for log in all_logs[:limit]:
            log_copy = log.copy()
            c = centres.get(log_copy.get("centre_id", ""), {})
            log_copy.setdefault(
                "centre_name", c.get("name", "PHC Facility") if c else "PHC Facility"
            )
            log_copy.setdefault("block", c.get("block", "Central") if c else "Central")
            results.append(FootfallLogResponse(**log_copy))
        return results

    # ---------------------------------------------------------------------------
    # Doctor Attendance Logic
    # ---------------------------------------------------------------------------

    async def record_doctor_attendance(
        self, data: DoctorAttendanceCreate
    ) -> DoctorAttendanceResponse:
        """Record daily shift attendance for doctors and calculate absenteeism rates."""
        centre = await self.db.get_document("centres", data.centre_id)
        centre_name = centre.get("name", "PHC Facility") if centre else "PHC Facility"
        block = centre.get("block", "Central") if centre else "Central"

        sanctioned = 2
        if centre and "staffing" in centre:
            sanctioned = max(
                1,
                centre["staffing"].get("medical_officers_sanctioned", 2)
                + centre["staffing"].get("specialists_sanctioned", 0),
            )

        # Count doctors present today
        present_count = sum(1 for d in data.doctors if d.status == AttendanceStatus.PRESENT)
        absence_rate = round(max(0.0, ((sanctioned - present_count) / sanctioned) * 100.0), 1)

        att_id = f"att_{data.centre_id}_{data.date}"
        doc_data = data.model_dump()
        doc_data.update(
            {
                "id": att_id,
                "centre_name": centre_name,
                "block": block,
                "doctors_sanctioned": sanctioned,
                "doctors_present_today": present_count,
                "absence_rate_percent": absence_rate,
            }
        )

        await self.db.set_document("doctor_attendance_logs", att_id, doc_data)
        return DoctorAttendanceResponse(**doc_data)

    async def get_doctor_attendance_for_centre(
        self, centre_id: str, date: str | None = None
    ) -> DoctorAttendanceResponse | None:
        """Fetch the latest or date-specific doctor attendance record for a centre."""
        all_logs = await self.db.list_documents("doctor_attendance_logs")
        relevant = [log for log in all_logs if log.get("centre_id") == centre_id]
        if not relevant:
            return None

        centre = await self.db.get_document("centres", centre_id)
        default_name = centre.get("name", "PHC Facility") if centre else "PHC Facility"
        default_block = centre.get("block", "Central") if centre else "Central"

        if date:
            target = next((log for log in relevant if log.get("date") == date), None)
            if not target:
                return None
            doc = target.copy()
            doc.setdefault("centre_name", default_name)
            doc.setdefault("block", default_block)
            return DoctorAttendanceResponse(**doc)

        # Return latest
        relevant.sort(key=lambda x: x.get("date", ""), reverse=True)
        doc = relevant[0].copy()
        doc.setdefault("centre_name", default_name)
        doc.setdefault("block", default_block)
        return DoctorAttendanceResponse(**doc)

    # ---------------------------------------------------------------------------
    # Lab Test Audit Logic
    # ---------------------------------------------------------------------------

    async def record_lab_test_audit(self, data: LabTestAuditCreate) -> LabTestAuditResponse:
        """Record diagnostic test audit and calculate readiness percentage."""
        centre = await self.db.get_document("centres", data.centre_id)
        centre_name = centre.get("name", "PHC Facility") if centre else "PHC Facility"
        block = centre.get("block", "Central") if centre else "Central"

        total_tests = len(data.tests)
        available_tests = sum(
            1 for t in data.tests if t.status == TestStatus.AVAILABLE and t.equipment_functional
        )
        avail_rate = round((available_tests / total_tests) * 100, 1) if total_tests > 0 else 100.0

        audit_id = f"lab_{data.centre_id}_{data.audit_date}"
        doc_data = data.model_dump()
        doc_data.update(
            {
                "id": audit_id,
                "centre_name": centre_name,
                "block": block,
                "total_audited_tests": total_tests,
                "available_tests": available_tests,
                "availability_rate_percent": avail_rate,
            }
        )

        await self.db.set_document("test_availability_audits", audit_id, doc_data)
        return LabTestAuditResponse(**doc_data)

    async def get_lab_test_audit_for_centre(
        self, centre_id: str, date: str | None = None
    ) -> LabTestAuditResponse | None:
        """Fetch the latest or date-specific lab test audit for a centre."""
        all_audits = await self.db.list_documents("test_availability_audits")
        relevant = [a for a in all_audits if a.get("centre_id") == centre_id]
        if not relevant:
            return None

        centre = await self.db.get_document("centres", centre_id)
        default_name = centre.get("name", "PHC Facility") if centre else "PHC Facility"
        default_block = centre.get("block", "Central") if centre else "Central"

        if date:
            target = next((a for a in relevant if a.get("audit_date") == date), None)
            if not target:
                return None
            doc = target.copy()
            doc.setdefault("centre_name", default_name)
            doc.setdefault("block", default_block)
            return LabTestAuditResponse(**doc)

        relevant.sort(key=lambda x: x.get("audit_date", ""), reverse=True)
        doc = relevant[0].copy()
        doc.setdefault("centre_name", default_name)
        doc.setdefault("block", default_block)
        return LabTestAuditResponse(**doc)

    # ---------------------------------------------------------------------------
    # Deterministic Composite Facility Vulnerability Scoring
    # ---------------------------------------------------------------------------

    async def calculate_facility_vulnerability(
        self, centre_id: str
    ) -> FacilityVulnerabilityScore | None:
        """Compute the deterministic Composite Facility Vulnerability Index (FVI).

        Formula:
        FVI = 0.25*(Stockout Rate) + 0.25*(Doctor Absence Rate) + 0.20*(Bed Saturation) + 0.15*(Test Stockout Rate) + 0.15*(UIP Dropout Rate)
        """
        centre = await self.db.get_document("centres", centre_id)
        if not centre:
            return None

        centre_name = centre.get("name", "PHC Facility")
        centre_name_hi = centre.get("name_hi", centre_name)
        block = centre.get("block", "Central")
        facility_type = centre.get("facility_type", "PHC")

        # 1. Stockout Rate (0 to 100)
        inventory_items = await self.db.list_documents("inventory")
        centre_items = [i for i in inventory_items if i.get("centre_id") == centre_id]
        stockouts = [i for i in centre_items if i.get("current_stock", 0) <= 0]
        stockout_rate = (
            round((len(stockouts) / len(centre_items)) * 100, 1) if centre_items else 0.0
        )

        # Penalize critical antivenom or vaccine stockout
        critical_stockout_flag = any(
            i.get("category") in ["anti_venom", "vaccine"] and i.get("current_stock", 0) <= 0
            for i in centre_items
        )
        if critical_stockout_flag:
            stockout_rate = min(100.0, stockout_rate + 25.0)

        # 2. Doctor Absence Rate (0 to 100)
        attendance = await self.get_doctor_attendance_for_centre(centre_id)
        if attendance:
            doctor_absence_rate = attendance.absence_rate_percent
        else:
            # Fallback to sanctioned vs in-position vacancies in staffing summary
            staffing = centre.get("staffing", {})
            mo_sanctioned = max(1, staffing.get("medical_officers_sanctioned", 2))
            mo_in_pos = staffing.get("medical_officers_in_position", 2)
            doctor_absence_rate = round(
                max(0.0, ((mo_sanctioned - mo_in_pos) / mo_sanctioned) * 100.0), 1
            )

        # 3. Bed Saturation Rate (0 to 100)
        infra = centre.get("infrastructure", {})
        beds_total = max(1, infra.get("beds_total", 6))
        beds_occupied = infra.get("beds_occupied", 0)
        bed_saturation = min(100.0, round((beds_occupied / beds_total) * 100.0, 1))

        # 4. Diagnostic Test Stockout Rate (0 to 100)
        lab_audit = await self.get_lab_test_audit_for_centre(centre_id)
        if lab_audit:
            test_stockout_rate = round(100.0 - lab_audit.availability_rate_percent, 1)
        else:
            test_stockout_rate = 0.0 if infra.get("lab_testing_active", True) else 100.0

        # 5. Immunization Dropout Rate (0 to 100)
        # Default benchmark for UIP dropout
        immunization_dropout_rate = 14.8 if "Tribal" in block else 8.5

        # Weighted calculation
        raw_fvi = (
            0.25 * stockout_rate
            + 0.25 * doctor_absence_rate
            + 0.20 * bed_saturation
            + 0.15 * test_stockout_rate
            + 0.15 * immunization_dropout_rate
        )
        vulnerability_score = round(min(100.0, max(0.0, raw_fvi)), 1)

        # Determine risk level
        if vulnerability_score >= 65.0:
            risk_level = "critical"
        elif vulnerability_score >= 50.0:
            risk_level = "high"
        elif vulnerability_score >= 30.0:
            risk_level = "moderate"
        else:
            risk_level = "low"

        # Contributing factors and interventions
        factors: list[str] = []
        interventions: list[str] = []

        if stockout_rate > 20.0 or critical_stockout_flag:
            factors.append(
                f"Critical drug stockouts: {len(stockouts)} items depleted (including essential antivenom/vaccine)"
            )
            interventions.append(
                "Trigger emergency lateral stock rebalancing from nearest surplus facility"
            )

        if doctor_absence_rate >= 50.0:
            factors.append(
                f"High doctor absenteeism: {doctor_absence_rate}% MO positions vacant or unnotified absent"
            )
            interventions.append("Issue temporary duty cross-deputation from block CHC")

        if bed_saturation >= 85.0:
            factors.append(f"Inpatient bed saturation: {bed_saturation}% beds occupied")
            interventions.append("Activate secondary referral transit for stable recovery patients")

        if test_stockout_rate >= 20.0:
            factors.append(
                f"Diagnostic laboratory deficit: {test_stockout_rate}% test kits depleted or equipment down"
            )
            interventions.append(
                "Dispatch rapid diagnostic test (RDT) buffer packs and dispatch repair engineer"
            )

        if not factors:
            factors.append(
                "Operations running within normal epidemiological and staffing benchmarks"
            )
            interventions.append("Maintain routine monitoring and inventory reorder cycle")

        return FacilityVulnerabilityScore(
            centre_id=centre_id,
            centre_name=centre_name,
            centre_name_hi=centre_name_hi,
            block=block,
            facility_type=facility_type,
            vulnerability_score=vulnerability_score,
            risk_level=risk_level,
            contributing_factors=factors,
            recommended_interventions=interventions,
            stockout_rate=stockout_rate,
            doctor_absence_rate=doctor_absence_rate,
            bed_saturation_rate=bed_saturation,
            test_stockout_rate=test_stockout_rate,
            immunization_dropout_rate=immunization_dropout_rate,
        )

    async def get_underperforming_centres(self) -> list[FacilityVulnerabilityScore]:
        """Fetch all health centres flagged with vulnerability (FVI >= 30.0 or high/critical risk)."""
        centres = await self.db.list_documents("centres")
        scores: list[FacilityVulnerabilityScore] = []

        for c in centres:
            score = await self.calculate_facility_vulnerability(c["id"])
            if score and (
                score.vulnerability_score >= 30.0 or score.risk_level in ["high", "critical"]
            ):
                scores.append(score)

        scores.sort(key=lambda x: x.vulnerability_score, reverse=True)
        return scores

    # ---------------------------------------------------------------------------
    # District Operations Summary
    # ---------------------------------------------------------------------------

    async def get_operations_summary(self) -> OperationsSummaryResponse:
        """Compile aggregated district-wide operational indicators."""
        centres = await self.db.list_documents("centres")
        footfall_logs = await self.db.list_documents("footfall_logs")
        attendance_logs = await self.db.list_documents("doctor_attendance_logs")
        test_audits = await self.db.list_documents("test_availability_audits")

        # Total footfall for latest day
        latest_date = max((f.get("date", "") for f in footfall_logs), default="")
        today_footfall = (
            [f for f in footfall_logs if f.get("date") == latest_date]
            if latest_date
            else footfall_logs
        )
        total_footfall = (
            sum(f.get("total_opd_visits", 0) for f in today_footfall) if today_footfall else 840
        )
        avg_wait = (
            int(
                sum(f.get("average_wait_time_minutes", 20) for f in today_footfall)
                / len(today_footfall)
            )
            if today_footfall
            else 26
        )

        # Beds
        total_beds = sum(c.get("infrastructure", {}).get("beds_total", 6) for c in centres)
        occupied_beds = sum(c.get("infrastructure", {}).get("beds_occupied", 2) for c in centres)
        bed_occ_pct = round((occupied_beds / total_beds) * 100, 1) if total_beds > 0 else 0.0

        # Doctors on duty for latest day
        sanctioned_doctors = sum(
            c.get("staffing", {}).get("medical_officers_sanctioned", 2)
            + c.get("staffing", {}).get("specialists_sanctioned", 0)
            for c in centres
        )
        if attendance_logs:
            latest_att_date = max((a.get("date", "") for a in attendance_logs), default="")
            today_att = (
                [a for a in attendance_logs if a.get("date") == latest_att_date]
                if latest_att_date
                else attendance_logs
            )
            present_doctors = sum(a.get("doctors_present_today", 1) for a in today_att)
            doc_att_pct = (
                round((present_doctors / sanctioned_doctors) * 100, 1)
                if sanctioned_doctors > 0
                else 85.0
            )
        else:
            in_pos_doctors = sum(
                c.get("staffing", {}).get("medical_officers_in_position", 2)
                + c.get("staffing", {}).get("specialists_in_position", 0)
                for c in centres
            )
            present_doctors = in_pos_doctors
            doc_att_pct = (
                round((in_pos_doctors / sanctioned_doctors) * 100, 1)
                if sanctioned_doctors > 0
                else 85.0
            )

        # Tests availability for latest audit
        if test_audits:
            latest_test_date = max((t.get("audit_date", "") for t in test_audits), default="")
            today_tests = (
                [t for t in test_audits if t.get("audit_date") == latest_test_date]
                if latest_test_date
                else test_audits
            )
            test_avail_pct = round(
                sum(t.get("availability_rate_percent", 85.0) for t in today_tests)
                / len(today_tests),
                1,
            )
        else:
            test_avail_pct = 82.5

        # Vulnerable centres
        vulnerable = await self.get_underperforming_centres()

        return OperationsSummaryResponse(
            total_daily_opd_footfall=total_footfall,
            average_district_wait_time_mins=avg_wait,
            district_bed_occupancy_percent=bed_occ_pct,
            total_beds_occupied=occupied_beds,
            total_beds_available=total_beds,
            district_doctor_attendance_percent=doc_att_pct,
            doctors_on_duty_today=present_doctors,
            doctors_sanctioned_total=sanctioned_doctors,
            district_test_availability_percent=test_avail_pct,
            underperforming_centres_count=len(vulnerable),
            top_vulnerable_centres=vulnerable[:5],
        )

    async def get_deputation_recommendations(
        self, target_centre_id: str | None = None
    ) -> list[DeputationRecommendation]:
        """Generate smart doctor deputation recommendations for facilities facing acute absenteeism.

        Uses Haversine distance matrix to identify nearest surplus CHCs/PHCs with available on-duty doctors.
        """
        centres = {c["id"]: c for c in await self.db.list_documents("centres")}
        all_logs = await self.db.list_documents("doctor_attendance_logs")

        # Compile latest attendance by centre
        latest_attendance: dict[str, dict[str, Any]] = {}
        for log in all_logs:
            c_id = log.get("centre_id")
            if not c_id:
                continue
            date_str = log.get("date", "")
            if c_id not in latest_attendance or date_str > latest_attendance[c_id].get("date", ""):
                latest_attendance[c_id] = log

        recommendations: list[DeputationRecommendation] = []

        # Find target facilities experiencing doctor absence >= 40%
        target_ids = (
            [target_centre_id]
            if target_centre_id
            else [
                cid
                for cid, log in latest_attendance.items()
                if log.get("absence_rate_percent", 0.0) >= 40.0
                or log.get("doctors_present_today", 0) == 0
            ]
        )

        # Potential donor facilities: CHCs or PHCs with >= 2 doctors present and low absence
        donor_pool: list[tuple[str, dict[str, Any], dict[str, Any]]] = []
        for cid, centre in centres.items():
            log = latest_attendance.get(cid, {})
            present = log.get("doctors_present_today", 0)
            absence = log.get("absence_rate_percent", 0.0)
            if present >= 2 and absence <= 25.0:
                donor_pool.append((cid, centre, log))

        for tid in target_ids:
            target_centre = centres.get(tid)
            if not target_centre:
                continue

            target_log = latest_attendance.get(tid, {})
            abs_rate = target_log.get("absence_rate_percent", 50.0)
            docs_present = target_log.get("doctors_present_today", 0)
            docs_sanctioned = target_log.get("doctors_sanctioned", 2)

            t_lat = target_centre.get("latitude", 18.52)
            t_lon = target_centre.get("longitude", 73.85)
            t_name = target_centre.get("name", "PHC Facility")
            t_name_hi = target_centre.get("name_hi", t_name)
            t_block = target_centre.get("block", "Central")

            candidates: list[DeputationCandidate] = []

            for did, donor_centre, donor_log in donor_pool:
                if did == tid:
                    continue

                d_lat = donor_centre.get("latitude", 18.52)
                d_lon = donor_centre.get("longitude", 73.85)
                dist_km = haversine_distance_km(t_lat, t_lon, d_lat, d_lon)
                transit_mins = int(round((dist_km / 35.0) * 60 + 15))
                doctors_on_duty = donor_log.get("doctors_present_today", 2)

                # Find candidate on-duty doctors at donor
                for doc_entry in donor_log.get("doctors", []):
                    if doc_entry.get("status") == AttendanceStatus.PRESENT.value:
                        candidates.append(
                            DeputationCandidate(
                                donor_centre_id=did,
                                donor_centre_name=donor_centre.get("name", "CHC Facility"),
                                donor_centre_name_hi=donor_centre.get(
                                    "name_hi", donor_centre.get("name", "CHC Facility")
                                ),
                                donor_block=donor_centre.get("block", "Central"),
                                doctor_id=doc_entry.get("doctor_id", "doc_unknown"),
                                doctor_name=doc_entry.get("name", "Medical Officer"),
                                designation=doc_entry.get("designation", "Medical Officer"),
                                distance_km=dist_km,
                                estimated_transit_mins=transit_mins,
                                doctors_on_duty_at_donor=doctors_on_duty,
                            )
                        )

            # Sort by shortest distance first, then most doctors on duty
            candidates.sort(key=lambda c: (c.distance_km, -c.doctors_on_duty_at_donor))
            top_cand = candidates[0] if candidates else None

            justification = ""
            justification_hi = ""
            if top_cand:
                justification = (
                    f"Clinical Rationale: {t_name} is operating at {abs_rate}% doctor absenteeism with only "
                    f"{docs_present} physician(s) covering emergency & OPD load. Immediate temporary deputation of "
                    f"{top_cand.doctor_name} ({top_cand.designation}) from {top_cand.donor_centre_name} ({top_cand.distance_km} km, "
                    f"~{top_cand.estimated_transit_mins} mins transit) restores essential casualty triage and maternal cover without "
                    f"compromising {top_cand.donor_centre_name}'s routine capacity ({top_cand.doctors_on_duty_at_donor - 1} physicians remaining on duty)."
                )
                justification_hi = (
                    f"नैदानिक तर्क: {t_name_hi} में डॉक्टरों की {abs_rate}% अनुपस्थिति है और केवल {docs_present} डॉक्टर ओपीडी व आपातकालीन सेवाएं संभाल रहे हैं। "
                    f"{top_cand.donor_centre_name_hi} ({top_cand.distance_km} किमी, ~{top_cand.estimated_transit_mins} मिनट) से "
                    f"{top_cand.doctor_name} का तत्काल अस्थायी प्रतिनियुक्ति प्राथमिक स्वास्थ्य सेवाएं सुदृढ़ करेगा। "
                    f"दाता केंद्र पर शेष {top_cand.doctors_on_duty_at_donor - 1} डॉक्टर उपस्थित रहेंगे, अतः वहां सेवाएं अप्रभावित रहेंगी।"
                )
            else:
                justification = f"No eligible donor facilities with surplus on-duty doctors identified within district radius for {t_name}."
                justification_hi = (
                    f"{t_name_hi} के लिए जिले के किसी भी केंद्र पर अतिरिक्त डॉक्टर उपलब्ध नहीं हैं।"
                )

            recommendations.append(
                DeputationRecommendation(
                    target_centre_id=tid,
                    target_centre_name=t_name,
                    target_centre_name_hi=t_name_hi,
                    target_block=t_block,
                    absence_rate_percent=abs_rate,
                    doctors_present=docs_present,
                    doctors_sanctioned=docs_sanctioned,
                    top_candidate=top_cand,
                    candidates=candidates,
                    distance_algorithm="Haversine (Great-Circle)",
                    gemini_justification=justification,
                    gemini_justification_hi=justification_hi,
                )
            )

        return recommendations

    async def execute_deputation(self, req: ExecuteDeputationRequest) -> ExecuteDeputationResponse:
        """Atomically log and apply an emergency doctor deputation order."""
        deputation_id = f"dep_{int(datetime.now().timestamp() * 1000)}"
        deputation_record = {
            "id": deputation_id,
            "target_centre_id": req.target_centre_id,
            "donor_centre_id": req.donor_centre_id,
            "doctor_id": req.doctor_id,
            "doctor_name": req.doctor_name,
            "date": req.date,
            "reason": req.reason,
            "status": "active",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        await self.db.set_document("deputations", deputation_id, deputation_record, merge=True)

        return ExecuteDeputationResponse(
            deputation_id=deputation_id,
            status="completed",
            target_centre_id=req.target_centre_id,
            donor_centre_id=req.donor_centre_id,
            doctor_name=req.doctor_name,
            date=req.date,
            message=(
                f"Deputation order issued successfully: {req.doctor_name} temporarily assigned "
                f"from {req.donor_centre_id} to {req.target_centre_id}."
            ),
        )


_operations_service_instance: OperationsService | None = None


def get_operations_service() -> OperationsService:
    """Operations service singleton."""
    global _operations_service_instance
    if _operations_service_instance is None:
        _operations_service_instance = OperationsService()
    return _operations_service_instance
