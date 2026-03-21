def test_superadmin_allowed_admin_dashboard(client, auth_header_for, mock_user_presence, monkeypatch, valid_object_id):
    class _Count:
        async def count(self):
            return 1

    monkeypatch.setattr("routers.admin.Institution.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Vendor.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Student.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Teacher.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Batch.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Course.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Assessment.find_all", lambda: _Count())

    response = client.get(
        "/api/v1/admins/dashboard",
        headers=auth_header_for(valid_object_id, "SUPERADMIN"),
    )
    assert response.status_code == 200


def test_student_denied_admin_dashboard(client, auth_header_for, mock_user_presence, monkeypatch, valid_object_id):
    class _Count:
        async def count(self):
            return 0

    monkeypatch.setattr("routers.admin.Institution.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Vendor.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Student.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Teacher.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Batch.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Course.find_all", lambda: _Count())
    monkeypatch.setattr("routers.admin.Assessment.find_all", lambda: _Count())

    response = client.get(
        "/api/v1/admins/dashboard",
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )
    assert response.status_code == 403


def test_student_denied_vendor_update(client, auth_header_for, mock_user_presence, monkeypatch, valid_object_id):
    class _Vendor:
        id = valid_object_id
        name = "Vendor"

        async def save(self):
            return None

    async def _get(*_args, **_kwargs):
        return _Vendor()

    monkeypatch.setattr("routers.vendor.Vendor.get", _get)

    response = client.put(
        f"/api/v1/vendors/update-vendor-by-id/{valid_object_id}",
        json={"name": "hacked"},
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )
    assert response.status_code == 403


def test_vendor_denied_updating_other_institution(client, auth_header_for, mock_user_presence, monkeypatch):
    vendor_id = "507f1f77bcf86cd799439010"
    other_vendor_id = "507f1f77bcf86cd799439012"
    institution_id = "507f1f77bcf86cd799439011"

    class _Institution:
        id = institution_id
        name = "Inst"
        created_by_vendor_id = other_vendor_id

        async def save(self):
            return None

    async def _get(*_args, **_kwargs):
        return _Institution()

    monkeypatch.setattr("routers.institution.Institution.get", _get)

    response = client.put(
        f"/api/v1/institutions/update-institution-by-id/{institution_id}",
        json={"name": "Unauthorized Update"},
        headers=auth_header_for(vendor_id, "VENDOR"),
    )
    assert response.status_code == 403


def test_student_denied_enrollment_create(client, auth_header_for, mock_user_presence):
    response = client.post(
        "/api/v1/courses/add-course-enrollment/",
        json={
            "courseId": "507f1f77bcf86cd799439011",
            "batchId": "507f1f77bcf86cd799439012",
            "institutionId": "507f1f77bcf86cd799439013",
        },
        headers=auth_header_for("507f1f77bcf86cd799439010", "STUDENT"),
    )
    assert response.status_code == 403


def test_teacher_denied_student_delete(client, auth_header_for, mock_user_presence, monkeypatch, valid_object_id):
    class _Student:
        async def delete(self):
            return None

    async def _get(*_args, **_kwargs):
        return _Student()

    monkeypatch.setattr("routers.student.Student.get", _get)

    response = client.delete(
        f"/api/v1/students/delete-student-by-id/{valid_object_id}",
        headers=auth_header_for(valid_object_id, "TEACHER"),
    )
    assert response.status_code == 403


def test_jwt_tamper_rejected(client, mock_user_presence):
    response = client.get(
        "/api/v1/courses/get-student-courses",
        headers={"Authorization": "Bearer tampered.invalid.token"},
    )
    assert response.status_code == 401


def test_cross_role_token_misuse_student_on_admin_route_denied(client, auth_header_for, mock_user_presence, valid_object_id):
    response = client.post(
        "/api/v1/admins/create-admin",
        json={"name": "x", "email": "x@example.com", "role": "ADMIN"},
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )
    assert response.status_code == 403


def test_vendor_cannot_view_other_vendor_institutions(client, auth_header_for, mock_user_presence):
    vendor_id = "507f1f77bcf86cd799439010"
    other_vendor_id = "507f1f77bcf86cd799439012"

    response = client.get(
        f"/api/v1/institutions/get-institution-by-vendor/{other_vendor_id}",
        headers=auth_header_for(vendor_id, "VENDOR"),
    )
    assert response.status_code == 403


def test_student_cannot_read_other_student_by_id(client, auth_header_for, mock_user_presence, monkeypatch):
    requester_student_id = "507f1f77bcf86cd799439010"
    other_student_id = "507f1f77bcf86cd799439011"

    class _StudentDoc:
        id = other_student_id
        name = "Other Student"
        email = "other@example.com"
        roll_number = "R-1"
        batch_id = "507f1f77bcf86cd799439020"
        institute_id = "507f1f77bcf86cd799439030"
        cloud_platform = "AWS"
        cloudname = None
        cloudpass = None
        cloudurl = None
        created_at = None

    async def _get(*_args, **_kwargs):
        return _StudentDoc()

    monkeypatch.setattr("routers.student.Student.get", _get)

    response = client.get(
        f"/api/v1/students/get-student-by-id/{other_student_id}",
        headers=auth_header_for(requester_student_id, "STUDENT"),
    )
    assert response.status_code == 403
