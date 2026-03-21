"""
One-time script to seed a SUPERADMIN user into MongoDB.
Run from the project root:
    python seed_superadmin.py
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

DATABASE_URL = "mongodb+srv://bitwiselearn20:superadmin@cluster0.rvgyzhr.mongodb.net/bitwiselearn?retryWrites=true&w=majority&appName=Cluster0"

# ── Change these before running ──────────────────────────────────────────────
SUPERADMIN_EMAIL    = "admin@bitwiselearn.com"
SUPERADMIN_PASSWORD = "Admin@1234"
SUPERADMIN_NAME     = "Super Admin"
# ─────────────────────────────────────────────────────────────────────────────


async def seed():
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
        "role": str(UserType.SUPERADMIN),
    })
    print(f"[seed] Superadmin created successfully!")
    print(f"       Email:    {SUPERADMIN_EMAIL}")
    print(f"       Password: {SUPERADMIN_PASSWORD}")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
