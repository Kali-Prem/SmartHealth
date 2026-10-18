"""Health Facility (PHC/CHC) Directory API Endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.database import DatabaseClient, get_db
from backend.app.models.centre import (
    CentreCreate,
    CentreListResponse,
    CentreResponse,
    CentreUpdate,
    FacilityType,
    OperationalStatus,
)
from backend.app.security import RoleEnum, get_current_user, require_role

router = APIRouter(prefix="/centres", tags=["Health Centres"])


@router.get("", response_model=CentreListResponse)
async def list_centres(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    block: str | None = None,
    facility_type: FacilityType | None = None,
    status: OperationalStatus | None = None,
    db: DatabaseClient = Depends(get_db),
) -> CentreListResponse:
    """List health centres with filtering, pagination and operational health indicators."""
    all_centres = await db.list_documents("centres")
    alerts = await db.list_documents("outbreak_alerts")
    inventory = await db.list_documents("inventory")

    # Map alerts and stockouts per centre
    alerts_per_centre: dict[str, int] = {}
    for a in alerts:
        if a.get("status") in ["active", "under_investigation"]:
            cid = a.get("centre_id")
            if cid:
                cid_str = str(cid)
                alerts_per_centre[cid_str] = alerts_per_centre.get(cid_str, 0) + 1

    stockouts_per_centre: dict[str, int] = {}
    for item in inventory:
        if item.get("current_stock", 0) <= 0:
            cid = item.get("centre_id")
            if cid:
                cid_str = str(cid)
                stockouts_per_centre[cid_str] = stockouts_per_centre.get(cid_str, 0) + 1

    filtered: list[CentreResponse] = []
    for c in all_centres:
        if block and c.get("block", "").lower() != block.lower():
            continue
        if facility_type and c.get("facility_type") != facility_type.value:
            continue
        if status and c.get("operational_status") != status.value:
            continue

        c_copy = c.copy()
        c_copy["active_alerts_count"] = alerts_per_centre.get(c["id"], 0)
        c_copy["stockout_count"] = stockouts_per_centre.get(c["id"], 0)
        filtered.append(CentreResponse(**c_copy))

    # Stats summary
    stats = {
        "total": len(all_centres),
        "normal": sum(
            1 for c in all_centres if c.get("operational_status") == OperationalStatus.NORMAL.value
        ),
        "warning": sum(
            1 for c in all_centres if c.get("operational_status") == OperationalStatus.WARNING.value
        ),
        "critical": sum(
            1
            for c in all_centres
            if c.get("operational_status") == OperationalStatus.CRITICAL.value
        ),
    }

    # Pagination slice
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    items_slice = filtered[start_idx:end_idx]

    return CentreListResponse(
        page=page,
        page_size=page_size,
        total=len(filtered),
        items=items_slice,
        stats_summary=stats,
    )


@router.get("/{centre_id}", response_model=CentreResponse)
async def get_centre_details(
    centre_id: str, db: DatabaseClient = Depends(get_db)
) -> CentreResponse:
    """Retrieve full telemetry, staffing and status for a single health centre."""
    c = await db.get_document("centres", centre_id)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Centre '{centre_id}' not found"
        )

    alerts = await db.list_documents("outbreak_alerts")
    inventory = await db.list_documents("inventory")

    active_alerts = sum(
        1
        for a in alerts
        if a.get("centre_id") == centre_id and a.get("status") in ["active", "under_investigation"]
    )
    stockouts = sum(
        1 for i in inventory if i.get("centre_id") == centre_id and i.get("current_stock", 0) <= 0
    )

    c_copy = c.copy()
    c_copy["active_alerts_count"] = active_alerts
    c_copy["stockout_count"] = stockouts
    return CentreResponse(**c_copy)


@router.post(
    "",
    response_model=CentreResponse,
    dependencies=[Depends(require_role([RoleEnum.DISTRICT_ADMIN]))],
)
async def create_centre(
    payload: CentreCreate, db: DatabaseClient = Depends(get_db)
) -> CentreResponse:
    """Register a new PHC/CHC facility (requires District Admin role)."""
    centre_id = f"fac_{payload.block.lower()[:3]}_{int(payload.latitude * 1000)}"
    data = payload.model_dump()
    data["id"] = centre_id
    await db.set_document("centres", centre_id, data)
    data["active_alerts_count"] = 0
    data["stockout_count"] = 0
    return CentreResponse(**data)


@router.put("/{centre_id}", response_model=CentreResponse)
async def update_centre(
    centre_id: str,
    payload: CentreUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: DatabaseClient = Depends(get_db),
) -> CentreResponse:
    """Update health centre data (Admin or assigned Centre Staff)."""
    # Enforce RBAC: staff can only update their own assigned centre
    if (
        current_user["role"] == RoleEnum.CENTRE_STAFF.value
        and current_user.get("centre_id") != centre_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff members are only permitted to update their assigned facility",
        )

    existing = await db.get_document("centres", centre_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Centre not found")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    await db.set_document("centres", centre_id, updates, merge=True)

    updated_doc = await db.get_document("centres", centre_id)
    if not updated_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Centre not found")
    updated_doc["active_alerts_count"] = 0
    updated_doc["stockout_count"] = 0
    return CentreResponse(**updated_doc)
