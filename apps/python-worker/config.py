from pydantic_settings import BaseSettings
from functools import lru_cache
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError


class Settings(BaseSettings):
    DATABASE_URL: str = "mongodb://localhost:27017/bitwiselearn"
    DATABASE_FALLBACK_URL: str = "mongodb://localhost:27017/bitwiselearn"
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = 8000
    MQ_CLIENT: str = "amqp://guest:guest@localhost/"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "bitwise-learn"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


async def connect_to_mongo(settings: Settings) -> tuple[AsyncIOMotorClient, str]:
    primary_url = settings.DATABASE_URL
    fallback_url = settings.DATABASE_FALLBACK_URL

    for url in dict.fromkeys([primary_url, fallback_url]):
        client = AsyncIOMotorClient(
            url,
            serverSelectionTimeoutMS=settings.MONGO_SERVER_SELECTION_TIMEOUT_MS,
        )
        try:
            await client.admin.command("ping")
            db_name = url.rsplit("/", 1)[-1].split("?")[0] or "bitwiselearn"
            return client, db_name
        except PyMongoError as exc:
            client.close()
            if url == fallback_url:
                raise RuntimeError(
                    f"Unable to connect to MongoDB using primary or fallback URL. Last error: {exc}"
                ) from exc
            print(f"Primary MongoDB connection failed, trying fallback URL: {exc}")

    raise RuntimeError("Unable to resolve a MongoDB connection.")
