"""Health Centre (PHC/CHC/SC) Data Models."""

from enum import Enum

from pydantic import BaseModel, Field


class FacilityType(str, Enum):
    """Tier of health facility."""

    PHC = "PHC"  # Primary Health Centre
    CHC = "CHC"  # Community Health Centre (referral unit)
    SC_HWC = "SC_HWC"  # Sub-Centre / Ayushman Arogya Mandir


class OperationalStatus(str, Enum):
    """Overall operational health status."""

    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"


class StaffingSummary(BaseModel):
    """Sanctioned and in-position staff counts."""

    medical_officers_sanctioned: int = Field(ge=0, default=2)
    medical_officers_in_position: int = Field(ge=0, default=2)
    specialists_sanctioned: int = Field(ge=0, default=0)
    specialists_in_position: int = Field(ge=0, default=0)
    staff_nurses_sanctioned: int = Field(ge=0, default=4)
    staff_nurses_in_position: int = Field(ge=0, default=3)
    pharmacists_sanctioned: int = Field(ge=0, default=1)
    pharmacists_in_position: int = Field(ge=0, default=1)
    lab_technicians_sanctioned: int = Field(ge=0, default=1)
    lab_technicians_in_position: int = Field(ge=0, default=1)
    anm_in_position: int = Field(ge=0, default=5)
    asha_workers: int = Field(ge=0, default=12)

    @property
    def total_vacancies(self) -> int:
        return (
            max(0, self.medical_officers_sanctioned - self.medical_officers_in_position)
            + max(0, self.specialists_sanctioned - self.specialists_in_position)
            + max(0, self.staff_nurses_sanctioned - self.staff_nurses_in_position)
            + max(0, self.pharmacists_sanctioned - self.pharmacists_in_position)
            + max(0, self.lab_technicians_sanctioned - self.lab_technicians_in_position)
        )


class InfrastructureSummary(BaseModel):
    """Physical infrastructure indicators."""

    beds_total: int = Field(ge=0, default=6)
    beds_occupied: int = Field(ge=0, default=2)
    cold_chain_functional: bool = Field(
        default=True, description="ILR and deep freezer operational"
    )
    cold_chain_temperature_c: float = Field(
        default=4.2, description="Current vaccine storage temp (°C)"
    )
    power_backup_functional: bool = Field(
        default=True, description="Generator / solar backup operational"
    )
    water_supply_24x7: bool = Field(default=True)
    ambulance_available: bool = Field(default=True)
    lab_testing_active: bool = Field(default=True)


class CentreBase(BaseModel):
    """Base schema for Health Facility."""

    name: str = Field(..., min_length=2, max_length=100)
    name_hi: str = Field(..., min_length=2, max_length=100, description="Hindi title of facility")
    facility_type: FacilityType = Field(default=FacilityType.PHC)
    district: str = Field(default="Pune")
    block: str = Field(..., min_length=2, max_length=50, description="Administrative block/taluka")
    pincode: str = Field(default="411001", max_length=10)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    catchment_population: int = Field(default=25000, ge=100)
    in_charge_doctor: str = Field(..., min_length=2, max_length=80)
    phone_number: str = Field(default="+91 20 2612 0000")
    operational_status: OperationalStatus = Field(default=OperationalStatus.NORMAL)
    staffing: StaffingSummary = Field(default_factory=StaffingSummary)
    infrastructure: InfrastructureSummary = Field(default_factory=InfrastructureSummary)


class CentreCreate(CentreBase):
    """Create Health Centre payload."""

    pass


class CentreUpdate(BaseModel):
    """Update Health Centre payload (partial updates allowed)."""

    name: str | None = None
    name_hi: str | None = None
    in_charge_doctor: str | None = None
    phone_number: str | None = None
    operational_status: OperationalStatus | None = None
    staffing: StaffingSummary | None = None
    infrastructure: InfrastructureSummary | None = None


class CentreResponse(CentreBase):
    """Full Health Centre response with identifier."""

    id: str
    active_alerts_count: int = 0
    stockout_count: int = 0


class CentreListResponse(BaseModel):
    """Paginated list of centres."""

    page: int
    page_size: int
    total: int
    items: list[CentreResponse]
    stats_summary: dict[str, int]
