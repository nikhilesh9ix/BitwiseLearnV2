from datetime import datetime, timezone
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field
import pymongo


class CourseEnrollment(Document):
    course_id: PydanticObjectId
    batch_id: PydanticObjectId
    institution_id: Optional[PydanticObjectId] = None
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "course_enrollments"
        indexes = [
            pymongo.IndexModel(
                [("course_id", 1), ("batch_id", 1)],
                unique=True,
            ),
        ]
