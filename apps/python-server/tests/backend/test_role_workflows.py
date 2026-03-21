from datetime import datetime, timedelta, timezone
from types import SimpleNamespace


def test_superadmin_full_control_create_admin(client, monkeypatch, auth_header_for, mock_user_presence):
    superadmin_id = "507f1f77bcf86cd799439010"

    class _FakeUser:
        email = "email"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return None

        def __init__(self, **kwargs):
            self.id = "507f1f77bcf86cd799439011"
            self.name = kwargs["name"]
            self.email = kwargs["email"]
            self.role = kwargs["role"]

        async def insert(self):
            return None

    monkeypatch.setattr("routers.admin.User", _FakeUser)
    monkeypatch.setattr("routers.admin.send_welcome_email", lambda *_args, **_kwargs: None)

    response = client.post(
        "/api/v1/admins/create-admin",
        json={"name": "New Admin", "email": "newadmin@example.com", "role": "ADMIN"},
        headers=auth_header_for(superadmin_id, "SUPERADMIN"),
    )
    assert response.status_code == 201


def test_admin_can_manage_institutions_but_not_superadmin_routes(
    client,
    monkeypatch,
    auth_header_for,
    mock_user_presence,
):
    admin_id = "507f1f77bcf86cd799439010"

    class _FakeInstitution:
        email = "email"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return None

        def __init__(self, **kwargs):
            self.id = "507f1f77bcf86cd799439099"
            self.name = kwargs["name"]
            self.email = kwargs["email"]
            self.created_by_vendor_id = kwargs.get("created_by_vendor_id")

        async def insert(self):
            return None

    monkeypatch.setattr("routers.institution.Institution", _FakeInstitution)
    monkeypatch.setattr("routers.institution.send_welcome_email", lambda *_args, **_kwargs: None)

    create_inst = client.post(
        "/api/v1/institutions/create-institution",
        json={
            "name": "Inst A",
            "address": "Addr",
            "pinCode": "123456",
            "tagline": "Tag",
            "websiteLink": "https://example.com",
            "email": "inst@example.com",
            "secondaryEmail": "inst2@example.com",
            "phoneNumber": "9999999999",
            "secondaryPhoneNumber": "8888888888",
        },
        headers=auth_header_for(admin_id, "ADMIN"),
    )
    assert create_inst.status_code == 201

    denied_superadmin = client.get(
        "/api/v1/admins/get-all-admin",
        headers=auth_header_for(admin_id, "ADMIN"),
    )
    assert denied_superadmin.status_code == 403


def test_institution_can_manage_batches(client, monkeypatch, auth_header_for, mock_user_presence):
    institution_id = "507f1f77bcf86cd799439010"

    class _FakeInstitution:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(id=institution_id)

    class _FakeBatch:
        def __init__(self, **kwargs):
            self.id = "507f1f77bcf86cd799439011"
            self.batchname = kwargs["batchname"]
            self.branch = kwargs["branch"]
            self.batch_end_year = kwargs["batch_end_year"]
            self.institution_id = kwargs["institution_id"]

        async def insert(self):
            return None

    monkeypatch.setattr("routers.batch.Institution", _FakeInstitution)
    monkeypatch.setattr("routers.batch.Batch", _FakeBatch)

    response = client.post(
        "/api/v1/batches/create-batch",
        json={
            "batchname": "CSE-A",
            "branch": "CSE",
            "batchEndYear": "2028",
            "institutionId": institution_id,
        },
        headers=auth_header_for(institution_id, "INSTITUTION"),
    )
    assert response.status_code == 201


def test_vendor_can_view_assigned_institutions(client, monkeypatch, auth_header_for, mock_user_presence):
    vendor_id = "507f1f77bcf86cd799439010"

    class _FindResult:
        async def to_list(self):
            return [
                SimpleNamespace(
                    id="507f1f77bcf86cd799439011",
                    name="Assigned Inst",
                    email="assigned@example.com",
                    address="Addr",
                    pin_code="123456",
                    tagline="Tag",
                    website_link="https://example.com",
                    phone_number="9999999999",
                    secondary_phone_number="8888888888",
                    secondary_email="secondary@example.com",
                    created_by="507f1f77bcf86cd799439099",
                    created_by_vendor_id=vendor_id,
                    created_at=datetime.now(timezone.utc),
                )
            ]

    class _Institution:
        created_by_vendor_id = "created_by_vendor_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _FindResult()

    monkeypatch.setattr("routers.institution.Institution", _Institution)

    response = client.get(
        "/api/v1/institutions/get-all-institution",
        headers=auth_header_for(vendor_id, "VENDOR"),
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) == 1


def test_teacher_can_create_assessment(client, monkeypatch, auth_header_for, mock_user_presence):
    teacher_id = "507f1f77bcf86cd799439010"

    class _Assessment:
        def __init__(self, **kwargs):
            self.id = "507f1f77bcf86cd799439011"
            self.name = kwargs["name"]

        async def insert(self):
            return None

    monkeypatch.setattr("routers.assessment.Assessment", _Assessment)

    now = datetime.now(timezone.utc)
    response = client.post(
        "/api/v1/assessments/create-assessment",
        json={
            "name": "Midterm",
            "description": "desc",
            "instruction": "inst",
            "startTime": now.isoformat(),
            "endTime": (now + timedelta(hours=1)).isoformat(),
            "individualSectionTimeLimit": 30,
            "autoSubmit": True,
            "batchId": "507f1f77bcf86cd799439012",
            "teacherId": teacher_id,
        },
        headers=auth_header_for(teacher_id, "TEACHER"),
    )
    assert response.status_code == 201


def test_student_end_to_end_learning_flow(client, monkeypatch, auth_header_for, mock_user_presence):
    student_id = "507f1f77bcf86cd799439010"

    class _CourseQuery:
        async def to_list(self):
            return [SimpleNamespace(course_id="507f1f77bcf86cd799439011")]

    class _Enrollment:
        batch_id = "batch_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _CourseQuery()

    class _Course:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(
                id="507f1f77bcf86cd799439011",
                name="DSA",
                description="desc",
                level="BASIC",
                thumbnail="",
                instructor_name="Teacher",
                is_published="PUBLISHED",
            )

    class _Student:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(batch_id="507f1f77bcf86cd799439012")

    monkeypatch.setattr("routers.course.Student", _Student)
    monkeypatch.setattr("routers.course.CourseEnrollment", _Enrollment)
    monkeypatch.setattr("routers.course.Course", _Course)

    response = client.get(
        "/api/v1/courses/get-student-courses",
        headers=auth_header_for(student_id, "STUDENT"),
    )
    assert response.status_code == 200
    assert response.json()["data"][0]["name"] == "DSA"
