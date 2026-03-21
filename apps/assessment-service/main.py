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
from shared.models.assessment import Assessment
from shared.models.assessment_section import AssessmentSection
from shared.models.assessment_question import AssessmentQuestion
from shared.models.assessment_submission import AssessmentSubmission
from shared.models.assessment_question_submission import AssessmentQuestionSubmission
from shared.models.problem import Problem
from shared.models.problem_template import ProblemTemplate
from shared.models.problem_test_case import ProblemTestCase

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Teacher, Student, Batch,
    Assessment, AssessmentSection, AssessmentQuestion,
    AssessmentSubmission, AssessmentQuestionSubmission,
    Problem, ProblemTemplate, ProblemTestCase,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[assessment-service] Connected to MongoDB: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Assessment Service", lifespan=lifespan)

from routers.assessment import router as assessment_router

app.include_router(assessment_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "assessment"}
