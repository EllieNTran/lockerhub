from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.connectors.db import db
from src.middleware.auth import fetch_jwks
from src.routes import router as admin_router
from src.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting admin service...")
    await db.connect()
    await fetch_jwks()  # Fetch JWKS at startup
    yield
    # Shutdown
    logger.info("Shutting down admin service...")
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
