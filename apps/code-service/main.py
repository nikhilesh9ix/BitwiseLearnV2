from contextlib import asynccontextmanager
from fastapi import FastAPI
from beanie import init_beanie
from shared.config import connect_to_mongo, get_settings
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.teacher import Teacher
from shared.models.student import Student
from shared.models.problem import Problem
from shared.models.problem_test_case import ProblemTestCase
from shared.models.problem_template import ProblemTemplate
from shared.models.problem_submission import ProblemSubmission
from shared.models.problem_submission_test_case import ProblemSubmissionTestCase

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Teacher, Student,
    Problem, ProblemTestCase, ProblemTemplate,
    ProblemSubmission, ProblemSubmissionTestCase,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[code-service] Connected to MongoDB: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Code Service", lifespan=lifespan)

from routers.code_runner import router as code_runner_router

app.include_router(code_runner_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "code"}
