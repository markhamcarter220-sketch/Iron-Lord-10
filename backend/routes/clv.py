
from fastapi import APIRouter
from services.clv_service import generate_clv_report
from utils.validation import validate_username

router = APIRouter(prefix="/api/clv", tags=["clv"])

@router.get("/report")
def clv_report(user: str):
    validate_username(user)
    return generate_clv_report(user)
