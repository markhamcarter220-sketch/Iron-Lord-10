
from db.mongo import get_bets_collection
from models.bet import Bet
from datetime import datetime
import uuid

def log_bet(bet: Bet):
    # Compute closing line value
    clv = round((bet.odds - bet.closing_odds) / abs(bet.closing_odds), 3) if bet.closing_odds else None

    # EV calculation
    implied_prob = 1 / bet.odds
    payout = bet.odds - 1
    expected_value = round(((implied_prob * payout) - (1 - implied_prob)) * 100, 2)

    # Kelly calculation
    b = payout
    p = implied_prob
    q = 1 - p
    kelly_fraction = max(0, round(((b * p - q) / b), 4)) if b > 0 else 0

    # Generate detailed calculation breakdown
    calculation_breakdown = {
        "clv": {
            "formula": "(Your Odds - Closing Odds) / |Closing Odds|",
            "calculation": f"({bet.odds} - {bet.closing_odds}) / |{bet.closing_odds}|" if bet.closing_odds else "N/A (no closing odds)",
            "steps": [
                f"Odds difference: {bet.odds} - {bet.closing_odds} = {round(bet.odds - bet.closing_odds, 3)}" if bet.closing_odds else None,
                f"Divide by closing odds: {round(bet.odds - bet.closing_odds, 3)} / {abs(bet.closing_odds)} = {clv}" if bet.closing_odds else None
            ] if bet.closing_odds else [],
            "result": clv,
            "interpretation": "Positive CLV means you got better odds than closing" if clv and clv > 0 else "Negative CLV means closing odds were better" if clv and clv < 0 else "No CLV available"
        },
        "expected_value": {
            "formula": "((Implied Probability × Payout) - (1 - Implied Probability)) × 100",
            "calculation": f"(({round(implied_prob, 4)} × {round(payout, 4)}) - (1 - {round(implied_prob, 4)})) × 100",
            "steps": [
                f"Implied Probability: 1 / {bet.odds} = {round(implied_prob, 4)}",
                f"Payout: {bet.odds} - 1 = {round(payout, 4)}",
                f"Win component: {round(implied_prob, 4)} × {round(payout, 4)} = {round(implied_prob * payout, 4)}",
                f"Loss component: 1 - {round(implied_prob, 4)} = {round(1 - implied_prob, 4)}",
                f"EV: ({round(implied_prob * payout, 4)} - {round(1 - implied_prob, 4)}) × 100 = {expected_value}%"
            ],
            "result": expected_value,
            "interpretation": "Positive EV suggests a profitable bet over time" if expected_value > 0 else "Negative EV suggests an unprofitable bet over time"
        },
        "kelly": {
            "formula": "(b × p - q) / b",
            "calculation": f"({round(b, 4)} × {round(p, 4)} - {round(q, 4)}) / {round(b, 4)}",
            "steps": [
                f"b (payout odds): {bet.odds} - 1 = {round(b, 4)}",
                f"p (implied probability): 1 / {bet.odds} = {round(p, 4)}",
                f"q (probability of losing): 1 - {round(p, 4)} = {round(q, 4)}",
                f"Numerator: ({round(b, 4)} × {round(p, 4)}) - {round(q, 4)} = {round(b * p - q, 4)}",
                f"Kelly Fraction: {round(b * p - q, 4)} / {round(b, 4)} = {kelly_fraction}",
                f"Kelly Size: {kelly_fraction} × ${bet.stake} = ${round(kelly_fraction * bet.stake, 2)}"
            ],
            "result": {
                "fraction": kelly_fraction,
                "size": round(kelly_fraction * bet.stake, 2)
            },
            "interpretation": f"Suggests betting {round(kelly_fraction * 100, 2)}% of your bankroll (${round(kelly_fraction * bet.stake, 2)})"
        }
    }

    bet_dict = bet.dict()
    bet_dict["id"] = str(uuid.uuid4())
    bet_dict["clv"] = clv
    bet_dict["expectedValue"] = expected_value
    bet_dict["kellySize"] = round(kelly_fraction * bet.stake, 2)
    bet_dict["calculation_breakdown"] = calculation_breakdown
    bet_dict["loggedAt"] = datetime.utcnow()

    get_bets_collection().insert_one(bet_dict)
    return bet_dict

def fetch_bets(user: str):
    return list(get_bets_collection().find({"user": user}, {"_id": 0}))
