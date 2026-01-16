"""
Unit Tests for EV Calculator

Tests the mathematically correct EV calculation engine.

CRITICAL: These tests MUST pass before deployment.
If any test fails, the product would lie to users.
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta

from services.ev_calculator import (
    calculate_straight_bet_ev,
    validate_ev_input,
    EVInput,
    EVResult,
    InvalidProbabilityError,
    InvalidOddsError,
    InvalidStakeError,
    StaleDataError,
    EVCalculationError
)


class TestEVCalculationCorrectness:
    """Test that EV calculations are mathematically correct"""

    def test_positive_ev_calculation(self):
        """Test +EV scenario: User has edge"""
        # User estimates 52% chance, market offers 2.05 odds
        # True prob = 0.52, Decimal odds = 2.05
        # EV = 100 * (0.52 * 2.05 - 1) = 100 * (1.066 - 1) = 6.60

        result = calculate_straight_bet_ev(
            odds=Decimal('2.05'),
            true_probability=Decimal('0.52'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert result.ev_cash == Decimal('6.60')
        assert result.formula_used == "EV = stake × (P × O - 1)"

    def test_negative_ev_calculation(self):
        """Test -EV scenario: Market has edge"""
        # User estimates 45% chance, market offers 2.00 odds
        # EV = 100 * (0.45 * 2.00 - 1) = 100 * (0.90 - 1) = -10.00

        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.45'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert result.ev_cash == Decimal('-10.00')

    def test_zero_ev_calculation(self):
        """Test fair bet: EV = 0"""
        # User estimates 50% chance, market offers 2.00 odds
        # EV = 100 * (0.50 * 2.00 - 1) = 100 * 0 = 0

        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.50'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert result.ev_cash == Decimal('0.00')

    def test_small_stake_calculation(self):
        """Test with small stake (decimal precision)"""
        # Stake = $10, P = 0.55, O = 1.91
        # EV = 10 * (0.55 * 1.91 - 1) = 10 * 0.0505 = 0.505 → 0.51

        result = calculate_straight_bet_ev(
            odds=Decimal('1.91'),
            true_probability=Decimal('0.55'),
            cash_stake=Decimal('10.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # Should round to nearest cent
        assert result.ev_cash == Decimal('0.51')

    def test_large_stake_calculation(self):
        """Test with large stake"""
        # Stake = $10,000, P = 0.51, O = 2.10
        # EV = 10000 * (0.51 * 2.10 - 1) = 10000 * 0.071 = 710.00

        result = calculate_straight_bet_ev(
            odds=Decimal('2.10'),
            true_probability=Decimal('0.51'),
            cash_stake=Decimal('10000.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert result.ev_cash == Decimal('710.00')


class TestBoundaryConditions:
    """Test edge cases and boundary values"""

    def test_minimum_valid_probability(self):
        """Test with probability just above 0"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.01'),  # 1%
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.01 * 2.00 - 1) = 100 * -0.98 = -98.00
        assert result.ev_cash == Decimal('-98.00')

    def test_maximum_valid_probability(self):
        """Test with probability just below 1"""
        result = calculate_straight_bet_ev(
            odds=Decimal('1.05'),
            true_probability=Decimal('0.99'),  # 99%
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.99 * 1.05 - 1) = 100 * 0.0395 = 3.95
        assert result.ev_cash == Decimal('3.95')

    def test_minimum_valid_odds(self):
        """Test with odds just above 1.0"""
        result = calculate_straight_bet_ev(
            odds=Decimal('1.01'),
            true_probability=Decimal('0.99'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.99 * 1.01 - 1) = 100 * -0.0001 = -0.01
        assert result.ev_cash == Decimal('-0.01')

    def test_very_high_odds(self):
        """Test with high underdog odds"""
        result = calculate_straight_bet_ev(
            odds=Decimal('50.00'),  # 50-to-1 underdog
            true_probability=Decimal('0.03'),  # User thinks 3% chance
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.03 * 50.00 - 1) = 100 * 0.50 = 50.00
        assert result.ev_cash == Decimal('50.00')

    def test_fractional_cent_rounding(self):
        """Test that rounding to cents works correctly"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.33'),
            true_probability=Decimal('0.47'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.47 * 2.33 - 1) = 100 * 0.0951 = 9.51
        assert result.ev_cash == Decimal('9.51')


class TestInputValidation:
    """Test that invalid inputs are rejected"""

    def test_probability_zero_rejected(self):
        """Probability of 0 is invalid"""
        with pytest.raises(InvalidProbabilityError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('0'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_probability_one_rejected(self):
        """Probability of 1 is invalid"""
        with pytest.raises(InvalidProbabilityError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('1'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_probability_above_one_rejected(self):
        """Probability > 1 is invalid"""
        with pytest.raises(InvalidProbabilityError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('1.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_probability_negative_rejected(self):
        """Negative probability is invalid"""
        with pytest.raises(InvalidProbabilityError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('-0.1'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_odds_one_rejected(self):
        """Odds of 1.0 are invalid"""
        with pytest.raises(InvalidOddsError):
            calculate_straight_bet_ev(
                odds=Decimal('1.00'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_odds_below_one_rejected(self):
        """Odds < 1.0 are invalid"""
        with pytest.raises(InvalidOddsError):
            calculate_straight_bet_ev(
                odds=Decimal('0.95'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_odds_zero_rejected(self):
        """Odds of 0 are invalid"""
        with pytest.raises(InvalidOddsError):
            calculate_straight_bet_ev(
                odds=Decimal('0'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_odds_negative_rejected(self):
        """Negative odds are invalid"""
        with pytest.raises(InvalidOddsError):
            calculate_straight_bet_ev(
                odds=Decimal('-1.50'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_stake_zero_rejected(self):
        """Zero stake is invalid"""
        with pytest.raises(InvalidStakeError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('0'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )

    def test_stake_negative_rejected(self):
        """Negative stake is invalid"""
        with pytest.raises(InvalidStakeError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('-100.00'),
                odds_timestamp=datetime.utcnow(),
                odds_source="test"
            )


class TestTimestampValidation:
    """Test that stale odds are rejected"""

    def test_fresh_odds_accepted(self):
        """Odds < 30 seconds old have no warnings"""
        fresh_timestamp = datetime.utcnow() - timedelta(seconds=25)

        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=fresh_timestamp,
            odds_source="test"
        )

        assert result.odds_age_seconds >= 25
        assert result.odds_age_seconds < 30  # Some execution time
        assert len(result.warnings) == 0  # No warning for < 30s

    def test_warning_for_thirty_second_old_odds(self):
        """Odds 30-60 seconds old get warning but accepted"""
        old_timestamp = datetime.utcnow() - timedelta(seconds=45)

        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=old_timestamp,
            odds_source="test"
        )

        assert result.odds_age_seconds >= 45
        assert len(result.warnings) > 0
        assert "seconds old" in result.warnings[0]

    def test_stale_odds_rejected(self):
        """Odds > 60 seconds old are rejected"""
        stale_timestamp = datetime.utcnow() - timedelta(seconds=75)

        with pytest.raises(StaleDataError) as exc_info:
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=stale_timestamp,
                odds_source="test"
            )

        assert "75 seconds old" in str(exc_info.value)
        assert "60 seconds" in str(exc_info.value)

    def test_exactly_sixty_seconds_rejected(self):
        """Odds exactly 60 seconds old are rejected"""
        sixty_sec_old = datetime.utcnow() - timedelta(seconds=60)

        with pytest.raises(StaleDataError):
            calculate_straight_bet_ev(
                odds=Decimal('2.00'),
                true_probability=Decimal('0.5'),
                cash_stake=Decimal('100.00'),
                odds_timestamp=sixty_sec_old,
                odds_source="test"
            )

    def test_future_timestamp_rejected(self):
        """Future timestamps are invalid"""
        # This should be caught by Pydantic validator
        future_timestamp = datetime.utcnow() + timedelta(seconds=30)

        with pytest.raises((ValueError, EVCalculationError)):
            validate_ev_input({
                "odds": 2.00,
                "true_probability": 0.5,
                "cash_stake": 100.00,
                "odds_timestamp": future_timestamp.isoformat() + "Z",
                "odds_source": "test"
            })


class TestResultProvenance:
    """Test that results include complete provenance"""

    def test_result_includes_inputs(self):
        """Result must include all inputs"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.05'),
            true_probability=Decimal('0.52'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test-api"
        )

        assert result.inputs["odds"] == 2.05
        assert result.inputs["true_probability"] == 0.52
        assert result.inputs["cash_stake"] == 100.00

    def test_result_includes_formula(self):
        """Result must include formula used"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert result.formula_used == "EV = stake × (P × O - 1)"

    def test_result_includes_timestamps(self):
        """Result must include both timestamps"""
        odds_ts = datetime.utcnow() - timedelta(seconds=15)

        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=odds_ts,
            odds_source="test"
        )

        assert result.odds_timestamp == odds_ts
        assert result.calculation_timestamp is not None
        assert result.odds_age_seconds >= 15

    def test_result_includes_source(self):
        """Result must include odds source"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="the-odds-api-v4"
        )

        assert result.odds_source == "the-odds-api-v4"

    def test_result_includes_excluded_features(self):
        """Result must list excluded features"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.00'),
            true_probability=Decimal('0.5'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        assert "bonus_bets" in result.excluded_features
        assert "matched_betting" in result.excluded_features
        assert "insurance" in result.excluded_features
        assert "hedging" in result.excluded_features
        assert "parlays" in result.excluded_features


class TestDecimalPrecision:
    """Test that decimal precision is maintained"""

    def test_no_floating_point_errors(self):
        """Ensure decimal precision, not float errors"""
        # Classic float error case: 0.1 + 0.2 != 0.3
        # With Decimal this should be exact

        result = calculate_straight_bet_ev(
            odds=Decimal('2.10'),
            true_probability=Decimal('0.52'),
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.52 * 2.10 - 1) = 100 * 0.092 = 9.20
        # Should be exact, not 9.199999999 or 9.200000001
        assert result.ev_cash == Decimal('9.20')

    def test_three_decimal_probability(self):
        """Test with probability to 3 decimal places"""
        result = calculate_straight_bet_ev(
            odds=Decimal('1.95'),
            true_probability=Decimal('0.525'),  # 52.5%
            cash_stake=Decimal('100.00'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 100 * (0.525 * 1.95 - 1) = 100 * 0.02375 = 2.375 → 2.38
        assert result.ev_cash == Decimal('2.38')

    def test_many_decimal_places_in_calculation(self):
        """Test that intermediate precision is maintained"""
        result = calculate_straight_bet_ev(
            odds=Decimal('2.37'),
            true_probability=Decimal('0.479'),
            cash_stake=Decimal('123.45'),
            odds_timestamp=datetime.utcnow(),
            odds_source="test"
        )

        # EV = 123.45 * (0.479 * 2.37 - 1)
        # = 123.45 * (1.13523 - 1)
        # = 123.45 * 0.13523
        # = 16.69466... → 16.69
        assert result.ev_cash == Decimal('16.69')
