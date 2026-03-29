from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from beanie import PydanticObjectId
from schemas.problem import (
    CreateProblemRequest, UpdateProblemRequest, AddTopicRequest, UpdateTopicRequest,
    AddTemplateRequest, UpdateTemplateRequest, AddTestCaseRequest, UpdateTestCaseRequest,
    AddSolutionRequest, UpdateSolutionRequest, SearchProblemRequest,
)
from utils.api_response import api_response
from middleware.auth import get_current_user, not_student
from models.problem import Problem
from models.problem_topic import ProblemTopic
from models.problem_template import ProblemTemplate
from models.problem_test_case import ProblemTestCase
from models.problem_solution import ProblemSolution
from models.problem_submission import ProblemSubmission
from enums import ListingStatus, TestcaseType
import re

router = APIRouter(prefix="/api/v1/problems", tags=["DSA Problems"])


# ========== PUBLIC ENDPOINTS ==========

@router.get("/get-all-dsa-problem/")
async def get_all_dsa_problems():
    problems = await Problem.find_all().to_list()
    data = []
    for p in problems:
        topics = await ProblemTopic.find(ProblemTopic.problem_id == p.id).to_list()
        tags = []
        for t in topics:
            tags.extend(t.tag_name)
        data.append({
            "id": str(p.id), "name": p.name, "difficulty": p.difficulty,
            "published": p.published, "tags": tags
        })
    return api_response(200, "Problems fetched", data=data)


@router.get("/get-all-listed-problem/")
async def get_all_listed_problems():
    problems = await Problem.find(Problem.published == ListingStatus.LISTED).to_list()
    data = []
    for p in problems:
        topics = await ProblemTopic.find(ProblemTopic.problem_id == p.id).to_list()
        tags = []
        for t in topics:
            tags.extend(t.tag_name)
        data.append({
            "id": str(p.id), "name": p.name, "difficulty": p.difficulty, "tags": tags
        })
    return api_response(200, "Listed problems fetched", data=data)


@router.post("/search-question")
async def search_question(body: SearchProblemRequest):
    pattern = re.escape(body.query)
    problems = await Problem.find({"name": {"$regex": pattern, "$options": "i"}}).to_list()
    data = [{
        "id": str(p.id), "name": p.name, "difficulty": p.difficulty, "published": p.published
    } for p in problems]
    return api_response(200, "Search results", data=data)


@router.get("/get-dsa-problem/{id}/")
async def get_dsa_problem(id: str):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")

    topics = await ProblemTopic.find(ProblemTopic.problem_id == problem.id).to_list()
    tags = []
    for t in topics:
        tags.extend(t.tag_name)

    templates = await ProblemTemplate.find(ProblemTemplate.problem_id == problem.id).to_list()
    template_data = [{
        "id": str(t.id), "language": t.language, "default_code": t.default_code,
        "function_body": t.function_body
    } for t in templates]

    # Only example test cases for public
    test_cases = await ProblemTestCase.find(
        ProblemTestCase.problem_id == problem.id,
        ProblemTestCase.test_type == TestcaseType.EXAMPLE,
    ).to_list()
    tc_data = [{"id": str(tc.id), "input": tc.input, "output": tc.output, "test_type": tc.test_type} for tc in test_cases]

    solutions = await ProblemSolution.find(ProblemSolution.problem_id == problem.id).to_list()
    sol_data = [{"id": str(s.id), "solution": s.solution, "video_solution": s.video_solution} for s in solutions]

    return api_response(200, "Problem fetched", data={
        "id": str(problem.id), "name": problem.name, "description": problem.description,
        "hints": problem.hints, "difficulty": problem.difficulty, "published": problem.published,
        "tags": tags, "templates": template_data, "test_cases": tc_data, "solutions": sol_data,
    })


@router.get("/get-dsa-problems-by-tag")
async def get_problems_by_tag(tag: str = Query(...)):
    topics = await ProblemTopic.find({"tag_name": tag}).to_list()
    problem_ids = [t.problem_id for t in topics]
    if not problem_ids:
        return api_response(200, "No problems found", data=[])

    problems = await Problem.find({"_id": {"$in": problem_ids}}).to_list()
    data = [{
        "id": str(p.id), "name": p.name, "difficulty": p.difficulty, "published": p.published
    } for p in problems]
    return api_response(200, "Problems fetched", data=data)


# ========== ADMIN ENDPOINTS ==========

@router.put("/change-status/{id}")
async def change_status(id: str, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    problem.published = ListingStatus.NOT_LISTED if problem.published == ListingStatus.LISTED else ListingStatus.LISTED
    problem.updated_at = datetime.now(timezone.utc)
    await problem.save()
    return api_response(200, "Status changed", data={"published": problem.published})


@router.get("/admin/get-dsa-problem/{id}")
async def admin_get_dsa_problem(id: str, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")

    topics = await ProblemTopic.find(ProblemTopic.problem_id == problem.id).to_list()
    templates = await ProblemTemplate.find(ProblemTemplate.problem_id == problem.id).to_list()
    test_cases = await ProblemTestCase.find(ProblemTestCase.problem_id == problem.id).to_list()
    solutions = await ProblemSolution.find(ProblemSolution.problem_id == problem.id).to_list()
    submissions = await ProblemSubmission.find(ProblemSubmission.problem_id == problem.id).to_list()

    return api_response(200, "Problem fetched", data={
        "id": str(problem.id), "name": problem.name, "description": problem.description,
        "hints": problem.hints, "difficulty": problem.difficulty, "published": problem.published,
        "topics": [{"id": str(t.id), "tag_name": t.tag_name} for t in topics],
        "templates": [{"id": str(t.id), "language": t.language, "default_code": t.default_code, "function_body": t.function_body} for t in templates],
        "test_cases": [{"id": str(tc.id), "input": tc.input, "output": tc.output, "test_type": tc.test_type} for tc in test_cases],
        "solutions": [{"id": str(s.id), "solution": s.solution, "video_solution": s.video_solution} for s in solutions],
        "submissions": [{"id": str(sub.id), "status": sub.status, "student_id": str(sub.student_id)} for sub in submissions],
    })


@router.get("/admin/get-dsa-problem/testcases/{id}")
async def admin_get_testcases(id: str, current_user: dict = Depends(not_student)):
    test_cases = await ProblemTestCase.find(ProblemTestCase.problem_id == PydanticObjectId(id)).to_list()
    data = [{"id": str(tc.id), "input": tc.input, "output": tc.output, "test_type": tc.test_type} for tc in test_cases]
    return api_response(200, "Test cases fetched", data=data)


@router.get("/admin/get-dsa-problem/solution/{id}")
async def admin_get_solutions(id: str, current_user: dict = Depends(not_student)):
    solutions = await ProblemSolution.find(ProblemSolution.problem_id == PydanticObjectId(id)).to_list()
    data = [{"id": str(s.id), "solution": s.solution, "video_solution": s.video_solution} for s in solutions]
    return api_response(200, "Solutions fetched", data=data)


@router.get("/admin/get-dsa-problem/submission/{id}")
async def admin_get_submissions(id: str, current_user: dict = Depends(not_student)):
    submissions = await ProblemSubmission.find(ProblemSubmission.problem_id == PydanticObjectId(id)).to_list()
    data = [{
        "id": str(s.id), "status": s.status, "code": s.code, "runtime": s.runtime,
        "memory": s.memory, "student_id": str(s.student_id),
        "submitted_at": s.submitted_at.isoformat()
    } for s in submissions]
    return api_response(200, "Submissions fetched", data=data)


@router.get("/admin/get-dsa-problem/templates/{id}")
async def admin_get_templates(id: str, current_user: dict = Depends(not_student)):
    templates = await ProblemTemplate.find(ProblemTemplate.problem_id == PydanticObjectId(id)).to_list()
    data = [{"id": str(t.id), "language": t.language, "default_code": t.default_code, "function_body": t.function_body} for t in templates]
    return api_response(200, "Templates fetched", data=data)


@router.post("/add-problem/")
async def add_problem(body: CreateProblemRequest, current_user: dict = Depends(not_student)):
    problem = Problem(
        name=body.name,
        description=body.description,
        hints=body.hints,
        difficulty=body.difficulty,
        created_by=current_user["type"],
        creator_type=current_user["type"],
        section_id=PydanticObjectId(body.section_id) if body.section_id else None,
        user_id=PydanticObjectId(current_user["id"]),
    )
    await problem.insert()
    return api_response(201, "Problem created", data={"id": str(problem.id), "name": problem.name})


@router.patch("/update-problem/{id}")
async def update_problem(id: str, body: UpdateProblemRequest, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(problem, key, val)
    problem.updated_at = datetime.now(timezone.utc)
    await problem.save()
    return api_response(200, "Problem updated", data={"id": str(problem.id)})


@router.delete("/delete-problem/{id}")
async def delete_problem(id: str, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    pid = problem.id
    await ProblemTopic.find(ProblemTopic.problem_id == pid).delete()
    await ProblemTemplate.find(ProblemTemplate.problem_id == pid).delete()
    await ProblemTestCase.find(ProblemTestCase.problem_id == pid).delete()
    await ProblemSolution.find(ProblemSolution.problem_id == pid).delete()
    await ProblemSubmission.find(ProblemSubmission.problem_id == pid).delete()
    await problem.delete()
    return api_response(200, "Problem deleted")


# Topics
@router.post("/add-topic-to-problem/{id}")
async def add_topic(id: str, body: AddTopicRequest, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    topic = ProblemTopic(problem_id=problem.id, tag_name=body.tag_name)
    await topic.insert()
    return api_response(201, "Topic added", data={"id": str(topic.id)})


@router.patch("/update-topic-to-problem/{id}")
async def update_topic(id: str, body: UpdateTopicRequest, current_user: dict = Depends(not_student)):
    topic = await ProblemTopic.get(PydanticObjectId(id))
    if not topic:
        return api_response(404, "Topic not found", error="Not found")
    topic.tag_name = body.tag_name
    topic.updated_at = datetime.now(timezone.utc)
    await topic.save()
    return api_response(200, "Topic updated")


@router.delete("/delete-topic-from-problem/{id}")
async def delete_topic(id: str, current_user: dict = Depends(not_student)):
    topic = await ProblemTopic.get(PydanticObjectId(id))
    if not topic:
        return api_response(404, "Topic not found", error="Not found")
    await topic.delete()
    return api_response(200, "Topic deleted")


# Templates
@router.post("/add-template-to-problem/{id}")
async def add_template(id: str, body: AddTemplateRequest, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    template = ProblemTemplate(
        problem_id=problem.id, function_body=body.function_body,
        default_code=body.default_code, language=body.language,
    )
    await template.insert()
    return api_response(201, "Template added", data={"id": str(template.id)})


@router.patch("/update-template-to-problem/{id}")
async def update_template(id: str, body: UpdateTemplateRequest, current_user: dict = Depends(not_student)):
    template = await ProblemTemplate.get(PydanticObjectId(id))
    if not template:
        return api_response(404, "Template not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(template, key, val)
    template.updated_at = datetime.now(timezone.utc)
    await template.save()
    return api_response(200, "Template updated")


@router.delete("/delete-template-from-problem/{id}")
async def delete_template(id: str, current_user: dict = Depends(not_student)):
    template = await ProblemTemplate.get(PydanticObjectId(id))
    if not template:
        return api_response(404, "Template not found", error="Not found")
    await template.delete()
    return api_response(200, "Template deleted")


# Test Cases
@router.post("/add-testcase-to-problem/{id}")
async def add_testcase(id: str, body: AddTestCaseRequest, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    tc = ProblemTestCase(
        test_type=body.test_type, input=body.input, output=body.output, problem_id=problem.id,
    )
    await tc.insert()
    return api_response(201, "Test case added", data={"id": str(tc.id)})


@router.patch("/update-testcase-to-problem/{id}")
async def update_testcase(id: str, body: UpdateTestCaseRequest, current_user: dict = Depends(not_student)):
    tc = await ProblemTestCase.get(PydanticObjectId(id))
    if not tc:
        return api_response(404, "Test case not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(tc, key, val)
    tc.updated_at = datetime.now(timezone.utc)
    await tc.save()
    return api_response(200, "Test case updated")


@router.delete("/delete-testcase-to-problem/{id}")
async def delete_testcase(id: str, current_user: dict = Depends(not_student)):
    tc = await ProblemTestCase.get(PydanticObjectId(id))
    if not tc:
        return api_response(404, "Test case not found", error="Not found")
    await tc.delete()
    return api_response(200, "Test case deleted")


# Solutions
@router.post("/add-solution-to-problem/{id}")
async def add_solution(id: str, body: AddSolutionRequest, current_user: dict = Depends(not_student)):
    problem = await Problem.get(PydanticObjectId(id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")
    sol = ProblemSolution(solution=body.solution, video_solution=body.video_solution, problem_id=problem.id)
    await sol.insert()
    return api_response(201, "Solution added", data={"id": str(sol.id)})


@router.patch("/update-solution-to-problem/{id}")
async def update_solution(id: str, body: UpdateSolutionRequest, current_user: dict = Depends(not_student)):
    sol = await ProblemSolution.get(PydanticObjectId(id))
    if not sol:
        return api_response(404, "Solution not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(sol, key, val)
    sol.updated_at = datetime.now(timezone.utc)
    await sol.save()
    return api_response(200, "Solution updated")


@router.delete("/delete-solution-to-problem/{id}")
async def delete_solution(id: str, current_user: dict = Depends(not_student)):
    sol = await ProblemSolution.get(PydanticObjectId(id))
    if not sol:
        return api_response(404, "Solution not found", error="Not found")
    await sol.delete()
    return api_response(200, "Solution deleted")


# ========== AUTHENTICATED ENDPOINTS ==========

@router.get("/get-user-solved-questions/")
async def get_user_solved_questions(current_user: dict = Depends(get_current_user)):
    user_id = PydanticObjectId(current_user["id"])
    submissions = await ProblemSubmission.find(ProblemSubmission.student_id == user_id).to_list()
    
    solved_ids = set()
    for s in submissions:
        if s.status == "SUCCESS":
            solved_ids.add(str(s.problem_id))

    data = []
    for pid_str in solved_ids:
        p = await Problem.get(PydanticObjectId(pid_str))
        if p:
            data.append({"id": str(p.id), "name": p.name, "difficulty": p.difficulty})
    return api_response(200, "Solved questions", data=data)


@router.get("/admin/get-user-solved-questions")
async def admin_get_user_solved(current_user: dict = Depends(not_student)):
    submissions = await ProblemSubmission.find_all().to_list()
    user_solved = {}
    for s in submissions:
        key = str(s.student_id)
        if key not in user_solved:
            user_solved[key] = set()
        if s.status == "SUCCESS":
            user_solved[key].add(str(s.problem_id))

    data = [{"student_id": k, "solved_count": len(v)} for k, v in user_solved.items()]
    return api_response(200, "User solved data", data=data)


@router.get("/get-submission/{id}")
async def get_submission(id: str, current_user: dict = Depends(get_current_user)):
    user_id = PydanticObjectId(current_user["id"])
    problem_id = PydanticObjectId(id)
    submissions = await ProblemSubmission.find(
        ProblemSubmission.student_id == user_id,
        ProblemSubmission.problem_id == problem_id,
    ).sort("-submitted_at").to_list()
    data = [{
        "id": str(s.id), "code": s.code, "status": s.status,
        "runtime": s.runtime, "memory": s.memory,
        "failed_test_case": s.failed_test_case,
        "submitted_at": s.submitted_at.isoformat()
    } for s in submissions]
    return api_response(200, "Submissions fetched", data=data)
