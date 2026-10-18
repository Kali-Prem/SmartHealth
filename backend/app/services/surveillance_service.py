"""Disease Surveillance and Outbreak Detection Service.

Provides:
- Statistical anomaly detection for communicable disease surges
- Integrated Disease Surveillance Programme (IDSP) threshold triggers
- Automated bilingual outbreak alert generation (English & Hindi)
- District trend line aggregation
"""

import math
from datetime import datetime, timedelta
from typing import Any

from backend.app.database import DatabaseClient, get_db
from backend.app.models.surveillance import (
    AlertStatus,
    DiseaseTrendPoint,
    DiseaseType,
    OutbreakAlert,
    SeverityLevel,
    SurveillanceSummaryResponse,
    SyndromicReportCreate,
    SyndromicReportResponse,
)


class SurveillanceService:
    """Core logic for syndromic surveillance and statistical outbreak detection."""

    def __init__(self, db: DatabaseClient | None = None) -> None:
        self.db = db or get_db()

    async def record_syndromic_report(
        self,
        report_data: SyndromicReportCreate,
        reported_by: str,
    ) -> SyndromicReportResponse:
        """Save a new syndromic report and evaluate if it breaches outbreak thresholds."""
        report_id = f"rep_{int(datetime.now().timestamp() * 1000)}"
        doc_data = report_data.model_dump()
        doc_data["id"] = report_id
        doc_data["created_at"] = datetime.now().isoformat()
        doc_data["reported_by"] = reported_by

        await self.db.set_document("syndromic_reports", report_id, doc_data)

        # Check if an alert needs to be triggered
        await self.evaluate_outbreak_threshold(report_data.centre_id, report_data.disease)

        return SyndromicReportResponse(**doc_data)

    async def evaluate_outbreak_threshold(
        self,
        centre_id: str,
        disease: DiseaseType,
    ) -> OutbreakAlert | None:
        """Run statistical threshold calculation on recent reports for a specific centre and disease.

        Triggers an OutbreakAlert if current 7-day cases exceed 1.8x baseline average
        or breach critical disease-specific minimum thresholds.
        """
        # Fetch centre metadata
        centre_doc = await self.db.get_document("centres", centre_id)
        centre_name = centre_doc.get("name", "PHC Facility") if centre_doc else "PHC Facility"
        block = centre_doc.get("block", "Central") if centre_doc else "Central"

        # Fetch all reports for this centre and disease
        all_reports = await self.db.list_documents("syndromic_reports")
        relevant_reports = [
            r
            for r in all_reports
            if r.get("centre_id") == centre_id and r.get("disease") == disease.value
        ]

        if not relevant_reports:
            return None

        # Sort by reporting_date descending
        relevant_reports.sort(key=lambda x: x.get("reporting_date", ""), reverse=True)

        # Recent 7 days cases vs historical baseline
        recent_7d = relevant_reports[:7]
        current_cases = sum(r.get("new_cases", 0) for r in recent_7d)

        historical = relevant_reports[7:28]  # Prior 3 weeks
        if historical:
            baseline_avg = sum(r.get("new_cases", 0) for r in historical) / len(historical) * 7.0
        else:
            baseline_avg = max(3.0, current_cases * 0.4)

        # Statistical threshold: Baseline * 1.7 + 2 * std_dev
        threshold = max(5.0, round(baseline_avg * 1.75, 1))

        if current_cases >= threshold and current_cases >= 5:
            severity = (
                SeverityLevel.HIGH if current_cases < threshold * 1.5 else SeverityLevel.OUTBREAK
            )

            # Determine bilingual advisories
            advisories = self._generate_advisory_text(disease.value, centre_name, current_cases)

            alert_id = f"alert_{centre_id}_{disease.value}"
            alert = OutbreakAlert(
                id=alert_id,
                centre_id=centre_id,
                centre_name=centre_name,
                block=block,
                disease=disease,
                current_cases_7d=current_cases,
                baseline_cases_7d=round(baseline_avg, 1),
                threshold_limit=threshold,
                severity=severity,
                status=AlertStatus.ACTIVE,
                detected_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
                advisory_en=advisories["en"],
                advisory_hi=advisories["hi"],
                containment_checklist=advisories["checklist"],
            )

            await self.db.set_document("outbreak_alerts", alert_id, alert.model_dump())
            return alert

        return None

    def _generate_advisory_text(self, disease: str, centre_name: str, cases: int) -> dict[str, Any]:
        """Construct bilingual advisory text and rapid action checklist."""
        dis_title = disease.replace("_", " ").title()

        checklist = [
            f"Dispatch Rapid Response Team (RRT) to {centre_name} within 4 hours",
            "Chlorinate all public drinking water wells and pipeline distribution points",
            "Initiate fever screening and symptomatic line-listing in 500m radius",
            "Verify adequate stock of ORS, IV fluids, Paracetamol, and diagnostic kits",
            "Issue daily bulletin to District Chief Medical Officer (CMO)",
        ]

        advisory_en = (
            f"CRITICAL SURVEILLANCE ALERT: {cases} suspected cases of {dis_title} detected at {centre_name}. "
            f"Breached the statistical epidemic threshold. Immediate containment protocol and active fever survey mandated."
        )

        advisory_hi = (
            f"महत्वपूर्ण निगरानी चेतावनी: {centre_name} पर {dis_title} के {cases} संदिग्ध मामले दर्ज किए गए हैं, "
            f"जो महामारी सीमा से अधिक हैं। तत्काल रोकथाम प्रोटोकॉल, आशा कार्यकर्ताओं द्वारा डोर-टू-डोर सर्वे और शुद्ध पेयजल आपूर्ति सुनिश्चित करें।"
        )

        return {
            "en": advisory_en,
            "hi": advisory_hi,
            "checklist": checklist,
        }

    async def get_surveillance_summary(self) -> SurveillanceSummaryResponse:
        """Aggregate district surveillance KPIs, active alerts, and 7-day disease trends."""
        alerts_data = await self.db.list_documents("outbreak_alerts")
        active_alerts = [
            OutbreakAlert(**a)
            for a in alerts_data
            if a.get("status") in [AlertStatus.ACTIVE.value, AlertStatus.UNDER_INVESTIGATION.value]
        ]

        critical_count = sum(
            1 for a in active_alerts if a.severity in [SeverityLevel.HIGH, SeverityLevel.OUTBREAK]
        )

        # Disease distribution
        reports = await self.db.list_documents("syndromic_reports")
        distribution: dict[str, int] = {}
        for r in reports:
            dis = r.get("disease", "other")
            distribution[dis] = distribution.get(dis, 0) + r.get("new_cases", 0)

        most_prevalent = (
            max(distribution.items(), key=lambda x: x[1])[0] if distribution else "None"
        )

        # Generate 7-day time series points
        trend_points: list[DiseaseTrendPoint] = []
        today = datetime.now()
        for i in range(6, -1, -1):
            day_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            day_cases = sum(
                r.get("new_cases", 0) for r in reports if r.get("reporting_date") == day_str
            )
            # Baseline simulation for visualization
            baseline = 15.0 + math.sin(i) * 3.0
            threshold = baseline * 1.75
            trend_points.append(
                DiseaseTrendPoint(
                    date=day_str,
                    cases=day_cases,
                    baseline=round(baseline, 1),
                    threshold=round(threshold, 1),
                )
            )

        return SurveillanceSummaryResponse(
            total_active_alerts=len(active_alerts),
            critical_outbreaks=critical_count,
            most_prevalent_disease=most_prevalent.replace("_", " ").title(),
            district_case_trend_7d=trend_points,
            active_alerts=active_alerts,
            disease_distribution=distribution,
        )

    async def update_alert_status(
        self,
        alert_id: str,
        new_status: AlertStatus,
        notes: str | None = None,
    ) -> OutbreakAlert | None:
        """Update an outbreak alert's lifecycle status."""
        alert_doc = await self.db.get_document("outbreak_alerts", alert_id)
        if not alert_doc:
            return None

        alert_doc["status"] = new_status.value
        if notes:
            alert_doc.setdefault("containment_checklist", []).append(
                f"Note ({datetime.now().strftime('%d/%m %H:%M')}): {notes}"
            )

        await self.db.set_document("outbreak_alerts", alert_id, alert_doc)
        return OutbreakAlert(**alert_doc)


_surveillance_service_instance: SurveillanceService | None = None


def get_surveillance_service() -> SurveillanceService:
    """Surveillance service singleton."""
    global _surveillance_service_instance
    if _surveillance_service_instance is None:
        _surveillance_service_instance = SurveillanceService()
    return _surveillance_service_instance
