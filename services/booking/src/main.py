from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.connectors.db import db
from src.middleware.auth import fetch_jwks
from src.routes.bookings import router as bookings_router
from src.routes.scheduled_jobs import router as scheduled_jobs_router
from src.scheduled_jobs.scheduler import (
    start_scheduler,
    shutdown_scheduler,
    run_all_jobs_once,
)
from src.events.listener import start_event_listener, stop_event_listener
from src.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting booking service...")
    await db.connect()
    await fetch_jwks()  # Fetch JWKS at startup
    start_scheduler()  # Start scheduled jobs
    await start_event_listener()  # Start event listener for floor queue processing

    # Run all scheduled jobs once on startup to ensure consistent state
    logger.info("Running all scheduled jobs on startup...")
    await run_all_jobs_once()
    logger.info("Startup jobs completed")

    yield
    logger.info("Shutting down booking service...")
    await stop_event_listener()
    shutdown_scheduler()
    await db.disconnect()


app = FastAPI(
    title="LockerHub Booking Service",
    description="Booking service for LockerHub",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(bookings_router)
app.include_router(scheduled_jobs_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "booking"}
