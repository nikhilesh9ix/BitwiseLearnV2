from datetime import datetime, timezone
from beanie import Document, PydanticObjectId
from pydantic import Field


class AssessmentSection(Document):
    name: str
    marks_per_question: int
    assessment_type: str
    assessment_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessment_sections"
