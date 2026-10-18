"""Liveness and Readiness Health Check Endpoints."""

from typing import Any

from fastapi import APIRouter, Depends

from backend.app.config import get_settings
from backend.app.database import DatabaseClient, get_db

router = APIRouter(tags=["Health"])


@router.get("/healthz")
async def health_check() -> dict[str, str]:
    """Basic container liveness probe."""
    return {"status": "ok", "service": "SmartHealth API"}


@router.get("/readyz")
async def readiness_check(db: DatabaseClient = Depends(get_db)) -> dict[str, Any]:
    """Readiness probe verifying database connectivity and configuration readiness."""
    settings = get_settings()
    db_ready = True
    try:
        # Check database read
        await db.list_documents("centres")
    except Exception:
        db_ready = False

    return {
        "status": "ready" if db_ready else "degraded",
        "database_connected": db_ready,
        "environment": settings.environment,
        "gemini_configured": bool(settings.gemini_api_key),
        "app_name": settings.app_name,
    }
