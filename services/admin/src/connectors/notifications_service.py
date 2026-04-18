"""Connector to the notifications service."""

import os
import requests

from src.logger import logger
from src.settings import settings


class NotificationsServiceClient:
    """Client for interacting with the notifications service."""

    def __init__(self):
        self.base_url = settings.NOTIFICATIONS_SERVICE_URL
        self.enabled = os.getenv("ENABLE_NOTIFICATIONS", "true").lower() == "true"

    async def post(self, endpoint: str, payload: dict) -> dict:
        """Send a POST request to the notifications service.

        Args:
            endpoint: The API endpoint to send the request to
            payload: The JSON payload to include in the request

        Returns:
            The JSON response from the notifications service
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping notification")
            return {}

        url = f"{self.base_url}/notifications{endpoint}"
        try:
            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()
            return response.json()
        except:
            logger.error("Error sending request to notifications service")
            raise
