from typing import Any
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ApiResponse(BaseModel):
    statusCode: int = 200
    message: str = "Success"
    data: Any = None
    error: Any = None
