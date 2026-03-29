from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class ProblemTestCase(Document):
    test_type: str
    input: str
    output: str
    problem_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "problem_test_cases"
