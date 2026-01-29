"""
Validated Odds Endpoint

Returns only validated, current odds from supported sportsbooks.
"""

from fastapi import APIRouter, HTTPException, status, Query
from services.validated_odds import (
    get_validated_odds,
    OddsAPIError,
    OddsValidationError,
    SUPPORTED_SPORTSBOOKS
)
from services.odds_service import get_player_props
from config.sports import SUPPORTED_SPORTS, get_sports_by_category

router = APIRouter(prefix="/api/odds", tags=["odds"])


@router.get("/{sport_key}")
def get_odds_for_sport(sport_key: str):
    """
    Get validated odds for a sport.

    Returns only:
    - Events with valid timestamps (< 30 minutes old)
    - Bookmakers in supported list (12 major US sportsbooks)
    - Odds in valid range (> 1.0 decimal)
    - Multiple markets: h2h (moneyline), spreads, totals

    Args:
        sport_key: Sport identifier (e.g., 'americanfootball_nfl')

    Returns:
        Validated odds with timestamps and source attribution including:
        - h2h (moneyline) markets
        - spreads markets (with point values)
        - totals markets (over/under with point values)

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
            "max_odds_age_seconds": 1800
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
    Get list of supported sports with categories.

    Returns sports grouped by category (NFL, NBA, Soccer, etc.)
    """
    return {
        "sports": SUPPORTED_SPORTS,
        "by_category": get_sports_by_category(),
        "supported_sportsbooks": list(SUPPORTED_SPORTSBOOKS.values()),
        "total_sports": len(SUPPORTED_SPORTS),
        "total_sportsbooks": len(SUPPORTED_SPORTSBOOKS)
    }


@router.get("/{sport_key}/player-props")
def get_player_props_for_sport(sport_key: str, event_id: str = Query(None)):
    """
    Get player prop odds for a sport.

    Player props include:
    - Player points
    - Player rebounds
    - Player assists
    - Player touchdowns
    - Player rushing yards
    - Player receptions

    Args:
        sport_key: Sport identifier (e.g., 'basketball_nba')
        event_id: Optional specific event ID to get props for

    Returns:
        Player prop odds with timestamps

    Raises:
        503: Odds API unavailable
        500: Unexpected error
    """
    try:
        result = get_player_props(sport_key, event_id)

        return {
            "data": result["data"],
            "retrieved_at": result["retrieved_at"],
            "api_requests_remaining": result["meta"].get("x-requests-remaining"),
            "api_requests_used": result["meta"].get("x-requests-used"),
            "source": "the-odds-api-v4"
        }

    except OddsAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Odds API unavailable",
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
