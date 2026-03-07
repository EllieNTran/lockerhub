from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_MIN_POOL_SIZE: int
    DB_MAX_POOL_SIZE: int
    APP_HOST: str
    APP_PORT: int
    AUTH_SERVICE_URL: str

    @property
    def jwks_url(self) -> str:
        """JWKS endpoint URL."""
        return f"{self.AUTH_SERVICE_URL}/auth/.well-known/jwks.json"


settings = Settings()
