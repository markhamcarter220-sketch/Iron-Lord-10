"""
Validated Odds Endpoint

Returns only validated, current odds from supported sportsbooks.

MVP LIMITATION: Only DraftKings supported initially.
"""

from fastapi import APIRouter, HTTPException, status, Query
from services.validated_odds import (
    get_validated_odds,
    OddsAPIError,
    OddsValidationError,
    SUPPORTED_SPORTSBOOKS
)

router = APIRouter(prefix="/api/odds", tags=["odds"])


@router.get("/{sport_key}")
def get_odds_for_sport(sport_key: str):
    """
    Get validated odds for a sport.

    Returns only:
    - Events with valid timestamps (< 60 seconds old)
    - Bookmakers in supported list (currently: DraftKings only)
    - Odds in valid range (> 1.0 decimal)
    - Head-to-head markets only (no spreads/totals in MVP)

    Args:
        sport_key: Sport identifier (e.g., 'americanfootball_nfl')

    Returns:
        Validated odds with timestamps and source attribution

    Raises:
        503: Odds API unavailable
        500: Validation error
    """
    try:
        validated = get_validated_odds(sport_key)

        return {
            "events": [event.dict() for event in validated.events],
            "retrieved_at": validated.retrieved_at.isoformat() + "Z",
            "api_requests_remaining": validated.api_requests_remaining,
            "api_requests_used": validated.api_requests_used,
            "source": validated.source,
            "supported_sportsbooks": list(SUPPORTED_SPORTSBOOKS.keys()),
            "max_odds_age_seconds": 60
        }

    except OddsAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Odds API unavailable",
                "message": str(e)
            }
        )

    except OddsValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Odds validation failed",
                "message": str(e)
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Unexpected error",
                "message": str(e)
            }
        )


@router.get("/sports/available")
def get_available_sports():
    """
    Get list of available sports from The Odds API.

    Note: Not all sports may have supported sportsbooks.
    """
    from services.odds_service import get_sports

    try:
        sports = get_sports()
        return {
            "sports": sports,
            "supported_sportsbooks": list(SUPPORTED_SPORTSBOOKS.keys()),
            "note": "Only events from supported sportsbooks will be returned"
        }

    except OddsAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Odds API unavailable",
                "message": str(e)
            }
        )
