"""API Key authentication middleware for internal service calls."""

import os
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> bool:
    """
    Verify the API key from the request header.

    Args:
        api_key: API key from X-API-Key header

    Returns:
        True if API key is valid

    Raises:
        HTTPException: 401 if API key is missing or invalid
    """
    expected_key = os.getenv("INTERNAL_API_KEY")

    # If no API key is configured, skip validation (dev mode)
    if not expected_key:
        return True

    if not api_key:
        raise HTTPException(
            status_code=401, detail="Missing API key. Provide X-API-Key header."
        )

    if api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    return True
