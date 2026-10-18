"""Operations Models: Patient Footfall, Doctor Attendance, Lab Test Audits, and Vulnerability Scoring."""

from enum import Enum

from pydantic import BaseModel, Field


class FootfallStatus(str, Enum):
    """OPD queue congestion classification."""

    NORMAL = "normal"
    HIGH = "high"
    OVERCROWDED = "overcrowded"


class AttendanceStatus(str, Enum):
    """Doctor attendance and shift state."""

    PRESENT = "present"
    ON_LEAVE = "on_leave"
    EMERGENCY_DEPUTATION = "emergency_deputation"
    UNNOTIFIED_ABSENT = "unnotified_absent"


class TestStatus(str, Enum):
    """Diagnostic readiness of individual lab tests."""

    __test__ = False

    AVAILABLE = "available"
    LOW_REAGENT = "low_reagent"
    OUT_OF_STOCK = "out_of_stock"
    EQUIPMENT_DOWN = "equipment_down"


# ---------------------------------------------------------------------------
# Patient Footfall Models
# ---------------------------------------------------------------------------


class FootfallLogCreate(BaseModel):
    """Daily outpatient (OPD) and emergency department census."""

    centre_id: str
    date: str = Field(..., description="YYYY-MM-DD")
    total_opd_visits: int = Field(ge=0, description="Total general OPD footfall")
    emergency_visits: int = Field(ge=0, default=0, description="Casualty / emergency arrivals")
    maternal_child_visits: int = Field(
        ge=0, default=0, description="ANC/PNC/Immunization clinic footfall"
    )
    ncd_visits: int = Field(
        ge=0, default=0, description="Non-communicable diseases clinic (diabetes, hypertension)"
    )
    average_wait_time_minutes: int = Field(
        ge=0, default=20, description="Estimated patient wait time in minutes"
    )


class FootfallLogResponse(FootfallLogCreate):
    """Persisted daily footfall log with computed capacity metrics."""

    id: str
    centre_name: str
    block: str
    capacity_saturation_percent: float
    status: FootfallStatus


class DailyFootfall(FootfallLogResponse):
    """Convenience alias for daily footfall record."""

    pass


class BedStatus(BaseModel):
    """Inpatient bed status and occupancy metrics."""

    centre_id: str
    date: str = Field(..., description="YYYY-MM-DD")
    total: int = Field(ge=0, description="Total functional beds")
    occupied: int = Field(ge=0, description="Occupied beds")
    available: int = Field(ge=0, description="Vacant available beds")
    occupancy_percent: float = Field(ge=0.0)
    centre_name: str | None = None
    block: str | None = None


# ---------------------------------------------------------------------------
# Doctor Attendance Models
# ---------------------------------------------------------------------------


class DoctorAttendanceEntry(BaseModel):
    """Single doctor shift record."""

    doctor_id: str
    name: str
    designation: str = Field(default="Medical Officer")
    shift: str = Field(default="morning", description="morning | evening | night | general")
    status: AttendanceStatus = Field(default=AttendanceStatus.PRESENT)
    check_in_time: str | None = Field(default=None, description="HH:MM:SS format")


class DoctorAttendanceCreate(BaseModel):
    """Daily roster attendance submission for a health centre."""

    centre_id: str
    date: str = Field(..., description="YYYY-MM-DD")
    doctors: list[DoctorAttendanceEntry]


class DoctorAttendanceResponse(DoctorAttendanceCreate):
    """Persisted daily doctor attendance with computed metrics."""

    id: str
    centre_name: str
    block: str
    doctors_sanctioned: int
    doctors_present_today: int
    absence_rate_percent: float


# ---------------------------------------------------------------------------
# Lab Test Availability Models
# ---------------------------------------------------------------------------


class LabTestEntry(BaseModel):
    """Diagnostic test availability and reagent status."""

    test_name: str
    category: str = Field(
        default="communicable", description="communicable | haematology | biochemistry | maternal"
    )
    status: TestStatus = Field(default=TestStatus.AVAILABLE)
    kits_remaining: int = Field(ge=0, default=50)
    equipment_functional: bool = Field(default=True)


class LabTestAuditCreate(BaseModel):
    """Daily or weekly diagnostic readiness audit."""

    centre_id: str
    audit_date: str = Field(..., description="YYYY-MM-DD")
    tests: list[LabTestEntry]


class LabTestAuditResponse(LabTestAuditCreate):
    """Persisted diagnostic test audit record."""

    id: str
    centre_name: str
    block: str
    total_audited_tests: int
    available_tests: int
    availability_rate_percent: float


class TestAvailability(BaseModel):
    """Individual diagnostic test availability record."""

    __test__ = False

    centre_id: str
    date: str
    test_name: str
    available: bool
    category: str = "general"
    kits_remaining: int = 0


# ---------------------------------------------------------------------------
# Composite Facility Vulnerability Scoring Models
# ---------------------------------------------------------------------------


class FacilityVulnerabilityScore(BaseModel):
    """Multi-dimensional deficit score flagging underperforming or stressed health centres."""

    centre_id: str
    centre_name: str
    centre_name_hi: str
    block: str
    facility_type: str
    vulnerability_score: float = Field(
        ge=0.0, le=100.0, description="0 (healthy) to 100 (critical deficit)"
    )
    risk_level: str = Field(description="low | moderate | high | critical")
    contributing_factors: list[str]
    recommended_interventions: list[str]
    stockout_rate: float
    doctor_absence_rate: float
    bed_saturation_rate: float
    test_stockout_rate: float
    immunization_dropout_rate: float


class OperationsSummaryResponse(BaseModel):
    """District-wide aggregated operations scorecard."""

    total_daily_opd_footfall: int
    average_district_wait_time_mins: int
    district_bed_occupancy_percent: float
    total_beds_occupied: int
    total_beds_available: int
    district_doctor_attendance_percent: float
    doctors_on_duty_today: int
    doctors_sanctioned_total: int
    district_test_availability_percent: float
    underperforming_centres_count: int
    top_vulnerable_centres: list[FacilityVulnerabilityScore]


# ---------------------------------------------------------------------------
# Smart Staff Deputation Models (Milestone 3)
# ---------------------------------------------------------------------------


class DeputationCandidate(BaseModel):
    """Available doctor from a nearby facility eligible for temporary deputation."""

    donor_centre_id: str
    donor_centre_name: str
    donor_centre_name_hi: str
    donor_block: str
    doctor_id: str
    doctor_name: str
    designation: str
    distance_km: float
    estimated_transit_mins: int
    doctors_on_duty_at_donor: int


class DeputationRecommendation(BaseModel):
    """Clinical recommendation to address acute doctor absence at a target centre."""

    target_centre_id: str
    target_centre_name: str
    target_centre_name_hi: str
    target_block: str
    absence_rate_percent: float
    doctors_present: int
    doctors_sanctioned: int
    top_candidate: DeputationCandidate | None = None
    candidates: list[DeputationCandidate] = Field(default_factory=list)
    distance_algorithm: str = "Haversine (Great-Circle)"
    gemini_justification: str = ""
    gemini_justification_hi: str = ""


class ExecuteDeputationRequest(BaseModel):
    """Payload to confirm and log a doctor temporary deputation."""

    target_centre_id: str
    donor_centre_id: str
    doctor_id: str
    doctor_name: str
    date: str = Field(description="YYYY-MM-DD")
    reason: str = "Acute absenteeism load rebalancing"


class ExecuteDeputationResponse(BaseModel):
    """Audit response confirming doctor deputation."""

    deputation_id: str
    status: str
    target_centre_id: str
    donor_centre_id: str
    doctor_name: str
    date: str
    message: str
