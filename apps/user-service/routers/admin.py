import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from beanie import PydanticObjectId
from shared.schemas.user import CreateAdminRequest, UpdateAdminRequest
from shared.utils.api_response import api_response
from shared.utils.password import hash_password
from shared.middleware.auth import get_current_user, superadmin_only
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.student import Student
from shared.models.teacher import Teacher
from shared.models.batch import Batch
from shared.models.course import Course
from shared.models.assessment import Assessment
from shared.enums import UserType
from shared.services.email import send_welcome_email

router = APIRouter(prefix="/api/v1/admins", tags=["Admin"])


@router.post("/create-admin")
async def create_admin(body: CreateAdminRequest, current_user: dict = Depends(superadmin_only)):
    existing = await User.find_one(User.email == body.email)
    if existing:
        return api_response(400, "Email already exists", error="Duplicate email")

    raw_password = secrets.token_urlsafe(10)
    hashed = hash_password(raw_password)
    admin = User(name=body.name, email=body.email, password=hashed, role=body.role)
    await admin.insert()

    try:
        send_welcome_email(body.email, body.name, raw_password, "Admin")
    except Exception:
        pass

    return api_response(201, "Admin created successfully", data={
        "id": str(admin.id), "name": admin.name, "email": admin.email, "role": admin.role
    })


@router.get("/get-all-admin")
async def get_all_admins(current_user: dict = Depends(superadmin_only)):
    admins = await User.find(User.role == UserType.ADMIN).to_list()
    data = [{"id": str(a.id), "name": a.name, "email": a.email, "role": a.role,
             "created_at": a.created_at.isoformat()} for a in admins]
    return api_response(200, "Admins fetched", data=data)


@router.get("/get-admin-by-id/{id}")
async def get_admin_by_id(id: str, current_user: dict = Depends(superadmin_only)):
    admin = await User.get(PydanticObjectId(id))
    if not admin:
        return api_response(404, "Admin not found", error="Not found")
    return api_response(200, "Admin fetched", data={
        "id": str(admin.id), "name": admin.name, "email": admin.email, "role": admin.role,
        "created_at": admin.created_at.isoformat()
    })


@router.put("/update-admin-by-id/{id}")
async def update_admin(id: str, body: UpdateAdminRequest, current_user: dict = Depends(superadmin_only)):
    admin = await User.get(PydanticObjectId(id))
    if not admin:
        return api_response(404, "Admin not found", error="Not found")

    update_data = body.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(admin, key, val)
    admin.updated_at = datetime.now(timezone.utc)
    await admin.save()
    return api_response(200, "Admin updated", data={
        "id": str(admin.id), "name": admin.name, "email": admin.email, "role": admin.role
    })


@router.delete("/delete-admin-by-id/{id}")
async def delete_admin(id: str, current_user: dict = Depends(superadmin_only)):
    if current_user["id"] == id:
        return api_response(400, "Cannot delete yourself", error="Self-deletion not allowed")
    admin = await User.get(PydanticObjectId(id))
    if not admin:
        return api_response(404, "Admin not found", error="Not found")
    await admin.delete()
    return api_response(200, "Admin deleted")


@router.get("/db-info")
async def db_info(current_user: dict = Depends(get_current_user)):
    institutions = await Institution.find_all().to_list()
    inst_data = []
    for inst in institutions:
        batches = await Batch.find(Batch.institution_id == inst.id).to_list()
        batch_data = []
        for b in batches:
            student_count = await Student.find(Student.batch_id == b.id).count()
            teacher_count = await Teacher.find(Teacher.batch_id == b.id).count()
            batch_data.append({
                "id": str(b.id), "batchname": b.batchname, "branch": b.branch,
                "student_count": student_count, "teacher_count": teacher_count
            })
        inst_data.append({
            "id": str(inst.id), "name": inst.name, "email": inst.email,
            "batches": batch_data
        })

    data = {
        "institutions": await Institution.find_all().count(),
        "vendors": await Vendor.find_all().count(),
        "admins": await User.find(User.role == UserType.ADMIN).count(),
        "students": await Student.find_all().count(),
        "teachers": await Teacher.find_all().count(),
        "batches": await Batch.find_all().count(),
        "courses": await Course.find_all().count(),
        "assessments": await Assessment.find_all().count(),
        "institution_hierarchy": inst_data,
    }
    return api_response(200, "DB info fetched", data=data)


@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(get_current_user)):
    data = {
        "institutions": await Institution.find_all().count(),
        "vendors": await Vendor.find_all().count(),
        "students": await Student.find_all().count(),
        "teachers": await Teacher.find_all().count(),
        "batches": await Batch.find_all().count(),
        "courses": await Course.find_all().count(),
        "assessments": await Assessment.find_all().count(),
    }
    return api_response(200, "Dashboard data", data=data)
