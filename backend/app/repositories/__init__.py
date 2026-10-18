"""Firestore Repositories Package for SmartHealth."""

from backend.app.repositories.attendance_repository import DoctorAttendanceRepository
from backend.app.repositories.base import BaseRepository
from backend.app.repositories.bed_repository import BedStatusRepository
from backend.app.repositories.centre_repository import CentreRepository
from backend.app.repositories.footfall_repository import DailyFootfallRepository
from backend.app.repositories.stock_repository import MedicineStockRepository
from backend.app.repositories.test_repository import TestAvailabilityRepository

__all__ = [
    "BaseRepository",
    "CentreRepository",
    "MedicineStockRepository",
    "DailyFootfallRepository",
    "BedStatusRepository",
    "DoctorAttendanceRepository",
    "TestAvailabilityRepository",
]
