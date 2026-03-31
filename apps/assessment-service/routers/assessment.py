from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from beanie import PydanticObjectId
from shared.schemas.assessment import (
    CreateAssessmentRequest, UpdateAssessmentRequest, UpdateAssessmentStatusRequest,
    CreateAssessmentSectionRequest, UpdateAssessmentSectionRequest,
    AddAssessmentQuestionRequest, UpdateAssessmentQuestionRequest,
    SubmitAssessmentRequest, SubmitAssessmentQuestionRequest,
)
from shared.utils.api_response import api_response
from shared.middleware.auth import get_current_user, not_student, require_roles
from shared.models.assessment import Assessment
from shared.models.assessment_section import AssessmentSection
from shared.models.assessment_question import AssessmentQuestion
from shared.models.assessment_submission import AssessmentSubmission
from shared.models.assessment_question_submission import AssessmentQuestionSubmission
from shared.models.batch import Batch
from shared.services.piston import execute_code
from shared.services.queue import publish_message
from shared.enums import UserType, AssessmentStatus, AssessmentType, ReportStatus

router = APIRouter(prefix="/api/v1/assessments", tags=["Assessments"])

_admin_roles = require_roles(UserType.SUPERADMIN, UserType.ADMIN, UserType.INSTITUTION, UserType.VENDOR)


# ========== ASSESSMENT CRUD ==========

@router.post("/create-assessment")
async def create_assessment(body: CreateAssessmentRequest, current_user: dict = Depends(not_student)):
    assessment = Assessment(
        name=body.name,
        description=body.description,
        instruction=body.instruction,
        start_time=body.start_time,
        end_time=body.end_time,
        individual_section_time_limit=body.individual_section_time_limit,
        auto_submit=body.auto_submit,
        batch_id=PydanticObjectId(body.batch_id),
        teacher_id=PydanticObjectId(body.teacher_id) if body.teacher_id else None,
        creator_id=current_user["id"],
        creator_type=current_user["type"],
    )
    await assessment.insert()
    return api_response(201, "Assessment created", data={"id": str(assessment.id), "name": assessment.name})


@router.get("/get-all-assessment")
async def get_all_assessments(current_user: dict = Depends(_admin_roles)):
    assessments = await Assessment.find_all().to_list()
    data = [{
        "id": str(a.id), "name": a.name, "description": a.description,
        "status": a.status, "start_time": a.start_time.isoformat(),
        "end_time": a.end_time.isoformat(), "batch_id": str(a.batch_id),
        "report_status": a.report_status, "created_at": a.created_at.isoformat()
    } for a in assessments]
    return api_response(200, "Assessments fetched", data=data)


@router.get("/get-assessment-by-id/{id}")
async def get_assessment_by_id(id: str, current_user: dict = Depends(get_current_user)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    data = {
        "id": str(assessment.id), "name": assessment.name, "description": assessment.description,
        "instruction": assessment.instruction, "status": assessment.status,
        "start_time": assessment.start_time.isoformat(), "end_time": assessment.end_time.isoformat(),
        "individual_section_time_limit": assessment.individual_section_time_limit,
        "auto_submit": assessment.auto_submit, "batch_id": str(assessment.batch_id),
        "report": assessment.report, "report_status": assessment.report_status,
        "teacher_id": str(assessment.teacher_id) if assessment.teacher_id else None,
    }

    # If student, add submission status
    if current_user["type"] == UserType.STUDENT:
        sub = await AssessmentSubmission.find_one(
            AssessmentSubmission.assessment_id == assessment.id,
            AssessmentSubmission.student_id == PydanticObjectId(current_user["id"]),
        )
        data["has_submitted"] = sub.is_submitted if sub else False
        data["submission_id"] = str(sub.id) if sub else None

    return api_response(200, "Assessment fetched", data=data)


@router.get("/get-assessment-by-institution/{id}")
async def get_assessment_by_institution(id: str, current_user: dict = Depends(get_current_user)):
    batches = await Batch.find(Batch.institution_id == PydanticObjectId(id)).to_list()
    batch_ids = [b.id for b in batches]
    if not batch_ids:
        return api_response(200, "No assessments", data=[])

    assessments = await Assessment.find({"batch_id": {"$in": batch_ids}}).to_list()
    data = [{
        "id": str(a.id), "name": a.name, "status": a.status,
        "batch_id": str(a.batch_id), "start_time": a.start_time.isoformat(),
        "end_time": a.end_time.isoformat()
    } for a in assessments]
    return api_response(200, "Assessments fetched", data=data)


@router.get("/get-assessment-by-batch/{id}")
async def get_assessment_by_batch(id: str, current_user: dict = Depends(get_current_user)):
    batch_id = PydanticObjectId(id)
    assessments = await Assessment.find(Assessment.batch_id == batch_id).to_list()

    if current_user["type"] == UserType.STUDENT:
        # Students only see LIVE assessments
        student_id = PydanticObjectId(current_user["id"])
        data = []
        for a in assessments:
            if a.status != AssessmentStatus.LIVE:
                continue
            sub = await AssessmentSubmission.find_one(
                AssessmentSubmission.assessment_id == a.id,
                AssessmentSubmission.student_id == student_id,
            )
            can_access = sub is None or not sub.is_submitted
            data.append({
                "id": str(a.id), "name": a.name, "status": a.status,
                "start_time": a.start_time.isoformat(), "end_time": a.end_time.isoformat(),
                "canAccessTest": can_access,
            })
    else:
        data = [{
            "id": str(a.id), "name": a.name, "status": a.status,
            "start_time": a.start_time.isoformat(), "end_time": a.end_time.isoformat(),
            "batch_id": str(a.batch_id), "report_status": a.report_status,
        } for a in assessments]

    return api_response(200, "Assessments fetched", data=data)


@router.put("/update-assessment-by-id/{id}")
async def update_assessment(id: str, body: UpdateAssessmentRequest, current_user: dict = Depends(not_student)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(assessment, key, val)
    assessment.updated_at = datetime.now(timezone.utc)
    await assessment.save()
    return api_response(200, "Assessment updated", data={"id": str(assessment.id)})


@router.put("/update-assessment-status/{id}")
async def update_assessment_status(id: str, body: UpdateAssessmentStatusRequest, current_user: dict = Depends(not_student)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")
    assessment.status = body.status
    assessment.updated_at = datetime.now(timezone.utc)
    await assessment.save()
    return api_response(200, "Status updated", data={"status": assessment.status})


@router.delete("/delete-assessment-by-id/{id}")
async def delete_assessment(id: str, current_user: dict = Depends(not_student)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")
    aid = assessment.id
    await AssessmentSection.find(AssessmentSection.assessment_id == aid).delete()
    await AssessmentQuestion.find({"section_id": {"$in": [s.id for s in await AssessmentSection.find(AssessmentSection.assessment_id == aid).to_list()]}}).delete()
    await AssessmentSubmission.find(AssessmentSubmission.assessment_id == aid).delete()
    await AssessmentQuestionSubmission.find(AssessmentQuestionSubmission.assessment_id == aid).delete()
    await assessment.delete()
    return api_response(200, "Assessment deleted")


# ========== ASSESSMENT SECTIONS ==========

@router.get("/get-sections-for-assessment/{id}")
async def get_sections(id: str, current_user: dict = Depends(get_current_user)):
    sections = await AssessmentSection.find(AssessmentSection.assessment_id == PydanticObjectId(id)).to_list()
    data = [{
        "id": str(s.id), "name": s.name, "marks_per_question": s.marks_per_question,
        "assessment_type": s.assessment_type, "assessment_id": str(s.assessment_id)
    } for s in sections]
    return api_response(200, "Sections fetched", data=data)


@router.post("/add-assessment-section")
async def add_section(body: CreateAssessmentSectionRequest, current_user: dict = Depends(_admin_roles)):
    section = AssessmentSection(
        name=body.name,
        marks_per_question=body.marks_per_question,
        assessment_type=body.assessment_type,
        assessment_id=PydanticObjectId(body.assessment_id),
    )
    await section.insert()
    return api_response(201, "Section created", data={"id": str(section.id)})


@router.put("/update-assessment-section/{id}")
async def update_section(id: str, body: UpdateAssessmentSectionRequest, current_user: dict = Depends(_admin_roles)):
    section = await AssessmentSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(section, key, val)
    section.updated_at = datetime.now(timezone.utc)
    await section.save()
    return api_response(200, "Section updated")


@router.delete("/delete-assessment-section/{id}")
async def delete_section(id: str, current_user: dict = Depends(_admin_roles)):
    section = await AssessmentSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")
    await AssessmentQuestion.find(AssessmentQuestion.section_id == section.id).delete()
    await section.delete()
    return api_response(200, "Section deleted")


# ========== ASSESSMENT QUESTIONS ==========

@router.post("/add-assessment-question/{id}")
async def add_question(id: str, body: AddAssessmentQuestionRequest, current_user: dict = Depends(_admin_roles)):
    section = await AssessmentSection.get(PydanticObjectId(id))
    if not section:
        return api_response(404, "Section not found", error="Not found")

    q = AssessmentQuestion(
        question=body.question,
        options=body.options,
        correct_option=body.correct_option,
        section_id=section.id,
        problem_id=PydanticObjectId(body.problem_id) if body.problem_id else None,
        max_marks=body.max_marks,
    )
    await q.insert()
    return api_response(201, "Question added", data={"id": str(q.id)})


@router.put("/update-assessment-question/{id}")
async def update_question(id: str, body: UpdateAssessmentQuestionRequest, current_user: dict = Depends(_admin_roles)):
    q = await AssessmentQuestion.get(PydanticObjectId(id))
    if not q:
        return api_response(404, "Question not found", error="Not found")
    for key, val in body.model_dump(exclude_none=True).items():
        setattr(q, key, val)
    q.updated_at = datetime.now(timezone.utc)
    await q.save()
    return api_response(200, "Question updated")


@router.delete("/delete-assessment-question/{id}")
async def delete_question(id: str, current_user: dict = Depends(_admin_roles)):
    q = await AssessmentQuestion.get(PydanticObjectId(id))
    if not q:
        return api_response(404, "Question not found", error="Not found")
    await q.delete()
    return api_response(200, "Question deleted")


@router.get("/get-questions-by-sectionId/{id}")
async def get_questions_by_section(id: str, current_user: dict = Depends(get_current_user)):
    questions = await AssessmentQuestion.find(AssessmentQuestion.section_id == PydanticObjectId(id)).to_list()
    data = [{
        "id": str(q.id), "question": q.question, "options": q.options,
        "correct_option": q.correct_option if current_user["type"] != UserType.STUDENT else None,
        "problem_id": str(q.problem_id) if q.problem_id else None,
        "max_marks": q.max_marks, "section_id": str(q.section_id),
    } for q in questions]
    return api_response(200, "Questions fetched", data=data)


# ========== ASSESSMENT SUBMISSIONS ==========

@router.post("/submit-assessment-by-id/{id}")
async def submit_assessment(id: str, body: SubmitAssessmentRequest, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    sections = await AssessmentSection.find(AssessmentSection.assessment_id == assessment.id).to_list()
    total_questions = 0
    total_max_marks = 0
    for sec in sections:
        sec_questions = await AssessmentQuestion.find(AssessmentQuestion.section_id == sec.id).to_list()
        total_questions += len(sec_questions)
        total_max_marks += sum(q.max_marks or 0 for q in sec_questions)

    submission = await AssessmentSubmission.find_one(
        AssessmentSubmission.assessment_id == assessment.id,
        AssessmentSubmission.student_id == student_id,
    )

    if submission and submission.is_submitted:
        obtained_marks = submission.total_marks or 0
        percentage = round((obtained_marks / total_max_marks) * 100, 2) if total_max_marks > 0 else 0
        return api_response(
            409,
            "Assessment already submitted",
            data={
                "report": {
                    "assessment_id": str(assessment.id),
                    "assessment_name": assessment.name,
                    "total_questions": total_questions,
                    "obtained_marks": obtained_marks,
                    "total_marks": total_max_marks,
                    "percentage": percentage,
                    "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
                }
            },
            error="Only one attempt is allowed",
        )

    # Tally marks from question submissions
    q_submissions = await AssessmentQuestionSubmission.find(
        AssessmentQuestionSubmission.assessment_id == assessment.id,
        AssessmentQuestionSubmission.student_id == student_id,
    ).to_list()
    total_marks = sum(qs.marks_obtained for qs in q_submissions)

    if submission:
        submission.is_submitted = True
        submission.submitted_at = datetime.now(timezone.utc)
        submission.total_marks = total_marks
        submission.tab_switch_count = body.tab_switch_count
        submission.proctoring_status = body.proctoring_status
        submission.updated_at = datetime.now(timezone.utc)
        await submission.save()
    else:
        submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            student_ip=body.student_ip,
            is_submitted=True,
            submitted_at=datetime.now(timezone.utc),
            total_marks=total_marks,
            tab_switch_count=body.tab_switch_count,
            proctoring_status=body.proctoring_status,
        )
        await submission.insert()

    percentage = round((total_marks / total_max_marks) * 100, 2) if total_max_marks > 0 else 0

    return api_response(200, "Assessment submitted", data={
        "submission_id": str(submission.id),
        "total_marks": total_marks,
        "report": {
            "assessment_id": str(assessment.id),
            "assessment_name": assessment.name,
            "total_questions": total_questions,
            "obtained_marks": total_marks,
            "total_marks": total_max_marks,
            "percentage": percentage,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        },
    })


@router.get("/get-student-assessment-report/{id}")
async def get_student_assessment_report(id: str, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    submission = await AssessmentSubmission.find_one(
        AssessmentSubmission.assessment_id == assessment.id,
        AssessmentSubmission.student_id == student_id,
    )
    if not submission or not submission.is_submitted:
        return api_response(404, "Report not found", error="Not found")

    sections = await AssessmentSection.find(AssessmentSection.assessment_id == assessment.id).to_list()
    total_questions = 0
    total_max_marks = 0
    for sec in sections:
        sec_questions = await AssessmentQuestion.find(AssessmentQuestion.section_id == sec.id).to_list()
        total_questions += len(sec_questions)
        total_max_marks += sum(q.max_marks or 0 for q in sec_questions)

    obtained_marks = submission.total_marks or 0
    percentage = round((obtained_marks / total_max_marks) * 100, 2) if total_max_marks > 0 else 0

    return api_response(200, "Assessment report fetched", data={
        "assessment_id": str(assessment.id),
        "assessment_name": assessment.name,
        "total_questions": total_questions,
        "obtained_marks": obtained_marks,
        "total_marks": total_max_marks,
        "percentage": percentage,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
    })


@router.post("/submit-assessment-question-by-id/{id}")
async def submit_assessment_question(id: str, body: SubmitAssessmentQuestionRequest, current_user: dict = Depends(require_roles(UserType.STUDENT))):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    student_id = PydanticObjectId(current_user["id"])
    question = await AssessmentQuestion.get(PydanticObjectId(body.question_id))
    if not question:
        return api_response(404, "Question not found", error="Not found")

    # Ensure submission record exists
    submission = await AssessmentSubmission.find_one(
        AssessmentSubmission.assessment_id == assessment.id,
        AssessmentSubmission.student_id == student_id,
    )
    if not submission:
        submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            student_ip="",
        )
        await submission.insert()

    marks = 0
    answer_str = body.answer

    section = await AssessmentSection.get(question.section_id)
    if section and section.assessment_type == AssessmentType.NO_CODE:
        # MCQ auto-grade
        if body.answer and question.correct_option and body.answer == question.correct_option:
            marks = question.max_marks
        answer_str = body.answer
    elif section and section.assessment_type == AssessmentType.CODE:
        # Execute code and grade
        if body.code and body.language:
            from models.problem import Problem
            from models.problem_test_case import ProblemTestCase
            from models.problem_template import ProblemTemplate

            if question.problem_id:
                problem = await Problem.get(question.problem_id)
                if problem:
                    template = await ProblemTemplate.find_one(
                        ProblemTemplate.problem_id == problem.id,
                        ProblemTemplate.language == body.language,
                    )
                    if not template:
                        normalized_language = (body.language or "").strip().upper()
                        language_aliases = {
                            "JS": "JAVASCRIPT",
                            "NODE": "JAVASCRIPT",
                            "C++": "CPP",
                            "CXX": "CPP",
                        }
                        normalized_language = language_aliases.get(normalized_language, normalized_language)
                        if normalized_language != body.language:
                            template = await ProblemTemplate.find_one(
                                ProblemTemplate.problem_id == problem.id,
                                ProblemTemplate.language == normalized_language,
                            )
                    test_cases = await ProblemTestCase.find(ProblemTestCase.problem_id == problem.id).to_list()

                    full_code = body.code
                    if template:
                        if "_solution_" in template.function_body:
                            full_code = template.function_body.replace("_solution_", body.code)
                        else:
                            full_code = body.code + "\n" + template.function_body

                    all_passed = True
                    for tc in test_cases:
                        result = await execute_code(body.language, full_code, tc.input)
                        run_output = result.get("run", {})
                        actual = (run_output.get("stdout") or "").strip()
                        if actual != tc.output.strip():
                            all_passed = False
                            break

                    if all_passed:
                        marks = question.max_marks
            answer_str = body.code

    # Upsert question submission
    existing = await AssessmentQuestionSubmission.find_one(
        AssessmentQuestionSubmission.question_id == question.id,
        AssessmentQuestionSubmission.assessment_id == assessment.id,
        AssessmentQuestionSubmission.student_id == student_id,
    )
    if existing:
        existing.answer = answer_str
        existing.marks_obtained = marks
        existing.assessment_submission_id = submission.id
        existing.updated_at = datetime.now(timezone.utc)
        await existing.save()
    else:
        qs = AssessmentQuestionSubmission(
            question_id=question.id,
            assessment_id=assessment.id,
            student_id=student_id,
            answer=answer_str,
            marks_obtained=marks,
            assessment_submission_id=submission.id,
        )
        await qs.insert()

    return api_response(200, "Question submitted", data={"marks_obtained": marks})


# ========== ASSESSMENT REPORT ==========

@router.post("/assignment-report/{id}")
@router.post("/assessment-report/{id}")
async def trigger_assessment_report(id: str, current_user: dict = Depends(not_student)):
    assessment = await Assessment.get(PydanticObjectId(id))
    if not assessment:
        return api_response(404, "Assessment not found", error="Not found")

    assessment.report_status = ReportStatus.PROCESSING
    assessment.updated_at = datetime.now(timezone.utc)
    await assessment.save()

    try:
        await publish_message("assessment-report", {"assessment_id": str(assessment.id)})
    except Exception:
        pass

    return api_response(200, "Report generation triggered", data={"report_status": ReportStatus.PROCESSING})
