"""
Expected Value Calculator - Mathematically Correct Implementation

This module implements ONLY what is proven correct:
- Straight cash bets (no bonus, no insurance, no hedging)

CRITICAL CONSTRAINT:
Uses USER'S true probability estimate, NOT implied probability from odds.

Formula: EV = stake × (P × O - 1)
Where:
  - P = User's true probability (0 < P < 1)
  - O = Decimal odds (O > 1.0)
  - stake = Cash wagered (stake > 0)
"""

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field, validator


class EVCalculationError(Exception):
    """Raised when EV cannot be calculated safely"""
    pass


class InvalidProbabilityError(EVCalculationError):
    """Probability must be in range (0, 1)"""
    pass


class InvalidOddsError(EVCalculationError):
    """Odds must be > 1.0"""
    pass


class InvalidStakeError(EVCalculationError):
    """Stake must be > 0"""
    pass


class StaleDataError(EVCalculationError):
    """Odds data is too old"""
    pass


class EVInput(BaseModel):
    """
    Input validation for EV calculation.

    All inputs are required and must pass validation.
    No defaults, no assumptions.
    """
    odds: Decimal = Field(
        ...,
        description="Decimal odds (e.g., 2.05). Must be > 1.0",
        gt=Decimal('1.0')
    )
    true_probability: Decimal = Field(
        ...,
        description="User's estimated probability that bet wins (0-1 exclusive)",
        gt=Decimal('0'),
        lt=Decimal('1')
    )
    cash_stake: Decimal = Field(
        ...,
        description="Amount of cash wagered. Must be > 0",
        gt=Decimal('0')
    )
    odds_timestamp: datetime = Field(
        ...,
        description="When these odds were retrieved from API"
    )
    odds_source: str = Field(
        ...,
        description="Source of odds (e.g., 'the-odds-api-v4')"
    )

    @validator('odds_timestamp')
    def validate_timestamp_not_future(cls, v):
        if v > datetime.utcnow():
            raise ValueError("Odds timestamp cannot be in the future")
        return v

    class Config:
        # Use Decimal for precise financial calculations
        json_encoders = {
            Decimal: lambda v: float(v)
        }


class EVResult(BaseModel):
    """
    Result of EV calculation.

    Includes full provenance: inputs, formula, timestamps, warnings.
    """
    ev_cash: Decimal = Field(
        ...,
        description="Expected value in cash (can be negative)"
    )
    formula_used: str = Field(
        default="EV = stake × (P × O - 1)",
        description="Mathematical formula used"
    )
    inputs: dict = Field(
        ...,
        description="All inputs used in calculation (for transparency)"
    )
    calculation_timestamp: datetime = Field(
        ...,
        description="When this calculation was performed"
    )
    odds_timestamp: datetime = Field(
        ...,
        description="When the odds were retrieved"
    )
    odds_age_seconds: int = Field(
        ...,
        description="Age of odds at time of calculation"
    )
    odds_source: str = Field(
        ...,
        description="Where odds came from"
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Any warnings about this calculation"
    )
    excluded_features: list[str] = Field(
        default=[
            "bonus_bets",
            "matched_betting",
            "insurance",
            "hedging",
            "parlays"
        ],
        description="Features not supported in this calculation"
    )

    class Config:
        json_encoders = {
            Decimal: lambda v: round(float(v), 2),
            datetime: lambda v: v.isoformat()
        }


def calculate_straight_bet_ev(
    odds: Decimal,
    true_probability: Decimal,
    cash_stake: Decimal,
    odds_timestamp: datetime,
    odds_source: str,
    max_odds_age_seconds: int = 60
) -> EVResult:
    """
    Calculate Expected Value for a straight cash bet.

    CRITICAL: This uses the USER'S probability estimate, NOT implied probability.

    Formula: EV = stake × (P × O - 1)

    Args:
        odds: Decimal odds (must be > 1.0)
        true_probability: User's probability estimate (must be in (0,1))
        cash_stake: Amount wagered (must be > 0)
        odds_timestamp: When odds were retrieved
        odds_source: API source identifier
        max_odds_age_seconds: Maximum acceptable odds age (default 60)

    Returns:
        EVResult with full calculation provenance

    Raises:
        InvalidOddsError: If odds <= 1.0
        InvalidProbabilityError: If probability not in (0,1)
        InvalidStakeError: If stake <= 0
        StaleDataError: If odds too old
        EVCalculationError: If calculation fails for any reason
    """
    calculation_time = datetime.utcnow()

    # Validate odds age FIRST (most likely to fail in production)
    odds_age = (calculation_time - odds_timestamp).total_seconds()
    if odds_age > max_odds_age_seconds:
        raise StaleDataError(
            f"Odds are {odds_age:.0f} seconds old. "
            f"Maximum allowed age is {max_odds_age_seconds} seconds. "
            f"Please refresh odds before calculating EV."
        )

    # Validate inputs (Pydantic handles this, but explicit checks for clarity)
    if odds <= Decimal('1.0'):
        raise InvalidOddsError(
            f"Odds must be greater than 1.0, got {odds}. "
            f"Decimal odds of 1.0 or less are invalid."
        )

    if not (Decimal('0') < true_probability < Decimal('1')):
        raise InvalidProbabilityError(
            f"Probability must be between 0 and 1 (exclusive), got {true_probability}. "
            f"Example: 52% = 0.52"
        )

    if cash_stake <= Decimal('0'):
        raise InvalidStakeError(
            f"Stake must be greater than 0, got {cash_stake}"
        )

    # Perform calculation
    # EV = stake × (P × O - 1)
    try:
        ev = cash_stake * (true_probability * odds - Decimal('1'))
    except (InvalidOperation, OverflowError, ZeroDivisionError) as e:
        raise EVCalculationError(f"Calculation failed: {e}")

    # Build warnings
    warnings = []
    if odds_age > 30:
        warnings.append(
            f"Odds are {odds_age:.0f} seconds old. "
            f"Consider refreshing for more current data."
        )

    # Build result with full provenance
    return EVResult(
        ev_cash=ev.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),  # Round to cents
        formula_used="EV = stake × (P × O - 1)",
        inputs={
            "odds": float(odds),
            "true_probability": float(true_probability),
            "cash_stake": float(cash_stake)
        },
        calculation_timestamp=calculation_time,
        odds_timestamp=odds_timestamp,
        odds_age_seconds=int(odds_age),
        odds_source=odds_source,
        warnings=warnings
    )


def validate_ev_input(data: dict) -> EVInput:
    """
    Validate input data for EV calculation.

    Returns validated EVInput object.
    Raises ValidationError with specific message if invalid.
    """
    try:
        return EVInput(**data)
    except Exception as e:
        # Re-raise with clearer context
        raise EVCalculationError(f"Invalid input: {e}")
