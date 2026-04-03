from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.connectors.db import db
from src.middleware.auth import fetch_jwks
from src.routes import router as admin_router
from src.logger import logger
from src.scheduled_jobs.scheduler import start_scheduler, shutdown_scheduler
from src.scheduled_jobs.jobs.update_floor_statuses import update_floor_statuses


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting admin service...")
    await db.connect()
    await fetch_jwks()  # Fetch JWKS at startup
    start_scheduler()  # Start scheduled jobs

    # Run floor status update job on startup
    logger.info("Running floor status update job on startup...")
    try:
        await update_floor_statuses()
        logger.info("Floor status update job completed successfully on startup")
    except Exception as e:
        logger.error(
            f"Error running floor status update on startup: {e}", exc_info=True
        )

    yield
    logger.info("Shutting down admin service...")
    shutdown_scheduler()  # Stop scheduled jobs
    await db.disconnect()


app = FastAPI(
    title="LockerHub Admin Service",
    description="Admin service for LockerHub",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(admin_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "admin"}
