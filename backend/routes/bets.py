from fastapi import APIRouter, HTTPException
from models.bet import Bet
from services.bet_service import log_bet, fetch_bets
from models.responses import LoggedBetResponse, BetHistoryResponse
import re

router = APIRouter(prefix="/api/bets", tags=["bets"])

def validate_username(username: str) -> str:
    """Validate username format to prevent injection attacks."""
    if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', username):
        raise HTTPException(
            status_code=400,
            detail="Invalid username format. Must be 3-20 alphanumeric characters, underscores, or hyphens."
        )
    return username

@router.post("/log", response_model=LoggedBetResponse)
def log_bet_route(bet: Bet):
    validate_username(bet.user)
    result = log_bet(bet)
    return {"status": "logged", "bet": result}

@router.get("/history/{user}", response_model=BetHistoryResponse)
def get_history(user: str):
    validate_username(user)
    return {"bets": fetch_bets(user)}
