"""Booking management routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.middleware.auth import get_current_user
from src.models.responses import AllUsersResponse, UserDetailResponse
from src.services.users.get_all_users import get_all_users
from src.services.users.get_user import get_user

from src.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["admin-users"])


@router.get("", response_model=AllUsersResponse)
async def get_all_users_endpoint(_: dict = Depends(get_current_user)):
    """Get all users with their details."""
    try:
        users = await get_all_users()
        return AllUsersResponse(users=users)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user_endpoint(user_id: str, _: dict = Depends(get_current_user)):
    """Get a user by their ID."""
    try:
        user = await get_user(user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to retrieve users")
