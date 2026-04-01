from datetime import datetime, timezone
from zoneinfo import ZoneInfo


IST = ZoneInfo("Asia/Kolkata")


def _to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Legacy records may be stored as naive local datetime.
        dt = dt.replace(tzinfo=IST)
    return dt.astimezone(timezone.utc)


async def check_assessment_status():
    """
    Cron job that runs every 30 minutes:
    - UPCOMING -> LIVE if start_time <= now
    - LIVE -> ENDED if end_time <= now (auto-submit pending students)
    """
    from models import Assessment, AssessmentSubmission, AssessmentQuestionSubmission
    from services.queue import publish_message
    from tasks.assessment_processing import process_assessment_report

    now = datetime.now(timezone.utc)
    print(f"[CRON] Checking assessment statuses at {now.isoformat()}")

    # UPCOMING -> LIVE
    upcoming_all = await Assessment.find(
        Assessment.status == "UPCOMING",
    ).to_list()
    upcoming = [
        a for a in upcoming_all if (_to_utc(a.start_time) is not None and _to_utc(a.start_time) <= now)
    ]

    for a in upcoming:
        a.status = "LIVE"
        a.updated_at = now
        await a.save()
        print(f"  Assessment '{a.name}' -> LIVE")

    async def trigger_report_generation(assessment, timestamp: datetime):
        # Trigger report generation once assessment has ended.
        # Skip if already in-progress or completed.
        if assessment.report_status in ("PROCESSING", "PROCESSED"):
            return

        assessment.report_status = "PROCESSING"
        assessment.updated_at = timestamp
        await assessment.save()

        try:
            await publish_message("assessment-report", {"assessment_id": str(assessment.id)})
            print(f"    Report generation queued for assessment {assessment.id}")
        except Exception as exc:
            print(
                f"    Failed to queue report generation for assessment {assessment.id}: {exc}. "
                "Falling back to direct processing."
            )
            try:
                await process_assessment_report({"assessment_id": str(assessment.id)})
                print(f"    Report generation completed via fallback for assessment {assessment.id}")
            except Exception as fallback_exc:
                assessment.report_status = "NOT_REQUESTED"
                assessment.updated_at = timestamp
                await assessment.save()
                print(f"    Fallback report generation failed for assessment {assessment.id}: {fallback_exc}")

    # LIVE -> ENDED
    live_all = await Assessment.find(
        Assessment.status == "LIVE",
    ).to_list()
    live = [
        a for a in live_all if (_to_utc(a.end_time) is not None and _to_utc(a.end_time) <= now)
    ]

    for a in live:
        a.status = "ENDED"
        a.updated_at = now
        await a.save()
        print(f"  Assessment '{a.name}' -> ENDED")

        # Auto-submit for students who haven't submitted
        if a.auto_submit:
            submissions = await AssessmentSubmission.find(
                AssessmentSubmission.assessment_id == a.id,
                {"is_submitted": False},
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

        await trigger_report_generation(a, now)

    # Backfill report generation for already-ended assessments.
    ended_pending = await Assessment.find(
        Assessment.status == "ENDED",
    ).to_list()

    for a in ended_pending:
        await trigger_report_generation(a, now)
        print(f"  Backfill report trigger for ended assessment '{a.name}'")

    print(
        f"[CRON] Status check complete. Updated {len(upcoming)} to LIVE, {len(live)} to ENDED, "
        f"backfilled {len(ended_pending)} reports."
    )
