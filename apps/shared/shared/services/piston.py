import httpx
from json import JSONDecodeError
from shared.config import get_settings
from shared.enums import Languages
from urllib.parse import urlparse

settings = get_settings()

LANGUAGE_MAP = {
    Languages.PYTHON: ("python3", "3.10.0", "py"),
    Languages.JAVASCRIPT: ("javascript", "18.15.0", "js"),
    Languages.JAVA: ("java", "15.0.2", "java"),
    Languages.C: ("c", "10.2.0", "c"),
    Languages.CPP: ("c++", "10.2.0", "cpp"),
}


async def execute_code(language: str, code: str, stdin: str = "") -> dict:
    normalized_language = (language or "").strip().upper()
    aliases = {
        "PY": "PYTHON",
        "JS": "JAVASCRIPT",
        "NODE": "JAVASCRIPT",
        "C++": "CPP",
        "CXX": "CPP",
    }
    normalized_language = aliases.get(normalized_language, normalized_language)

    try:
        language_enum = Languages(normalized_language)
    except ValueError:
        language_enum = None

    if language_enum is None:
        return {"error": f"Unsupported language: {language}"}

    lang_info = LANGUAGE_MAP.get(language_enum)
    if not lang_info:
        return {"error": f"Unsupported language: {language}"}

    lang_name, version, ext = lang_info
    payload = {
        "language": lang_name,
        "version": "*",
        "files": [{"name": f"main.{ext}", "content": code}],
        "stdin": stdin,
        "args": [],
        "compile_timeout": 10000,
        "run_timeout": 3000,
        "compile_memory_limit": -1,
        "run_memory_limit": -1,
    }

    base_url = settings.CODE_EXECUTION_SERVER.rstrip("/")
    if base_url.endswith("/api/v2/execute"):
        candidate_urls = [base_url]
    elif base_url.endswith("/api/v2/piston"):
        candidate_urls = [f"{base_url}/execute"]
    elif base_url.endswith("/api/v2"):
        candidate_urls = [
            f"{base_url}/execute",
            f"{base_url}/piston/execute",
        ]
    else:
        candidate_urls = [
            f"{base_url}/api/v2/piston/execute",
            f"{base_url}/api/v2/execute",
        ]

    async with httpx.AsyncClient(timeout=30.0) as client:
        last_error: dict | None = None

        for url in candidate_urls:
            try:
                resp = await client.post(url, json=payload)
            except httpx.HTTPError as exc:
                parsed = urlparse(url)
                is_local_piston = parsed.hostname in {"localhost", "127.0.0.1", "piston"}
                if is_local_piston and parsed.port in {None, 2000}:
                    last_error = {
                        "error": (
                            "Execution server request failed: local Piston is not reachable at "
                            f"{url}. Start it with `docker compose up -d piston` or set "
                            "CODE_EXECUTION_SERVER to a reachable Piston instance."
                        )
                    }
                else:
                    last_error = {"error": f"Execution server request failed: {exc}"}
                continue

            if resp.status_code == 401:
                message = "Execution server is not authorized for this project."
                details = resp.text[:500]
                if "whitelist" in details.lower():
                    message = (
                        "Execution server access denied (EMKC now requires whitelist). "
                        "Set CODE_EXECUTION_SERVER to your own Piston instance."
                    )
                return {"error": message, "details": details}

            if resp.status_code in (404, 405):
                last_error = {
                    "error": f"Execution server returned HTTP {resp.status_code}",
                    "details": resp.text[:500],
                }
                continue

            if resp.status_code >= 400:
                return {
                    "error": f"Execution server returned HTTP {resp.status_code}",
                    "details": resp.text[:500],
                }

            try:
                return resp.json()
            except JSONDecodeError:
                return {
                    "error": "Execution server returned invalid response format",
                    "details": resp.text[:500],
                }

        return last_error or {
            "error": "Execution server request failed",
            "details": "No reachable execution endpoint found",
        }
