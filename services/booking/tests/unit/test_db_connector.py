"""Unit tests for database connector."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import asyncpg


class TestDatabasePool:
    """Tests for the DatabasePool connector."""

    @pytest.mark.asyncio
    async def test_connect_success(self):
        """
        Verify successful database pool creation.
        Mock asyncpg.create_pool to return a valid pool.
        Expect pool to be created and logged.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock(spec=asyncpg.Pool)
        pool = DatabasePool()

        with patch("asyncpg.create_pool", AsyncMock(return_value=mock_pool)):
            await pool.connect()

        assert pool._pool == mock_pool

    @pytest.mark.asyncio
    async def test_connect_already_exists(self):
        """
        Verify warning when pool already exists.
        Pool already initialized.
        Expect warning without creating new pool.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock(spec=asyncpg.Pool)
        pool = DatabasePool()
        pool._pool = mock_pool

        with patch("asyncpg.create_pool", AsyncMock()) as mock_create:
            await pool.connect()

        mock_create.assert_not_called()

    @pytest.mark.asyncio
    async def test_connect_failure(self):
        """
        Verify error handling when connection fails.
        Mock asyncpg.create_pool to raise exception.
        Expect exception to be raised and logged.
        """
        from src.connectors.db import DatabasePool

        pool = DatabasePool()

        with patch(
            "asyncpg.create_pool",
            AsyncMock(side_effect=Exception("Connection refused")),
        ):
            with pytest.raises(Exception, match="Connection refused"):
                await pool.connect()

        assert pool._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_success(self):
        """
        Verify successful pool disconnection.
        Pool exists and close succeeds.
        Expect pool to be closed and set to None.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_pool.close = AsyncMock()
        pool = DatabasePool()
        pool._pool = mock_pool

        await pool.disconnect()

        mock_pool.close.assert_called_once()
        assert pool._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_no_pool(self):
        """
        Verify warning when no pool exists to disconnect.
        Pool is None.
        Expect warning without errors.
        """
        from src.connectors.db import DatabasePool

        pool = DatabasePool()
        pool._pool = None

        await pool.disconnect()  # Should not raise

        assert pool._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_failure(self):
        """
        Verify error handling when disconnection fails.
        Mock pool.close to raise exception.
        Expect exception to be raised and logged.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_pool.close = AsyncMock(side_effect=Exception("Close failed"))
        pool = DatabasePool()
        pool._pool = mock_pool

        with pytest.raises(Exception, match="Close failed"):
            await pool.disconnect()

    @pytest.mark.asyncio
    async def test_get_pool_success(self):
        """
        Verify successful retrieval of pool.
        Pool is initialized.
        Expect pool instance to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock(spec=asyncpg.Pool)
        pool = DatabasePool()
        pool._pool = mock_pool

        result = pool.get_pool()

        assert result == mock_pool

    @pytest.mark.asyncio
    async def test_get_pool_not_initialized(self):
        """
        Verify error when getting uninitialized pool.
        Pool is None.
        Expect RuntimeError.
        """
        from src.connectors.db import DatabasePool

        pool = DatabasePool()
        pool._pool = None

        with pytest.raises(RuntimeError, match="not initialized"):
            pool.get_pool()

    @pytest.mark.asyncio
    async def test_execute_success(self):
        """
        Verify successful query execution.
        Mock connection executes query and returns result.
        Expect result to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.execute = AsyncMock(return_value="INSERT 1")

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        result = await pool.execute("INSERT INTO test VALUES ($1)", "value")

        assert result == "INSERT 1"
        mock_connection.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetch_success(self):
        """
        Verify successful fetch of multiple rows.
        Mock connection returns list of records.
        Expect list to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_records = [{"id": 1}, {"id": 2}]
        mock_connection = MagicMock()
        mock_connection.fetch = AsyncMock(return_value=mock_records)

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        result = await pool.fetch("SELECT * FROM test")

        assert result == mock_records
        mock_connection.fetch.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetchrow_success(self):
        """
        Verify successful fetch of single row.
        Mock connection returns single record.
        Expect record to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_record = {"id": 1, "name": "test"}
        mock_connection = MagicMock()
        mock_connection.fetchrow = AsyncMock(return_value=mock_record)

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        result = await pool.fetchrow("SELECT * FROM test WHERE id = $1", 1)

        assert result == mock_record
        mock_connection.fetchrow.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetchrow_none(self):
        """
        Verify handling when no row is found.
        Mock connection returns None.
        Expect None to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.fetchrow = AsyncMock(return_value=None)

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        result = await pool.fetchrow("SELECT * FROM test WHERE id = $1", 999)

        assert result is None

    @pytest.mark.asyncio
    async def test_fetchval_success(self):
        """
        Verify successful fetch of single value.
        Mock connection returns single value.
        Expect value to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.fetchval = AsyncMock(return_value=42)

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        result = await pool.fetchval("SELECT COUNT(*) FROM test")

        assert result == 42
        mock_connection.fetchval.assert_called_once()

    @pytest.mark.asyncio
    async def test_transaction_success(self):
        """
        Verify successful transaction context manager.
        Mock connection and transaction context.
        Expect transaction to be entered and exited properly.
        """
        from src.connectors.db import DatabasePool

        mock_transaction = MagicMock()
        mock_transaction.__aenter__ = AsyncMock()
        mock_transaction.__aexit__ = AsyncMock()

        mock_connection = MagicMock()
        mock_connection.transaction.return_value = mock_transaction

        mock_pool = MagicMock(spec=asyncpg.Pool)
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        pool = DatabasePool()
        pool._pool = mock_pool

        async with pool.transaction() as conn:
            assert conn == mock_connection

        mock_connection.transaction.assert_called_once()
