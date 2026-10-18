"""SmartHealth FastAPI Application Entrypoint."""

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import get_settings
from backend.app.data.seed import seed_database
from backend.app.database import get_db
from backend.app.routers import (
    ai_router,
    auth_router,
    centres_router,
    health_router,
    inventory_router,
    mch_router,
    operations_router,
    surveillance_router,
)
from backend.app.security import RateLimiterMiddleware, SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle events."""
    # Seed database with realistic Indian health centre network
    db = get_db()
    await seed_database(db)
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Multilingual AI Platform for District Health Administrators managing PHCs/CHCs in India",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 1. Custom Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting Middleware
app.add_middleware(RateLimiterMiddleware, requests_per_minute=settings.rate_limit_per_minute)

# 3. CORS locked down
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Safe global exception handler avoiding internal traceback leaks."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred. Please contact the district administrator."
        },
    )


# Mount API routers
app.include_router(health_router)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(centres_router, prefix=settings.api_prefix)
app.include_router(operations_router, prefix=settings.api_prefix)
app.include_router(surveillance_router, prefix=settings.api_prefix)
app.include_router(inventory_router, prefix=settings.api_prefix)
app.include_router(mch_router, prefix=settings.api_prefix)
app.include_router(ai_router, prefix=settings.api_prefix)

# Serve Frontend static assets
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
dist_dir = os.path.join(frontend_dir, "dist")
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
elif os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


@app.get("/", include_in_schema=False)
async def serve_index() -> FileResponse:
    """Serve the main accessible Single Page Application."""
    dist_index = os.path.join(dist_dir, "index.html")
    src_index = os.path.join(frontend_dir, "index.html")
    target_index = dist_index if os.path.exists(dist_index) else src_index

    if os.path.exists(target_index):
        return FileResponse(target_index)
    return JSONResponse(
        content={"message": "SmartHealth API is running. Visit /docs for OpenAPI documentation."}
    )
