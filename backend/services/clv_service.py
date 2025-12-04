
from db.mongo import get_bets_collection

def generate_clv_report(user: str):
    bets = list(get_bets_collection().find({"user": user, "clv": {"$ne": None}}, {"_id": 0}))
    if not bets:
        return {"user": user, "bets": 0, "average_clv": None, "positive_clv": 0, "sharp_rate": None, "clv_data": []}

    clv_values = [b["clv"] for b in bets if "clv" in b]
    avg_clv = round(sum(clv_values) / len(clv_values), 4)
    pos_count = sum(1 for c in clv_values if c > 0)
    sharp_rate = round(pos_count / len(clv_values) * 100, 2)

    return {
        "user": user,
        "bets": len(clv_values),
        "average_clv": avg_clv,
        "positive_clv": pos_count,
        "sharp_rate": sharp_rate,
        "clv_data": clv_values
    }
