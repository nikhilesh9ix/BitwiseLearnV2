from types import SimpleNamespace


def test_get_all_listed_problems_returns_200(client, monkeypatch, valid_object_id):
    class _Q:
        async def to_list(self):
            return [SimpleNamespace(id=valid_object_id, name="Two Sum", difficulty="EASY", published="LISTED")]

    class _TQ:
        async def to_list(self):
            return [SimpleNamespace(tag_name=["array", "hashmap"])]

    class _FakeProblemTopic:
        problem_id = "problem_id"

        @staticmethod
        def find(*_args, **_kwargs):
            return _TQ()

    class _FakeProblem:
        published = "published"

        @staticmethod
        def find(*_args, **_kwargs):
            return _Q()

    monkeypatch.setattr("routers.dsa_problem.Problem", _FakeProblem)
    monkeypatch.setattr("routers.dsa_problem.ProblemTopic", _FakeProblemTopic)

    response = client.get("/api/v1/problems/get-all-listed-problem/")

    assert response.status_code == 200
    assert response.json()["data"][0]["tags"] == ["array", "hashmap"]


def test_get_problem_not_found_returns_404(client, monkeypatch, valid_object_id):
    async def _none(*_args, **_kwargs):
        return None

    monkeypatch.setattr("routers.dsa_problem.Problem.get", _none)
    response = client.get(f"/api/v1/problems/get-dsa-problem/{valid_object_id}/")

    assert response.status_code == 404


def test_change_problem_status_requires_auth(client, valid_object_id):
    response = client.put(f"/api/v1/problems/change-status/{valid_object_id}")
    assert response.status_code == 401


def test_search_problem_missing_query_is_422(client):
    response = client.post("/api/v1/problems/search-question", json={})
    assert response.status_code == 422
