from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json().get("ok") == True

def test_odds_sports():
    res = client.get("/api/odds/sports")
    assert res.status_code in (200, 401, 403)

def test_odds_best_invalid():
    res = client.get("/api/odds/best?sport_key=invalid_sport")
    assert res.status_code in (200, 422, 500)

def test_bet_log_and_history():
    payload = {
        "user": "testuser",
        "matchup": "Team A vs Team B",
        "sportsbook": "TestBook",
        "odds": 1.9,
        "stake": 100,
        "closing_odds": 2.0
    }
    res = client.post("/api/bets/log", json=payload)
    assert res.status_code == 200
    assert res.json().get("status") == "logged"

    res = client.get("/api/bets/history/testuser")
    assert res.status_code == 200
    assert "bets" in res.json()

def test_clv_report():
    res = client.get("/api/clv/report?user=testuser")
    assert res.status_code == 200
    data = res.json()
    assert "avg_clv" in data
    assert "total_bets" in data