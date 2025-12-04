from fastapi import APIRouter
from models.bet import Bet
from services.bet_service import log_bet, fetch_bets
from models.responses import LoggedBetResponse, BetHistoryResponse

router = APIRouter(prefix="/api/bets", tags=["bets"])

@router.post("/log", response_model=LoggedBetResponse)
def log_bet_route(bet: Bet):
    result = log_bet(bet)
    return {"status": "logged", "bet": result}

@router.get("/history/{user}", response_model=BetHistoryResponse)
def get_history(user: str):
    return {"bets": fetch_bets(user)}
