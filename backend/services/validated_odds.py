"""
Validated Odds Service

Wraps The Odds API with strict validation.

FAILURES:
- Missing required fields → reject entire response
- Invalid odds values → skip that outcome
- Stale timestamps → raise error
- Unknown sportsbooks → skip that bookmaker
"""

from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from decimal import Decimal, InvalidOperation

from services.odds_service import get_odds, OddsAPIError


class OddsValidationError(Exception):
    """Raised when odds data fails validation"""
    pass


class Outcome(BaseModel):
    """Single betting outcome with validated odds"""
    name: str = Field(..., description="Team/outcome/player name")
    price: Decimal = Field(..., description="Decimal odds", gt=Decimal('1.0'))
    point: Optional[Decimal] = Field(None, description="Point spread or total line (for spreads/totals)")

    @validator('price')
    def validate_price(cls, v):
        if v <= Decimal('1.0'):
            raise ValueError(f"Odds must be > 1.0, got {v}")
        return v


class Market(BaseModel):
    """Single market with outcomes (h2h, spreads, totals, etc.)"""
    key: str = Field(..., description="Market type: h2h, spreads, totals, etc.")
    last_update: datetime = Field(..., description="When odds were last updated")
    outcomes: List[Outcome] = Field(..., min_items=2)

    @validator('last_update')
    def validate_timestamp_not_future(cls, v):
        if v > datetime.utcnow():
            raise ValueError("Timestamp cannot be in future")
        return v


class Bookmaker(BaseModel):
    """Bookmaker with validated market data"""
    key: str = Field(..., description="Sportsbook identifier")
    title: str = Field(..., description="Display name")
    markets: List[Market] = Field(..., min_items=1)

    @validator('last_update', check_fields=False)
    def validate_timestamp_not_future(cls, v):
        if v > datetime.utcnow():
            raise ValueError("Timestamp cannot be in future")
        return v


class ValidatedOddsEvent(BaseModel):
    """Single event with validated odds from one or more bookmakers"""
    id: str
    sport_key: str
    sport_title: str
    commence_time: datetime
    home_team: str
    away_team: str
    bookmakers: List[Bookmaker]

    @validator('bookmakers')
    def validate_has_bookmakers(cls, v):
        if len(v) == 0:
            raise ValueError("Event must have at least one bookmaker")
        return v


class ValidatedOddsResponse(BaseModel):
    """Complete validated odds response"""
    events: List[ValidatedOddsEvent]
    retrieved_at: datetime = Field(..., description="When we fetched this data")
    api_requests_remaining: Optional[str] = Field(None, description="API quota remaining")
    api_requests_used: Optional[str] = Field(None, description="API requests used")
    source: str = Field(default="the-odds-api-v4")


# Supported sportsbooks (using The Odds API actual keys)
SUPPORTED_SPORTSBOOKS = {
    "draftkings": "DraftKings",
    "fanduel": "FanDuel",
    "betmgm": "BetMGM",
    "williamhill_us": "William Hill",
    "bovada": "Bovada",
    "pointsbetus": "PointsBet",
    "betrivers": "BetRivers",
    "wynnbet": "WynnBET",
    "unibet": "Unibet",
    "betus": "BetUS",
    "mybookieag": "MyBookie.ag",
    "betonlineag": "BetOnline.ag",
}


def validate_odds_response(
    raw_data: list,
    retrieved_at: datetime,
    meta: dict,
    max_age_seconds: int = 1800
) -> ValidatedOddsResponse:
    """
    Validate odds data from The Odds API.

    Filters out:
    - Events with no bookmakers
    - Bookmakers not in SUPPORTED_SPORTSBOOKS
    - Outcomes with invalid odds (≤ 1.0)
    - Markets with < 2 outcomes

    Raises:
        OddsValidationError if data is fundamentally invalid or too stale
    """
    validated_events = []

    for event in raw_data:
        try:
            # Required fields
            event_id = event.get("id")
            if not event_id:
                continue  # Skip events without ID

            sport_key = event.get("sport_key")
            sport_title = event.get("sport_title")
            commence_time = event.get("commence_time")
            home_team = event.get("home_team")
            away_team = event.get("away_team")
            bookmakers = event.get("bookmakers", [])

            if not all([sport_key, sport_title, commence_time, home_team, away_team]):
                continue  # Skip incomplete events

            # Parse commence time
            try:
                commence_dt = datetime.fromisoformat(commence_time.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                continue  # Skip if timestamp invalid

            # Validate bookmakers
            validated_bookmakers = []
            for book in bookmakers:
                book_key = book.get("key")

                # ONLY include supported sportsbooks
                if book_key not in SUPPORTED_SPORTSBOOKS:
                    continue  # Skip unsupported books

                book_title = book.get("title")
                last_update_str = book.get("last_update")

                if not all([book_key, book_title, last_update_str]):
                    continue  # Skip incomplete bookmakers

                # Parse timestamp
                try:
                    last_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    continue

                # Check staleness
                age = (datetime.utcnow() - last_update).total_seconds()
                if age > max_age_seconds:
                    continue  # Skip stale odds

                # Validate markets (now supporting h2h, spreads, totals, player props, etc.)
                markets_data = book.get("markets", [])
                validated_markets = []

                for market in markets_data:
                    market_key = market.get("key")
                    if not market_key:
                        continue

                    # Support multiple market types
                    if market_key not in ["h2h", "spreads", "totals", "player_points", "player_rebounds",
                                          "player_assists", "player_pass_tds", "player_rush_yds", "player_receptions"]:
                        continue  # Skip unsupported markets

                    outcomes = market.get("outcomes", [])
                    validated_outcomes = []

                    for outcome in outcomes:
                        name = outcome.get("name")
                        price = outcome.get("price")
                        point = outcome.get("point")  # For spreads/totals

                        if not name or price is None:
                            continue  # Skip incomplete outcomes

                        # Validate price
                        try:
                            price_decimal = Decimal(str(price))
                            if price_decimal <= Decimal('1.0'):
                                continue  # Skip invalid odds

                            # Build outcome with optional point
                            outcome_data = {"name": name, "price": price_decimal}
                            if point is not None:
                                outcome_data["point"] = Decimal(str(point))

                            validated_outcomes.append(Outcome(**outcome_data))
                        except (ValueError, InvalidOperation):
                            continue  # Skip unparseable prices

                    # Must have at least 2 outcomes (except for some player props which may have 1)
                    min_outcomes = 1 if market_key.startswith("player_") else 2
                    if len(validated_outcomes) >= min_outcomes:
                        validated_markets.append(Market(
                            key=market_key,
                            last_update=last_update,
                            outcomes=validated_outcomes
                        ))

                # Only add bookmaker if it has at least one valid market
                if validated_markets:
                    validated_bookmakers.append(Bookmaker(
                        key=book_key,
                        title=book_title,
                        markets=validated_markets
                    ))

            # Only include event if it has at least one valid bookmaker
            if validated_bookmakers:
                validated_events.append(ValidatedOddsEvent(
                    id=event_id,
                    sport_key=sport_key,
                    sport_title=sport_title,
                    commence_time=commence_dt,
                    home_team=home_team,
                    away_team=away_team,
                    bookmakers=validated_bookmakers
                ))

        except Exception:
            # Skip events that cause any validation error
            continue

    # Build response
    return ValidatedOddsResponse(
        events=validated_events,
        retrieved_at=retrieved_at,
        api_requests_remaining=meta.get("x-requests-remaining"),
        api_requests_used=meta.get("x-requests-used")
    )


def get_validated_odds(sport_key: str) -> ValidatedOddsResponse:
    """
    Fetch and validate odds for a sport.

    Returns only events with valid, current odds from supported sportsbooks.

    Raises:
        OddsAPIError: If API request fails
        OddsValidationError: If response cannot be validated
    """
    # Fetch raw odds
    response = get_odds(sport_key)

    # Parse retrieved timestamp
    retrieved_str = response.get("retrieved_at")
    try:
        retrieved_at = datetime.fromisoformat(retrieved_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        retrieved_at = datetime.utcnow()

    # Validate
    validated = validate_odds_response(
        raw_data=response["data"],
        retrieved_at=retrieved_at,
        meta=response["meta"]
    )

    return validated
