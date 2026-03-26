from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from beanie import init_beanie
from config import connect_to_mongo, get_settings
from models import ALL_MODELS
from services.queue import close_connection as close_mq

# Import all routers
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.institution import router as institution_router
from routers.vendor import router as vendor_router
from routers.batch import router as batch_router
from routers.teacher import router as teacher_router
from routers.student import router as student_router
from routers.course import router as course_router
from routers.dsa_problem import router as dsa_problem_router
from routers.code_runner import router as code_runner_router
from routers.assessment import router as assessment_router
from routers.report import router as report_router
from routers.bulk_upload import router as bulk_upload_router
from routers.contact import router as contact_router

settings = get_settings()

limiter = Limiter(key_func=get_remote_address, default_limits=["200/10minutes"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=ALL_MODELS)
    print(f"Database connected: {db_name}")

    yield

    # Shutdown
    await close_mq()
    client.close()
    print("Server shutdown complete")


app = FastAPI(
    title="BitwiseLearn API",
    description="Backend API for BitwiseLearn - Learning & Institution Management Platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(institution_router)
app.include_router(vendor_router)
app.include_router(batch_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(course_router)
app.include_router(dsa_problem_router)
app.include_router(code_runner_router)
app.include_router(assessment_router)
app.include_router(report_router)
app.include_router(bulk_upload_router)
app.include_router(contact_router)


@app.get("/")
async def root():
    return {"message": "BitwiseLearn API v2.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
