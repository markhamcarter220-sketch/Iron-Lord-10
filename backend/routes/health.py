from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health():
    """
    Health check endpoint.

    Returns system status and supported features.
    """
    return {
        "status": "healthy",
        "version": "0.1.0-mvp",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "features_enabled": {
            "straight_cash_bets": True,
            "ev_calculation": True,
            "live_odds": True,
            "odds_validation": True,
            "timestamp_staleness_check": True
        },
        "features_disabled": {
            "bonus_bets": "Not implemented - requires sportsbook policy database",
            "matched_betting": "Not implemented - requires dual-book support",
            "insurance": "Not implemented - requires sportsbook policy database",
            "hedging": "Not implemented",
            "parlays": "Not implemented",
            "kelly_calculator": "Removed - was using incorrect probability source",
            "clv_tracking": "Disabled - not part of MVP",
            "devig_odds": "Disabled - not part of MVP"
        },
        "constraints": {
            "max_odds_age_seconds": 60,
            "supported_sportsbooks": ["draftkings"],
            "supported_markets": ["h2h"],
            "odds_format": "decimal"
        },
        "warnings": [
            "This is an MVP version",
            "EV calculations require YOUR probability estimate",
            "Only cash bets are supported",
            "Odds must be refreshed within 60 seconds"
        ]
    }
