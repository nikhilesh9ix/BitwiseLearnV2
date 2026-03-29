from fastapi import APIRouter
from pydantic import BaseModel
from shared.utils.api_response import api_response
from shared.services.email import send_contact_email

router = APIRouter(prefix="/api/v1/contact", tags=["Contact"])


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str


@router.post("")
async def send_contact(body: ContactRequest):
    try:
        send_contact_email(body.name, body.email, body.message)
        return api_response(200, "Message sent successfully")
    except Exception as e:
        return api_response(500, "Failed to send message", error=str(e))
