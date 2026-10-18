"""Operations API Endpoints: Footfall, Doctor Attendance, Lab Test Audits, and Underperformance Flagging."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.models.operations import (
    DeputationRecommendation,
    DoctorAttendanceCreate,
    DoctorAttendanceResponse,
    ExecuteDeputationRequest,
    ExecuteDeputationResponse,
    FacilityVulnerabilityScore,
    FootfallLogCreate,
    FootfallLogResponse,
    LabTestAuditCreate,
    LabTestAuditResponse,
    OperationsSummaryResponse,
)
from backend.app.security import get_current_user
from backend.app.services.operations_service import OperationsService, get_operations_service

router = APIRouter(prefix="/operations", tags=["Health Centre Operations"])


@router.get("/summary", response_model=OperationsSummaryResponse)
async def get_operations_summary(
    service: OperationsService = Depends(get_operations_service),
) -> OperationsSummaryResponse:
    """Get district operational scorecard: footfall, wait time, bed saturation, doctor attendance, test availability."""
    return await service.get_operations_summary()


# ---------------------------------------------------------------------------
# Patient Footfall Endpoints
# ---------------------------------------------------------------------------


@router.post("/footfall", response_model=FootfallLogResponse)
async def record_daily_footfall(
    payload: FootfallLogCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: OperationsService = Depends(get_operations_service),
) -> FootfallLogResponse:
    """Submit daily patient outpatient and emergency department census."""
    return await service.record_footfall(payload)


@router.get("/footfall/{centre_id}", response_model=list[FootfallLogResponse])
async def get_footfall_history(
    centre_id: str,
    limit: int = Query(default=14, ge=1, le=60),
    service: OperationsService = Depends(get_operations_service),
) -> list[FootfallLogResponse]:
    """Retrieve historical daily footfall logs and congestion indicators for a centre."""
    return await service.get_footfall_history(centre_id=centre_id, limit=limit)


# ---------------------------------------------------------------------------
# Doctor Attendance Endpoints
# ---------------------------------------------------------------------------


@router.post("/attendance", response_model=DoctorAttendanceResponse)
async def record_doctor_attendance(
    payload: DoctorAttendanceCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: OperationsService = Depends(get_operations_service),
) -> DoctorAttendanceResponse:
    """Submit daily doctor roster and shift attendance."""
    return await service.record_doctor_attendance(payload)


@router.get("/attendance/{centre_id}", response_model=DoctorAttendanceResponse)
async def get_doctor_attendance(
    centre_id: str,
    date: str | None = None,
    service: OperationsService = Depends(get_operations_service),
) -> DoctorAttendanceResponse:
    """Retrieve latest or date-specific doctor attendance record for a facility."""
    record = await service.get_doctor_attendance_for_centre(centre_id, date)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No doctor attendance record found for centre '{centre_id}'",
        )
    return record


# ---------------------------------------------------------------------------
# Lab Test Availability Audit Endpoints
# ---------------------------------------------------------------------------


@router.post("/tests", response_model=LabTestAuditResponse)
async def record_lab_test_audit(
    payload: LabTestAuditCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: OperationsService = Depends(get_operations_service),
) -> LabTestAuditResponse:
    """Submit diagnostic test kit availability and laboratory equipment functional audit."""
    return await service.record_lab_test_audit(payload)


@router.get("/tests/{centre_id}", response_model=LabTestAuditResponse)
async def get_lab_test_audit(
    centre_id: str,
    date: str | None = None,
    service: OperationsService = Depends(get_operations_service),
) -> LabTestAuditResponse:
    """Retrieve latest diagnostic test audit and kit stockout flags for a facility."""
    audit = await service.get_lab_test_audit_for_centre(centre_id, date)
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No lab test audit record found for centre '{centre_id}'",
        )
    return audit


# ---------------------------------------------------------------------------
# Underperformance & Vulnerability Scoring Endpoints
# ---------------------------------------------------------------------------


@router.get("/underperforming", response_model=list[FacilityVulnerabilityScore])
async def list_underperforming_centres(
    service: OperationsService = Depends(get_operations_service),
) -> list[FacilityVulnerabilityScore]:
    """List facilities flagged with high or critical vulnerability using the Composite Vulnerability Index (FVI >= 45)."""
    return await service.get_underperforming_centres()


@router.get("/vulnerability/{centre_id}", response_model=FacilityVulnerabilityScore)
async def get_centre_vulnerability_score(
    centre_id: str,
    service: OperationsService = Depends(get_operations_service),
) -> FacilityVulnerabilityScore:
    """Retrieve the multi-factor vulnerability score, risk factors, and recommended interventions for a centre."""
    score = await service.calculate_facility_vulnerability(centre_id)
    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Centre '{centre_id}' not found",
        )
    return score


# ---------------------------------------------------------------------------
# Smart Staff Deputation Endpoints (Milestone 3)
# ---------------------------------------------------------------------------


@router.get("/deputation/recommendations", response_model=list[DeputationRecommendation])
async def get_deputation_recommendations(
    target_centre_id: str | None = Query(default=None, description="Optional target PHC"),
    service: OperationsService = Depends(get_operations_service),
) -> list[DeputationRecommendation]:
    """Retrieve smart doctor deputation recommendations for facilities experiencing acute absenteeism."""
    return await service.get_deputation_recommendations(target_centre_id=target_centre_id)


@router.post("/deputation/execute", response_model=ExecuteDeputationResponse)
async def execute_doctor_deputation(
    payload: ExecuteDeputationRequest,
    service: OperationsService = Depends(get_operations_service),
) -> ExecuteDeputationResponse:
    """Issue and record an emergency temporary doctor deputation order."""
    return await service.execute_deputation(payload)
