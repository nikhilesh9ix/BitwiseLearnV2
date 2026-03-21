import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from beanie import PydanticObjectId
from schemas.vendor import CreateVendorRequest, UpdateVendorRequest
from utils.api_response import api_response
from utils.password import hash_password
from middleware.auth import get_current_user, require_roles
from models.vendor import Vendor
from models.institution import Institution
from enums import UserType
from services.email import send_welcome_email

router = APIRouter(prefix="/api/v1/vendors", tags=["Vendors"])

_create_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN)
_read_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION)
_delete_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION, UserType.VENDOR)
_update_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.VENDOR)


@router.post("/create-vendor")
async def create_vendor(body: CreateVendorRequest, current_user: dict = Depends(_create_roles)):
    existing = await Vendor.find_one(Vendor.email == body.email)
    if existing:
        return api_response(400, "Email already exists", error="Duplicate email")

    raw_password = secrets.token_urlsafe(10)
    hashed = hash_password(raw_password)

    vendor = Vendor(
        name=body.name,
        email=body.email,
        secondary_email=body.secondary_email,
        tagline=body.tagline,
        phone_number=body.phone_number,
        secondary_phone_number=body.secondary_phone_number,
        website_link=body.website_link,
        login_password=hashed,
    )
    await vendor.insert()

    try:
        send_welcome_email(body.email, body.name, raw_password, "Vendor")
    except Exception:
        pass

    return api_response(201, "Vendor created", data={
        "id": str(vendor.id), "name": vendor.name, "email": vendor.email
    })


@router.get("/get-all-vendor")
async def get_all_vendors(current_user: dict = Depends(_read_roles)):
    vendors = await Vendor.find_all().to_list()
    data = [{
        "id": str(v.id), "name": v.name, "email": v.email,
        "phone_number": v.phone_number, "tagline": v.tagline,
        "website_link": v.website_link,
        "created_at": v.created_at.isoformat(timespec="milliseconds") if v.created_at else None
    } for v in vendors]
    return api_response(200, "Vendors fetched", data=data)


@router.get("/get-vendor-by-id/{id}")
async def get_vendor_by_id(id: str, current_user: dict = Depends(_update_roles)):
    if current_user["type"] == UserType.VENDOR and current_user["id"] != id:
        return api_response(403, "Not authorized", error="Forbidden")

    vendor = await Vendor.get(PydanticObjectId(id))
    if not vendor:
        return api_response(404, "Vendor not found", error="Not found")
    return api_response(200, "Vendor fetched", data={
        "id": str(vendor.id), "name": vendor.name, "email": vendor.email,
        "secondary_email": vendor.secondary_email, "phone_number": vendor.phone_number,
        "secondary_phone_number": vendor.secondary_phone_number,
        "tagline": vendor.tagline, "website_link": vendor.website_link,
        "created_at": vendor.created_at.isoformat(timespec="milliseconds") if vendor.created_at else None
    })


@router.put("/update-vendor-by-id/{id}")
async def update_vendor(id: str, body: UpdateVendorRequest, current_user: dict = Depends(_update_roles)):
    if current_user["type"] == UserType.VENDOR and current_user["id"] != id:
        return api_response(403, "Not authorized", error="Forbidden")

    vendor = await Vendor.get(PydanticObjectId(id))
    if not vendor:
        return api_response(404, "Vendor not found", error="Not found")

    update_data = body.model_dump(exclude_none=True)
    for key, val in update_data.items():
        setattr(vendor, key, val)
    vendor.updated_at = datetime.now(timezone.utc)
    await vendor.save()
    return api_response(200, "Vendor updated", data={"id": str(vendor.id), "name": vendor.name})


@router.delete("/delete-vendor-by-id/{id}")
async def delete_vendor(id: str, current_user: dict = Depends(_delete_roles)):
    if current_user["type"] in (UserType.TEACHER, UserType.STUDENT):
        return api_response(403, "Not authorized", error="Forbidden")

    vendor = await Vendor.get(PydanticObjectId(id))
    if not vendor:
        return api_response(404, "Vendor not found", error="Not found")
    await vendor.delete()
    return api_response(200, "Vendor deleted")


@router.get("/dashboard")
async def vendor_dashboard(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != UserType.VENDOR:
        return api_response(403, "Not authorized", error="Forbidden")

    vendor_id = PydanticObjectId(current_user["id"])
    institutions = await Institution.find(
        Institution.created_by_vendor_id == vendor_id
    ).to_list()

    from models.batch import Batch
    from models.student import Student
    from models.teacher import Teacher

    total_students = 0
    total_teachers = 0
    total_batches = 0
    for inst in institutions:
        total_batches += await Batch.find(Batch.institution_id == inst.id).count()
        total_students += await Student.find(Student.institute_id == inst.id).count()
        total_teachers += await Teacher.find(Teacher.institute_id == inst.id).count()

    return api_response(200, "Vendor dashboard", data={
        "institutions": len(institutions),
        "batches": total_batches,
        "students": total_students,
        "teachers": total_teachers,
    })
