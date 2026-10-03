from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "production"
    cv_service_secret: str

    cv_service_model: str = "openai/clip-vit-base-patch32"
    cv_model_version: str = "1"
    cv_extra_models: str = ""
    cv_max_concurrent_inferences: int = 2

    mongodb_uri: str = "mongodb://127.0.0.1:27017"
    mongodb_db: str = "sanskriti-snap"
    mongodb_references_collection: str = "artifactreferences"

    cloudinary_cloud_name: str | None = None
    cv_allowed_image_hosts: str = "res.cloudinary.com"
    cv_allow_http_images: bool = False
    cv_image_max_bytes: int = 10 * 1024 * 1024
    cv_image_fetch_timeout_s: float = 4.0

    cv_default_top_k: int = 3
    cv_enable_docs: bool = False

    @property
    def extra_models(self) -> list[str]:
        return [m.strip() for m in self.cv_extra_models.split(",") if m.strip()]

    @property
    def allowed_hosts(self) -> set[str]:
        return {h.strip().lower() for h in self.cv_allowed_image_hosts.split(",") if h.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
