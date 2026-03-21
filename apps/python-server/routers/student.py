import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from beanie import PydanticObjectId
from schemas.student import CreateStudentRequest, UpdateStudentRequest
from utils.api_response import api_response
from utils.password import hash_password
from middleware.auth import get_current_user, not_student, require_roles
from models.student import Student
from models.institution import Institution
from models.batch import Batch
from models.teacher import Teacher
from models.course_enrollment import CourseEnrollment
from models.course import Course
from models.assessment import Assessment
from enums import UserType
from services.email import send_welcome_email

router = APIRouter(prefix="/api/v1/students", tags=["Students"])
_student_manage_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION, UserType.VENDOR)


@router.post("/create-student")
async def create_student(body: CreateStudentRequest, current_user: dict = Depends(not_student)):
    inst = await Institution.get(PydanticObjectId(body.institution_id))
    if not inst:
        return api_response(404, "Institution not found", error="Not found")
    batch = await Batch.get(PydanticObjectId(body.batch_id))
    if not batch:
        return api_response(404, "Batch not found", error="Not found")

    existing = await Student.find_one(Student.email == body.email)
    if existing:
        return api_response(400, "Email already exists", error="Duplicate email")

    raw_password = body.login_password if body.login_password else secrets.token_urlsafe(10)
    hashed = hash_password(raw_password)

    student = Student(
        name=body.name,
        roll_number=body.roll_number,
        email=body.email,
        login_password=hashed,
        cloud_platform=body.cloud_platform,
        batch_id=PydanticObjectId(body.batch_id),
        institute_id=PydanticObjectId(body.institution_id),
    )
    await student.insert()

    try:
        send_welcome_email(body.email, body.name, raw_password, "Student")
    except Exception:
        pass

    return api_response(201, "Student created", data={
        "id": str(student.id), "name": student.name, "email": student.email
    })


@router.get("/get-all-student")
async def get_all_students(current_user: dict = Depends(get_current_user)):
    if current_user["type"] == UserType.INSTITUTION:
        students = await Student.find(
            Student.institute_id == PydanticObjectId(current_user["id"])
        ).to_list()
    else:
        students = await Student.find_all().to_list()

    data = [{
        "id": str(s.id), "name": s.name, "email": s.email,
        "roll_number": s.roll_number, "batch_id": str(s.batch_id),
        "institute_id": str(s.institute_id), "cloud_platform": s.cloud_platform,
        "created_at": s.created_at.isoformat()
    } for s in students]
    return api_response(200, "Students fetched", data=data)


@router.get("/get-student-by-id/{id}")
async def get_student_by_id(id: str, current_user: dict = Depends(get_current_user)):
    student = await Student.get(PydanticObjectId(id))
    if not student:
        return api_response(404, "Student not found", error="Not found")

    if current_user["type"] == UserType.STUDENT and str(student.id) != current_user["id"]:
        return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.INSTITUTION and str(student.institute_id) != current_user["id"]:
        return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.VENDOR:
        inst = await Institution.get(student.institute_id)
        if not inst or str(inst.created_by_vendor_id) != current_user["id"]:
            return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.TEACHER:
        teacher = await Teacher.get(PydanticObjectId(current_user["id"]))
        if not teacher or str(teacher.batch_id) != str(student.batch_id):
            return api_response(403, "Not authorized", error="Forbidden")

    return api_response(200, "Student fetched", data={
        "id": str(student.id), "name": student.name, "email": student.email,
        "roll_number": student.roll_number, "batch_id": str(student.batch_id),
        "institute_id": str(student.institute_id), "cloud_platform": student.cloud_platform,
        "cloudname": student.cloudname, "cloudpass": student.cloudpass, "cloudurl": student.cloudurl,
        "created_at": student.created_at.isoformat()
    })


@router.get("/get-student-by-batch/{id}")
async def get_students_by_batch(id: str, current_user: dict = Depends(get_current_user)):
    batch = await Batch.get(PydanticObjectId(id))
    if not batch:
        return api_response(404, "Batch not found", error="Not found")

    if current_user["type"] == UserType.STUDENT:
        me = await Student.get(PydanticObjectId(current_user["id"]))
        if not me or str(me.batch_id) != id:
            return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.TEACHER:
        teacher = await Teacher.get(PydanticObjectId(current_user["id"]))
        if not teacher or str(teacher.batch_id) != id:
            return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.INSTITUTION and str(batch.institution_id) != current_user["id"]:
        return api_response(403, "Not authorized", error="Forbidden")

    if current_user["type"] == UserType.VENDOR:
        inst = await Institution.get(batch.institution_id)
        if not inst or str(inst.created_by_vendor_id) != current_user["id"]:
            return api_response(403, "Not authorized", error="Forbidden")

    students = await Student.find(Student.batch_id == PydanticObjectId(id)).to_list()
    data = [{
        "id": str(s.id), "name": s.name, "email": s.email,
        "roll_number": s.roll_number
    } for s in students]
    return api_response(200, "Students fetched", data=data)


@router.put("/update-student-by-id/{id}")
async def update_student(id: str, body: UpdateStudentRequest, current_user: dict = Depends(get_current_user)):
    student = await Student.get(PydanticObjectId(id))
    if not student:
        return api_response(404, "Student not found", error="Not found")

    update_data = body.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(student, key, val)
    student.updated_at = datetime.now(timezone.utc)
    await student.save()
    return api_response(200, "Student updated", data={"id": str(student.id), "name": student.name})


@router.delete("/delete-student-by-id/{id}")
async def delete_student(id: str, current_user: dict = Depends(_student_manage_roles)):
    student = await Student.get(PydanticObjectId(id))
    if not student:
        return api_response(404, "Student not found", error="Not found")
    await student.delete()
    return api_response(200, "Student deleted")


@router.get("/dashboard")
async def student_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != UserType.STUDENT:
        return api_response(403, "Not authorized", error="Forbidden")

    student = await Student.get(PydanticObjectId(current_user["id"]))
    if not student:
        return api_response(404, "Student not found", error="Not found")

    batch = await Batch.get(student.batch_id)
    inst = await Institution.get(student.institute_id)

    # Enrolled courses via batch
    enrollments = await CourseEnrollment.find(CourseEnrollment.batch_id == student.batch_id).to_list()
    course_ids = [e.course_id for e in enrollments]
    courses = []
    for cid in course_ids:
        c = await Course.get(cid)
        if c:
            courses.append({"id": str(c.id), "name": c.name, "level": c.level})

    # Assessments for batch
    assessments = await Assessment.find(Assessment.batch_id == student.batch_id).to_list()
    assessment_data = [{
        "id": str(a.id), "name": a.name, "status": a.status,
        "start_time": a.start_time.isoformat(), "end_time": a.end_time.isoformat()
    } for a in assessments]

    return api_response(200, "Student dashboard", data={
        "student": {"id": str(student.id), "name": student.name, "email": student.email},
        "batch": {"id": str(batch.id), "batchname": batch.batchname} if batch else None,
        "institution": {"id": str(inst.id), "name": inst.name} if inst else None,
        "courses": courses,
        "assessments": assessment_data,
    })
