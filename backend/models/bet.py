
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Bet(BaseModel):
    user: str
    matchup: str
    sportsbook: str
    sport: str
    odds: float
    stake: float
    closing_odds: Optional[float] = None
    result: Optional[str] = None  # 'win', 'lose', 'push', or None
    loggedAt: datetime = Field(default_factory=datetime.utcnow)
    kellySize: Optional[float] = None
    expectedValue: Optional[float] = None
