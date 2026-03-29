from datetime import datetime, timezone


async def check_assessment_status():
    """
    Cron job that runs every 30 minutes:
    - UPCOMING -> LIVE if start_time <= now
    - LIVE -> ENDED if end_time <= now (auto-submit pending students)
    """
    from models import Assessment, AssessmentSubmission, AssessmentQuestionSubmission

    now = datetime.now(timezone.utc)
    print(f"[CRON] Checking assessment statuses at {now.isoformat()}")

    # UPCOMING -> LIVE
    upcoming = await Assessment.find(
        Assessment.status == "UPCOMING",
        Assessment.start_time <= now,
    ).to_list()

    for a in upcoming:
        a.status = "LIVE"
        a.updated_at = now
        await a.save()
        print(f"  Assessment '{a.name}' -> LIVE")

    # LIVE -> ENDED
    live = await Assessment.find(
        Assessment.status == "LIVE",
        Assessment.end_time <= now,
    ).to_list()

    for a in live:
        a.status = "ENDED"
        a.updated_at = now
        await a.save()
        print(f"  Assessment '{a.name}' -> ENDED")

        # Auto-submit for students who haven't submitted
        if a.auto_submit:
            submissions = await AssessmentSubmission.find(
                AssessmentSubmission.assessment_id == a.id,
                AssessmentSubmission.is_submitted == False,
            ).to_list()

            for sub in submissions:
                # Calculate total marks from question submissions
                q_subs = await AssessmentQuestionSubmission.find(
                    AssessmentQuestionSubmission.assessment_id == a.id,
                    AssessmentQuestionSubmission.student_id == sub.student_id,
                ).to_list()
                total = sum(qs.marks_obtained for qs in q_subs)

                sub.is_submitted = True
                sub.submitted_at = now
                sub.total_marks = total
                sub.updated_at = now
                await sub.save()
                print(f"    Auto-submitted for student {sub.student_id}")

    print(f"[CRON] Status check complete. Updated {len(upcoming)} to LIVE, {len(live)} to ENDED.")
