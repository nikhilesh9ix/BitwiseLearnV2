from types import SimpleNamespace


def test_get_stats_count_for_admin_success(client, monkeypatch, auth_header_for, mock_user_presence, valid_object_id):
    class _C:
        def __init__(self, count):
            self._count = count

        async def count(self):
            return self._count

    class _User:
        role = "role"

        @staticmethod
        def find(*_args, **_kwargs):
            return _C(2)

    monkeypatch.setattr("routers.report.User", _User)
    monkeypatch.setattr("routers.report.Institution.find_all", lambda: _C(3))
    monkeypatch.setattr("routers.report.Vendor.find_all", lambda: _C(4))
    monkeypatch.setattr("routers.report.Batch.find_all", lambda: _C(5))
    monkeypatch.setattr("routers.report.Teacher.find_all", lambda: _C(6))
    monkeypatch.setattr("routers.report.Student.find_all", lambda: _C(7))
    monkeypatch.setattr("routers.report.Course.find_all", lambda: _C(8))
    monkeypatch.setattr("routers.report.Assessment.find_all", lambda: _C(9))

    response = client.get(
        "/api/v1/reports/get-stats-count",
        headers=auth_header_for(valid_object_id, "ADMIN"),
    )

    assert response.status_code == 200
    assert response.json()["data"]["admins"] == 2
    assert response.json()["data"]["assessments"] == 9


def test_get_stats_count_for_student_forbidden(client, auth_header_for, mock_user_presence, valid_object_id):
    response = client.get(
        "/api/v1/reports/get-stats-count",
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )
    assert response.status_code == 403


def test_assessment_report_not_found(client, monkeypatch, auth_header_for, mock_user_presence, valid_object_id):
    async def _none(*_args, **_kwargs):
        return None

    monkeypatch.setattr("routers.report.Assessment.get", _none)

    response = client.get(
        f"/api/v1/reports/assessment-report/{valid_object_id}",
        headers=auth_header_for(valid_object_id, "TEACHER"),
    )

    assert response.status_code == 404


def test_course_report_returns_student_assignment_summary(
    client,
    monkeypatch,
    auth_header_for,
    mock_user_presence,
):
    course_id = "507f1f77bcf86cd799439011"
    batch_id = "507f1f77bcf86cd799439012"

    class _Query:
        def __init__(self, items):
            self.items = list(items)

        async def count(self):
            return len(self.items)

        def skip(self, offset):
            self.items = self.items[offset:]
            return self

        def limit(self, size):
            self.items = self.items[:size]
            return self

        async def to_list(self):
            return self.items

    class _Course:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(id=course_id, name="Python")

    class _Batch:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(id=batch_id, batchname="CSE-A")

    class _Student:
        batch_id = "batch_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _Query(
                [
                    SimpleNamespace(id="507f1f77bcf86cd799439101", name="Alice", roll_number="A1"),
                    SimpleNamespace(id="507f1f77bcf86cd799439102", name="Bob", roll_number="B1"),
                ]
            )

    class _CourseSection:
        course_id = "course_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _Query([SimpleNamespace(id="507f1f77bcf86cd799439201")])

    class _CourseContent:
        @staticmethod
        def find(*_args, **_kwargs):
            return _Query(
                [
                    SimpleNamespace(id="507f1f77bcf86cd799439301"),
                    SimpleNamespace(id="507f1f77bcf86cd799439302"),
                ]
            )

    class _CourseAssignment:
        @staticmethod
        def find(*_args, **_kwargs):
            return _Query([SimpleNamespace(id="507f1f77bcf86cd799439401")])

    class _CourseProgress:
        @staticmethod
        def find(*_args, **_kwargs):
            return _Query(
                [
                    SimpleNamespace(
                        id="507f1f77bcf86cd799439501",
                        student_id="507f1f77bcf86cd799439101",
                        content_id="507f1f77bcf86cd799439301",
                    )
                ]
            )

    class _CourseAssignmentSubmission:
        @staticmethod
        def find(*_args, **_kwargs):
            return _Query(
                [
                    SimpleNamespace(
                        id="507f1f77bcf86cd799439601",
                        student_id="507f1f77bcf86cd799439101",
                        assignment_id="507f1f77bcf86cd799439401",
                    )
                ]
            )

    monkeypatch.setattr("routers.report.Course", _Course)
    monkeypatch.setattr("routers.report.Batch", _Batch)
    monkeypatch.setattr("routers.report.Student", _Student)
    monkeypatch.setattr("routers.report.CourseSection", _CourseSection)
    monkeypatch.setattr("routers.report.CourseLearningContent", _CourseContent)
    monkeypatch.setattr("routers.report.CourseAssignment", _CourseAssignment)
    monkeypatch.setattr("routers.report.CourseProgress", _CourseProgress)
    monkeypatch.setattr(
        "routers.report.CourseAssignmentSubmission",
        _CourseAssignmentSubmission,
    )

    response = client.get(
        f"/api/v1/reports/course-report/{batch_id}/{course_id}",
        headers=auth_header_for(batch_id, "TEACHER"),
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["totalCourseTopics"] == 2
    assert len(payload["students"]) == 2
    assert payload["students"][0]["courseAssignemntSubmissions"][0]["assignmentId"] == "507f1f77bcf86cd799439401"
