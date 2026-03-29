from contextlib import asynccontextmanager
from fastapi import FastAPI
from beanie import init_beanie
from shared.config import connect_to_mongo, get_settings
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.teacher import Teacher
from shared.models.student import Student

settings = get_settings()

SERVICE_MODELS = [User, Institution, Vendor, Teacher, Student]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[auth-service] Database connected: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Auth Service", lifespan=lifespan)

from routers.auth import router as auth_router

app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}
