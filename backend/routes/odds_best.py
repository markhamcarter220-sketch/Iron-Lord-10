from fastapi import APIRouter, Query
from services.odds_service import get_best_lines
from models.responses import BestLine

router = APIRouter(prefix="/api/odds", tags=["odds"])

@router.get("/best", response_model=list[BestLine])
def best_lines(sport_key: str = Query(...), market: str = Query("h2h")):
    return get_best_lines(sport_key, market)
