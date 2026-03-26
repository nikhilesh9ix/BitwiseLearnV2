from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class ProblemSubmission(Document):
    code: str
    runtime: Optional[str] = None
    memory: Optional[str] = None
    status: str
    student_id: PydanticObjectId
    problem_id: PydanticObjectId
    failed_test_case: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "problem_submissions"
