"""Pydantic V2 Domain Models for SmartHealth."""

from backend.app.models.ai import (
    AIAdvisoryRequest,
    AIAdvisoryResponse,
    AIChatRequest,
    AIChatResponse,
)
from backend.app.models.auth import TokenResponse, UserLoginRequest, UserProfileResponse
from backend.app.models.centre import (
    CentreCreate,
    CentreResponse,
    FacilityType,
    OperationalStatus,
)
from backend.app.models.inventory import (
    StockItemCreate,
    StockItemResponse,
    StockTransferCreate,
    StockTransferResponse,
)
from backend.app.models.mch import MaternalCohortResponse, MCHSummaryResponse
from backend.app.models.operations import (
    DoctorAttendanceCreate,
    DoctorAttendanceResponse,
    FacilityVulnerabilityScore,
    FootfallLogCreate,
    FootfallLogResponse,
    LabTestAuditCreate,
    LabTestAuditResponse,
    OperationsSummaryResponse,
)
from backend.app.models.surveillance import (
    DiseaseType,
    OutbreakAlert,
    SyndromicReportCreate,
)

__all__ = [
    "TokenResponse",
    "UserLoginRequest",
    "UserProfileResponse",
    "CentreCreate",
    "CentreResponse",
    "FacilityType",
    "OperationalStatus",
    "DiseaseType",
    "OutbreakAlert",
    "SyndromicReportCreate",
    "StockItemCreate",
    "StockItemResponse",
    "StockTransferCreate",
    "StockTransferResponse",
    "MaternalCohortResponse",
    "MCHSummaryResponse",
    "AIChatRequest",
    "AIChatResponse",
    "AIAdvisoryRequest",
    "AIAdvisoryResponse",
    "FootfallLogCreate",
    "FootfallLogResponse",
    "DoctorAttendanceCreate",
    "DoctorAttendanceResponse",
    "LabTestAuditCreate",
    "LabTestAuditResponse",
    "FacilityVulnerabilityScore",
    "OperationsSummaryResponse",
]
