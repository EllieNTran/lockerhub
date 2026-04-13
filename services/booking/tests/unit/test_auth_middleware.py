"""Unit tests for JWT authentication middleware."""

import pytest
import jwt
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from src.middleware.auth import fetch_jwks, get_current_user


@pytest.mark.unit
class TestFetchJWKS:
    """Tests for fetch_jwks function."""

    @pytest.mark.asyncio
    async def test_fetch_jwks_success(self):
        """Test successful JWKS fetching."""
        mock_jwks = {
            "keys": [
                {
                    "kid": "test-kid",
                    "kty": "RSA",
                    "use": "sig",
                    "n": "test-n",
                    "e": "AQAB",
                }
            ]
        }

        mock_response = MagicMock()
        mock_response.json.return_value = mock_jwks
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value.get = AsyncMock(return_value=mock_response)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await fetch_jwks()

            assert result == mock_jwks
            assert "keys" in result

    @pytest.mark.asyncio
    async def test_fetch_jwks_http_error(self):
        """Test JWKS fetch with HTTP error."""
        from src.middleware.auth import fetch_jwks

        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP error")

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value.get = AsyncMock(return_value=mock_response)

        with patch("httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(Exception):
                await fetch_jwks()

    @pytest.mark.asyncio
    async def test_fetch_jwks_timeout(self):
        """Test JWKS fetch with timeout."""

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value.get = AsyncMock(
            side_effect=Exception("Timeout")
        )

        with patch("httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(Exception):
                await fetch_jwks()


@pytest.mark.unit
class TestGetCurrentUser:
    """Tests for get_current_user function."""

    def setup_method(self):
        """Set up test fixtures."""
        # Reset JWKS cache before each test
        import src.middleware.auth as auth_module

        auth_module.jwks_cache = {
            "keys": [
                {
                    "kid": "test-kid",
                    "kty": "RSA",
                    "use": "sig",
                    "alg": "RS256",
                }
            ]
        }

    @pytest.mark.asyncio
    async def test_get_current_user_jwks_not_loaded(self):
        """Test when JWKS cache is not loaded."""
        from src.middleware.auth import get_current_user
        import src.middleware.auth as auth_module

        # Clear JWKS cache
        auth_module.jwks_cache = None

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="fake-token"
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials)

        assert exc_info.value.status_code == 503
        assert "JWKS not loaded" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_missing_kid(self):
        """Test token missing kid in header."""
        # Create token without kid (use long secret to avoid warning)
        token = jwt.encode({"sub": "user123"}, "a" * 32, algorithm="HS256")

        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with patch("jwt.get_unverified_header", return_value={}):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(credentials)

            assert exc_info.value.status_code == 401
            # Generic exception handler catches HTTPException
            assert "Authentication failed" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_public_key_not_found(self):
        """Test when public key not found in JWKS."""
        token = "fake-token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Mock kid that doesn't exist in JWKS
        with patch("jwt.get_unverified_header", return_value={"kid": "non-existent"}):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(credentials)

            assert exc_info.value.status_code == 401
            # Generic exception handler catches HTTPException
            assert "Authentication failed" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_expired_token(self):
        """Test with expired JWT token."""
        token = "fake-token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with patch("jwt.get_unverified_header", return_value={"kid": "test-kid"}):
            with patch("jwt.algorithms.RSAAlgorithm.from_jwk", return_value="key"):
                with patch(
                    "jwt.decode", side_effect=jwt.ExpiredSignatureError("Token expired")
                ):
                    with pytest.raises(HTTPException) as exc_info:
                        await get_current_user(credentials)

                    assert exc_info.value.status_code == 401
                    assert "Token expired" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self):
        """Test with invalid JWT token."""
        token = "fake-token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with patch("jwt.get_unverified_header", return_value={"kid": "test-kid"}):
            with patch("jwt.algorithms.RSAAlgorithm.from_jwk", return_value="key"):
                with patch(
                    "jwt.decode",
                    side_effect=jwt.InvalidTokenError("Invalid token"),
                ):
                    with pytest.raises(HTTPException) as exc_info:
                        await get_current_user(credentials)

                    assert exc_info.value.status_code == 401
                    assert "Invalid token" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_generic_exception(self):
        """Test with generic exception during token verification."""
        from src.middleware.auth import get_current_user

        token = "fake-token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with patch("jwt.get_unverified_header", return_value={"kid": "test-kid"}):
            with patch("jwt.algorithms.RSAAlgorithm.from_jwk", return_value="key"):
                with patch("jwt.decode", side_effect=Exception("Unexpected error")):
                    with pytest.raises(HTTPException) as exc_info:
                        await get_current_user(credentials)

                    assert exc_info.value.status_code == 401
                    assert "Authentication failed" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_current_user_success(self):
        """Test successful user authentication with admin role."""
        from src.middleware.auth import get_current_user

        token = "fake-token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        mock_payload = {
            "sub": "admin123",
            "role": "admin",
            "aud": "lockerhub-services",
        }

        with patch("jwt.get_unverified_header", return_value={"kid": "test-kid"}):
            with patch("jwt.algorithms.RSAAlgorithm.from_jwk", return_value="key"):
                with patch("jwt.decode", return_value=mock_payload):
                    result = await get_current_user(credentials)

                    assert result["user_id"] == "admin123"
                    assert result["role"] == "admin"
