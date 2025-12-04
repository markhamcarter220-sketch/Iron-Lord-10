
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

    bet_dict = bet.dict()
    bet_dict["id"] = str(uuid.uuid4())
    bet_dict["clv"] = clv
    bet_dict["expectedValue"] = expected_value
    bet_dict["kellySize"] = round(kelly_fraction * bet.stake, 2)
    bet_dict["loggedAt"] = datetime.utcnow()

    get_bets_collection().insert_one(bet_dict)
    return bet_dict

def fetch_bets(user: str):
    return list(get_bets_collection().find({"user": user}, {"_id": 0}))
