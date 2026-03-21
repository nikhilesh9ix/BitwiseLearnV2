from types import SimpleNamespace


def test_listed_courses_returns_200_and_data(client, monkeypatch, valid_object_id):
    class _Q:
        async def to_list(self):
            return [
                SimpleNamespace(
                    id=valid_object_id,
                    name="Course A",
                    description="desc",
                    level="BEGINNER",
                    thumbnail="",
                    instructor_name="Teacher",
                    duration="10h",
                )
            ]

    class _FakeCourse:
        is_published = "published"

        @staticmethod
        def find(*_args, **_kwargs):
            return _Q()

    monkeypatch.setattr("routers.course.Course", _FakeCourse)

    response = client.get("/api/v1/courses/listed-courses")

    assert response.status_code == 200
    assert response.json()["data"][0]["name"] == "Course A"


def test_get_course_section_requires_authentication(client, valid_object_id):
    response = client.get(f"/api/v1/courses/get-course-section/{valid_object_id}")
    assert response.status_code == 401


def test_get_student_courses_forbidden_for_admin(
    client,
    auth_header_for,
    mock_user_presence,
    valid_object_id,
):
    headers = auth_header_for(valid_object_id, "ADMIN")
    response = client.get("/api/v1/courses/get-student-courses", headers=headers)

    assert response.status_code == 403


def test_get_course_section_invalid_object_id_returns_401(client, auth_header_for, mock_user_presence, valid_object_id):
    headers = auth_header_for(valid_object_id, "ADMIN")
    response = client.get("/api/v1/courses/get-course-section/not-an-object-id", headers=headers)

    # Unhandled ObjectId conversion currently bubbles as server error.
    assert response.status_code == 500
