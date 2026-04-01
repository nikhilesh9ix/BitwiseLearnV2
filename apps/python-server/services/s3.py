import boto3
from botocore.exceptions import ClientError
from config import get_settings
import uuid
from pathlib import Path
from urllib.parse import urlparse

settings = get_settings()
LOCAL_UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION,
)


def upload_file_to_s3(file_bytes: bytes, folder: str, filename: str, content_type: str = "application/octet-stream") -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    unique_name = f"{folder}/{uuid.uuid4().hex}.{ext}" if ext else f"{folder}/{uuid.uuid4().hex}"
    try:
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=unique_name,
            Body=file_bytes,
            ContentType=content_type,
        )
        return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{unique_name}"
    except Exception:
        # Local/dev fallback when AWS credentials or bucket settings are unavailable.
        local_file = LOCAL_UPLOADS_DIR / unique_name
        local_file.parent.mkdir(parents=True, exist_ok=True)
        local_file.write_bytes(file_bytes)
        return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/uploads/{unique_name}"


def delete_file_from_s3(file_url: str) -> bool:
    if not file_url:
        return True

    try:
        parsed_local = urlparse(file_url)
        if parsed_local.path.startswith("/uploads/"):
            local_relative_path = parsed_local.path.removeprefix("/uploads/")
            local_file = LOCAL_UPLOADS_DIR / local_relative_path
            if local_file.exists():
                local_file.unlink()
            return True
    except Exception:
        pass

    try:
        parsed = urlparse(file_url)
        key = parsed.path.lstrip("/")
        s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        return True
    except ClientError:
        return False
