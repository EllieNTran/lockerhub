"""Unit tests for notifications service connector."""

import pytest
from unittest.mock import patch, MagicMock
import requests


class TestNotificationsServiceClient:
    """Tests for the NotificationsServiceClient connector."""

    @pytest.mark.asyncio
    async def test_post_success(self):
        """
        Verify successful POST request to notifications service.
        Mock requests.post to return successful response.
        Expect JSON response to be returned.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        mock_response = MagicMock()
        mock_response.json.return_value = {"status": "sent"}
        mock_response.raise_for_status = MagicMock()

        client = NotificationsServiceClient()

        with patch("requests.post", return_value=mock_response) as mock_post:
            result = await client.post("/test-endpoint", {"key": "value"})

        assert result == {"status": "sent"}
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "/notifications/test-endpoint" in call_args[0][0]
        assert call_args[1]["json"] == {"key": "value"}
        assert call_args[1]["timeout"] == 5

    @pytest.mark.asyncio
    async def test_post_http_error(self):
        """
        Verify error handling for HTTP errors.
        Mock requests.post to raise HTTPError.
        Expect exception to be raised and logged.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            "404 Not Found"
        )

        client = NotificationsServiceClient()

        with patch("requests.post", return_value=mock_response):
            with pytest.raises(requests.exceptions.HTTPError):
                await client.post("/test-endpoint", {"key": "value"})

    @pytest.mark.asyncio
    async def test_post_timeout(self):
        """
        Verify error handling for request timeout.
        Mock requests.post to raise Timeout.
        Expect exception to be raised and logged.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        client = NotificationsServiceClient()

        with patch(
            "requests.post", side_effect=requests.exceptions.Timeout("Request timeout")
        ):
            with pytest.raises(requests.exceptions.Timeout):
                await client.post("/test-endpoint", {"key": "value"})

    @pytest.mark.asyncio
    async def test_post_connection_error(self):
        """
        Verify error handling for connection errors.
        Mock requests.post to raise ConnectionError.
        Expect exception to be raised and logged.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        client = NotificationsServiceClient()

        with patch(
            "requests.post",
            side_effect=requests.exceptions.ConnectionError("Service unavailable"),
        ):
            with pytest.raises(requests.exceptions.ConnectionError):
                await client.post("/test-endpoint", {"key": "value"})

    @pytest.mark.asyncio
    async def test_post_json_decode_error(self):
        """
        Verify error handling for invalid JSON response.
        Mock requests.post to return invalid JSON.
        Expect exception to be raised.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.side_effect = ValueError("Invalid JSON")

        client = NotificationsServiceClient()

        with patch("requests.post", return_value=mock_response):
            with pytest.raises(ValueError):
                await client.post("/test-endpoint", {"key": "value"})

    @pytest.mark.asyncio
    async def test_post_url_construction(self):
        """
        Verify correct URL construction.
        Mock NOTIFICATIONS_SERVICE_URL setting.
        Expect full URL to be constructed correctly.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        mock_response = MagicMock()
        mock_response.json.return_value = {"status": "sent"}
        mock_response.raise_for_status = MagicMock()

        with patch("src.connectors.notifications_service.settings") as mock_settings:
            mock_settings.NOTIFICATIONS_SERVICE_URL = "http://localhost:3002"
            client = NotificationsServiceClient()

            with patch("requests.post", return_value=mock_response) as mock_post:
                await client.post("/booking/created", {"id": 123})

            call_args = mock_post.call_args[0][0]
            assert call_args == "http://localhost:3002/notifications/booking/created"

    @pytest.mark.asyncio
    async def test_post_payload_format(self):
        """
        Verify payload is sent as JSON.
        Mock requests.post.
        Expect payload to be passed as json parameter.
        """
        from src.connectors.notifications_service import NotificationsServiceClient

        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_response.raise_for_status = MagicMock()

        client = NotificationsServiceClient()
        test_payload = {
            "userId": "123",
            "email": "test@example.com",
            "message": "Test message",
        }

        with patch("requests.post", return_value=mock_response) as mock_post:
            await client.post("/test", test_payload)

        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["json"] == test_payload
        assert call_kwargs["timeout"] == 5
