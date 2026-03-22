import httpx
from json import JSONDecodeError
from config import get_settings
from enums import Languages

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

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{settings.CODE_EXECUTION_SERVER}api/v2/execute",
                json=payload,
            )
        except httpx.HTTPError as exc:
            return {"error": f"Execution server request failed: {exc}"}

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
