"""JWT authentication middleware."""

import httpx
import jwt

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.settings import settings
from src.logger import logger

security = HTTPBearer()

jwks_cache = None


async def fetch_jwks():
    """Fetch JWKS from auth service."""
    global jwks_cache

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.jwks_url, timeout=5.0)
            response.raise_for_status()
            jwks_cache = response.json()
            logger.info("JWKS fetched successfully")
            return jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        raise


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Verify JWT token and extract user information.

    Returns:
        dict with user_id and other claims
    """
    token = credentials.credentials

    if not jwks_cache:
        raise HTTPException(status_code=503, detail="JWKS not loaded")

    try:
        kid = jwt.get_unverified_header(token).get("kid")

        if not kid:
            raise HTTPException(status_code=401, detail="Token missing kid")

        jwk = None
        for key in jwks_cache.get("keys", []):
            if key.get("kid") == kid:
                jwk = key
                break

        if not jwk:
            raise HTTPException(status_code=401, detail="Public key not found")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)

        payload = jwt.decode(
            token, public_key, algorithms=["RS256"], options={"verify_signature": True}
        )

        return {"user_id": payload.get("sub"), "role": payload.get("role")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
