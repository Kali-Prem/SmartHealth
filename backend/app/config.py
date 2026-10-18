"""Application Configuration with Google Secret Manager and Environment Variable support.

Follows non-negotiable security requirements:
- No hardcoded secrets
- Integration with Google Cloud Secret Manager when running in GCP
- Safe fallback to environment variables in local development
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings with validation and GCP Secret Manager fallback."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core environment
    app_name: str = "SmartHealth Platform"
    environment: str = Field(
        default="development", description="development | staging | production"
    )
    debug: bool = Field(default=False)
    api_prefix: str = "/api/v1"

    # Security & Auth
    secret_key: str = Field(
        default="smarthealth-dev-insecure-secret-key-change-in-production-12345",
        description="JWT HMAC signing key",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    rate_limit_per_minute: int = 120

    # Google Cloud & Services
    gcp_project_id: str = Field(default="smarthealth-india", description="Google Cloud Project ID")
    google_application_credentials: str | None = None
    use_secret_manager: bool = Field(
        default=False, description="Whether to fetch secrets from GCP Secret Manager"
    )

    # Gemini API
    gemini_api_key: str | None = Field(default=None, description="Gemini API Key")
    gemini_model: str = Field(default="gemini-2.5-flash", description="Gemini model name")
    gemini_cache_ttl_seconds: int = 3600  # 1 hour cache for repeated queries

    # Database
    use_mock_db: bool = Field(
        default=True, description="Use in-memory Firestore mock when not connected to GCP"
    )
    firestore_database: str = "(default)"

    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # Localization
    supported_languages: list[str] = ["en", "hi"]
    default_language: str = "en"

    def fetch_secret_from_gcp(self, secret_id: str, version_id: str = "latest") -> str | None:
        """Fetch a secret payload from Google Cloud Secret Manager if configured.

        Args:
            secret_id: The ID of the secret in Secret Manager.
            version_id: Secret version (default: 'latest').

        Returns:
            Decoded secret string, or None if Secret Manager is not available or fails.
        """
        if not self.use_secret_manager:
            return None

        try:
            from google.cloud import secretmanager  # type: ignore

            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{self.gcp_project_id}/secrets/{secret_id}/versions/{version_id}"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception:
            # Fall back gracefully to environment variable / default
            return None

    def post_init_secrets(self) -> "Settings":
        """Load secrets from Google Secret Manager if enabled."""
        if self.use_secret_manager:
            fetched_key = self.fetch_secret_from_gcp("SMARTHEALTH_SECRET_KEY")
            if fetched_key:
                self.secret_key = fetched_key

            fetched_gemini = self.fetch_secret_from_gcp("GEMINI_API_KEY")
            if fetched_gemini:
                self.gemini_api_key = fetched_gemini

        return self


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    settings = Settings()
    return settings.post_init_secrets()
