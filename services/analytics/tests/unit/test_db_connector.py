"""Unit tests for database connector."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestDatabasePool:
    """Tests for the DatabasePool class."""

    @pytest.mark.asyncio
    async def test_connect_success(self):
        """
        Verify successful database pool creation.
        Mock asyncpg.create_pool to return a mock pool.
        Expect pool to be stored and logged.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock()
        db = DatabasePool()

        with patch(
            "src.connectors.db.asyncpg.create_pool", AsyncMock(return_value=mock_pool)
        ):
            await db.connect()

        assert db._pool == mock_pool

    @pytest.mark.asyncio
    async def test_connect_already_exists(self):
        """
        Verify warning when pool already exists.
        Set _pool before calling connect.
        Expect warning and no new pool creation.
        """
        from src.connectors.db import DatabasePool

        existing_pool = MagicMock()
        db = DatabasePool()
        db._pool = existing_pool

        with patch("src.connectors.db.asyncpg.create_pool", AsyncMock()) as mock_create:
            await db.connect()

        mock_create.assert_not_called()
        assert db._pool == existing_pool

    @pytest.mark.asyncio
    async def test_connect_failure(self):
        """
        Verify error handling when pool creation fails.
        Mock create_pool to raise exception.
        Expect exception to be raised and logged.
        """
        from src.connectors.db import DatabasePool

        db = DatabasePool()

        with patch(
            "src.connectors.db.asyncpg.create_pool",
            AsyncMock(side_effect=Exception("Connection failed")),
        ):
            with pytest.raises(Exception, match="Connection failed"):
                await db.connect()

        assert db._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_success(self):
        """
        Verify successful pool closure.
        Set up pool with close method.
        Expect pool to be closed and set to None.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock()
        mock_pool.close = AsyncMock()

        db = DatabasePool()
        db._pool = mock_pool

        await db.disconnect()

        mock_pool.close.assert_called_once()
        assert db._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_no_pool(self):
        """
        Verify warning when disconnecting with no pool.
        Pool is None before disconnect.
        Expect warning without errors.
        """
        from src.connectors.db import DatabasePool

        db = DatabasePool()
        db._pool = None

        await db.disconnect()  # Should not raise

        assert db._pool is None

    @pytest.mark.asyncio
    async def test_disconnect_failure(self):
        """
        Verify error handling when pool closure fails.
        Mock pool.close to raise exception.
        Expect exception to be raised.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock()
        mock_pool.close = AsyncMock(side_effect=Exception("Failed to close"))

        db = DatabasePool()
        db._pool = mock_pool

        with pytest.raises(Exception, match="Failed to close"):
            await db.disconnect()

    @pytest.mark.asyncio
    async def test_get_pool_success(self):
        """
        Verify successful pool retrieval.
        Set up pool instance.
        Expect pool to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_pool = MagicMock()
        db = DatabasePool()
        db._pool = mock_pool

        result = db.get_pool()

        assert result == mock_pool

    @pytest.mark.asyncio
    async def test_get_pool_not_initialized(self):
        """
        Verify error when getting uninitialized pool.
        Pool is None.
        Expect RuntimeError to be raised.
        """
        from src.connectors.db import DatabasePool

        db = DatabasePool()
        db._pool = None

        with pytest.raises(RuntimeError, match="not initialized"):
            db.get_pool()

    @pytest.mark.asyncio
    async def test_execute_success(self):
        """
        Verify successful query execution.
        Mock pool and connection.
        Expect execute to be called with query and args.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.execute = AsyncMock(return_value="INSERT 1")

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        result = await db.execute("INSERT INTO test VALUES ($1)", "value")

        assert result == "INSERT 1"
        mock_connection.execute.assert_called_once_with(
            "INSERT INTO test VALUES ($1)", "value"
        )

    @pytest.mark.asyncio
    async def test_fetch_success(self):
        """
        Verify successful fetch operation.
        Mock pool to return rows.
        Expect fetch to return list of rows.
        """
        from src.connectors.db import DatabasePool

        mock_rows = [{"id": 1, "name": "test"}]
        mock_connection = MagicMock()
        mock_connection.fetch = AsyncMock(return_value=mock_rows)

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        result = await db.fetch("SELECT * FROM test")

        assert result == mock_rows
        mock_connection.fetch.assert_called_once_with("SELECT * FROM test")

    @pytest.mark.asyncio
    async def test_fetchrow_success(self):
        """
        Verify successful fetchrow operation.
        Mock pool to return single row.
        Expect fetchrow to return one row.
        """
        from src.connectors.db import DatabasePool

        mock_row = {"id": 1, "name": "test"}
        mock_connection = MagicMock()
        mock_connection.fetchrow = AsyncMock(return_value=mock_row)

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        result = await db.fetchrow("SELECT * FROM test WHERE id = $1", 1)

        assert result == mock_row
        mock_connection.fetchrow.assert_called_once_with(
            "SELECT * FROM test WHERE id = $1", 1
        )

    @pytest.mark.asyncio
    async def test_fetchrow_none(self):
        """
        Verify fetchrow when no row found.
        Mock connection to return None.
        Expect None to be returned.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.fetchrow = AsyncMock(return_value=None)

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        result = await db.fetchrow("SELECT * FROM test WHERE id = $1", 999)

        assert result is None

    @pytest.mark.asyncio
    async def test_fetchval_success(self):
        """
        Verify successful fetchval operation.
        Mock pool to return single value.
        Expect fetchval to return scalar value.
        """
        from src.connectors.db import DatabasePool

        mock_connection = MagicMock()
        mock_connection.fetchval = AsyncMock(return_value=42)

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        result = await db.fetchval("SELECT COUNT(*) FROM test")

        assert result == 42
        mock_connection.fetchval.assert_called_once_with("SELECT COUNT(*) FROM test")

    @pytest.mark.asyncio
    async def test_transaction_success(self):
        """
        Verify successful transaction context manager.
        Mock pool and connection with transaction.
        Expect transaction to be started and committed.
        """
        from src.connectors.db import DatabasePool

        mock_transaction = MagicMock()
        mock_transaction.__aenter__ = AsyncMock()
        mock_transaction.__aexit__ = AsyncMock()

        mock_connection = MagicMock()
        mock_connection.transaction.return_value = mock_transaction

        mock_pool = MagicMock()
        mock_acquire = MagicMock()
        mock_acquire.__aenter__ = AsyncMock(return_value=mock_connection)
        mock_acquire.__aexit__ = AsyncMock()
        mock_pool.acquire.return_value = mock_acquire

        db = DatabasePool()
        db._pool = mock_pool

        async with db.transaction() as txn:
            assert txn is not None

        mock_connection.transaction.assert_called_once()
        mock_transaction.__aenter__.assert_called_once()
        mock_transaction.__aexit__.assert_called_once()
