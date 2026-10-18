"""FastAPI routers package."""

from backend.app.routers.ai import router as ai_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.centres import router as centres_router
from backend.app.routers.health import router as health_router
from backend.app.routers.inventory import router as inventory_router
from backend.app.routers.mch import router as mch_router
from backend.app.routers.operations import router as operations_router
from backend.app.routers.surveillance import router as surveillance_router

__all__ = [
    "ai_router",
    "auth_router",
    "centres_router",
    "health_router",
    "inventory_router",
    "mch_router",
    "operations_router",
    "surveillance_router",
]
