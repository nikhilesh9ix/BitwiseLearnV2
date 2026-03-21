import os
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Service URL mapping — use env vars for Docker, defaults for local dev
ROUTE_TABLE = {
    "/api/v1/auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:8001"),
    "/api/v1/admins": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/institutions": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/vendors": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/batches": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/teachers": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/students": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/bulk-upload": os.getenv("USER_SERVICE_URL", "http://localhost:8002"),
    "/api/v1/courses": os.getenv("COURSE_SERVICE_URL", "http://localhost:8003"),
    "/api/v1/problems": os.getenv("PROBLEM_SERVICE_URL", "http://localhost:8004"),
    "/api/v1/assessments": os.getenv("ASSESSMENT_SERVICE_URL", "http://localhost:8005"),
    "/api/v1/code": os.getenv("CODE_SERVICE_URL", "http://localhost:8006"),
    "/api/v1/contact": os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8007"),
    "/api/v1/reports": os.getenv("REPORT_SERVICE_URL", "http://localhost:8008"),
}

# Sort prefixes longest-first for correct matching
SORTED_PREFIXES = sorted(ROUTE_TABLE.keys(), key=len, reverse=True)

limiter = Limiter(key_func=get_remote_address, default_limits=["200/10minutes"])

app = FastAPI(
    title="BitwiseLearn API Gateway",
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resolve_target(path: str) -> str | None:
    for prefix in SORTED_PREFIXES:
        if path == prefix or path.startswith(prefix + "/"):
            return ROUTE_TABLE[prefix]
    return None


@app.get("/")
async def root():
    return {"message": "BitwiseLearn API Gateway v2.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(request: Request, path: str):
    full_path = f"/{path}"
    target_base = _resolve_target(full_path)
    if target_base is None:
        return Response(content='{"detail":"Route not found"}', status_code=404, media_type="application/json")

    target_url = f"{target_base}{full_path}"
    if request.url.query:
        target_url += f"?{request.url.query}"

    body = await request.body()

    headers = dict(request.headers)
    headers.pop("host", None)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            content=body,
            headers=headers,
            cookies=request.cookies,
        )

    response = Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type"),
    )
    for key, value in resp.headers.items():
        key_lower = key.lower()
        if key_lower in ("content-encoding", "content-length", "transfer-encoding", "set-cookie"):
            continue
        if key_lower not in ("content-encoding", "content-length", "transfer-encoding"):
            response.headers[key] = value
    for cookie in resp.headers.get_list("set-cookie"):
        response.headers.append("set-cookie", cookie)
    return response
