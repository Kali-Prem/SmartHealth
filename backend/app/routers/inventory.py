from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.models.inventory import (
    DrugCategory,
    EarlyStockoutReport,
    ExecuteRebalanceRequest,
    ExecuteRebalanceResponse,
    InventorySummaryResponse,
    RebalanceOptimizationResponse,
    RebalanceRequest,
    StockForecastItem,
    StockItemCreate,
    StockItemResponse,
    StockStatus,
    StockTransferCreate,
    StockTransferResponse,
    TransferStatus,
)
from backend.app.security import require_admin_execution, require_write_permission
from backend.app.services.inventory_service import InventoryService, get_inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory & Supply Chain"])


@router.get("/summary", response_model=InventorySummaryResponse)
async def get_inventory_summary(
    service: InventoryService = Depends(get_inventory_service),
) -> InventorySummaryResponse:
    """Get district inventory indicators, stockout count, and urgent alerts."""
    return await service.get_inventory_summary()


@router.get("", response_model=list[StockItemResponse])
@router.get("/items", response_model=list[StockItemResponse])
async def list_stock_items(
    centre_id: str | None = None,
    category: DrugCategory | None = None,
    status_filter: StockStatus | None = None,
    service: InventoryService = Depends(get_inventory_service),
) -> list[StockItemResponse]:
    """List medicines and vaccines across centres with computed expiry and stockout indicators."""
    return await service.list_stock_items(
        centre_id=centre_id, category=category, status_filter=status_filter
    )


@router.post(
    "/items",
    response_model=StockItemResponse,
    dependencies=[Depends(require_write_permission)],
)
async def save_stock_item(
    payload: StockItemCreate,
    service: InventoryService = Depends(get_inventory_service),
) -> StockItemResponse:
    """Add or update an inventory batch item."""
    return await service.add_or_update_stock_item(payload)


@router.get("/rebalance-options")
async def get_rebalancing_options(
    target_centre_id: str = Query(..., description="PHC in deficit"),
    drug_name: str = Query(..., description="Medicine needed"),
    service: InventoryService = Depends(get_inventory_service),
) -> list[dict[str, Any]]:
    """Query nearby health centres with surplus stock capable of rebalancing to the deficit PHC."""
    return await service.find_rebalancing_options(target_centre_id, drug_name)


@router.post("/rebalance/optimize", response_model=RebalanceOptimizationResponse)
async def optimize_lateral_rebalance(
    payload: RebalanceRequest,
    service: InventoryService = Depends(get_inventory_service),
) -> RebalanceOptimizationResponse:
    """Run Haversine nearest-donor search and attach Gemini clinical justification."""
    try:
        return await service.optimize_lateral_rebalance(
            target_centre_id=payload.target_centre_id,
            drug_name=payload.drug_name,
            language=payload.language,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post(
    "/rebalance/execute",
    response_model=ExecuteRebalanceResponse,
    dependencies=[Depends(require_admin_execution)],
)
async def execute_lateral_rebalance(
    payload: ExecuteRebalanceRequest,
    service: InventoryService = Depends(get_inventory_service),
) -> ExecuteRebalanceResponse:
    """Atomically execute peer medicine transfer and update inventory stocks."""
    try:
        return await service.execute_lateral_rebalance(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post(
    "/transfer",
    response_model=StockTransferResponse,
    dependencies=[Depends(require_write_permission)],
)
async def create_stock_transfer(
    payload: StockTransferCreate,
    service: InventoryService = Depends(get_inventory_service),
) -> StockTransferResponse:
    """Initiate an inter-facility stock transfer to resolve a critical shortage."""
    return await service.create_stock_transfer(payload)


@router.patch(
    "/transfer/{transfer_id}",
    response_model=StockTransferResponse,
    dependencies=[Depends(require_write_permission)],
)
async def update_transfer_status(
    transfer_id: str,
    new_status: TransferStatus = Query(..., description="New lifecycle state"),
    service: InventoryService = Depends(get_inventory_service),
) -> StockTransferResponse:
    """Update transfer progress (approve, dispatch, or mark completed with automated inventory deduction)."""
    updated = await service.update_transfer_status(transfer_id, new_status)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transfer record not found"
        )
    return updated


@router.get("/forecast", response_model=list[StockForecastItem])
async def get_demand_forecast(
    service: InventoryService = Depends(get_inventory_service),
) -> list[StockForecastItem]:
    """Retrieve 30-day AI-driven demand forecast with seasonal epidemiology buffers."""
    return await service.get_forecast()


@router.get("/early-warnings", response_model=EarlyStockoutReport)
async def get_early_stockout_warnings(
    service: InventoryService = Depends(get_inventory_service),
) -> EarlyStockoutReport:
    """Retrieve district early stockout warning radar with burn-rate projections."""
    return await service.get_early_stockout_report()
