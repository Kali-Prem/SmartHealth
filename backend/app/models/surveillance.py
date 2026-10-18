"""Disease Surveillance and Outbreak Early Warning Data Models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DiseaseType(str, Enum):
    """Monitored communicable and syndromic diseases under IDSP."""

    DENGUE = "dengue"
    MALARIA = "malaria"
    ACUTE_DIARRHEAL = "acute_diarrheal"
    VIRAL_FEVER = "viral_fever"
    RESPIRATORY_INFECTION = "respiratory_infection"
    CHOLERA = "cholera"
    TYPHOID = "typhoid"
    CHIKUNGUNYA = "chikungunya"
    SNAKEBITE = "snakebite"
    RABIES = "rabies"


class SeverityLevel(str, Enum):
    """Threshold escalation level."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    OUTBREAK = "outbreak"


class AlertStatus(str, Enum):
    """Investigation and containment status."""

    ACTIVE = "active"
    UNDER_INVESTIGATION = "under_investigation"
    CONTAINED = "contained"


class SyndromicReportCreate(BaseModel):
    """Daily or weekly syndromic case report submitted by PHC/CHC."""

    centre_id: str
    disease: DiseaseType
    new_cases: int = Field(ge=0, description="New cases diagnosed today")
    inpatient_admissions: int = Field(ge=0, default=0)
    deaths: int = Field(ge=0, default=0)
    reporting_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    notes: str | None = Field(default=None, max_length=500)


class SyndromicReportResponse(SyndromicReportCreate):
    """Persisted syndromic report."""

    id: str
    created_at: str
    reported_by: str


class OutbreakAlert(BaseModel):
    """Early warning anomaly alert generated when cases breach statistical thresholds."""

    id: str
    centre_id: str
    centre_name: str
    block: str
    disease: DiseaseType
    current_cases_7d: int
    baseline_cases_7d: float
    threshold_limit: float
    severity: SeverityLevel
    status: AlertStatus = AlertStatus.ACTIVE
    detected_at: str
    advisory_en: str
    advisory_hi: str
    containment_checklist: list[str] = Field(default_factory=list)


class OutbreakAlertUpdate(BaseModel):
    """Update alert status or add investigation notes."""

    status: AlertStatus | None = None
    investigation_notes: str | None = None


class DiseaseTrendPoint(BaseModel):
    """Time-series point for disease incidence."""

    date: str
    cases: int
    baseline: float
    threshold: float


class SurveillanceSummaryResponse(BaseModel):
    """District-wide surveillance dashboard statistics."""

    total_active_alerts: int
    critical_outbreaks: int
    most_prevalent_disease: str
    district_case_trend_7d: list[DiseaseTrendPoint]
    active_alerts: list[OutbreakAlert]
    disease_distribution: dict[str, int]
