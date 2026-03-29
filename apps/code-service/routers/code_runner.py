from fastapi import APIRouter, Depends
from beanie import PydanticObjectId
from shared.schemas.problem import RunCodeRequest, CompileCodeRequest, SubmitCodeRequest
from shared.utils.api_response import api_response
from shared.middleware.auth import get_current_user, require_roles
from shared.models.problem import Problem
from shared.models.problem_test_case import ProblemTestCase
from shared.models.problem_template import ProblemTemplate
from shared.models.problem_submission import ProblemSubmission
from shared.models.problem_submission_test_case import ProblemSubmissionTestCase
from shared.services.piston import execute_code
from shared.enums import TestcaseType, ProblemStatus, UserType

router = APIRouter(prefix="/api/v1/code", tags=["Code Runner"])


@router.post("/run")
async def run_code(body: RunCodeRequest, current_user: dict = Depends(get_current_user)):
    problem = await Problem.get(PydanticObjectId(body.problem_id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")

    template = await ProblemTemplate.find_one(
        ProblemTemplate.problem_id == problem.id,
        ProblemTemplate.language == body.language,
    )

    # Admins run against all test cases, others only example
    if current_user["type"] in (UserType.SUPERADMIN, UserType.ADMIN):
        test_cases = await ProblemTestCase.find(ProblemTestCase.problem_id == problem.id).to_list()
    else:
        test_cases = await ProblemTestCase.find(
            ProblemTestCase.problem_id == problem.id,
            ProblemTestCase.test_type == TestcaseType.EXAMPLE,
        ).to_list()

    if not test_cases:
        return api_response(400, "No test cases found", error="No test cases")

    full_code = body.code
    if template:
        full_code = body.code + "\n" + template.function_body

    results = []
    for tc in test_cases:
        result = await execute_code(body.language, full_code, tc.input)
        run_output = result.get("run", {})
        actual_output = (run_output.get("stdout") or "").strip()
        expected = tc.output.strip()
        passed = actual_output == expected
        results.append({
            "test_case_id": str(tc.id),
            "input": tc.input,
            "expected_output": expected,
            "actual_output": actual_output,
            "passed": passed,
            "stderr": run_output.get("stderr", ""),
            "test_type": tc.test_type,
        })

    all_passed = all(r["passed"] for r in results)
    return api_response(200, "Code executed", data={
        "results": results,
        "all_passed": all_passed,
    })


@router.post("/compile")
async def compile_code(body: CompileCodeRequest):
    result = await execute_code(body.language, body.code, body.stdin)
    if result.get("error"):
        error_message = str(result.get("error"))
        details = result.get("details")
        if details:
            error_message = f"{error_message}: {details}"
        return api_response(400, "Compile failed", error=error_message)
    run_output = result.get("run", {})
    return api_response(200, "Code compiled", data={
        "stdout": run_output.get("stdout", ""),
        "stderr": run_output.get("stderr", ""),
        "code": run_output.get("code"),
        "signal": run_output.get("signal"),
    })


@router.post("/submit")
async def submit_code(body: SubmitCodeRequest, current_user: dict = Depends(require_roles(UserType.STUDENT, UserType.TEACHER))):
    problem = await Problem.get(PydanticObjectId(body.problem_id))
    if not problem:
        return api_response(404, "Problem not found", error="Not found")

    template = await ProblemTemplate.find_one(
        ProblemTemplate.problem_id == problem.id,
        ProblemTemplate.language == body.language,
    )

    test_cases = await ProblemTestCase.find(ProblemTestCase.problem_id == problem.id).to_list()
    if not test_cases:
        return api_response(400, "No test cases", error="No test cases")

    full_code = body.code
    if template:
        full_code = body.code + "\n" + template.function_body

    all_passed = True
    failed_tc = None
    tc_results = []

    for tc in test_cases:
        result = await execute_code(body.language, full_code, tc.input)
        run_output = result.get("run", {})
        actual_output = (run_output.get("stdout") or "").strip()
        expected = tc.output.strip()
        passed = actual_output == expected

        tc_results.append({
            "test_case_id": tc.id,
            "passed": passed,
            "actual_output": actual_output,
            "runtime": run_output.get("code"),
            "memory": None,
        })

        if not passed and all_passed:
            all_passed = False
            failed_tc = str(tc.id)

    status = ProblemStatus.SUCCESS if all_passed else ProblemStatus.FAILED
    submission = ProblemSubmission(
        code=body.code,
        status=status,
        student_id=PydanticObjectId(current_user["id"]),
        problem_id=problem.id,
        failed_test_case=failed_tc,
    )
    await submission.insert()

    # Save individual test case results
    for tcr in tc_results:
        sub_tc = ProblemSubmissionTestCase(
            submission_id=submission.id,
            test_case_id=tcr["test_case_id"],
            passed=tcr["passed"],
            actual_output=tcr["actual_output"],
            runtime=str(tcr["runtime"]) if tcr["runtime"] else None,
            memory=tcr["memory"],
        )
        await sub_tc.insert()

    return api_response(200, "Code submitted", data={
        "submission_id": str(submission.id),
        "status": status,
        "all_passed": all_passed,
        "total_test_cases": len(test_cases),
        "passed_count": sum(1 for r in tc_results if r["passed"]),
    })
