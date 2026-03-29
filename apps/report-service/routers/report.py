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
from shared.models.course_section import CourseSection
from shared.models.course_content import CourseLearningContent
from shared.models.course_assignment import CourseAssignment
from shared.models.course_assignment_submission import CourseAssignmentSubmission
from shared.models.course_enrollment import CourseEnrollment
from shared.models.course_progress import CourseProgress
from shared.models.assessment import Assessment
from shared.models.assessment_submission import AssessmentSubmission
from shared.services.queue import publish_message
from shared.enums import ReportStatus
import math

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


def _group_by_student(records: list, attr_name: str) -> dict[str, list]:
    grouped: dict[str, list] = {}
    for record in records:
        student_id = str(getattr(record, attr_name))
        grouped.setdefault(student_id, []).append(record)
    return grouped


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

    batch_oid = PydanticObjectId(batch_id)
    batch = await Batch.get(batch_oid)
    if not batch:
        return api_response(404, "Batch not found", error="Not found")

    total = await Student.find(Student.batch_id == batch_oid).count()
    students = await Student.find(Student.batch_id == batch_oid).skip(
        (page - 1) * limit
    ).limit(limit).to_list()

    student_ids = [student.id for student in students]
    sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
    section_ids = [section.id for section in sections]

    contents = []
    assignments = []
    if section_ids:
        contents = await CourseLearningContent.find(
            {"section_id": {"$in": section_ids}}
        ).to_list()
        assignments = await CourseAssignment.find(
            {"section_id": {"$in": section_ids}}
        ).to_list()

    content_ids = [content.id for content in contents]
    assignment_ids = [assignment.id for assignment in assignments]

    progresses = []
    submissions = []
    if student_ids and content_ids:
        progresses = await CourseProgress.find(
            {"student_id": {"$in": student_ids}, "content_id": {"$in": content_ids}}
        ).to_list()
    if student_ids and assignment_ids:
        submissions = await CourseAssignmentSubmission.find(
            {
                "student_id": {"$in": student_ids},
                "assignment_id": {"$in": assignment_ids},
            }
        ).to_list()

    progresses_by_student = _group_by_student(progresses, "student_id")
    submissions_by_student = _group_by_student(submissions, "student_id")

    data = []
    for student in students:
        student_id = str(student.id)
        student_progresses = progresses_by_student.get(student_id, [])
        student_submissions = submissions_by_student.get(student_id, [])
        data.append({
            "id": student_id,
            "name": student.name,
            "rollNumber": student.roll_number,
            "courseProgresses": [
                {"id": str(progress.id), "contentId": str(progress.content_id)}
                for progress in student_progresses
            ],
            "courseAssignemntSubmissions": [
                {"id": str(submission.id), "assignmentId": str(submission.assignment_id)}
                for submission in student_submissions
            ],
            "courseAssignmentSubmissions": [
                {"id": str(submission.id), "assignmentId": str(submission.assignment_id)}
                for submission in student_submissions
            ],
        })

    return api_response(200, "Course report fetched", data={
        "students": data,
        "batch": {"id": str(batch.id), "batchname": batch.batchname},
        "course": {"id": str(course.id), "name": course.name},
        "total_students": total,
        "page": page,
        "total_pages": math.ceil(total / limit) if total > 0 else 1,
        "totalCourseTopics": len(content_ids),
        "totalAssignments": len(assignment_ids),
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
