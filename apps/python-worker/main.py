import asyncio
from beanie import init_beanie
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import connect_to_mongo, get_settings
from models import ALL_WORKER_MODELS
from services.queue import start_consumer
from tasks.assessment_processing import process_assessment_report
from tasks.assessment_cron import check_assessment_status

settings = get_settings()


async def main():
    # Initialize database + Beanie
    client, db_name = await connect_to_mongo(settings)
    await init_beanie(database=client[db_name], document_models=ALL_WORKER_MODELS)
    print(f"Worker database connected: {db_name}")

    # Start APScheduler for cron jobs
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_assessment_status,
        "interval",
        minutes=30,
        id="assessment_status_check",
    )
    scheduler.start()
    print("APScheduler started — assessment status check every 30 minutes")

    # Start RabbitMQ consumer
    connection = await start_consumer("assessment-report", process_assessment_report)
    print("RabbitMQ consumer started — listening on 'assessment-report' queue")

    try:
        # Keep the worker running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down worker...")
    finally:
        scheduler.shutdown()
        await connection.close()
        client.close()
        print("Worker shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
