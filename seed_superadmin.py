"""
One-time script to seed a SUPERADMIN user into MongoDB.
Run from the project root:
    python seed_superadmin.py

Required environment variables:
    DATABASE_URL
    SUPERADMIN_EMAIL
    SUPERADMIN_PASSWORD

Optional environment variables:
    SUPERADMIN_NAME (default: Super Admin)
"""
import asyncio
import os
import sys
import certifi

# Allow importing shared package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "apps", "shared"))

from motor.motor_asyncio import AsyncIOMotorClient
from shared.utils.password import hash_password
from shared.enums import UserType

DATABASE_URL = os.getenv("DATABASE_URL")
SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD")
SUPERADMIN_NAME = os.getenv("SUPERADMIN_NAME", "Super Admin")


def _require_env() -> None:
    missing = [
        name
        for name, value in {
            "DATABASE_URL": DATABASE_URL,
            "SUPERADMIN_EMAIL": SUPERADMIN_EMAIL,
            "SUPERADMIN_PASSWORD": SUPERADMIN_PASSWORD,
        }.items()
        if not value
    ]

    if missing:
        raise RuntimeError(
            f"Missing required environment variable(s): {', '.join(missing)}"
        )


async def seed():
    _require_env()

    client = AsyncIOMotorClient(DATABASE_URL, tlsCAFile=certifi.where())
    db_name = DATABASE_URL.rsplit("/", 1)[-1].split("?")[0] or "bitwiselearn"
    db = client[db_name]
    users = db["users"]

    existing = await users.find_one({"email": SUPERADMIN_EMAIL})
    if existing:
        print(f"[seed] Superadmin already exists: {SUPERADMIN_EMAIL}")
        client.close()
        return

    await users.insert_one({
        "name": SUPERADMIN_NAME,
        "email": SUPERADMIN_EMAIL,
        "password": hash_password(SUPERADMIN_PASSWORD),
        "role": UserType.SUPERADMIN.value,
    })
    print(f"[seed] Superadmin created successfully!")
    print(f"       Email:    {SUPERADMIN_EMAIL}")
    print(f"       Password: {SUPERADMIN_PASSWORD}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
