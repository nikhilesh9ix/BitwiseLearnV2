from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = 8000
    MQ_CLIENT: str = "amqp://guest:guest@localhost/"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "bitwise-learn"

    model_config = SettingsConfigDict(
        env_file=(".env", "../python-server/.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


async def connect_to_mongo(settings: Settings) -> tuple[AsyncIOMotorClient, str]:
    url = settings.DATABASE_URL
    if not url:
        raise RuntimeError("DATABASE_URL is not configured.")

    client: AsyncIOMotorClient = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=settings.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    )
    try:
        await client.admin.command("ping")
        db_name = url.rsplit("/", 1)[-1].split("?")[0] or "bitwiselearn"
        return client, db_name
    except PyMongoError as exc:
        client.close()
        raise RuntimeError(
            f"Unable to connect to database using DATABASE_URL. Last error: {exc}"
        ) from exc
