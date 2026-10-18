"""Diagnostic Test Availability Repository for laboratory audits."""

from backend.app.models.operations import LabTestAuditCreate, LabTestAuditResponse, TestAvailability
from backend.app.repositories.base import BaseRepository
from backend.app.services.operations_service import get_operations_service


class TestAvailabilityRepository(BaseRepository):
    """Firestore repository for diagnostic test availability audits."""

    __test__ = False

    collection_name = "test_availability_audits"

    async def get_latest_audit(
        self, centre_id: str, date: str | None = None
    ) -> LabTestAuditResponse | None:
        """Fetch test audit for a specific date or latest."""
        service = get_operations_service()
        return await service.get_lab_test_audit_for_centre(centre_id=centre_id, date=date)

    async def list_audit_history(
        self, centre_id: str | None = None, limit: int = 90, days: int | None = None
    ) -> list[LabTestAuditResponse]:
        """List audit history up to 90 days."""
        actual_limit = days or limit
        raw_list = await self.list_all()
        if centre_id:
            raw_list = [a for a in raw_list if a.get("centre_id") == centre_id]

        raw_list.sort(key=lambda x: x.get("audit_date", ""), reverse=True)
        centres = {c["id"]: c for c in await self.db.list_documents("centres")}

        results: list[LabTestAuditResponse] = []
        for a in raw_list[:actual_limit]:
            doc = a.copy()
            c = centres.get(doc.get("centre_id", ""), {})
            doc.setdefault("centre_name", c.get("name", "PHC Facility") if c else "PHC Facility")
            doc.setdefault("block", c.get("block", "Central") if c else "Central")
            results.append(LabTestAuditResponse(**doc))

        return results

    async def list_unavailable_tests(self, centre_id: str) -> list[TestAvailability]:
        """Fetch list of diagnostic tests currently out of stock or with broken equipment."""
        latest = await self.get_latest_audit(centre_id)
        if not latest:
            return []

        out_of_stock: list[TestAvailability] = []
        for t in latest.tests:
            is_available = (t.status.value == "available") and t.equipment_functional
            if not is_available:
                out_of_stock.append(
                    TestAvailability(
                        centre_id=centre_id,
                        date=latest.audit_date,
                        test_name=t.test_name,
                        available=False,
                        category=t.category,
                        kits_remaining=t.kits_remaining,
                    )
                )

        return out_of_stock

    async def record_audit(self, data: LabTestAuditCreate) -> LabTestAuditResponse:
        """Create or update daily diagnostic test audit."""
        service = get_operations_service()
        return await service.record_lab_test_audit(data)
