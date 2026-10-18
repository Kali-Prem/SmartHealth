"""Maternal & Child Health and Immunization API Endpoints."""

from fastapi import APIRouter, Depends

from backend.app.models.mch import (
    ImmunizationCohortResponse,
    MaternalCohortCreate,
    MaternalCohortResponse,
    MCHSummaryResponse,
)
from backend.app.services.mch_service import MCHService, get_mch_service

router = APIRouter(prefix="/mch", tags=["Maternal & Child Health"])


@router.get("/summary", response_model=MCHSummaryResponse)
async def get_mch_summary(service: MCHService = Depends(get_mch_service)) -> MCHSummaryResponse:
    """Get district maternal indicators, high-risk pregnancy load, and block immunization rankings."""
    return await service.get_mch_summary()


@router.post("/cohort", response_model=MaternalCohortResponse)
async def record_maternal_cohort(
    payload: MaternalCohortCreate,
    service: MCHService = Depends(get_mch_service),
) -> MaternalCohortResponse:
    """Submit monthly maternal cohort data from a health centre."""
    return await service.record_maternal_cohort(payload)


@router.get("/immunization/{centre_id}", response_model=ImmunizationCohortResponse)
async def get_immunization_cohort(
    centre_id: str,
    month: str = "2026-09",
    service: MCHService = Depends(get_mch_service),
) -> ImmunizationCohortResponse:
    """Retrieve detailed antigen-wise vaccine coverage and cohort dropout percentages for a facility."""
    return await service.get_immunization_cohort(centre_id, month=month)
