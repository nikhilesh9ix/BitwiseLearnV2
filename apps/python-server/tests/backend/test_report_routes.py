def test_get_stats_count_for_admin_success(client, monkeypatch, auth_header_for, mock_user_presence, valid_object_id):
    class _C:
        def __init__(self, count):
            self._count = count

        async def count(self):
            return self._count

    monkeypatch.setattr("routers.report.User.find_all", lambda: _C(2))
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
