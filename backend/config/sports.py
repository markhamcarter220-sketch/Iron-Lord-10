"""
Sports Configuration

List of supported sports with their keys and display names.
"""

SUPPORTED_SPORTS = {
    # American Football
    "americanfootball_nfl": {
        "title": "NFL",
        "category": "American Football",
        "icon": "🏈"
    },
    "americanfootball_ncaaf": {
        "title": "NCAAF",
        "category": "American Football",
        "icon": "🏈"
    },

    # Basketball
    "basketball_nba": {
        "title": "NBA",
        "category": "Basketball",
        "icon": "🏀"
    },
    "basketball_ncaab": {
        "title": "NCAAB",
        "category": "Basketball",
        "icon": "🏀"
    },
    "basketball_euroleague": {
        "title": "EuroLeague",
        "category": "Basketball",
        "icon": "🏀"
    },

    # Hockey
    "icehockey_nhl": {
        "title": "NHL",
        "category": "Hockey",
        "icon": "🏒"
    },

    # Baseball
    "baseball_mlb": {
        "title": "MLB",
        "category": "Baseball",
        "icon": "⚾"
    },

    # Soccer
    "soccer_epl": {
        "title": "Premier League",
        "category": "Soccer",
        "icon": "⚽"
    },
    "soccer_spain_la_liga": {
        "title": "La Liga",
        "category": "Soccer",
        "icon": "⚽"
    },
    "soccer_uefa_champs_league": {
        "title": "Champions League",
        "category": "Soccer",
        "icon": "⚽"
    },
    "soccer_usa_mls": {
        "title": "MLS",
        "category": "Soccer",
        "icon": "⚽"
    },

    # UFC/MMA
    "mma_mixed_martial_arts": {
        "title": "UFC/MMA",
        "category": "MMA",
        "icon": "🥊"
    },

    # Boxing
    "boxing_boxing": {
        "title": "Boxing",
        "category": "Boxing",
        "icon": "🥊"
    },

    # Tennis
    "tennis_atp": {
        "title": "ATP Tennis",
        "category": "Tennis",
        "icon": "🎾"
    },
    "tennis_wta": {
        "title": "WTA Tennis",
        "category": "Tennis",
        "icon": "🎾"
    },

    # Golf
    "golf_pga": {
        "title": "PGA Tour",
        "category": "Golf",
        "icon": "⛳"
    },
}


def get_sports_by_category():
    """Group sports by category for UI display"""
    categories = {}
    for key, sport in SUPPORTED_SPORTS.items():
        category = sport["category"]
        if category not in categories:
            categories[category] = []
        categories[category].append({
            "key": key,
            "title": sport["title"],
            "icon": sport["icon"]
        })
    return categories
