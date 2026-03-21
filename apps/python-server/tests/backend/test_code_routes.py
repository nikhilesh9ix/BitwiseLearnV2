def test_compile_code_returns_output(client, monkeypatch):
    async def _exec(*_args, **_kwargs):
        return {"run": {"stdout": "ok", "stderr": "", "code": 0, "signal": None}}

    monkeypatch.setattr("routers.code_runner.execute_code", _exec)

    response = client.post(
        "/api/v1/code/compile",
        json={"language": "python", "code": "print('ok')", "stdin": ""},
    )

    assert response.status_code == 200
    assert response.json()["data"]["stdout"] == "ok"


def test_run_code_requires_auth(client):
    response = client.post(
        "/api/v1/code/run",
        json={"problemId": "507f1f77bcf86cd799439011", "language": "python", "code": "print(1)"},
    )
    assert response.status_code == 401


def test_submit_code_forbidden_for_admin(client, auth_header_for, mock_user_presence, valid_object_id):
    response = client.post(
        "/api/v1/code/submit",
        json={"problemId": valid_object_id, "language": "python", "code": "print(1)"},
        headers=auth_header_for(valid_object_id, "ADMIN"),
    )
    assert response.status_code == 403


def test_submit_code_problem_not_found(client, monkeypatch, auth_header_for, mock_user_presence, valid_object_id):
    async def _none(*_args, **_kwargs):
        return None

    monkeypatch.setattr("routers.code_runner.Problem.get", _none)

    response = client.post(
        "/api/v1/code/submit",
        json={"problemId": valid_object_id, "language": "python", "code": "print(1)"},
        headers=auth_header_for(valid_object_id, "STUDENT"),
    )

    assert response.status_code == 404
