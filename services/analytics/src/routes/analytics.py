"""Analytics routes"""

from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from src.logger import logger
from src.middleware.auth import get_current_user
from src.services.get_locker_usage import get_locker_usage
from src.services.get_top_departments import get_top_departments
from src.services.get_most_popular_floors import get_most_popular_floors

Period = Literal[
    "last_7_days",
    "last_14_days",
    "last_month",
    "last_3_months",
    "last_6_months",
    "last_year",
    "last_2_years",
    "all_time",
]

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/locker-usage")
async def get_locker_usage_endpoint(
    period: Period = Query(default="last_7_days", description="Time period to analyze"),
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


@router.get("/top-departments")
async def get_top_departments_endpoint(
    period: Period = Query(default="last_7_days", description="Time period to analyze"),
    floor_id: Optional[str] = Query(None, description="ID of the floor to filter by"),
    _: dict = Depends(get_current_user),
):
    """Get top 6 departments by locker occupancy."""
    try:
        result = await get_top_departments(period=period, floor_id=floor_id)
        logger.info("Retrieved top departments analytics")
        return result
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve top departments analytics"
        )


@router.get("/most-popular-floors")
async def get_most_popular_floors_endpoint(
    period: Period = Query(default="last_7_days", description="Time period to analyze"),
    department_id: Optional[str] = Query(
        None, description="ID of the department to filter by"
    ),
    _: dict = Depends(get_current_user),
):
    """Get top 6 floors by locker occupancy."""
    try:
        result = await get_most_popular_floors(
            period=period, department_id=department_id
        )
        logger.info("Retrieved most popular floors analytics")
        return result
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve most popular floors analytics"
        )
