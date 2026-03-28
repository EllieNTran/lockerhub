"""Integration tests for analytics routes."""

import pytest
from unittest.mock import patch, AsyncMock
from datetime import date, timedelta


class TestAnalyticsRoutes:
    """Test analytics HTTP endpoints."""

    pytestmark = pytest.mark.asyncio

    async def test_get_locker_usage_default_period(self, test_client):
        """
        Verify locker usage endpoint with default period (last_month).
        Mock service returns usage data for 30 days.
        Expect 200 status with locker_usage array.
        """
        today = date.today()
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 20 + i}
            for i in range(30)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get("/analytics/locker-usage")

        assert response.status_code == 200
        data = response.json()
        assert "locker_usage" in data
        assert len(data["locker_usage"]) == 30
        assert data["locker_usage"][0]["occupied_count"] == 20

    async def test_get_locker_usage_specific_period(self, test_client):
        """
        Verify locker usage endpoint with specific period parameter.
        Request last_7_days period.
        Expect 200 status with 7 days of data.
        """
        today = date.today()
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 15}
            for i in range(7)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get(
                "/analytics/locker-usage?period=last_7_days"
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["locker_usage"]) == 7

    async def test_get_locker_usage_with_floor_filter(self, test_client):
        """
        Verify locker usage endpoint with floor_id filter.
        Request data for specific floor.
        Expect 200 status with filtered results.
        """
        today = date.today()
        floor_id = "12345678-1234-1234-1234-123456789abc"
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 10}
            for i in range(30)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/locker-usage?floor_id={floor_id}"
            )

        assert response.status_code == 200
        # Verify floor_id was passed to service
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["floor_id"] == floor_id

    async def test_get_locker_usage_with_department_filter(self, test_client):
        """
        Verify locker usage endpoint with department_id filter.
        Request data for specific department.
        Expect 200 status with filtered results.
        """
        today = date.today()
        department_id = "87654321-4321-4321-4321-987654321cba"
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 8}
            for i in range(30)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/locker-usage?department_id={department_id}"
            )

        assert response.status_code == 200
        # Verify department_id was passed to service
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["department_id"] == department_id

    async def test_get_locker_usage_with_all_filters(self, test_client):
        """
        Verify locker usage endpoint with all filters.
        Request data for specific period, floor, and department.
        Expect 200 status with all filters applied.
        """
        today = date.today()
        floor_id = "12345678-1234-1234-1234-123456789abc"
        department_id = "87654321-4321-4321-4321-987654321cba"
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 5}
            for i in range(14)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/locker-usage?period=last_14_days&floor_id={floor_id}&department_id={department_id}"
            )

        assert response.status_code == 200
        # Verify all parameters were passed
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_14_days"
        assert call_kwargs["floor_id"] == floor_id
        assert call_kwargs["department_id"] == department_id

    async def test_get_locker_usage_invalid_period(self, test_client):
        """
        Verify error handling for invalid period parameter.
        Request with unsupported period value.
        Expect 422 validation error.
        """
        response = await test_client.get(
            "/analytics/locker-usage?period=invalid_period"
        )

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    async def test_get_locker_usage_today(self, test_client):
        """
        Verify locker usage endpoint for today period.
        Request single day of usage data.
        Expect 200 status with 1 day of data.
        """
        today = date.today()
        mock_usage_data = [{"usage_date": today, "occupied_count": 18}]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get("/analytics/locker-usage?period=today")

        assert response.status_code == 200
        data = response.json()
        assert len(data["locker_usage"]) == 1
        assert data["locker_usage"][0]["usage_date"] == str(today)

    async def test_get_locker_usage_all_time(self, test_client):
        """
        Verify locker usage endpoint for all_time period.
        Request all historical usage data.
        Expect 200 status with extended data range.
        """
        today = date.today()
        mock_usage_data = [
            {"usage_date": today - timedelta(days=i), "occupied_count": 12}
            for i in range(365)
        ]

        from src.models.responses import (
            FullLockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = FullLockerUsageResponse(
            locker_usage=[DayLockerUsageResponse(**data) for data in mock_usage_data]
        )

        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get("/analytics/locker-usage?period=all_time")

        assert response.status_code == 200
        data = response.json()
        assert len(data["locker_usage"]) == 365

    async def test_get_locker_usage_service_error(self, test_client):
        """
        Verify error handling when service raises exception.
        Mock service raises generic exception.
        Expect 500 internal server error.
        """
        with patch(
            "src.routes.analytics.get_locker_usage",
            AsyncMock(side_effect=Exception("Database connection failed")),
        ):
            response = await test_client.get("/analytics/locker-usage")

        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve locker usage analytics" in data["detail"]


class TestHealthEndpoint:
    """Test health check endpoint."""

    pytestmark = pytest.mark.asyncio

    async def test_health_check(self, test_client):
        """
        Verify health check endpoint returns healthy status.
        Expect 200 status with service name.
        """
        response = await test_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "analytics"
