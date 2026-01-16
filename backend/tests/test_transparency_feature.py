"""
Test for sportsbook transparency feature.

Verifies that odds_source_detail is properly included in EV results
when event/outcome/bookmaker details are provided.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from decimal import Decimal

from services.ev_calculator import calculate_straight_bet_ev


def test_transparency_with_full_details():
    """Test that odds_source_detail is included when details are provided."""
    print("\n" + "="*70)
    print("TRANSPARENCY FEATURE TEST: Full Sportsbook Details")
    print("="*70)

    odds_source_detail = {
        "event": "Kansas City Chiefs vs Buffalo Bills",
        "outcome": "Kansas City Chiefs",
        "bookmaker": "DraftKings",
        "api_source": "the-odds-api-v4"
    }

    result = calculate_straight_bet_ev(
        odds=Decimal('1.95'),
        true_probability=Decimal('0.55'),
        cash_stake=Decimal('100.00'),
        odds_timestamp=datetime.utcnow(),
        odds_source="the-odds-api-v4",
        odds_source_detail=odds_source_detail
    )

    print(f"\n✓ EV Result:")
    print(f"  Expected Value: ${result.ev_cash}")
    print(f"  Formula: {result.formula_used}")

    print(f"\n✓ Transparency Information:")
    assert result.odds_source_detail is not None, "odds_source_detail should be present"
    print(f"  Event: {result.odds_source_detail['event']}")
    print(f"  Betting On: {result.odds_source_detail['outcome']}")
    print(f"  Sportsbook: {result.odds_source_detail['bookmaker']}")
    print(f"  API Source: {result.odds_source_detail['api_source']}")

    # Verify all fields are correct
    assert result.odds_source_detail['event'] == "Kansas City Chiefs vs Buffalo Bills"
    assert result.odds_source_detail['outcome'] == "Kansas City Chiefs"
    assert result.odds_source_detail['bookmaker'] == "DraftKings"
    assert result.odds_source_detail['api_source'] == "the-odds-api-v4"

    print(f"\n✅ TRANSPARENCY FEATURE WORKING CORRECTLY")
    print("="*70)


def test_transparency_without_details():
    """Test that calculation works without transparency details (backward compatible)."""
    print("\n" + "="*70)
    print("TRANSPARENCY FEATURE TEST: Without Details (Backward Compatible)")
    print("="*70)

    result = calculate_straight_bet_ev(
        odds=Decimal('2.05'),
        true_probability=Decimal('0.52'),
        cash_stake=Decimal('100.00'),
        odds_timestamp=datetime.utcnow(),
        odds_source="the-odds-api-v4"
        # Note: No odds_source_detail provided
    )

    print(f"\n✓ EV Result:")
    print(f"  Expected Value: ${result.ev_cash}")

    print(f"\n✓ Transparency Information:")
    assert result.odds_source_detail is None, "odds_source_detail should be None when not provided"
    print(f"  odds_source_detail: None (not provided)")

    print(f"\n✅ BACKWARD COMPATIBILITY MAINTAINED")
    print("="*70)


if __name__ == "__main__":
    test_transparency_with_full_details()
    test_transparency_without_details()

    print("\n" + "="*70)
    print("✅ ALL TRANSPARENCY TESTS PASSED")
    print("="*70)
    print("\nFEATURE SUMMARY:")
    print("  ✓ Sportsbook transparency data properly tracked")
    print("  ✓ Event, outcome, and bookmaker details included")
    print("  ✓ Backward compatible (works without details)")
    print("  ✓ Frontend will display in expandable section")
    print("="*70)
