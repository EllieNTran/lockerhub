import asyncpg
from typing import Optional
from contextlib import asynccontextmanager
from src.settings import settings
from src.logger import logger


class DatabasePool:
    """PostgreSQL connection pool manager."""

    def __init__(self):
        self._pool: Optional[asyncpg.Pool] = None

    async def connect(self) -> None:
        """Create and initialize the connection pool."""
        if self._pool is not None:
            logger.warning("Database pool already exists")
            return

        try:
            self._pool = await asyncpg.create_pool(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                min_size=settings.DB_MIN_POOL_SIZE,
                max_size=settings.DB_MAX_POOL_SIZE,
                command_timeout=60,
            )
            logger.info("Database pool created")
        except Exception:
            logger.error("Failed to create database pool")
            raise

    async def disconnect(self) -> None:
        """Close the connection pool."""
        if self._pool is None:
            logger.warning("No database pool to close")
            return

        try:
            await self._pool.close()
            self._pool = None
            logger.info("Database pool closed")
        except Exception:
            logger.error("Error closing database pool")
            raise

    def get_pool(self) -> asyncpg.Pool:
        """Get the connection pool instance."""
        if self._pool is None:
            raise RuntimeError("Database pool not initialized. Call connect() first.")
        return self._pool

    async def execute(self, query: str, *args) -> str:
        """Execute a query that doesn't return rows (INSERT, UPDATE, DELETE)."""
        async with self.get_pool().acquire() as connection:
            return await connection.execute(query, *args)

    async def fetch(self, query: str, *args) -> list:
        """Fetch multiple rows from the database."""
        async with self.get_pool().acquire() as connection:
            return await connection.fetch(query, *args)

    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch a single row from the database."""
        async with self.get_pool().acquire() as connection:
            return await connection.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        """Fetch a single value from the database."""
        async with self.get_pool().acquire() as connection:
            return await connection.fetchval(query, *args)

    @asynccontextmanager
    async def transaction(self):
        """Create a transaction context manager."""
        async with self.get_pool().acquire() as connection:
            async with connection.transaction():
                yield connection


db = DatabasePool()
