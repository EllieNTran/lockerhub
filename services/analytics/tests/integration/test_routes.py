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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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
            LockerUsageResponse,
            DayLockerUsageResponse,
        )

        mock_response = LockerUsageResponse(
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


class TestTopDepartmentsRoutes:
    """Test top departments analytics endpoint."""

    pytestmark = pytest.mark.asyncio

    async def test_get_top_departments_default(self, test_client):
        """
        Verify top departments endpoint with default parameters.
        Request top departments for last 7 days.
        Expect 200 status with up to 6 departments.
        """
        mock_departments = [
            {
                "department_id": "12345678-1234-1234-1234-123456789abc",
                "department_name": "Engineering",
                "occupied_count": 45,
            },
            {
                "department_id": "87654321-4321-4321-4321-987654321cba",
                "department_name": "Marketing",
                "occupied_count": 32,
            },
        ]

        from src.models.responses import TopDepartmentsResponse, DepartmentUsageResponse

        mock_response = TopDepartmentsResponse(
            departments=[DepartmentUsageResponse(**dept) for dept in mock_departments]
        )

        with patch(
            "src.routes.analytics.get_top_departments",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get("/analytics/top-departments")

        assert response.status_code == 200
        data = response.json()
        assert "departments" in data
        assert len(data["departments"]) == 2

        # Verify default period was used
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_7_days"

    async def test_get_top_departments_with_period(self, test_client):
        """
        Verify top departments endpoint with specific period.
        Request top departments for last 30 days.
        Expect 200 status with period filter applied.
        """
        mock_departments = [
            {
                "department_id": "11111111-1111-1111-1111-111111111111",
                "department_name": "Sales",
                "occupied_count": 23,
            }
        ]

        from src.models.responses import TopDepartmentsResponse, DepartmentUsageResponse

        mock_response = TopDepartmentsResponse(
            departments=[DepartmentUsageResponse(**dept) for dept in mock_departments]
        )

        with patch(
            "src.routes.analytics.get_top_departments",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                "/analytics/top-departments?period=last_month"
            )

        assert response.status_code == 200
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_month"

    async def test_get_top_departments_with_floor_filter(self, test_client):
        """
        Verify top departments endpoint with floor filter.
        Request top departments for specific floor.
        Expect 200 status with floor filter applied.
        """
        floor_id = "12345678-1234-1234-1234-123456789abc"
        mock_departments = []

        from src.models.responses import TopDepartmentsResponse

        mock_response = TopDepartmentsResponse(departments=mock_departments)

        with patch(
            "src.routes.analytics.get_top_departments",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/top-departments?floor_id={floor_id}"
            )

        assert response.status_code == 200
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["floor_id"] == floor_id

    async def test_get_top_departments_all_time(self, test_client):
        """
        Verify top departments endpoint for all_time period.
        Request all historical department usage.
        Expect 200 status with extended data range.
        """
        mock_departments = [
            {
                "department_id": f"{i:08x}-1111-1111-1111-111111111111",
                "department_name": f"Department {i}",
                "occupied_count": 100 - (i * 10),
            }
            for i in range(6)
        ]

        from src.models.responses import TopDepartmentsResponse, DepartmentUsageResponse

        mock_response = TopDepartmentsResponse(
            departments=[DepartmentUsageResponse(**dept) for dept in mock_departments]
        )

        with patch(
            "src.routes.analytics.get_top_departments",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get(
                "/analytics/top-departments?period=all_time"
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["departments"]) == 6

    async def test_get_top_departments_service_error(self, test_client):
        """
        Verify error handling when service raises exception.
        Mock service raises generic exception.
        Expect 500 internal server error.
        """
        with patch(
            "src.routes.analytics.get_top_departments",
            AsyncMock(side_effect=Exception("Database connection failed")),
        ):
            response = await test_client.get("/analytics/top-departments")

        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve top departments analytics" in data["detail"]


class TestMostPopularFloorsRoutes:
    """Test most popular floors analytics endpoint."""

    pytestmark = pytest.mark.asyncio

    async def test_get_most_popular_floors_default(self, test_client):
        """
        Verify most popular floors endpoint with default parameters.
        Request top floors for last 7 days.
        Expect 200 status with up to 6 floors.
        """
        mock_floors = [
            {
                "floor_id": "12345678-1234-1234-1234-123456789abc",
                "floor_number": "Floor 10",
                "occupied_count": 78,
            },
            {
                "floor_id": "87654321-4321-4321-4321-987654321cba",
                "floor_number": "Floor 3",
                "occupied_count": 56,
            },
        ]

        from src.models.responses import TopFloorsResponse, FloorUsageResponse

        mock_response = TopFloorsResponse(
            floors=[FloorUsageResponse(**floor) for floor in mock_floors]
        )

        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get("/analytics/most-popular-floors")

        assert response.status_code == 200
        data = response.json()
        assert "floors" in data
        assert len(data["floors"]) == 2

        # Verify default period was used
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_7_days"

    async def test_get_most_popular_floors_with_period(self, test_client):
        """
        Verify most popular floors endpoint with specific period.
        Request top floors for last 3 months.
        Expect 200 status with period filter applied.
        """
        mock_floors = [
            {
                "floor_id": "11111111-1111-1111-1111-111111111111",
                "floor_number": "Floor 5",
                "occupied_count": 42,
            }
        ]

        from src.models.responses import TopFloorsResponse, FloorUsageResponse

        mock_response = TopFloorsResponse(
            floors=[FloorUsageResponse(**floor) for floor in mock_floors]
        )

        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                "/analytics/most-popular-floors?period=last_3_months"
            )

        assert response.status_code == 200
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_3_months"

    async def test_get_most_popular_floors_with_department_filter(self, test_client):
        """
        Verify most popular floors endpoint with department filter.
        Request top floors for specific department.
        Expect 200 status with department filter applied.
        """
        department_id = "12345678-1234-1234-1234-123456789abc"
        mock_floors = []

        from src.models.responses import TopFloorsResponse

        mock_response = TopFloorsResponse(floors=mock_floors)

        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/most-popular-floors?department_id={department_id}"
            )

        assert response.status_code == 200
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["department_id"] == department_id

    async def test_get_most_popular_floors_all_filters(self, test_client):
        """
        Verify most popular floors endpoint with all filters.
        Request top floors for specific period and department.
        Expect 200 status with all filters applied.
        """
        department_id = "87654321-4321-4321-4321-987654321cba"
        mock_floors = [
            {
                "floor_id": "22222222-2222-2222-2222-222222222222",
                "floor_number": "Floor 7",
                "occupied_count": 15,
            }
        ]

        from src.models.responses import TopFloorsResponse, FloorUsageResponse

        mock_response = TopFloorsResponse(
            floors=[FloorUsageResponse(**floor) for floor in mock_floors]
        )

        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(return_value=mock_response),
        ) as mock_service:
            response = await test_client.get(
                f"/analytics/most-popular-floors?period=last_year&department_id={department_id}"
            )

        assert response.status_code == 200
        mock_service.assert_called_once()
        call_kwargs = mock_service.call_args.kwargs
        assert call_kwargs["period"] == "last_year"
        assert call_kwargs["department_id"] == department_id

    async def test_get_most_popular_floors_limit_six(self, test_client):
        """
        Verify most popular floors endpoint limits to 6 results.
        Request top floors for all_time.
        Expect 200 status with maximum 6 floors.
        """
        mock_floors = [
            {
                "floor_id": f"{i:08x}-1111-1111-1111-111111111111",
                "floor_number": f"Floor {i}",
                "occupied_count": 100 - (i * 10),
            }
            for i in range(6)
        ]

        from src.models.responses import TopFloorsResponse, FloorUsageResponse

        mock_response = TopFloorsResponse(
            floors=[FloorUsageResponse(**floor) for floor in mock_floors]
        )

        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(return_value=mock_response),
        ):
            response = await test_client.get(
                "/analytics/most-popular-floors?period=all_time"
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["floors"]) == 6

    async def test_get_most_popular_floors_service_error(self, test_client):
        """
        Verify error handling when service raises exception.
        Mock service raises generic exception.
        Expect 500 internal server error.
        """
        with patch(
            "src.routes.analytics.get_most_popular_floors",
            AsyncMock(side_effect=Exception("Database connection failed")),
        ):
            response = await test_client.get("/analytics/most-popular-floors")

        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve most popular floors analytics" in data["detail"]


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
