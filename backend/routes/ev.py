"""
EV Calculation Endpoint

Provides mathematically correct Expected Value calculations.

ONLY SUPPORTS: Straight cash bets (no bonus, no insurance, no hedging)
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional

from services.ev_calculator import (
    calculate_straight_bet_ev,
    validate_ev_input,
    EVCalculationError,
    InvalidProbabilityError,
    InvalidOddsError,
    InvalidStakeError,
    StaleDataError
)

router = APIRouter(prefix="/api/ev", tags=["ev"])


class EVRequest(BaseModel):
    """Request body for EV calculation"""
    odds: float = Field(
        ...,
        description="Decimal odds (e.g., 2.05). Must be > 1.0",
        gt=1.0,
        example=2.05
    )
    true_probability: float = Field(
        ...,
        description="YOUR estimated probability that bet wins (0-1). Example: 0.52 for 52%",
        gt=0.0,
        lt=1.0,
        example=0.52
    )
    cash_stake: float = Field(
        ...,
        description="Amount of cash you're wagering",
        gt=0.0,
        example=100.00
    )
    odds_timestamp: str = Field(
        ...,
        description="ISO 8601 timestamp of when odds were retrieved",
        example="2025-12-31T18:30:00Z"
    )
    odds_source: str = Field(
        ...,
        description="Source of odds data",
        example="the-odds-api-v4"
    )


@router.post("/calculate", status_code=status.HTTP_200_OK)
def calculate_ev(request: EVRequest):
    """
    Calculate Expected Value for a straight cash bet.

    CRITICAL NOTES:
    - Uses YOUR probability estimate, not market implied probability
    - Only supports cash bets (no bonus funds)
    - Odds must be less than 60 seconds old
    - Does NOT account for: bonuses, insurance, hedging, parlays

    Returns:
        EVResult with full calculation provenance

    Raises:
        422: Invalid input (bad probability, odds, stake, or stale timestamp)
        500: Calculation error
    """
    try:
        # Parse timestamp
        try:
            odds_ts = datetime.fromisoformat(request.odds_timestamp.replace('Z', '+00:00'))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error": "Invalid timestamp format",
                    "message": str(e),
                    "expected_format": "ISO 8601 (e.g., 2025-12-31T18:30:00Z)"
                }
            )

        # Calculate EV
        result = calculate_straight_bet_ev(
            odds=Decimal(str(request.odds)),
            true_probability=Decimal(str(request.true_probability)),
            cash_stake=Decimal(str(request.cash_stake)),
            odds_timestamp=odds_ts,
            odds_source=request.odds_source,
            max_odds_age_seconds=60
        )

        return result

    except StaleDataError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Odds too old",
                "message": str(e),
                "max_age_seconds": 60
            }
        )

    except InvalidProbabilityError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Invalid probability",
                "message": str(e),
                "valid_range": "0 < probability < 1 (exclusive)"
            }
        )

    except InvalidOddsError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Invalid odds",
                "message": str(e),
                "requirement": "Odds must be > 1.0 (decimal format)"
            }
        )

    except InvalidStakeError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Invalid stake",
                "message": str(e),
                "requirement": "Stake must be > 0"
            }
        )

    except EVCalculationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Calculation failed",
                "message": str(e)
            }
        )

    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Unexpected error",
                "message": str(e)
            }
        )


@router.get("/health")
def ev_health():
    """
    Health check for EV calculation service.

    Returns supported features and limitations.
    """
    return {
        "status": "healthy",
        "features_supported": [
            "straight_cash_bets"
        ],
        "features_not_supported": [
            "bonus_bets",
            "matched_betting",
            "insurance",
            "hedging",
            "parlays",
            "teasers",
            "same_game_parlays"
        ],
        "max_odds_age_seconds": 60,
        "formula": "EV = stake × (P × O - 1)",
        "probability_source": "user_provided"
    }
