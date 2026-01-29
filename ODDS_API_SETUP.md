# Odds API Setup Guide

## 🚨 CRITICAL: API Key Configuration

Your application is now configured but **requires an API key** to fetch odds data.

### Step 1: Get Your Free API Key

1. Go to **https://the-odds-api.com/**
2. Sign up for a **FREE account**
3. Copy your API key from the dashboard

Free tier includes:
- **500 requests per month**
- Access to all sports and markets
- Real-time odds updates

### Step 2: Configure Your API Key

Open `/home/user/Iron-Lord-10/backend/.env` and replace:

```bash
ODDS_API_KEY=your_odds_api_key_here
```

With your actual API key:

```bash
ODDS_API_KEY=abc123youractualkey456
```

### Step 3: Restart Your Backend

```bash
cd /home/user/Iron-Lord-10/backend
# Kill existing process and restart
python main.py
```

---

## ✅ What's Now Available

### Markets Supported

Your application now fetches **multiple market types**:

#### 1. **H2H (Moneyline)** ✅
- Straight win/loss bets
- Available for all sports

#### 2. **Spreads** ✅ NEW
- Point spread betting
- Includes the spread value (e.g., -7.5, +3.5)
- Available for: NFL, NBA, NCAAF, NCAAB

#### 3. **Totals (Over/Under)** ✅ NEW
- Over/under total points betting
- Includes the total value (e.g., 225.5 points)
- Available for: NFL, NBA, NCAAF, NCAAB, NHL

#### 4. **Player Props** ✅ NEW
Available via separate endpoint: `/api/odds/{sport_key}/player-props`

Includes:
- Player points
- Player rebounds
- Player assists
- Player touchdowns (NFL)
- Player rushing yards (NFL)
- Player receptions (NFL)

---

## 📊 Sportsbooks Included

You have **12 major US sportsbooks**:

1. **DraftKings** (draftkings)
2. **FanDuel** (fanduel)
3. **BetMGM** (betmgm)
4. **William Hill** (williamhill_us)
5. **Bovada** (bovada)
6. **PointsBet** (pointsbetus)
7. **BetRivers** (betrivers)
8. **WynnBET** (wynnbet)
9. **Unibet** (unibet)
10. **BetUS** (betus)
11. **MyBookie.ag** (mybookieag)
12. **BetOnline.ag** (betonlineag)

---

## 🔌 API Endpoints

### Get Odds (All Markets)
```
GET /api/odds/{sport_key}
```

Returns h2h, spreads, and totals for all events in that sport.

Example:
```bash
curl http://localhost:8000/api/odds/americanfootball_nfl
```

### Get Player Props
```
GET /api/odds/{sport_key}/player-props?event_id={optional}
```

Returns player prop markets.

Example:
```bash
curl http://localhost:8000/api/odds/basketball_nba/player-props
```

---

## 📝 Response Structure

### Game Markets (h2h, spreads, totals)

```json
{
  "events": [
    {
      "id": "event_id",
      "sport_key": "americanfootball_nfl",
      "sport_title": "NFL",
      "commence_time": "2026-01-29T18:00:00Z",
      "home_team": "Kansas City Chiefs",
      "away_team": "Buffalo Bills",
      "bookmakers": [
        {
          "key": "draftkings",
          "title": "DraftKings",
          "markets": [
            {
              "key": "h2h",
              "last_update": "2026-01-29T17:45:00Z",
              "outcomes": [
                {
                  "name": "Kansas City Chiefs",
                  "price": 1.85
                },
                {
                  "name": "Buffalo Bills",
                  "price": 2.05
                }
              ]
            },
            {
              "key": "spreads",
              "last_update": "2026-01-29T17:45:00Z",
              "outcomes": [
                {
                  "name": "Kansas City Chiefs",
                  "price": 1.91,
                  "point": -2.5
                },
                {
                  "name": "Buffalo Bills",
                  "price": 1.91,
                  "point": 2.5
                }
              ]
            },
            {
              "key": "totals",
              "last_update": "2026-01-29T17:45:00Z",
              "outcomes": [
                {
                  "name": "Over",
                  "price": 1.91,
                  "point": 50.5
                },
                {
                  "name": "Under",
                  "price": 1.91,
                  "point": 50.5
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🎯 Sports Available

### American Football
- `americanfootball_nfl` - NFL
- `americanfootball_ncaaf` - College Football

### Basketball
- `basketball_nba` - NBA
- `basketball_ncaab` - College Basketball
- `basketball_euroleague` - EuroLeague

### Hockey
- `icehockey_nhl` - NHL

### Baseball
- `baseball_mlb` - MLB

### Soccer
- `soccer_epl` - English Premier League
- `soccer_spain_la_liga` - La Liga
- `soccer_uefa_champs_league` - Champions League
- `soccer_usa_mls` - MLS

### Combat Sports
- `mma_mixed_martial_arts` - MMA
- `boxing_boxing` - Boxing

### Tennis
- `tennis_atp` - ATP
- `tennis_wta` - WTA

### Golf
- `golf_pga` - PGA

---

## ⚠️ Important Notes

### API Request Limits

The free tier provides **500 requests/month**. Each API call uses 1 request.

To check remaining requests, look at the response:
```json
{
  "api_requests_remaining": "485",
  "api_requests_used": "15"
}
```

### Data Freshness

- **Validation age**: Odds must be < 30 minutes old
- **EV calculation age**: Odds must be < 60 seconds old
- Stale odds are automatically filtered out

### Supported Odds Format

All odds are returned in **DECIMAL format**, not American format.

Examples:
- `2.00` = +100 (even money)
- `1.50` = -200 (favorite)
- `3.00` = +200 (underdog)

---

## 🐛 Troubleshooting

### "No games found"

1. **Check API key is set** in `.env`
2. **Verify sport has upcoming games** (some sports are seasonal)
3. **Check API quota** - you may have hit the 500 request limit
4. **Restart backend** after changing `.env`

### "API unavailable" error

1. Check your API key is valid
2. Verify you haven't exceeded the rate limit
3. Check The Odds API status: https://the-odds-api.com/

### "403 Forbidden" error

Your API key is invalid or has been revoked. Get a new key from The Odds API.

---

## 🚀 Next Steps

1. **Set your API key** in `/backend/.env`
2. **Restart the backend**
3. **Test an endpoint**:
   ```bash
   curl http://localhost:8000/api/odds/basketball_nba
   ```
4. **Check your frontend** - odds should now appear!

---

## 📚 Further Reading

- **The Odds API Documentation**: https://the-odds-api.com/liveapi/guides/v4/
- **Supported Markets**: https://the-odds-api.com/sports-odds-data/betting-markets.html
- **Sportsbook Coverage**: https://the-odds-api.com/sports-odds-data/bookmaker-apis.html
