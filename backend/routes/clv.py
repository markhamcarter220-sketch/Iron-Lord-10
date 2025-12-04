
from fastapi import APIRouter, Request
from services.clv_service import generate_clv_report

router = APIRouter(prefix="/api/clv", tags=["clv"])

@router.get("/report")
def clv_report(user: str):
    return generate_clv_report(user)
