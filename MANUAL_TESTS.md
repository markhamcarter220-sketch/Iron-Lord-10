# Manual Test Suite – IronMan30

## ✅ Smoke + Sanity Tests (curl examples)

### Health
```
curl http://localhost:8000/health
```

### Log Bet
```
curl -X POST http://localhost:8000/api/bets/log \
  -H "Content-Type: application/json" \
  -d '{ "user": "testuser", "matchup": "Team A vs Team B", "sportsbook": "TestBook", "odds": 2.1, "stake": 100, "closing_odds": 2.3 }'
```

### Get History
```
curl http://localhost:8000/api/bets/history/testuser
```

### CLV Report
```
curl http://localhost:8000/api/clv/report?user=testuser
```

### Best Odds
```
curl http://localhost:8000/api/odds/best?sport_key=basketball_nba&market=h2h
```

## ❌ Error Tests
- Leave out user → expect 422
- Invalid sport_key → expect 500 or 422
- Log bet with missing fields → expect 422
