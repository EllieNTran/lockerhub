"""Admin routes package - combines all admin route modules."""

from fastapi import APIRouter

from .dashboard import router as dashboard_router
from .bookings import router as bookings_router
from .lockers import router as lockers_router
from .special_requests import router as special_requests_router
from .booking_rules import router as rules_router
from .audit import router as audit_router
from .users import router as users_router
from .scheduled_jobs import router as scheduled_jobs_router

router = APIRouter(prefix="/admin")

router.include_router(dashboard_router)
router.include_router(bookings_router)
router.include_router(lockers_router)
router.include_router(special_requests_router)
router.include_router(rules_router)
router.include_router(audit_router)
router.include_router(users_router)
router.include_router(scheduled_jobs_router)
