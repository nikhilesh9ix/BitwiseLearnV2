from types import SimpleNamespace


def test_submit_assessment_requires_student_role(client, auth_header_for, mock_user_presence, valid_object_id):
    response = client.post(
        f"/api/v1/assessments/submit-assessment-by-id/{valid_object_id}",
        json={"studentIp": "127.0.0.1", "tabSwitchCount": 0, "proctoringStatus": "clean"},
        headers=auth_header_for(valid_object_id, "TEACHER"),
    )
    assert response.status_code == 403


def test_submit_assessment_question_missing_fields_422(client, auth_header_for, mock_user_presence, valid_object_id):
    response = client.post(
        f"/api/v1/assessments/submit-assessment-question-by-id/{valid_object_id}",
        json={},
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )
    assert response.status_code == 422


def test_submit_assessment_not_found_returns_404(client, monkeypatch, auth_header_for, mock_user_presence, valid_object_id):
    async def _none(*_args, **_kwargs):
        return None

    monkeypatch.setattr("routers.assessment.Assessment.get", _none)

    response = client.post(
        f"/api/v1/assessments/submit-assessment-by-id/{valid_object_id}",
        json={"studentIp": "127.0.0.1", "tabSwitchCount": 0, "proctoringStatus": "clean"},
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )

    assert response.status_code == 404


def test_submit_assessment_question_cross_assessment_should_be_rejected(
    client,
    monkeypatch,
    auth_header_for,
    mock_user_presence,
):
    assessment_id = "507f1f77bcf86cd799439011"
    other_assessment_id = "507f1f77bcf86cd799439012"
    question_id = "507f1f77bcf86cd799439013"

    async def _assessment_get(oid):
        return SimpleNamespace(id=str(oid))

    async def _question_get(_oid):
        return SimpleNamespace(
            id=question_id,
            section_id="507f1f77bcf86cd799439014",
            correct_option="A",
            max_marks=5,
            problem_id=None,
            assessment_id=other_assessment_id,
        )

    class _FindOneNone:
        async def __call__(self, *_args, **_kwargs):
            return None

    class _FakeAssessmentSubmission:
        assessment_id = "assessment_id"
        student_id = "student_id"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return SimpleNamespace(id="507f1f77bcf86cd799439099")

    class _SectionGet:
        async def __call__(self, *_args, **_kwargs):
            return SimpleNamespace(assessment_type="NO_CODE", assessment_id=other_assessment_id)

    inserted = {"value": False}

    class _QS:
        question_id = "question_id"
        assessment_id = "assessment_id"
        student_id = "student_id"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return None

        def __init__(self, **_kwargs):
            pass

        async def insert(self):
            inserted["value"] = True

    monkeypatch.setattr("routers.assessment.Assessment.get", _assessment_get)
    monkeypatch.setattr("routers.assessment.AssessmentQuestion.get", _question_get)
    monkeypatch.setattr("routers.assessment.AssessmentSubmission", _FakeAssessmentSubmission)
    monkeypatch.setattr("routers.assessment.AssessmentSection.get", _SectionGet())
    monkeypatch.setattr("routers.assessment.AssessmentQuestionSubmission", _QS)

    response = client.post(
        f"/api/v1/assessments/submit-assessment-question-by-id/{assessment_id}",
        json={"questionId": question_id, "answer": "A"},
        headers=auth_header_for("507f1f77bcf86cd799439010", "STUDENT"),
    )

    # Expected secure behavior is reject; current behavior allows cross-assessment write.
    assert response.status_code == 400
    assert inserted["value"] is False
