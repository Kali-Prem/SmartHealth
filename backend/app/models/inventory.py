"""Medicine, Vaccine and Supply Chain (EDL) Data Models."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class DrugCategory(str, Enum):
    """Essential Drug List (EDL) therapeutic category."""

    ANTIBIOTIC = "antibiotic"
    VACCINE = "vaccine"
    ANALGESIC = "analgesic"
    EMERGENCY = "emergency"
    IV_FLUID = "iv_fluid"
    ANTI_VENOM = "anti_venom"
    MATERNAL_CARE = "maternal_care"
    CHRONIC_NCD = "chronic_ncd"


class StockStatus(str, Enum):
    """Categorization of stock safety."""

    ADEQUATE = "adequate"
    LOW = "low"
    STOCKOUT = "stockout"
    EXPIRING_SOON = "expiring_soon"


class TransferStatus(str, Enum):
    """Inter-facility stock transfer lifecycle."""

    PENDING = "pending"
    APPROVED = "approved"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    REJECTED = "rejected"


class StockItemBase(BaseModel):
    """Base schema for an inventory item in a health centre."""

    centre_id: str
    drug_name: str = Field(..., min_length=2, max_length=100)
    drug_name_hi: str = Field(..., min_length=2, max_length=100)
    category: DrugCategory
    batch_number: str = Field(..., min_length=2, max_length=50)
    unit: str = Field(default="vials", description="vials, tablets, ampoules, bottles, strips")
    current_stock: int = Field(ge=0)
    minimum_reorder_level: int = Field(ge=0, description="MRL threshold triggering reorder alert")
    expiry_date: str = Field(..., description="YYYY-MM-DD")
    is_cold_chain: bool = Field(default=False)
    storage_temp_range: str | None = Field(default=None, description="e.g. 2°C - 8°C")


class StockItemCreate(StockItemBase):
    """Create new stock batch item."""

    pass


class StockItemResponse(StockItemBase):
    """Persisted stock item with computed status."""

    id: str
    days_to_expiry: int
    days_of_stock_remaining: int
    stock_status: StockStatus

    # Compatibility aliases for frontend clients
    item_name: str | None = None
    item_name_hi: str | None = None
    reorder_level: int | None = None
    status: str | None = None
    days_of_supply_remaining: int | None = None
    centre_name: str | None = None
    block: str | None = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data_copy = dict(data)
            drug_name = data_copy.get("drug_name") or data_copy.get("item_name")
            drug_name_hi = data_copy.get("drug_name_hi") or data_copy.get("item_name_hi")
            mrl = (
                data_copy.get("minimum_reorder_level")
                if data_copy.get("minimum_reorder_level") is not None
                else data_copy.get("reorder_level", 0)
            )
            stock_status = data_copy.get("stock_status") or data_copy.get("status")
            days_remaining = (
                data_copy.get("days_of_stock_remaining")
                if data_copy.get("days_of_stock_remaining") is not None
                else data_copy.get("days_of_supply_remaining", 0)
            )

            if drug_name:
                data_copy["drug_name"] = drug_name
                data_copy["item_name"] = drug_name
            if drug_name_hi:
                data_copy["drug_name_hi"] = drug_name_hi
                data_copy["item_name_hi"] = drug_name_hi
            data_copy["minimum_reorder_level"] = mrl
            data_copy["reorder_level"] = mrl
            if stock_status is not None:
                data_copy["stock_status"] = stock_status
                data_copy["status"] = (
                    stock_status.value if hasattr(stock_status, "value") else str(stock_status)
                )
            data_copy["days_of_stock_remaining"] = days_remaining
            data_copy["days_of_supply_remaining"] = days_remaining
            return data_copy
        return data


class StockTransferCreate(BaseModel):
    """Initiate an inter-facility stock rebalancing transfer."""

    source_centre_id: str
    target_centre_id: str
    drug_name: str
    quantity: int = Field(gt=0)
    reason: str = Field(default="Emergency stockout prevention", max_length=200)


class StockTransferResponse(BaseModel):
    """Stock transfer tracking record."""

    id: str
    source_centre_id: str
    source_centre_name: str
    target_centre_id: str
    target_centre_name: str
    drug_name: str
    quantity: int
    status: TransferStatus = TransferStatus.PENDING
    created_at: str
    reason: str
    updated_at: str | None = None


class StockForecastItem(BaseModel):
    """AI predicted demand for 30-60 day horizon."""

    drug_name: str
    drug_name_hi: str
    category: DrugCategory
    current_district_stock: int
    predicted_monthly_consumption: int
    procurement_recommendation: int
    risk_level: str  # "high", "medium", "safe"
    rationale: str


class InventorySummaryResponse(BaseModel):
    """District inventory overview."""

    total_tracked_medicines: int
    total_stockouts: int
    critical_vaccine_stockouts: int
    items_expiring_within_60d: int
    stock_by_category: dict[str, int]
    urgent_alerts: list[StockItemResponse]
    active_transfers: list[StockTransferResponse]


class EarlyStockoutWarning(BaseModel):
    """Early stockout warning identifying drugs depleting rapidly."""

    centre_id: str
    centre_name: str
    centre_name_hi: str
    block: str
    drug_name: str
    drug_name_hi: str
    category: str
    current_stock: int
    daily_burn_rate: float
    days_of_supply_remaining: int
    stockout_in_days: int
    urgency: str  # "immediate" (< 3 days), "imminent" (< 7 days), "warning" (< 14 days)
    recommended_order_quantity: int


class EarlyStockoutReport(BaseModel):
    """Summary of district early stockout warnings with Gemini advisory."""

    total_warning_items: int
    critical_immediate_count: int
    imminent_7d_count: int
    warnings: list[EarlyStockoutWarning]
    gemini_epidemiology_advisory: str = ""
    gemini_epidemiology_advisory_hi: str = ""


# ---------------------------------------------------------------------------
# Haversine + Gemini Redistribution Models
# ---------------------------------------------------------------------------


class RebalanceCandidate(BaseModel):
    """Ranked donor facility identified via Haversine distance and surplus analysis."""

    donor_centre_id: str
    donor_centre_name: str
    donor_centre_name_hi: str
    donor_block: str
    latitude: float
    longitude: float
    distance_km: float
    estimated_transit_mins: int
    current_stock: int
    reorder_level: int
    surplus_available: int
    recommended_transfer_quantity: int
    donor_remaining_stock: int
    expiry_date: str
    suitability_score: float


class RebalanceRequest(BaseModel):
    """Request payload to optimize peer medicine transfer."""

    target_centre_id: str
    drug_name: str
    language: str = "en"


class RebalanceOptimizationResponse(BaseModel):
    """Result of Haversine nearest-surplus search paired with Gemini clinical justification."""

    target_centre_id: str
    target_centre_name: str
    target_centre_name_hi: str
    target_block: str
    drug_name: str
    deficit_quantity: int
    top_donor: RebalanceCandidate | None
    candidates: list[RebalanceCandidate]
    distance_algorithm: str = "Haversine (Great-Circle)"
    gemini_explanation: str
    gemini_explanation_hi: str
    generated_at: str


class ExecuteRebalanceRequest(BaseModel):
    """Payload to atomically execute lateral transfer."""

    source_centre_id: str
    target_centre_id: str
    drug_name: str
    quantity: int = Field(gt=0)
    reason: str = "Lateral Haversine rebalance"


class ExecuteRebalanceResponse(BaseModel):
    """Outcome of atomic inventory balance adjustment."""

    transfer_id: str
    status: str
    drug_name: str
    quantity_transferred: int
    source_centre_id: str
    source_new_stock: int
    target_centre_id: str
    target_new_stock: int
    message: str
