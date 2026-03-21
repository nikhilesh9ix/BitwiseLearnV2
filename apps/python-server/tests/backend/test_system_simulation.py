from types import SimpleNamespace

from enums import UserType


def test_auth_flow_login_refresh_and_protected_access(client, monkeypatch, valid_object_id, auth_header_for, mock_user_presence):
    class _FakeUser:
        email = "email"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return SimpleNamespace(
                id=valid_object_id,
                name="Admin",
                email="admin@example.com",
                role=UserType.ADMIN,
                password="hashed",
            )

    class _Count:
        async def count(self):
            return 1

    monkeypatch.setattr("routers.auth.User", _FakeUser)
    monkeypatch.setattr("routers.auth.verify_password", lambda *_args, **_kwargs: True)
    monkeypatch.setattr("routers.report.User.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Institution.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Vendor.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Batch.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Teacher.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Student.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Course.find_all", lambda: _Count())
    monkeypatch.setattr("routers.report.Assessment.find_all", lambda: _Count())

    login = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@example.com", "password": "pass123"},
    )
    assert login.status_code == 200

    refresh_token = login.json()["data"]["tokens"]["refreshToken"]
    refreshed = client.post("/api/v1/auth/refresh", cookies={"refreshToken": refresh_token})
    assert refreshed.status_code == 200

    protected = client.get(
        "/api/v1/reports/get-stats-count",
        headers=auth_header_for(valid_object_id, "ADMIN"),
    )
    assert protected.status_code == 200


def test_assessment_flow_submit_question_then_assessment(client, monkeypatch, auth_header_for, mock_user_presence):
    assessment_id = "507f1f77bcf86cd799439011"
    student_id = "507f1f77bcf86cd799439010"

    class _ExistingSubmission:
        id = "507f1f77bcf86cd799439099"
        is_submitted = False
        total_marks = 0
        tab_switch_count = 0
        proctoring_status = "NOT_CHEATED"
        updated_at = None

        async def save(self):
            return None

    class _AssessmentSubmission:
        assessment_id = "assessment_id"
        student_id = "student_id"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return _ExistingSubmission()

    class _AssessmentQuestionSubmissionFind:
        def __init__(self, marks=5):
            self._marks = marks

        async def to_list(self):
            return [SimpleNamespace(marks_obtained=self._marks)]

    class _AssessmentQuestionSubmission:
        question_id = "question_id"
        assessment_id = "assessment_id"
        student_id = "student_id"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return None

        @staticmethod
        def find(*_args, **_kwargs):
            return _AssessmentQuestionSubmissionFind(marks=5)

        def __init__(self, **_kwargs):
            pass

        async def insert(self):
            return None

    class _Section:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(assessment_type="NO_CODE", assessment_id=assessment_id)

    async def _assessment_get(*_args, **_kwargs):
        return SimpleNamespace(id=assessment_id)

    async def _question_get(*_args, **_kwargs):
        return SimpleNamespace(
            id="507f1f77bcf86cd799439013",
            section_id="507f1f77bcf86cd799439014",
            correct_option="A",
            max_marks=5,
            problem_id=None,
        )

    monkeypatch.setattr("routers.assessment.Assessment.get", _assessment_get)
    monkeypatch.setattr(
        "routers.assessment.AssessmentQuestion.get",
        _question_get,
    )
    monkeypatch.setattr("routers.assessment.AssessmentSubmission", _AssessmentSubmission)
    monkeypatch.setattr("routers.assessment.AssessmentQuestionSubmission", _AssessmentQuestionSubmission)
    monkeypatch.setattr("routers.assessment.AssessmentSection", _Section)

    question_submit = client.post(
        f"/api/v1/assessments/submit-assessment-question-by-id/{assessment_id}",
        json={"questionId": "507f1f77bcf86cd799439013", "answer": "A"},
        headers=auth_header_for(student_id, "STUDENT"),
    )
    assert question_submit.status_code == 200

    final_submit = client.post(
        f"/api/v1/assessments/submit-assessment-by-id/{assessment_id}",
        json={"studentIp": "127.0.0.1", "tabSwitchCount": 1, "proctoringStatus": "NOT_CHEATED"},
        headers=auth_header_for(student_id, "STUDENT"),
    )
    assert final_submit.status_code == 200


def test_code_execution_flow_submit_and_store_results(client, monkeypatch, auth_header_for, mock_user_presence):
    problem_id = "507f1f77bcf86cd799439011"
    student_id = "507f1f77bcf86cd799439010"

    class _FakeProblem:
        @staticmethod
        async def get(*_args, **_kwargs):
            return SimpleNamespace(id=problem_id)

    class _FakeTemplate:
        problem_id = "problem_id"
        language = "language"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return SimpleNamespace(function_body="")

    class _TCFind:
        async def to_list(self):
            return [SimpleNamespace(id="507f1f77bcf86cd799439015", input="", output="1")]

    class _FakeTestCase:
        problem_id = "problem_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _TCFind()

    class _FakeSubmission:
        id = "507f1f77bcf86cd799439111"

        def __init__(self, **_kwargs):
            pass

        async def insert(self):
            return None

    class _FakeSubmissionTestCase:
        def __init__(self, **_kwargs):
            pass

        async def insert(self):
            return None

    async def _exec(*_args, **_kwargs):
        return {"run": {"stdout": "1", "stderr": "", "code": 0, "signal": None}}

    monkeypatch.setattr("routers.code_runner.Problem", _FakeProblem)
    monkeypatch.setattr("routers.code_runner.ProblemTemplate", _FakeTemplate)
    monkeypatch.setattr("routers.code_runner.ProblemTestCase", _FakeTestCase)
    monkeypatch.setattr("routers.code_runner.ProblemSubmission", _FakeSubmission)
    monkeypatch.setattr("routers.code_runner.ProblemSubmissionTestCase", _FakeSubmissionTestCase)
    monkeypatch.setattr("routers.code_runner.execute_code", _exec)

    response = client.post(
        "/api/v1/code/submit",
        json={"problemId": problem_id, "language": "python", "code": "print(1)"},
        headers=auth_header_for(student_id, "STUDENT"),
    )

    assert response.status_code == 200
    assert response.json()["data"]["allPassed"] is True


def test_reports_flow_triggers_async_generation(client, monkeypatch, auth_header_for, mock_user_presence):
    assessment_id = "507f1f77bcf86cd799439011"
    teacher_id = "507f1f77bcf86cd799439010"

    class _Assessment:
        id = assessment_id
        report_status = "PENDING"

        @staticmethod
        async def get(*_args, **_kwargs):
            return _Assessment()

        async def save(self):
            return None

    calls = {"published": False}

    async def _publish(*_args, **_kwargs):
        calls["published"] = True

    monkeypatch.setattr("routers.report.Assessment", _Assessment)
    monkeypatch.setattr("routers.report.publish_message", _publish)

    response = client.get(
        f"/api/v1/reports/full-assessment-report/{assessment_id}",
        headers=auth_header_for(teacher_id, "TEACHER"),
    )

    assert response.status_code == 200
    assert calls["published"] is True
