from fastapi import APIRouter, Depends, Query
from beanie import PydanticObjectId
from shared.utils.api_response import api_response
from shared.middleware.auth import not_student, admin_only
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.batch import Batch
from shared.models.teacher import Teacher
from shared.models.student import Student
from shared.models.course import Course
from shared.models.course_enrollment import CourseEnrollment
from shared.models.assessment import Assessment
from shared.models.assessment_submission import AssessmentSubmission
from shared.services.queue import publish_message
from shared.enums import ReportStatus
import math

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/get-stats-count")
async def get_stats_count(current_user: dict = Depends(admin_only)):
    admins = await User.find_all().count()
    institutions = await Institution.find_all().count()
    vendors = await Vendor.find_all().count()
    batches = await Batch.find_all().count()
    teachers = await Teacher.find_all().count()
    students = await Student.find_all().count()
    courses = await Course.find_all().count()
    assessments = await Assessment.find_all().count()

    return api_response(200, "Stats fetched", data={
        "admins": admins,
        "institutions": institutions,
        "vendors": vendors,
        "batches": batches,
        "teachers": teachers,
        "students": students,
        "courses": courses,
        "assessments": assessments,
    })


@router.get("/assessment-report/{id}")
async def get_assessment_report(
    id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(not_student),
):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    total = await AssessmentSubmission.find(
        AssessmentSubmission.assessment_id == assessment.id
    ).count()

    submissions = await AssessmentSubmission.find(
        AssessmentSubmission.assessment_id == assessment.id
    ).skip((page - 1) * limit).limit(limit).to_list()

    data = []
    for sub in submissions:
        student = await Student.get(sub.student_id)
        data.append({
            "id": str(sub.id),
            "student_id": str(sub.student_id),
            "student_name": student.name if student else "Unknown",
            "student_email": student.email if student else "",
            "is_submitted": sub.is_submitted,
            "total_marks": sub.total_marks,
            "tab_switch_count": sub.tab_switch_count,
            "proctoring_status": sub.proctoring_status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        })

    return api_response(200, "Assessment report fetched", data={
        "submissions": data,
        "total": total,
        "page": page,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    })


@router.get("/course-report/{batch_id}/{course_id}")
async def get_course_report(
    batch_id: str,
    course_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(not_student),
):
    course = await Course.get(PydanticObjectId(course_id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    total = await CourseEnrollment.find(
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.batch_id == PydanticObjectId(batch_id),
    ).count()

    enrollments = await CourseEnrollment.find(
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.batch_id == PydanticObjectId(batch_id),
    ).skip((page - 1) * limit).limit(limit).to_list()

    data = []
    for e in enrollments:
        batch = await Batch.get(e.batch_id) if e.batch_id else None
        data.append({
            "id": str(e.id),
            "batch_id": str(e.batch_id),
            "batch_name": batch.name if batch else "Unknown",
            "created_at": e.created_at.isoformat(),
        })

    return api_response(200, "Course report fetched", data={
        "enrollments": data,
        "total": total,
        "page": page,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
    })


@router.get("/full-assessment-report/{id}")
async def trigger_full_assessment_report(id: str, current_user: dict = Depends(not_student)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    assessment.report_status = ReportStatus.PROCESSING
    await assessment.save()

    try:
        await publish_message("assessment-report", {"assessment_id": str(assessment.id)})
    except Exception:
        pass

    return api_response(200, "Full report generation triggered", data={
        "report_status": ReportStatus.PROCESSING
    })
