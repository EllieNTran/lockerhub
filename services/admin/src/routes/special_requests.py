"""Special request management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.requests import ReviewSpecialRequestRequest
from src.models.responses import (
    AllSpecialRequestsResponse,
    ReviewSpecialRequestResponse,
    SpecialRequestDetailResponse,
)
from src.services.special_requests.get_all_special_requests import (
    get_all_special_requests,
)
from src.services.special_requests.review_special_request import review_special_request

router = APIRouter(prefix="/special-requests", tags=["admin-special-requests"])


@router.get("/", response_model=AllSpecialRequestsResponse)
async def get_all_special_requests_endpoint(
    _: dict = Depends(get_current_user),
):
    """Get all special requests."""
    try:
        requests = await get_all_special_requests()
        return AllSpecialRequestsResponse(
            requests=[SpecialRequestDetailResponse(**req) for req in requests]
        )
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to retrieve special requests"
        )


@router.post("/{request_id}/review", response_model=ReviewSpecialRequestResponse)
async def review_special_request_endpoint(
    request_id: int,
    request: ReviewSpecialRequestRequest,
    current_user: dict = Depends(get_current_user),
):
    """Review a special request (approve/reject)."""
    try:
        await review_special_request(
            request.status, current_user["user_id"], request_id
        )
        return ReviewSpecialRequestResponse(
            request_id=request_id,
            message=f"Special request {request.status}",
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to review special request")
