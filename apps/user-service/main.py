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
from shared.models.assessment_section import AssessmentSection
from shared.models.assessment_question import AssessmentQuestion
from shared.models.problem_test_case import ProblemTestCase

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Batch, Teacher, Student,
    Course, CourseEnrollment, Assessment, AssessmentSection,
    AssessmentQuestion, ProblemTestCase,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[user-service] Database connected: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn User Service", lifespan=lifespan)

from routers.admin import router as admin_router
from routers.institution import router as institution_router
from routers.vendor import router as vendor_router
from routers.batch import router as batch_router
from routers.teacher import router as teacher_router
from routers.student import router as student_router
from routers.bulk_upload import router as bulk_upload_router

app.include_router(admin_router)
app.include_router(institution_router)
app.include_router(vendor_router)
app.include_router(batch_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(bulk_upload_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "user"}
