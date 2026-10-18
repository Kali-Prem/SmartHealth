"""Maternal & Child Health (MCH) and Immunization Performance Models."""

from pydantic import BaseModel, Field


class MaternalCohortCreate(BaseModel):
    """Monthly maternal health metrics submitted by PHC/CHC."""

    centre_id: str
    reporting_month: str = Field(..., description="YYYY-MM")
    anc_registered_total: int = Field(ge=0)
    anc_first_trimester: int = Field(ge=0)
    anc_four_plus_visits: int = Field(ge=0)
    high_risk_pregnancies_identified: int = Field(ge=0)
    severe_anaemia_cases: int = Field(ge=0, description="Hb < 7 g/dL")
    hypertensive_disorders_cases: int = Field(ge=0, description="Pre-eclampsia / eclampsia")
    institutional_deliveries: int = Field(ge=0)
    home_deliveries: int = Field(ge=0)
    c_section_deliveries: int = Field(ge=0)
    maternal_deaths: int = Field(ge=0, default=0)


class MaternalCohortResponse(MaternalCohortCreate):
    """Persisted maternal cohort with computed indicators."""

    id: str
    centre_name: str
    block: str
    institutional_delivery_rate_percent: float
    early_registration_rate_percent: float


class ImmunizationAntigenMetric(BaseModel):
    """Specific vaccine coverage and drop-out rates."""

    antigen: str
    target_infants: int
    doses_administered: int
    coverage_percent: float
    dropouts_from_previous_dose: int = 0
    dropout_rate_percent: float = 0.0


class ImmunizationCohortResponse(BaseModel):
    """Full immunization cohort metrics for a facility."""

    centre_id: str
    centre_name: str
    block: str
    reporting_month: str
    full_immunization_coverage_percent: float
    antigens: list[ImmunizationAntigenMetric]


class MCHSummaryResponse(BaseModel):
    """District-wide MCH & RCH performance overview."""

    total_pregnant_women_tracked: int
    total_high_risk_pregnancies: int
    district_institutional_delivery_percent: float
    district_full_immunization_percent: float
    block_immunization_rankings: list[dict[str, str]]
    high_priority_centres: list[dict[str, str]]
