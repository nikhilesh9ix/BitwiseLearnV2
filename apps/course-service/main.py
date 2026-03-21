from contextlib import asynccontextmanager
from fastapi import FastAPI
from beanie import init_beanie
from shared.config import connect_to_mongo, get_settings
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.teacher import Teacher
from shared.models.student import Student
from shared.models.batch import Batch
from shared.models.course import Course
from shared.models.course_section import CourseSection
from shared.models.course_content import CourseLearningContent
from shared.models.course_assignment import CourseAssignment
from shared.models.course_assignment_question import CourseAssignmentQuestion
from shared.models.course_assignment_submission import CourseAssignmentSubmission
from shared.models.course_enrollment import CourseEnrollment
from shared.models.course_progress import CourseProgress

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Teacher, Student, Batch,
    Course, CourseSection, CourseLearningContent,
    CourseAssignment, CourseAssignmentQuestion, CourseAssignmentSubmission,
    CourseEnrollment, CourseProgress,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[course-service] Connected to MongoDB: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Course Service", lifespan=lifespan)

from routers.course import router as course_router

app.include_router(course_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "course"}
