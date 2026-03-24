"""Get all open and closed floors, including their total locker count."""

import json
from src.logger import logger
from src.connectors.db import db
from src.models.responses import FloorResponse, AllFloorsResponse

GET_FLOORS_QUERY = """
SELECT 
    f.floor_id,
    f.floor_number,
    f.status,
    f.created_at,
    f.updated_at,
    COUNT(DISTINCT l.locker_id) AS total_lockers,
    json_agg(
        DISTINCT jsonb_build_object(
            'closure_id', fc.closure_id,
            'start_date', fc.start_date,
            'end_date', fc.end_date,
            'reason', fc.reason
        )
    ) FILTER (WHERE fc.closure_id IS NOT NULL) AS closures
FROM lockerhub.floors f
LEFT JOIN lockerhub.lockers l ON f.floor_id = l.floor_id
LEFT JOIN lockerhub.floor_closures fc ON f.floor_id = fc.floor_id 
    AND (fc.end_date IS NULL OR fc.end_date >= CURRENT_DATE)
    AND fc.start_date <= CURRENT_DATE + INTERVAL '30 days'
GROUP BY f.floor_id, f.floor_number, f.status, f.created_at, f.updated_at
ORDER BY 
    CASE 
        WHEN f.floor_number ~ '^[0-9]+' THEN 
            SUBSTRING(f.floor_number FROM '^[0-9]+')::INTEGER
        ELSE 999
    END,
    f.floor_number
"""


async def get_all_floors() -> AllFloorsResponse:
    """
    Get all floors, including their total locker count and any closures upcoming in the next month.

    Returns:
        A list of all floors
    """
    try:
        floors = await db.fetch(GET_FLOORS_QUERY)
        logger.info("Retrieved floors")

        floor_list = []
        for floor in floors:
            floor_dict = dict(floor)
            if floor_dict.get("closures") and isinstance(floor_dict["closures"], str):
                floor_dict["closures"] = json.loads(floor_dict["closures"])
            floor_list.append(FloorResponse(**floor_dict))

        return AllFloorsResponse(floors=floor_list)
    except Exception as e:
        logger.error(f"Error retrieving floors: {e}")
        raise
