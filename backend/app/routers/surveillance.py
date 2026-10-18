"""Disease Surveillance and Outbreak Detection API Endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.database import DatabaseClient, get_db
from backend.app.models.surveillance import (
    AlertStatus,
    OutbreakAlert,
    OutbreakAlertUpdate,
    SurveillanceSummaryResponse,
    SyndromicReportCreate,
    SyndromicReportResponse,
)
from backend.app.security import get_current_user
from backend.app.services.surveillance_service import SurveillanceService, get_surveillance_service

router = APIRouter(prefix="/surveillance", tags=["Surveillance & Outbreaks"])


@router.get("/summary", response_model=SurveillanceSummaryResponse)
async def get_surveillance_summary(
    service: SurveillanceService = Depends(get_surveillance_service),
) -> SurveillanceSummaryResponse:
    """Get district surveillance overview, active outbreak alerts, and 7-day epidemiological trends."""
    return await service.get_surveillance_summary()


@router.post("/report", response_model=SyndromicReportResponse)
async def submit_syndromic_report(
    report: SyndromicReportCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: SurveillanceService = Depends(get_surveillance_service),
) -> SyndromicReportResponse:
    """Submit daily/weekly syndromic disease case count from PHC/CHC.

    Automatically triggers statistical anomaly analysis and alert creation if thresholds are breached.
    """
    return await service.record_syndromic_report(report, reported_by=current_user["username"])


@router.get("/alerts", response_model=list[OutbreakAlert])
async def list_outbreak_alerts(
    alert_status: AlertStatus | None = None,
    db: DatabaseClient = Depends(get_db),
) -> list[OutbreakAlert]:
    """List active and historical outbreak alerts."""
    alerts = await db.list_documents("outbreak_alerts")
    results = [OutbreakAlert(**a) for a in alerts]
    if alert_status:
        results = [a for a in results if a.status == alert_status]
    return results


@router.patch("/alerts/{alert_id}", response_model=OutbreakAlert)
async def update_alert(
    alert_id: str,
    update_data: OutbreakAlertUpdate,
    service: SurveillanceService = Depends(get_surveillance_service),
) -> OutbreakAlert:
    """Update outbreak investigation status or add clinical notes."""
    new_status = update_data.status or AlertStatus.UNDER_INVESTIGATION
    updated = await service.update_alert_status(
        alert_id, new_status, update_data.investigation_notes
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return updated
