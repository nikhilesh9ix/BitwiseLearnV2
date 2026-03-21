from types import SimpleNamespace

from enums import UserType
from utils.jwt import generate_refresh_token


def test_admin_login_invalid_credentials_returns_401(client, monkeypatch):
    class _FakeUser:
        email = "email"

        @staticmethod
        async def find_one(*_args, **_kwargs):
            return None

    monkeypatch.setattr("routers.auth.User", _FakeUser)

    response = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "missing@example.com", "password": "bad"},
    )

    assert response.status_code == 401
    assert response.json()["error"] == "Invalid credentials"


def test_admin_login_success_sets_tokens(client, monkeypatch, valid_object_id):
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

    monkeypatch.setattr("routers.auth.User", _FakeUser)
    monkeypatch.setattr("routers.auth.verify_password", lambda *_args, **_kwargs: True)

    response = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@example.com", "password": "pass123"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["tokens"]["accessToken"]
    assert data["tokens"]["refreshToken"]
    assert "set-cookie" in response.headers


def test_refresh_missing_cookie_returns_401(client):
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 401
    assert response.json()["error"] == "No refresh token"


def test_refresh_invalid_cookie_returns_401(client):
    response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refreshToken": "not-a-valid-token"},
    )
    assert response.status_code == 401
    assert response.json()["error"] == "Invalid refresh token"


def test_refresh_valid_cookie_returns_200(client, valid_object_id):
    refresh = generate_refresh_token(valid_object_id, UserType.ADMIN)
    response = client.post("/api/v1/auth/refresh", cookies={"refreshToken": refresh})

    assert response.status_code == 200
    assert response.json()["data"]["id"] == valid_object_id


def test_reset_password_without_cookie_returns_401(client):
    response = client.post(
        "/api/v1/auth/reset-password",
        json={"newPassword": "new-password-123"},
    )
    assert response.status_code == 401
    assert response.json()["error"] == "No reset token"
