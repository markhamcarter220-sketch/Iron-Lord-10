# CHANGELOG_IronLord5.md

## Added
- Global Stake Box on scan pages (auto-propagates to BetCards)
- Inline Log Bet button on each BetCard
- Logging modal with prefilled data (teams, market, book, odds, stake, EV)
- Backend `/api/bets/log` route + MongoDB integration
- CLV tracking engine: detects if user beat the closing line
- `/bets` history page with BetCards, W/L/Pending display
- Color-coded CLV metrics (green for +CLV, red for -CLV)

## Improved
- BetCard component upgraded to support modal logging
- Default stake auto-fills in new bet logs