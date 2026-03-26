from fastapi import Request, HTTPException, Depends
from shared.utils.jwt import verify_access_token
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.teacher import Teacher
from shared.models.student import Student
from beanie import PydanticObjectId
from shared.enums import UserType


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("id")
    user_type = payload.get("type")

    if not user_id or not user_type:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Verify user exists in appropriate collection
    try:
        oid = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    user_exists = False
    if user_type in (UserType.SUPERADMIN, UserType.ADMIN):
        user_exists = await User.get(oid) is not None
    elif user_type == UserType.INSTITUTION:
        user_exists = await Institution.get(oid) is not None
    elif user_type == UserType.VENDOR:
        user_exists = await Vendor.get(oid) is not None
    elif user_type == UserType.TEACHER:
        user_exists = await Teacher.get(oid) is not None
    elif user_type == UserType.STUDENT:
        user_exists = await Student.get(oid) is not None

    if not user_exists:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": user_id, "type": user_type}


def require_roles(*roles: str):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["type"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker


# Common role dependencies
not_student = require_roles(
    UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION, UserType.VENDOR, UserType.TEACHER
)
admin_only = require_roles(UserType.SUPERADMIN, UserType.ADMIN)
superadmin_only = require_roles(UserType.SUPERADMIN)
