from fastapi import APIRouter
from models.bet import Bet
from services.bet_service import log_bet, fetch_bets
from models.responses import LoggedBetResponse, BetHistoryResponse
from utils.validation import validate_username

router = APIRouter(prefix="/api/bets", tags=["bets"])

@router.post("/log", response_model=LoggedBetResponse)
def log_bet_route(bet: Bet):
    validate_username(bet.user)
    result = log_bet(bet)
    return {"status": "logged", "bet": result}

@router.get("/history/{user}", response_model=BetHistoryResponse)
def get_history(user: str):
    validate_username(user)
    return {"bets": fetch_bets(user)}
