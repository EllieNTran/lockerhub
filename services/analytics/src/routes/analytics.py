"""Analytics routes"""

from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from src.logger import logger
from src.middleware.auth import get_current_user
from src.services.get_locker_usage import get_locker_usage

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/locker-usage")
async def get_locker_usage_endpoint(
    period: Literal[
        "today",
        "last_7_days",
        "last_14_days",
        "last_month",
        "last_3_months",
        "last_6_months",
        "last_year",
        "last_2_years",
        "all_time",
    ] = Query(default="last_month", description="Time period to analyze"),
    floor_id: Optional[str] = Query(None, description="ID of the floor to filter by"),
    department_id: Optional[str] = Query(
        None, description="ID of the department to filter by"
    ),
    _: dict = Depends(get_current_user),
):
    """Get locker usage analytics."""
    try:
        result = await get_locker_usage(
            period=period, floor_id=floor_id, department_id=department_id
        )
        logger.info("Retrieved locker usage analytics")
        return result
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve locker usage analytics"
        )
