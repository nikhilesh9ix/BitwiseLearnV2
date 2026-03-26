from typing import Any
from fastapi.responses import JSONResponse


def _to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _camel_keys(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {_to_camel(k): _camel_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_camel_keys(i) for i in obj]
    return obj


def api_response(
    status_code: int = 200,
    message: str = "Success",
    data: Any = None,
    error: Any = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "statusCode": status_code,
            "message": message,
            "data": _camel_keys(data) if data is not None else data,
            "error": error,
        },
    )
