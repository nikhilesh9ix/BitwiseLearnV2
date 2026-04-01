from datetime import datetime, timezone
import base64
from fastapi import APIRouter, Depends, UploadFile, File
from beanie import PydanticObjectId
from schemas.course import (
    CreateCourseRequest, UpdateCourseRequest, CreateSectionRequest, UpdateSectionRequest,
    AddContentRequest, UpdateContentRequest, CreateAssignmentRequest, UpdateAssignmentRequest,
    AddAssignmentQuestionRequest, UpdateAssignmentQuestionRequest, SubmitAssignmentRequest,
    AddEnrollmentRequest,
)
from utils.api_response import api_response
from middleware.auth import get_current_user, admin_only, require_roles
from middleware.auth import not_student
from models.course import Course
from models.course_section import CourseSection
from models.course_content import CourseLearningContent
from models.course_assignment import CourseAssignment
from models.course_assignment_question import CourseAssignmentQuestion
from models.course_assignment_submission import CourseAssignmentSubmission
from models.course_enrollment import CourseEnrollment
from models.course_progress import CourseProgress
from models.student import Student
from models.batch import Batch
from models.institution import Institution
from enums import CourseStatus, UserType
from services.s3 import upload_file_to_s3, delete_file_from_s3
from services.cloudinary_service import upload_to_cloudinary, delete_from_cloudinary

router = APIRouter(prefix="/api/v1/courses", tags=["Courses"])


def _delete_media_url(file_url: str) -> None:
    if not file_url:
        return
    if file_url.startswith("data:"):
        return
    if "cloudinary.com" in file_url:
        delete_from_cloudinary(file_url)
    else:
        delete_file_from_s3(file_url)


def _upload_media(file_bytes: bytes, folder: str, filename: str, content_type: str | None) -> str:
    try:
        return upload_to_cloudinary(file_bytes, folder, filename)
    except Exception:
        try:
            return upload_file_to_s3(
                file_bytes=file_bytes,
                folder=folder,
                filename=filename,
                content_type=content_type or "application/octet-stream",
            )
        except Exception:
            mime_type = content_type or "application/octet-stream"
            encoded = base64.b64encode(file_bytes).decode("utf-8")
            return f"data:{mime_type};base64,{encoded}"

# ========== COURSE CRUD ==========

@router.post("/create-course")
async def create_course(body: CreateCourseRequest, current_user: dict = Depends(admin_only)):
    existing = await Course.find_one(Course.name == body.name)
    if existing:
        return api_response(400, "Course name already exists", error="Duplicate name")

    course = Course(
        name=body.name,
        description=body.description,
        level=body.level,
        duration=body.duration,
        instructor_name=body.instructor_name,
        created_by=PydanticObjectId(current_user["id"]),
    )
    await course.insert()
    return api_response(201, "Course created", data={
        "id": str(course.id), "name": course.name
    })


@router.post("/upload-thumbnail/{id}")
async def upload_thumbnail(id: str, file: UploadFile = File(...), current_user: dict = Depends(admin_only)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    try:
        content = await file.read()
        url = _upload_media(
            file_bytes=content,
            folder="course-thumbnails",
            filename=file.filename or "thumbnail",
            content_type=file.content_type,
        )

        if course.thumbnail:
            _delete_media_url(course.thumbnail)

        course.thumbnail = url
        course.updated_at = datetime.now(timezone.utc)
        await course.save()
        return api_response(200, "Thumbnail uploaded", data={"thumbnail": url})
    except Exception as exc:
        return api_response(500, "Failed to upload thumbnail", error=str(exc))


@router.post("/upload-completion-certificate/{id}")
async def upload_certificate(id: str, file: UploadFile = File(...), current_user: dict = Depends(admin_only)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    try:
        content = await file.read()
        url = _upload_media(
            file_bytes=content,
            folder="course-certificates",
            filename=file.filename or "certificate",
            content_type=file.content_type,
        )

        if course.certificate:
            _delete_media_url(course.certificate)

        course.certificate = url
        course.updated_at = datetime.now(timezone.utc)
        await course.save()
        return api_response(200, "Certificate uploaded", data={"certificate": url})
    except Exception as exc:
        return api_response(500, "Failed to upload certificate", error=str(exc))


@router.put("/change-publish-status/{id}")
async def change_publish_status(id: str, current_user: dict = Depends(admin_only)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    if course.is_published == CourseStatus.PUBLISHED:
        course.is_published = CourseStatus.NOT_PUBLISHED
        # Remove enrollments on unpublish
        await CourseEnrollment.find(CourseEnrollment.course_id == course.id).delete()
    else:
        course.is_published = CourseStatus.PUBLISHED
    course.updated_at = datetime.now(timezone.utc)
    await course.save()
    return api_response(200, "Status changed", data={"is_published": course.is_published})


@router.put("/update-course/{id}")
async def update_course(id: str, body: UpdateCourseRequest, current_user: dict = Depends(admin_only)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(course, key, val)
    course.updated_at = datetime.now(timezone.utc)
    await course.save()
    return api_response(200, "Course updated", data={"id": str(course.id), "name": course.name})


@router.get("/get-all-courses-by-admin")
async def get_all_courses_by_admin(current_user: dict = Depends(require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.VENDOR))):
    courses = await Course.find_all().to_list()
    data = [{
        "id": str(c.id), "name": c.name, "description": c.description, "level": c.level,
        "duration": c.duration, "thumbnail": c.thumbnail, "instructor_name": c.instructor_name,
        "is_published": c.is_published, "created_at": c.created_at.isoformat()
    } for c in courses]
    return api_response(200, "Courses fetched", data=data)


@router.get("/get-course-by-id/{id}")
async def get_course_by_id(id: str, current_user: dict = Depends(get_current_user)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
    section_data = []
    for s in sections:
        contents = await CourseLearningContent.find(CourseLearningContent.section_id == s.id).to_list()
        assignments = await CourseAssignment.find(CourseAssignment.section_id == s.id).to_list()
        content_data = [{
            "id": str(ct.id), "name": ct.name, "description": ct.description,
            "video_url": ct.video_url, "transcript": ct.transcript, "file": ct.file
        } for ct in contents]
        assignment_data = [{
            "id": str(a.id), "name": a.name, "description": a.description,
            "instruction": a.instruction, "marks_per_question": a.marks_per_question
        } for a in assignments]
        section_data.append({
            "id": str(s.id), "name": s.name, "contents": content_data,
            "assignments": assignment_data
        })

    return api_response(200, "Course fetched", data={
        "id": str(course.id), "name": course.name, "description": course.description,
        "level": course.level, "duration": course.duration, "thumbnail": course.thumbnail,
        "instructor_name": course.instructor_name, "certificate": course.certificate,
        "is_published": course.is_published, "sections": section_data,
        "created_at": course.created_at.isoformat()
    })


@router.get("/get-course-by-institution/{id}")
async def get_course_by_institution(id: str, current_user: dict = Depends(get_current_user)):
    batches = await Batch.find(Batch.institution_id == PydanticObjectId(id)).to_list()
    batch_ids = [b.id for b in batches]
    if not batch_ids:
        return api_response(200, "No courses", data=[])

    enrollments = await CourseEnrollment.find({"batch_id": {"$in": batch_ids}}).to_list()
    course_ids = list(set(e.course_id for e in enrollments))
    courses = []
    for cid in course_ids:
        c = await Course.get(cid)
        if c:
            courses.append({
                "id": str(c.id), "name": c.name, "level": c.level,
                "thumbnail": c.thumbnail, "instructor_name": c.instructor_name
            })
    return api_response(200, "Courses fetched", data=courses)


@router.get("/get-all-sections-by-course/{id}")
async def get_all_sections_by_course(id: str, current_user: dict = Depends(get_current_user)):
    sections = await CourseSection.find(CourseSection.course_id == PydanticObjectId(id)).to_list()

    data = []
    for section in sections:
        contents = await CourseLearningContent.find(
            CourseLearningContent.section_id == section.id
        ).to_list()

        content_data = [
            {
                "id": str(content.id),
                "name": content.name,
                "description": content.description,
                "video_url": content.video_url,
                "transcript": content.transcript,
                "file": content.file,
            }
            for content in contents
        ]

        data.append(
            {
                "id": str(section.id),
                "name": section.name,
                "course_id": str(section.course_id),
                "course_learning_contents": content_data,
            }
        )

    return api_response(200, "Sections fetched", data=data)


@router.delete("/delete-course/{id}")
async def delete_course(id: str, current_user: dict = Depends(admin_only)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    cid = course.id
    sections = await CourseSection.find(CourseSection.course_id == cid).to_list()
    for s in sections:
        contents = await CourseLearningContent.find(CourseLearningContent.section_id == s.id).to_list()
        for ct in contents:
            if ct.file:
                delete_file_from_s3(ct.file)
            await CourseProgress.find(CourseProgress.content_id == ct.id).delete()
            await ct.delete()
        await CourseAssignment.find(CourseAssignment.section_id == s.id).delete()
        await s.delete()
    await CourseEnrollment.find(CourseEnrollment.course_id == cid).delete()
    if course.thumbnail:
        delete_from_cloudinary(course.thumbnail)
    if course.certificate:
        delete_from_cloudinary(course.certificate)
    await course.delete()
    return api_response(200, "Course deleted")


@router.get("/get-student-courses")
async def get_student_courses(current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student = await Student.get(PydanticObjectId(current_user["id"]))
    if not student:
        return api_response(404, "Student not found", error="Not found")

    enrollments = await CourseEnrollment.find(CourseEnrollment.batch_id == student.batch_id).to_list()
    courses = []
    for e in enrollments:
        c = await Course.get(e.course_id)
        if c and c.is_published == CourseStatus.PUBLISHED:
            courses.append({
                "id": str(c.id), "name": c.name, "description": c.description,
                "level": c.level, "thumbnail": c.thumbnail, "instructor_name": c.instructor_name
            })
    return api_response(200, "Student courses", data=courses)


@router.get("/listed-courses")
async def listed_courses():
    courses = await Course.find(Course.is_published == CourseStatus.PUBLISHED).to_list()
    data = [{
        "id": str(c.id), "name": c.name, "description": c.description,
        "level": c.level, "thumbnail": c.thumbnail, "instructor_name": c.instructor_name,
        "duration": c.duration
    } for c in courses]
    return api_response(200, "Listed courses", data=data)


# ========== COURSE SECTIONS ==========

@router.get("/get-course-section/{id}")
async def get_course_section(id: str, current_user: dict = Depends(get_current_user)):
    section = await CourseSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")

    contents = await CourseLearningContent.find(CourseLearningContent.section_id == section.id).to_list()
    content_data = [{
        "id": str(ct.id), "name": ct.name, "description": ct.description,
        "video_url": ct.video_url, "transcript": ct.transcript, "file": ct.file
    } for ct in contents]

    return api_response(200, "Section fetched", data={
        "id": str(section.id), "name": section.name, "course_id": str(section.course_id),
        "contents": content_data
    })


@router.post("/add-course-section/{id}")
async def add_course_section(id: str, body: CreateSectionRequest, current_user: dict = Depends(get_current_user)):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    section = CourseSection(
        name=body.name,
        creator_id=PydanticObjectId(current_user["id"]),
        course_id=course.id,
    )
    await section.insert()
    return api_response(201, "Section created", data={"id": str(section.id), "name": section.name})


@router.put("/update-course-section/{id}")
async def update_course_section(id: str, body: UpdateSectionRequest, current_user: dict = Depends(get_current_user)):
    section = await CourseSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")
    if body.name:
        section.name = body.name
    section.updated_at = datetime.now(timezone.utc)
    await section.save()
    return api_response(200, "Section updated", data={"id": str(section.id), "name": section.name})


@router.delete("/delete-course-section/{id}")
async def delete_course_section(id: str, current_user: dict = Depends(get_current_user)):
    section = await CourseSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")
    # Delete contents and progress
    contents = await CourseLearningContent.find(CourseLearningContent.section_id == section.id).to_list()
    for ct in contents:
        if ct.file:
            delete_file_from_s3(ct.file)
        await CourseProgress.find(CourseProgress.content_id == ct.id).delete()
        await ct.delete()
    await CourseAssignment.find(CourseAssignment.section_id == section.id).delete()
    await section.delete()
    return api_response(200, "Section deleted")


# ========== COURSE CONTENT ==========

@router.post("/add-content-to-section")
async def add_content_to_section(body: AddContentRequest, current_user: dict = Depends(admin_only)):
    section = await CourseSection.get(PydanticObjectId(body.section_id))
    if not section:
        return api_response(404, "Section not found", error="Not found")

    content = CourseLearningContent(
        name=body.name,
        description=body.description,
        creator_id=PydanticObjectId(current_user["id"]),
        section_id=section.id,
        video_url=body.video_url,
        transcript=body.transcript,
    )
    await content.insert()
    return api_response(201, "Content added", data={"id": str(content.id), "name": content.name})


@router.delete("/delete-content/{id}")
async def delete_content(id: str, current_user: dict = Depends(admin_only)):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")
    if content.file:
        delete_file_from_s3(content.file)
    await CourseProgress.find(CourseProgress.content_id == content.id).delete()
    await content.delete()
    return api_response(200, "Content deleted")


@router.put("/update-content-to-section/{id}")
async def update_content(id: str, body: UpdateContentRequest, current_user: dict = Depends(admin_only)):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(content, key, val)
    content.updated_at = datetime.now(timezone.utc)
    await content.save()
    return api_response(200, "Content updated", data={"id": str(content.id)})


@router.post("/upload-file-in-content/{id}")
async def upload_file_in_content(id: str, file: UploadFile = File(...), current_user: dict = Depends(admin_only)):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")

    file_bytes = await file.read()
    url = upload_file_to_s3(file_bytes, "course-content", file.filename or "file", file.content_type or "application/octet-stream")
    if content.file:
        delete_file_from_s3(content.file)
    content.file = url
    content.updated_at = datetime.now(timezone.utc)
    await content.save()
    return api_response(200, "File uploaded", data={"file": url})


@router.delete("/remove-file-in-content/{id}")
async def remove_file_in_content(id: str, current_user: dict = Depends(admin_only)):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")
    if content.file:
        delete_file_from_s3(content.file)
        content.file = ""
        content.updated_at = datetime.now(timezone.utc)
        await content.save()
    return api_response(200, "File removed")


# ========== COURSE ASSIGNMENTS ==========

@router.post("/add-assignment-to-section/")
async def add_assignment_to_section(body: CreateAssignmentRequest, current_user: dict = Depends(admin_only)):
    section = await CourseSection.get(PydanticObjectId(body.section_id))
    if not section:
        return api_response(404, "Section not found", error="Not found")

    assignment = CourseAssignment(
        name=body.name,
        description=body.description,
        instruction=body.instruction,
        marks_per_question=body.marks_per_question,
        section_id=section.id,
    )
    await assignment.insert()
    return api_response(201, "Assignment created", data={"id": str(assignment.id), "name": assignment.name})


@router.put("/update-assignment-to-section/{id}")
async def update_assignment(id: str, body: UpdateAssignmentRequest, current_user: dict = Depends(admin_only)):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(assignment, key, val)
    assignment.updated_at = datetime.now(timezone.utc)
    await assignment.save()
    return api_response(200, "Assignment updated", data={"id": str(assignment.id)})


@router.delete("/remove-assignment-from-section/{id}")
async def remove_assignment(id: str, current_user: dict = Depends(admin_only)):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")
    await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == assignment.id).delete()
    await CourseAssignmentSubmission.find(CourseAssignmentSubmission.assignment_id == assignment.id).delete()
    await assignment.delete()
    return api_response(200, "Assignment deleted")


@router.get("/get-assignment-by-id/{id}")
async def get_assignment_by_id(id: str, current_user: dict = Depends(get_current_user)):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")
    questions = await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == assignment.id).to_list()
    q_data = [{
        "id": str(q.id), "question": q.question, "options": q.options,
        "correct_answer": q.correct_answer, "type": q.type
    } for q in questions]
    return api_response(200, "Assignment fetched", data={
        "id": str(assignment.id), "name": assignment.name, "description": assignment.description,
        "instruction": assignment.instruction, "marks_per_question": assignment.marks_per_question,
        "section_id": str(assignment.section_id), "questions": q_data
    })


@router.post("/add-assignment-question/{id}")
async def add_assignment_question(id: str, body: AddAssignmentQuestionRequest, current_user: dict = Depends(admin_only)):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")
    q = CourseAssignmentQuestion(
        question=body.question, options=body.options,
        correct_answer=body.correct_answer, assignment_id=assignment.id, type=body.type,
    )
    await q.insert()
    return api_response(201, "Question added", data={"id": str(q.id)})


@router.put("/update-assignment-question/{id}")
async def update_assignment_question(id: str, body: UpdateAssignmentQuestionRequest, current_user: dict = Depends(admin_only)):
    q = await CourseAssignmentQuestion.get(PydanticObjectId(id))
    if not q:
        return api_response(404, "Question not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(q, key, val)
    q.updated_at = datetime.now(timezone.utc)
    await q.save()
    return api_response(200, "Question updated", data={"id": str(q.id)})


@router.delete("/remove-assignment-question/{id}")
async def remove_assignment_question(id: str, current_user: dict = Depends(admin_only)):
    q = await CourseAssignmentQuestion.get(PydanticObjectId(id))
    if not q:
        return api_response(404, "Question not found", error="Not found")
    await CourseAssignmentSubmission.find(CourseAssignmentSubmission.question_id == q.id).delete()
    await q.delete()
    return api_response(200, "Question deleted")


@router.get("/get-all-section-assignments/{id}")
async def get_all_section_assignments(id: str, current_user: dict = Depends(admin_only)):
    assignments = await CourseAssignment.find(CourseAssignment.section_id == PydanticObjectId(id)).to_list()
    data = [{
        "id": str(a.id), "name": a.name, "description": a.description,
        "marks_per_question": a.marks_per_question
    } for a in assignments]
    return api_response(200, "Assignments fetched", data=data)


@router.get("/get-student-section-assignments/{id}")
async def get_student_section_assignments(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student_id = PydanticObjectId(current_user["id"])
    assignments = await CourseAssignment.find(CourseAssignment.section_id == PydanticObjectId(id)).to_list()
    data = []
    for a in assignments:
        submissions = await CourseAssignmentSubmission.find(
            CourseAssignmentSubmission.assignment_id == a.id,
            CourseAssignmentSubmission.student_id == student_id,
        ).to_list()
        data.append({
            "id": str(a.id), "name": a.name, "description": a.description,
            "marks_per_question": a.marks_per_question,
            "attempted": len(submissions) > 0,
            "submission_count": len(submissions),
        })
    return api_response(200, "Assignments fetched", data=data)


# ========== COURSE GRADES ==========

@router.get("/get-all-assignment-marks/")
async def get_all_assignment_marks(current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student_id = PydanticObjectId(current_user["id"])
    student = await Student.get(student_id)
    if not student:
        return api_response(404, "Student not found", error="Not found")

    enrollments = await CourseEnrollment.find(CourseEnrollment.batch_id == student.batch_id).to_list()
    results = []
    for e in enrollments:
        course = await Course.get(e.course_id)
        if not course:
            continue
        sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
        total_marks = 0
        obtained_marks = 0
        for sec in sections:
            assignments = await CourseAssignment.find(CourseAssignment.section_id == sec.id).to_list()
            for a in assignments:
                questions = await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == a.id).to_list()
                total_marks += len(questions) * a.marks_per_question
                subs = await CourseAssignmentSubmission.find(
                    CourseAssignmentSubmission.assignment_id == a.id,
                    CourseAssignmentSubmission.student_id == student_id,
                ).to_list()
                obtained_marks += sum(s.marks_obtained or 0 for s in subs)
        results.append({
            "course_id": str(course.id), "course_name": course.name,
            "total_marks": total_marks, "obtained_marks": obtained_marks
        })
    return api_response(200, "Assignment marks", data=results)


@router.get("/get-all-assignment-marks-by-courseId/{id}")
async def get_assignment_marks_by_course(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student_id = PydanticObjectId(current_user["id"])
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
    results = []
    for sec in sections:
        assignments = await CourseAssignment.find(CourseAssignment.section_id == sec.id).to_list()
        for a in assignments:
            questions = await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == a.id).to_list()
            total = len(questions) * a.marks_per_question
            subs = await CourseAssignmentSubmission.find(
                CourseAssignmentSubmission.assignment_id == a.id,
                CourseAssignmentSubmission.student_id == student_id,
            ).to_list()
            obtained = sum(s.marks_obtained or 0 for s in subs)
            results.append({
                "assignment_id": str(a.id), "assignment_name": a.name,
                "section_name": sec.name, "total_marks": total, "obtained_marks": obtained
            })
    return api_response(200, "Assignment marks", data=results)


@router.get("/get-assignment-report/{id}")
async def get_assignment_report(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    questions = await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == assignment.id).to_list()
    submissions = await CourseAssignmentSubmission.find(
        CourseAssignmentSubmission.assignment_id == assignment.id,
        CourseAssignmentSubmission.student_id == student_id,
    ).to_list()

    if not submissions:
        return api_response(404, "Report not found", error="Not found")

    obtained_marks = sum(s.marks_obtained or 0 for s in submissions)
    total_marks = len(questions) * assignment.marks_per_question
    percentage = round((obtained_marks / total_marks) * 100, 2) if total_marks > 0 else 0
    latest_attempted_at = max((s.submitted_at for s in submissions), default=None)

    return api_response(200, "Assignment report fetched", data={
        "assignment_id": str(assignment.id),
        "assignment_name": assignment.name,
        "total_questions": len(questions),
        "answered_questions": len(submissions),
        "correct_answers": sum(1 for s in submissions if s.is_correct),
        "obtained_marks": obtained_marks,
        "total_marks": total_marks,
        "percentage": percentage,
        "attempted_at": latest_attempted_at.isoformat() if latest_attempted_at else None,
    })


@router.post("/submit-course-assignment/{id}")
async def submit_course_assignment(id: str, body: SubmitAssignmentRequest, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    assignment = await CourseAssignment.get(PydanticObjectId(id))
    if not assignment:
        return api_response(404, "Assignment not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])

    existing_any = await CourseAssignmentSubmission.find_one(
        CourseAssignmentSubmission.assignment_id == assignment.id,
        CourseAssignmentSubmission.student_id == student_id,
    )
    if existing_any:
        questions = await CourseAssignmentQuestion.find(CourseAssignmentQuestion.assignment_id == assignment.id).to_list()
        existing_submissions = await CourseAssignmentSubmission.find(
            CourseAssignmentSubmission.assignment_id == assignment.id,
            CourseAssignmentSubmission.student_id == student_id,
        ).to_list()
        obtained_marks = sum(s.marks_obtained or 0 for s in existing_submissions)
        total_marks = len(questions) * assignment.marks_per_question
        percentage = round((obtained_marks / total_marks) * 100, 2) if total_marks > 0 else 0
        latest_attempted_at = max((s.submitted_at for s in existing_submissions), default=None)

        return api_response(
            409,
            "Assignment already attempted",
            data={
                "report": {
                    "assignment_id": str(assignment.id),
                    "assignment_name": assignment.name,
                    "total_questions": len(questions),
                    "answered_questions": len(existing_submissions),
                    "correct_answers": sum(1 for s in existing_submissions if s.is_correct),
                    "obtained_marks": obtained_marks,
                    "total_marks": total_marks,
                    "percentage": percentage,
                    "attempted_at": latest_attempted_at.isoformat() if latest_attempted_at else None,
                }
            },
            error="Only one attempt is allowed",
        )

    results = []
    question_map = {
        str(q.id): q
        for q in await CourseAssignmentQuestion.find(
            CourseAssignmentQuestion.assignment_id == assignment.id
        ).to_list()
    }

    for ans in body.answers:
        question_id = ans.get("question_id")
        if not question_id:
            continue

        question = question_map.get(str(question_id))
        if not question:
            continue

        q_id = PydanticObjectId(str(question.id))
        student_answer = ans.get("answer", [])
        is_correct = sorted(student_answer) == sorted(question.correct_answer)
        marks = assignment.marks_per_question if is_correct else 0

        sub = CourseAssignmentSubmission(
            question_id=q_id, student_id=student_id, answer=student_answer,
            assignment_id=assignment.id, marks_obtained=marks, is_correct=is_correct,
        )
        await sub.insert()

        results.append({"question_id": str(q_id), "is_correct": is_correct, "marks": marks})

    total_questions = len(question_map)
    total_marks = total_questions * assignment.marks_per_question
    obtained_marks = sum(r["marks"] for r in results)
    percentage = round((obtained_marks / total_marks) * 100, 2) if total_marks > 0 else 0

    return api_response(200, "Assignment submitted", data={
        "results": results,
        "report": {
            "assignment_id": str(assignment.id),
            "assignment_name": assignment.name,
            "total_questions": total_questions,
            "answered_questions": len(results),
            "correct_answers": sum(1 for r in results if r["is_correct"]),
            "obtained_marks": obtained_marks,
            "total_marks": total_marks,
            "percentage": percentage,
            "attempted_at": datetime.now(timezone.utc).isoformat(),
        },
    })


# ========== COURSE PROGRESS ==========

@router.post("/mark-content-as-done/{id}")
async def mark_content_done(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    existing = await CourseProgress.find_one(
        CourseProgress.student_id == student_id,
        CourseProgress.content_id == content.id,
    )
    if existing:
        return api_response(200, "Already marked as done")

    progress = CourseProgress(student_id=student_id, content_id=content.id)
    await progress.insert()
    return api_response(201, "Content marked as done")


@router.post("/unmark-content-as-done/{id}")
async def unmark_content_done(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    content = await CourseLearningContent.get(PydanticObjectId(id))
    if not content:
        return api_response(404, "Content not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    await CourseProgress.find(
        CourseProgress.student_id == student_id,
        CourseProgress.content_id == content.id,
    ).delete()
    return api_response(200, "Content unmarked")


@router.get("/get-all-course-progress/")
async def get_all_course_progress(current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student = await Student.get(PydanticObjectId(current_user["id"]))
    if not student:
        return api_response(404, "Student not found", error="Not found")

    enrollments = await CourseEnrollment.find(CourseEnrollment.batch_id == student.batch_id).to_list()
    results = []
    for e in enrollments:
        course = await Course.get(e.course_id)
        if not course:
            continue
        sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
        total_content = 0
        done_content = 0
        for sec in sections:
            contents = await CourseLearningContent.find(CourseLearningContent.section_id == sec.id).to_list()
            total_content += len(contents)
            for ct in contents:
                prog = await CourseProgress.find_one(
                    CourseProgress.student_id == student.id,
                    CourseProgress.content_id == ct.id,
                )
                if prog:
                    done_content += 1

        percentage = (done_content / total_content * 100) if total_content > 0 else 0
        results.append({
            "course_id": str(course.id), "course_name": course.name,
            "total_content": total_content, "completed_content": done_content,
            "percentage": round(percentage, 2)
        })
    return api_response(200, "Course progress", data=results)


@router.get("/get-individual-course-progress/{id}")
async def get_individual_course_progress(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    student_id = PydanticObjectId(current_user["id"])
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    sections = await CourseSection.find(CourseSection.course_id == course.id).to_list()
    results = []
    for sec in sections:
        contents = await CourseLearningContent.find(CourseLearningContent.section_id == sec.id).to_list()
        content_progress = []
        for ct in contents:
            prog = await CourseProgress.find_one(
                CourseProgress.student_id == student_id,
                CourseProgress.content_id == ct.id,
            )
            content_progress.append({
                "content_id": str(ct.id), "name": ct.name, "completed": prog is not None
            })
        total = len(contents)
        done = sum(1 for cp in content_progress if cp["completed"])
        results.append({
            "section_id": str(sec.id), "section_name": sec.name,
            "total": total, "completed": done,
            "percentage": round(done / total * 100, 2) if total > 0 else 0,
            "contents": content_progress,
        })
    return api_response(200, "Individual course progress", data=results)


# ========== COURSE ENROLLMENTS ==========

@router.get("/get-course-enrollments/{id}")
async def get_course_enrollments(id: str, current_user: dict = Depends(require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION))):
    course = await Course.get(PydanticObjectId(id))
    if not course:
        return api_response(404, "Course not found", error="Not found")

    enrollments = await CourseEnrollment.find(
        CourseEnrollment.course_id == course.id
    ).to_list()

    data = []
    for e in enrollments:
        batch = await Batch.get(e.batch_id)
        institution = None
        if e.institution_id:
            institution = await Institution.get(e.institution_id)
        elif batch and batch.institution_id:
            institution = await Institution.get(batch.institution_id)

        data.append({
            # Structured shape consumed by reports UI.
            "institution": {
                "id": str(institution.id) if institution else str(e.institution_id) if e.institution_id else "",
                "name": institution.name if institution else "Unknown Institution",
            },
            "batch": {
                "id": str(batch.id) if batch else str(e.batch_id),
                "batchname": batch.batchname if batch else "",
                "branch": batch.branch if batch else "",
            },

            # Legacy fields kept for backward compatibility.
            "id": str(e.id),
            "course_id": str(e.course_id),
            "batch_id": str(e.batch_id),
            "batch_name": batch.batchname if batch else None,
            "institution_id": str(e.institution_id) if e.institution_id else None,
            "enrolled_at": e.enrolled_at.isoformat(),
        })

    return api_response(200, "Enrollments fetched", data={
        "course": {
            "id": str(course.id),
            "name": course.name,
            "description": course.description,
            "level": course.level,
            "duration": course.duration,
            "thumbnail": course.thumbnail,
            "instructor_name": course.instructor_name,
            "certificate": course.certificate,
            "is_published": course.is_published,
            "created_at": course.created_at.isoformat() if course.created_at else None,
        },
        "data": data,
    })


@router.get("/get-course-enrollments-by-batch/{id}")
async def get_course_enrollments_by_batch(id: str, current_user: dict = Depends(get_current_user)):
    enrollments = await CourseEnrollment.find(CourseEnrollment.batch_id == PydanticObjectId(id)).to_list()
    data = []
    for e in enrollments:
        course = await Course.get(e.course_id)
        data.append({
            "id": str(e.id), "course_id": str(e.course_id),
            "course_name": course.name if course else None,
            "instructor_name": course.instructor_name if course else None,
            "level": course.level if course else None,
            "created_at": course.created_at.isoformat() if course else None,
            "batch_id": str(e.batch_id), "enrolled_at": e.enrolled_at.isoformat()
        })
    return api_response(200, "Enrollments fetched", data=data)


@router.post("/add-course-enrollment/")
async def add_course_enrollment(body: AddEnrollmentRequest, current_user: dict = Depends(not_student)):
    course_id = PydanticObjectId(body.course_id)
    batch_id = PydanticObjectId(body.batch_id)
    course = await Course.get(course_id)
    if not course:
        return api_response(404, "Course not found", error="Not found")

    if course.is_published != CourseStatus.PUBLISHED:
        return api_response(
            400,
            "Publish course before assigning it to a batch",
            error="Course is not published",
        )

    batch = await Batch.get(batch_id)
    if not batch:
        return api_response(404, "Batch not found", error="Not found")

    existing = await CourseEnrollment.find_one(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.batch_id == batch_id,
    )
    if existing:
        return api_response(400, "Already enrolled", error="Duplicate enrollment")

    enrollment = CourseEnrollment(
        course_id=course_id,
        batch_id=batch_id,
        institution_id=PydanticObjectId(body.institution_id) if body.institution_id else None,
    )
    await enrollment.insert()
    return api_response(201, "Enrollment created", data={"id": str(enrollment.id)})


@router.delete("/remove-course-enrollment/{id}")
async def remove_course_enrollment(id: str, current_user: dict = Depends(not_student)):
    enrollment = await CourseEnrollment.get(PydanticObjectId(id))
    if not enrollment:
        return api_response(404, "Enrollment not found", error="Not found")
    await enrollment.delete()
    return api_response(200, "Enrollment removed")
