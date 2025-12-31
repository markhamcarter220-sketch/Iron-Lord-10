
from fastapi import APIRouter, Request, HTTPException
from services.clv_service import generate_clv_report
import re

router = APIRouter(prefix="/api/clv", tags=["clv"])

def validate_username(username: str) -> str:
    """Validate username format to prevent injection attacks."""
    if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', username):
        raise HTTPException(
            status_code=400,
            detail="Invalid username format. Must be 3-20 alphanumeric characters, underscores, or hyphens."
        )
    return username

@router.get("/report")
def clv_report(user: str):
    validate_username(user)
    return generate_clv_report(user)
