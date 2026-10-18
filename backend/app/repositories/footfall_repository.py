"""Daily Footfall Repository for patient outpatient visit tracking."""

from backend.app.models.operations import DailyFootfall, FootfallLogCreate
from backend.app.repositories.base import BaseRepository
from backend.app.services.operations_service import get_operations_service


class DailyFootfallRepository(BaseRepository):
    """Firestore repository for patient footfall logs."""

    collection_name = "footfall_logs"

    async def get_by_date(self, centre_id: str, date: str) -> DailyFootfall | None:
        """Fetch footfall record for specific date and centre."""
        doc_id = f"footfall_{centre_id}_{date}"
        data = await self.get_by_id(doc_id)
        if not data:
            return None
        return DailyFootfall(**data)

    async def list_history(
        self, centre_id: str | None = None, limit: int = 90, days: int | None = None
    ) -> list[DailyFootfall]:
        """Fetch historical footfall logs up to 90 days."""
        actual_limit = days or limit
        service = get_operations_service()
        logs = await service.get_footfall_history(centre_id=centre_id, limit=actual_limit)
        return [DailyFootfall(**log.model_dump()) for log in logs]

    async def record_daily_footfall(self, data: FootfallLogCreate) -> DailyFootfall:
        """Create or update daily footfall record."""
        service = get_operations_service()
        res = await service.record_footfall(data)
        return DailyFootfall(**res.model_dump())
