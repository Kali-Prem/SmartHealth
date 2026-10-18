"""Centre Repository for PHC/CHC facilities."""

from backend.app.models.centre import CentreCreate, CentreResponse, FacilityType, OperationalStatus
from backend.app.repositories.base import BaseRepository


class CentreRepository(BaseRepository):
    """Firestore repository for health centres."""

    collection_name = "centres"

    async def get_centre(self, centre_id: str) -> CentreResponse | None:
        """Fetch centre by ID."""
        data = await self.get_by_id(centre_id)
        if not data:
            return None
        return CentreResponse(**data)

    async def list_centres(
        self,
        block: str | None = None,
        facility_type: FacilityType | None = None,
        status: OperationalStatus | None = None,
    ) -> list[CentreResponse]:
        """List centres with optional filtering."""
        raw_list = await self.list_all()
        results: list[CentreResponse] = []

        for item in raw_list:
            if block and item.get("block", "").lower() != block.lower():
                continue
            if facility_type and item.get("facility_type") != facility_type.value:
                continue
            if status and item.get("operational_status") != status.value:
                continue
            results.append(CentreResponse(**item))

        return results

    async def save_centre(self, centre_id: str, centre: CentreCreate) -> CentreResponse:
        """Create or update a centre."""
        data = centre.model_dump()
        data["id"] = centre_id
        await self.save(centre_id, data, merge=True)
        return CentreResponse(**data)
