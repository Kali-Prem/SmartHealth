"""Medicine Stock Repository for inventory tracking and redistribution."""

from backend.app.models.inventory import (
    StockItemResponse,
    StockStatus,
)
from backend.app.repositories.base import BaseRepository
from backend.app.services.inventory_service import get_inventory_service


class MedicineStockRepository(BaseRepository):
    """Firestore repository for medicine stock."""

    collection_name = "inventory"

    async def get_stock_item(self, item_id: str) -> StockItemResponse | None:
        """Fetch stock item by ID."""
        data = await self.get_by_id(item_id)
        if not data:
            return None
        service = get_inventory_service()
        computed = service._compute_item_metrics(data)
        return StockItemResponse(**computed)

    async def list_stock_by_centre(self, centre_id: str) -> list[StockItemResponse]:
        """List all stock items for a given health centre."""
        service = get_inventory_service()
        return await service.list_stock_items(centre_id=centre_id)

    async def list_critical_stockouts(self) -> list[StockItemResponse]:
        """List all stock items currently at zero stock."""
        service = get_inventory_service()
        return await service.list_stock_items(status_filter=StockStatus.STOCKOUT)

    async def update_stock_quantity(
        self, item_id: str, new_quantity: int
    ) -> StockItemResponse | None:
        """Directly adjust current stock quantity."""
        data = await self.get_by_id(item_id)
        if not data:
            return None
        data["current_stock"] = max(0, new_quantity)
        await self.save(item_id, data, merge=True)
        service = get_inventory_service()
        computed = service._compute_item_metrics(data)
        return StockItemResponse(**computed)
