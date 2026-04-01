"""
Worker models — re-declares Beanie Document models needed by the worker.
These mirror the python-server models to allow the worker to run independently.
"""
from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field
from beanie import PydanticObjectId


class Student(Document):
    name: str
    email: str
    phone: str = ""
    password: str = ""
    institution_id: Optional[PydanticObjectId] = None
    batch_id: Optional[PydanticObjectId] = None
    cloud_id: Optional[str] = None
    cloud_provider: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "students"


class Assessment(Document):
    name: str
    description: str = ""
    instruction: str = ""
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    individual_section_time_limit: Optional[int] = None
    auto_submit: bool = True
    batch_id: Optional[PydanticObjectId] = None
    teacher_id: Optional[PydanticObjectId] = None
    creator_id: Optional[str] = None
    creator_type: Optional[str] = None
    status: str = "UPCOMING"
    report: Optional[str] = None
    report_status: str = "NOT_REQUESTED"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessments"


class AssessmentSection(Document):
    name: str
    marks_per_question: int = 1
    assessment_type: str = "NO_CODE"
    assessment_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessment_sections"


class AssessmentQuestion(Document):
    question: Optional[str] = None
    options: List[str] = []
    correct_option: Optional[str] = None
    section_id: PydanticObjectId
    problem_id: Optional[PydanticObjectId] = None
    max_marks: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessment_questions"


class AssessmentSubmission(Document):
    assessment_id: PydanticObjectId
    student_id: PydanticObjectId
    student_ip: str = ""
    is_submitted: bool = False
    submitted_at: Optional[datetime] = None
    total_marks: int = 0
    tab_switch_count: int = 0
    proctoring_status: str = "NOT_CHEATED"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessment_submissions"


class AssessmentQuestionSubmission(Document):
    question_id: PydanticObjectId
    assessment_id: PydanticObjectId
    student_id: PydanticObjectId
    answer: Optional[str] = None
    marks_obtained: int = 0
    assessment_submission_id: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "assessment_question_submissions"


ALL_WORKER_MODELS = [
    Student,
    Assessment,
    AssessmentSection,
    AssessmentQuestion,
    AssessmentSubmission,
    AssessmentQuestionSubmission,
]
