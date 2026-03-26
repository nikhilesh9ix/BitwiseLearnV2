from contextlib import asynccontextmanager
from fastapi import FastAPI
from beanie import init_beanie
from shared.config import connect_to_mongo, get_settings
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.batch import Batch
from shared.models.teacher import Teacher
from shared.models.student import Student
from shared.models.course import Course
from shared.models.course_enrollment import CourseEnrollment
from shared.models.assessment import Assessment
from shared.models.assessment_submission import AssessmentSubmission

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Batch, Teacher, Student,
    Course, CourseEnrollment, Assessment, AssessmentSubmission,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[report-service] Database connected: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Report Service", lifespan=lifespan)

from routers.report import router as report_router

app.include_router(report_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "report"}
