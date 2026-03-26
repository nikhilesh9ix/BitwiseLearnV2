from fastapi import APIRouter, Response, Request
from shared.schemas.auth import LoginRequest, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest
from shared.utils.api_response import api_response
from shared.utils.password import hash_password, verify_password
from shared.utils.jwt import generate_access_token, generate_refresh_token, verify_refresh_token
from shared.utils.otp import generate_otp, verify_otp
from shared.utils.reset_token import generate_reset_token, verify_reset_token, invalidate_reset_token
from shared.models.user import User
from shared.models.institution import Institution
from shared.models.vendor import Vendor
from shared.models.teacher import Teacher
from shared.models.student import Student
from shared.enums import UserType
from shared.services.email import send_otp_email

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="token", value=access_token, httponly=True, samesite="none", secure=True, max_age=86400
    )
    response.set_cookie(
        key="refreshToken", value=refresh_token, httponly=True, samesite="none", secure=True, max_age=86400 * 20
    )


@router.post("/admin/login")
async def admin_login(body: LoginRequest, response: Response):
    user = await User.find_one(User.email == body.email)
    if not user:
        return api_response(401, "Invalid email or password", error="Invalid credentials")
    if not verify_password(body.password, user.password):
        return api_response(401, "Invalid email or password", error="Invalid credentials")

    access_token = generate_access_token(str(user.id), user.role)
    refresh_token = generate_refresh_token(str(user.id), user.role)
    _set_auth_cookies(response, access_token, refresh_token)
    return api_response(200, "Login successful", data={
        "id": str(user.id), "name": user.name, "email": user.email, "role": user.role,
        "tokens": {"access_token": access_token, "refresh_token": refresh_token}
    })


@router.post("/institution/login")
async def institution_login(body: LoginRequest, response: Response):
    inst = await Institution.find_one(Institution.email == body.email)
    if not inst:
        return api_response(401, "Invalid email or password", error="Invalid credentials")
    if not verify_password(body.password, inst.login_password):
        return api_response(401, "Invalid email or password", error="Invalid credentials")

    access_token = generate_access_token(str(inst.id), UserType.INSTITUTION)
    refresh_token = generate_refresh_token(str(inst.id), UserType.INSTITUTION)
    _set_auth_cookies(response, access_token, refresh_token)
    return api_response(200, "Login successful", data={
        "id": str(inst.id), "name": inst.name, "email": inst.email, "type": UserType.INSTITUTION,
        "tokens": {"access_token": access_token, "refresh_token": refresh_token}
    })


@router.post("/vendor/login")
async def vendor_login(body: LoginRequest, response: Response):
    vendor = await Vendor.find_one(Vendor.email == body.email)
    if not vendor:
        return api_response(401, "Invalid email or password", error="Invalid credentials")
    if not verify_password(body.password, vendor.login_password):
        return api_response(401, "Invalid email or password", error="Invalid credentials")

    access_token = generate_access_token(str(vendor.id), UserType.VENDOR)
    refresh_token = generate_refresh_token(str(vendor.id), UserType.VENDOR)
    _set_auth_cookies(response, access_token, refresh_token)
    return api_response(200, "Login successful", data={
        "id": str(vendor.id), "name": vendor.name, "email": vendor.email, "type": UserType.VENDOR,
        "tokens": {"access_token": access_token, "refresh_token": refresh_token}
    })


@router.post("/teacher/login")
async def teacher_login(body: LoginRequest, response: Response):
    teacher = await Teacher.find_one(Teacher.email == body.email)
    if not teacher:
        return api_response(401, "Invalid email or password", error="Invalid credentials")
    if not verify_password(body.password, teacher.login_password):
        return api_response(401, "Invalid email or password", error="Invalid credentials")

    access_token = generate_access_token(str(teacher.id), UserType.TEACHER)
    refresh_token = generate_refresh_token(str(teacher.id), UserType.TEACHER)
    _set_auth_cookies(response, access_token, refresh_token)
    return api_response(200, "Login successful", data={
        "id": str(teacher.id), "name": teacher.name, "email": teacher.email, "type": UserType.TEACHER,
        "tokens": {"access_token": access_token, "refresh_token": refresh_token}
    })


@router.post("/student/login")
async def student_login(body: LoginRequest, response: Response):
    student = await Student.find_one(Student.email == body.email)
    if not student:
        return api_response(401, "Invalid email or password", error="Invalid credentials")
    if not verify_password(body.password, student.login_password):
        return api_response(401, "Invalid email or password", error="Invalid credentials")

    access_token = generate_access_token(str(student.id), UserType.STUDENT)
    refresh_token = generate_refresh_token(str(student.id), UserType.STUDENT)
    _set_auth_cookies(response, access_token, refresh_token)
    return api_response(200, "Login successful", data={
        "id": str(student.id), "name": student.name, "email": student.email, "type": UserType.STUDENT,
        "tokens": {"access_token": access_token, "refresh_token": refresh_token}
    })


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    rt = request.cookies.get("refreshToken")
    if not rt:
        return api_response(401, "No refresh token provided", error="No refresh token")

    payload = verify_refresh_token(rt)
    if not payload:
        return api_response(401, "Invalid refresh token", error="Invalid refresh token")

    access_token = generate_access_token(payload["id"], payload["type"])
    refresh_token_new = generate_refresh_token(payload["id"], payload["type"])
    _set_auth_cookies(response, access_token, refresh_token_new)
    return api_response(200, "Token refreshed", data={"id": payload["id"], "type": payload["type"]})


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    email = body.email.lower()
    user_found = None

    # Search all collections
    u = await User.find_one(User.email == email)
    if u:
        user_found = u
    else:
        inst = await Institution.find_one(Institution.email == email)
        if inst:
            user_found = inst
        else:
            v = await Vendor.find_one(Vendor.email == email)
            if v:
                user_found = v
            else:
                t = await Teacher.find_one(Teacher.email == email)
                if t:
                    user_found = t
                else:
                    s = await Student.find_one(Student.email == email)
                    if s:
                        user_found = s

    if not user_found:
        return api_response(404, "Email not found", error="Email not registered")

    otp = generate_otp(email)
    try:
        send_otp_email(email, otp)
    except Exception:
        pass
    return api_response(200, "OTP sent to email", data={"email": email})


@router.post("/verify-forgot-password")
async def verify_forgot_password(body: VerifyOtpRequest, response: Response):
    email = body.email.lower()
    if not verify_otp(email, body.otp):
        return api_response(400, "Invalid or expired OTP", error="Invalid OTP")

    # Find user to get type and id
    user_type = None
    user_id = None
    u = await User.find_one(User.email == email)
    if u:
        user_type, user_id = u.role, str(u.id)
    else:
        inst = await Institution.find_one(Institution.email == email)
        if inst:
            user_type, user_id = UserType.INSTITUTION, str(inst.id)
        else:
            v = await Vendor.find_one(Vendor.email == email)
            if v:
                user_type, user_id = UserType.VENDOR, str(v.id)
            else:
                t = await Teacher.find_one(Teacher.email == email)
                if t:
                    user_type, user_id = UserType.TEACHER, str(t.id)
                else:
                    s = await Student.find_one(Student.email == email)
                    if s:
                        user_type, user_id = UserType.STUDENT, str(s.id)

    if not user_type:
        return api_response(404, "User not found", error="User not found")

    reset_tok = generate_reset_token(email, user_type, user_id)
    response.set_cookie(
        key="reset_token", value=reset_tok, httponly=True, samesite="none", secure=True, max_age=600
    )
    return api_response(200, "OTP verified", data={"verified": True})


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, request: Request, response: Response):
    reset_tok = request.cookies.get("reset_token")
    if not reset_tok:
        return api_response(401, "No reset token", error="No reset token")

    payload = verify_reset_token(reset_tok)
    if not payload:
        return api_response(401, "Invalid or expired reset token", error="Invalid reset token")

    hashed = hash_password(body.new_password)
    user_type = payload["type"]
    user_id = payload["id"]

    from beanie import PydanticObjectId
    oid = PydanticObjectId(user_id)

    if user_type in (UserType.SUPERADMIN, UserType.ADMIN):
        u = await User.get(oid)
        if u:
            u.password = hashed
            await u.save()
    elif user_type == UserType.INSTITUTION:
        inst = await Institution.get(oid)
        if inst:
            inst.login_password = hashed
            await inst.save()
    elif user_type == UserType.VENDOR:
        v = await Vendor.get(oid)
        if v:
            v.login_password = hashed
            await v.save()
    elif user_type == UserType.TEACHER:
        t = await Teacher.get(oid)
        if t:
            t.login_password = hashed
            await t.save()
    elif user_type == UserType.STUDENT:
        s = await Student.get(oid)
        if s:
            s.login_password = hashed
            await s.save()

    invalidate_reset_token(reset_tok)

    # Issue new auth tokens
    access_token = generate_access_token(user_id, user_type)
    refresh_token = generate_refresh_token(user_id, user_type)
    _set_auth_cookies(response, access_token, refresh_token)
    response.delete_cookie("reset_token")

    return api_response(200, "Password reset successful", data={"id": user_id, "type": user_type})
