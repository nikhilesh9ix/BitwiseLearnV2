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
from shared.models.problem_topic import ProblemTopic
from shared.models.problem_template import ProblemTemplate
from shared.models.problem_test_case import ProblemTestCase
from shared.models.problem_solution import ProblemSolution
from shared.models.problem_submission import ProblemSubmission

settings = get_settings()

SERVICE_MODELS = [
    User, Institution, Vendor, Teacher, Student,
    Problem, ProblemTopic, ProblemTemplate,
    ProblemTestCase, ProblemSolution, ProblemSubmission,
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=SERVICE_MODELS)
    print(f"[problem-service] Connected to MongoDB: {db_name}")
    yield
    client.close()


app = FastAPI(title="BitwiseLearn Problem Service", lifespan=lifespan)

from routers.dsa_problem import router as dsa_problem_router

app.include_router(dsa_problem_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "problem"}
