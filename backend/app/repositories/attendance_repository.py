"""Doctor Attendance Repository for shift tracking and absenteeism monitoring."""

from backend.app.models.operations import DoctorAttendanceCreate, DoctorAttendanceResponse
from backend.app.repositories.base import BaseRepository
from backend.app.services.operations_service import get_operations_service


class DoctorAttendanceRepository(BaseRepository):
    """Firestore repository for doctor shift attendance records."""

    collection_name = "doctor_attendance_logs"

    async def get_daily_attendance(
        self, centre_id: str, date: str | None = None
    ) -> DoctorAttendanceResponse | None:
        """Fetch attendance record for a specific date or latest."""
        service = get_operations_service()
        return await service.get_doctor_attendance_for_centre(centre_id=centre_id, date=date)

    async def list_attendance_history(
        self, centre_id: str | None = None, limit: int = 90, days: int | None = None
    ) -> list[DoctorAttendanceResponse]:
        """List attendance logs across centres or for a single facility."""
        actual_limit = days or limit
        raw_list = await self.list_all()
        if centre_id:
            raw_list = [a for a in raw_list if a.get("centre_id") == centre_id]

        raw_list.sort(key=lambda x: x.get("date", ""), reverse=True)
        centres = {c["id"]: c for c in await self.db.list_documents("centres")}

        results: list[DoctorAttendanceResponse] = []
        for a in raw_list[:actual_limit]:
            doc = a.copy()
            c = centres.get(doc.get("centre_id", ""), {})
            doc.setdefault("centre_name", c.get("name", "PHC Facility") if c else "PHC Facility")
            doc.setdefault("block", c.get("block", "Central") if c else "Central")
            results.append(DoctorAttendanceResponse(**doc))

        return results

    async def record_attendance(self, data: DoctorAttendanceCreate) -> DoctorAttendanceResponse:
        """Create or update daily doctor attendance record."""
        service = get_operations_service()
        return await service.record_doctor_attendance(data)
