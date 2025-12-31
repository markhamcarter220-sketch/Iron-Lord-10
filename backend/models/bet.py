
from pydantic import BaseModel, Field, validator
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
    calculation_breakdown: Optional[dict] = None

    @validator('odds')
    def validate_odds(cls, v):
        if v <= 1.0:
            raise ValueError('Odds must be greater than 1.0')
        if v > 1000:
            raise ValueError('Odds seem unrealistic (max 1000)')
        return v

    @validator('closing_odds')
    def validate_closing_odds(cls, v):
        if v is not None:
            if v <= 1.0:
                raise ValueError('Closing odds must be greater than 1.0')
            if v > 1000:
                raise ValueError('Closing odds seem unrealistic (max 1000)')
        return v

    @validator('stake')
    def validate_stake(cls, v):
        if v <= 0:
            raise ValueError('Stake must be positive')
        if v > 100000:
            raise ValueError('Stake seems unrealistic (max $100,000)')
        return v

    @validator('result')
    def validate_result(cls, v):
        if v is not None and v not in ['win', 'lose', 'push']:
            raise ValueError("Result must be 'win', 'lose', or 'push'")
        return v
