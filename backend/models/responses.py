from pydantic import BaseModel
from typing import List

class LoggedBetResponse(BaseModel):
    status: str
    bet: dict

class BetHistoryResponse(BaseModel):
    bets: List[dict]

class BestLine(BaseModel):
    matchup: str
    best_home: dict
    best_away: dict
    market: str


class CLVReport(BaseModel):
    user: str
    total_bets: int
    avg_clv: float
    clv_positive_rate: float
    max_clv: float
    min_clv: float
    positive_bets: int
    negative_bets: int
