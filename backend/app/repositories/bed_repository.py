"""Bed Status Repository for inpatient bed availability tracking."""

from backend.app.models.operations import BedStatus
from backend.app.repositories.base import BaseRepository


class BedStatusRepository(BaseRepository):
    """Firestore repository for bed availability and occupancy status."""

    collection_name = "bed_status_logs"

    async def get_latest_bed_status(self, centre_id: str) -> BedStatus | None:
        """Fetch current bed status for a health centre."""
        # Check explicit bed log or derive from centre infrastructure
        all_logs = await self.list_all()
        relevant = [b for b in all_logs if b.get("centre_id") == centre_id]
        if relevant:
            relevant.sort(key=lambda x: x.get("date", ""), reverse=True)
            return BedStatus(**relevant[0])

        # Fallback to centre document
        centre_doc = await self.db.get_document("centres", centre_id)
        if not centre_doc:
            return None

        infra = centre_doc.get("infrastructure", {})
        total = infra.get("beds_total", 6)
        occupied = infra.get("beds_occupied", 0)
        available = max(0, total - occupied)
        occ_pct = round((occupied / total) * 100, 1) if total > 0 else 0.0

        return BedStatus(
            centre_id=centre_id,
            date="2026-10-18",
            total=total,
            occupied=occupied,
            available=available,
            occupancy_percent=occ_pct,
        )

    async def list_district_bed_status(self) -> list[BedStatus]:
        """Fetch bed status for all facilities in the district."""
        centres = await self.db.list_documents("centres")
        results: list[BedStatus] = []
        for c in centres:
            status = await self.get_latest_bed_status(c["id"])
            if status:
                results.append(status)
        return results

    async def save_bed_status(self, status: BedStatus) -> None:
        """Persist bed status record."""
        doc_id = f"bed_{status.centre_id}_{status.date}"
        await self.save(doc_id, status.model_dump(), merge=True)
        # Synchronize back to centre infrastructure document
        await self.db.set_document(
            "centres",
            status.centre_id,
            {
                "infrastructure": {
                    "beds_total": status.total,
                    "beds_occupied": status.occupied,
                }
            },
            merge=True,
        )
