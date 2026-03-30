from contextlib import asynccontextmanager
import os
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from main import app
from middleware.auth import get_current_user
from utils.jwt import generate_access_token


@asynccontextmanager
async def _no_lifespan(_app):
    yield


@pytest.fixture(scope="session", autouse=True)
def isolated_test_db_env():
    os.environ["DATABASE_URL"] = "mongodb://localhost:27017/bitwiselearn_test"
    os.environ["DATABASE_FALLBACK_URL"] = "mongodb://localhost:27017/bitwiselearn_test"


@pytest.fixture()
def test_app():
    app.router.lifespan_context = _no_lifespan
    app.dependency_overrides.clear()
    return app


@pytest.fixture()
def client(test_app):
    with TestClient(test_app, raise_server_exceptions=False) as tc:
        yield tc


@pytest.fixture()
def valid_object_id() -> str:
    return "507f1f77bcf86cd799439011"


@pytest.fixture()
def override_current_user(test_app):
    def _override(user_id: str, role: str):
        async def _dep():
            return {"id": user_id, "type": role}

        test_app.dependency_overrides[get_current_user] = _dep

    yield _override
    test_app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def auth_header_for(monkeypatch):
    def _for(user_id: str, role: str) -> dict[str, str]:
        token = generate_access_token(user_id, role)
        return {"Authorization": f"Bearer {token}"}

    return _for


@pytest.fixture()
def mock_user_presence(monkeypatch):
    async def _exists(_oid):
        return SimpleNamespace(id=str(_oid))

    monkeypatch.setattr("middleware.auth.User.get", _exists)
    monkeypatch.setattr("middleware.auth.Institution.get", _exists)
    monkeypatch.setattr("middleware.auth.Vendor.get", _exists)
    monkeypatch.setattr("middleware.auth.Teacher.get", _exists)
    monkeypatch.setattr("middleware.auth.Student.get", _exists)
