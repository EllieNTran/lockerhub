"""Date utility functions for analytics services."""

from datetime import date, timedelta
from typing import Tuple
from src.connectors.db import db

PERIOD_DAYS = {
    "last_7_days": 7,
    "last_14_days": 14,
    "last_month": 30,
    "last_3_months": 90,
    "last_6_months": 180,
    "last_year": 365,
    "last_2_years": 730,
    "all_time": None,
}


async def get_date_range(period: str = "last_month") -> Tuple[date, date]:
    """
    Calculate start and end dates based on the specified period.

    Args:
        period: Time period to analyze (e.g., 'last_7_days', 'all_time')

    Returns:
        Tuple of (start_date, end_date)
    """
    end_date = date.today()

    if period == "all_time":
        earliest_booking = await db.fetchval(
            "SELECT MIN(start_date) FROM lockerhub.bookings"
        )
        start_date = earliest_booking if earliest_booking else end_date
    else:
        days = PERIOD_DAYS[period]
        start_date = end_date - timedelta(days=days - 1)

    return start_date, end_date
