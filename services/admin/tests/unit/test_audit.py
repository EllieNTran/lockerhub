"""Unit tests for audit services."""

import pytest
from unittest.mock import patch
from uuid import UUID
from datetime import datetime


@pytest.mark.unit
class TestGetAuditLogs:
    """Tests for get_audit_logs service."""

    @pytest.mark.asyncio
    async def test_get_audit_logs_first_page_success(self, mock_db):
        """Test retrieving first page of audit logs.

        Verifies that fetching the first page of audit logs returns correct
        pagination data including logs, total count, current page, and total pages.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 1,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_name": "John Doe",
                "action": "CREATE",
                "entity_type": "booking",
                "entity_id": UUID(22222222-2222-2222-2222-222222222222),
                "reference": "Booking created",
                "old_value": None,
                "new_value": "status: upcoming",
                "audit_date": datetime(2026, 3, 21, 10, 30, 0),
            },
            {
                "audit_log_id": 2,
                "user_id": UUID("33333333-3333-3333-3333-333333333333"),
                "user_name": "Jane Smith",
                "action": "UPDATE",
                "entity_type": "locker",
                "entity_id": UUID("44444444-4444-4444-4444-444444444444"),
                "reference": "Locker status changed",
                "old_value": "status: available",
                "new_value": "status: maintenance",
                "audit_date": datetime(2026, 3, 21, 9, 15, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 25}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs(page=1, limit=12)

            assert len(result.logs) == 2
            assert result.total == 25
            assert result.page == 1
            assert result.pages == 3
            assert result.limit == 12
            assert result.logs[0].audit_log_id == 1
            assert result.logs[0].action == "CREATE"
            assert result.logs[1].action == "UPDATE"

    @pytest.mark.asyncio
    async def test_get_audit_logs_second_page(self, mock_db):
        """Test retrieving second page of audit logs.

        Verifies that fetching the second page uses correct offset calculation
        and returns proper pagination metadata.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 13,
                "user_id": UUID("55555555-5555-5555-5555-555555555555"),
                "user_name": "Admin User",
                "action": "DELETE",
                "entity_type": "key",
                "entity_id": UUID("66666666-6666-6666-6666-666666666666"),
                "reference": "Key deleted",
                "old_value": "key_number: AA123",
                "new_value": None,
                "audit_date": datetime(2026, 3, 20, 14, 20, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 25}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs(page=2, limit=12)

            assert result.page == 2
            assert result.total == 25
            assert result.pages == 3
            assert len(result.logs) == 1

    @pytest.mark.asyncio
    async def test_get_audit_logs_empty(self, mock_db):
        """Test retrieving audit logs when none exist.

        Verifies that fetching audit logs from an empty database returns
        an empty list with correct pagination data showing 0 total and 0 pages.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        mock_db.fetchrow.return_value = {"total": 0}
        mock_db.fetch.return_value = []

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs()

            assert len(result.logs) == 0
            assert result.total == 0
            assert result.page == 1
            assert result.pages == 0
            assert result.limit == 12

    @pytest.mark.asyncio
    async def test_get_audit_logs_single_page(self, mock_db):
        """Test retrieving audit logs that fit in single page.

        Verifies that when total logs are less than the limit, pagination
        correctly shows 1 page.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 1,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_name": "Test User",
                "action": "CREATE",
                "entity_type": "booking",
                "entity_id": UUID(22222222-2222-2222-2222-222222222222),
                "reference": "Test",
                "old_value": None,
                "new_value": "test",
                "audit_date": datetime(2026, 3, 21, 10, 0, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 5}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs(page=1, limit=12)

            assert result.total == 5
            assert result.pages == 1
            assert len(result.logs) == 1

    @pytest.mark.asyncio
    async def test_get_audit_logs_custom_limit(self, mock_db):
        """Test retrieving audit logs with custom limit.

        Verifies that using a custom limit value correctly affects pagination
        calculations and the number of pages.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = []
        for i in range(5):
            logs.append(
                {
                    "audit_log_id": i + 1,
                    "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                    "user_name": f"User {i}",
                    "action": "CREATE",
                    "entity_type": "booking",
                    "entity_id": UUID(22222222-2222-2222-2222-222222222222),
                    "reference": f"Action {i}",
                    "old_value": None,
                    "new_value": "test",
                    "audit_date": datetime(2026, 3, 21, 10, i, 0),
                }
            )

        mock_db.fetchrow.return_value = {"total": 25}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs(page=1, limit=5)

            assert result.limit == 5
            assert result.pages == 5
            assert result.total == 25
            assert len(result.logs) == 5

    @pytest.mark.asyncio
    async def test_get_audit_logs_system_action(self, mock_db):
        """Test retrieving audit logs with system actions.

        Verifies that system-generated audit logs without a user_id are correctly
        handled with user_name as None.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 1,
                "user_id": None,
                "user_name": None,
                "action": "SYSTEM",
                "entity_type": "booking",
                "entity_id": UUID("11111111-1111-1111-1111-111111111111"),
                "reference": "Automated status update",
                "old_value": "status: upcoming",
                "new_value": "status: active",
                "audit_date": datetime(2026, 3, 21, 0, 0, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 1}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs()

            assert len(result.logs) == 1
            assert result.logs[0].user_id is None
            assert result.logs[0].user_name is None
            assert result.logs[0].action == "SYSTEM"

    @pytest.mark.asyncio
    async def test_get_audit_logs_default_parameters(self, mock_db):
        """Test retrieving audit logs with default parameters.

        Verifies that calling get_audit_logs without parameters uses default
        values of page=1 and limit=12.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        mock_db.fetchrow.return_value = {"total": 50}
        mock_db.fetch.return_value = []

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs()

            assert result.page == 1
            assert result.limit == 12
            assert result.pages == 5

    @pytest.mark.asyncio
    async def test_get_audit_logs_last_page_partial(self, mock_db):
        """Test retrieving last page with partial results.

        Verifies that pagination correctly handles the last page when it contains
        fewer items than the limit.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 26,
                "user_id": UUID("77777777-7777-7777-7777-777777777777"),
                "user_name": "Last User",
                "action": "UPDATE",
                "entity_type": "locker",
                "entity_id": UUID("88888888-8888-8888-8888-888888888888"),
                "reference": "Final update",
                "old_value": "test",
                "new_value": "updated",
                "audit_date": datetime(2026, 3, 19, 10, 0, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 26}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs(page=3, limit=12)

            assert result.page == 3
            assert result.pages == 3
            assert result.total == 26
            assert len(result.logs) == 1

    @pytest.mark.asyncio
    async def test_get_audit_logs_various_actions(self, mock_db):
        """Test audit logs with various action types.

        Verifies that different audit action types (CREATE, UPDATE, DELETE, SYSTEM)
        are correctly returned in the logs.
        """
        from src.services.audit.get_audit_logs import get_audit_logs

        logs = [
            {
                "audit_log_id": 1,
                "user_id": UUID("11111111-1111-1111-1111-111111111111"),
                "user_name": "User A",
                "action": "CREATE",
                "entity_type": "booking",
                "entity_id": UUID(22222222-2222-2222-2222-222222222222),
                "reference": "Created",
                "old_value": None,
                "new_value": "new booking",
                "audit_date": datetime(2026, 3, 21, 10, 0, 0),
            },
            {
                "audit_log_id": 2,
                "user_id": UUID("33333333-3333-3333-3333-333333333333"),
                "user_name": "User B",
                "action": "UPDATE",
                "entity_type": "locker",
                "entity_id": UUID("44444444-4444-4444-4444-444444444444"),
                "reference": "Updated",
                "old_value": "old value",
                "new_value": "new value",
                "audit_date": datetime(2026, 3, 21, 9, 0, 0),
            },
            {
                "audit_log_id": 3,
                "user_id": UUID("55555555-5555-5555-5555-555555555555"),
                "user_name": "User C",
                "action": "DELETE",
                "entity_type": "key",
                "entity_id": UUID("66666666-6666-6666-6666-666666666666"),
                "reference": "Deleted",
                "old_value": "deleted key",
                "new_value": None,
                "audit_date": datetime(2026, 3, 21, 8, 0, 0),
            },
        ]

        mock_db.fetchrow.return_value = {"total": 3}
        mock_db.fetch.return_value = logs

        with patch("src.services.audit.get_audit_logs.db", mock_db):
            result = await get_audit_logs()

            assert len(result.logs) == 3
            assert result.logs[0].action == "CREATE"
            assert result.logs[1].action == "UPDATE"
            assert result.logs[2].action == "DELETE"
            assert result.logs[0].old_value is None
            assert result.logs[2].new_value is None
