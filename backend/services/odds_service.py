import requests
from config.settings import settings
from tenacity import retry, stop_after_attempt, wait_fixed

class OddsAPIError(Exception): pass

BASE = "https://api.the-odds-api.com/v4/sports"

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def get_sports():
    r = requests.get(f"{BASE}?apiKey={settings.ODDS_API_KEY}", timeout=15)
    if r.status_code != 200:
        raise OddsAPIError(f"{r.status_code}: {r.text[:200]}")
    return r.json()

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def get_odds(sport_key: str):
    url = f"{BASE}/{sport_key}/odds"
    params = {
        "apiKey": settings.ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american",
        "dateFormat": "iso"
    }
    r = requests.get(url, params=params, timeout=20)
    if r.status_code != 200:
        raise OddsAPIError(f"{r.status_code}: {r.text[:200]}")
    return {
        "data": r.json(),
        "meta": {
            "x-requests-remaining": r.headers.get("x-requests-remaining"),
            "x-requests-used": r.headers.get("x-requests-used")
        }
    }

def get_best_lines(sport_key: str, market: str = "h2h") -> list:
    data = get_odds(sport_key, markets=market)["data"]
    results = []
    for event in data:
        if "bookmakers" not in event or not event["bookmakers"]:
            continue
        home = event.get("home_team")
        away = event.get("away_team")
        matchup = f"{home} vs {away}"
        best_home = None
        best_away = None
        for book in event["bookmakers"]:
            for m in book.get("markets", []):
                if m["key"] != market: continue
                for o in m.get("outcomes", []):
                    if o["name"] == home:
                        if not best_home or o["price"] > best_home["odds"]:
                            best_home = { "book": book["title"], "odds": o["price"] }
                    if o["name"] == away:
                        if not best_away or o["price"] > best_away["odds"]:
                            best_away = { "book": book["title"], "odds": o["price"] }
        if best_home and best_away:
            results.append({
                "matchup": matchup,
                "best_home": best_home,
                "best_away": best_away,
                "market": market
            })
    return results


def american_to_implied(odds):
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)

def devig_odds(home_odds, away_odds):
    home_imp = american_to_implied(home_odds)
    away_imp = american_to_implied(away_odds)
    margin = home_imp + away_imp
    return {
        "home": round(home_imp / margin, 4),
        "away": round(away_imp / margin, 4)
    }
