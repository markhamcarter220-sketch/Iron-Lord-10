# CHANGELOG_IronLord6.md

## Added
- Fixed bankroll input at top of page (user-defined)
- Kelly Criterion overlay on BetCards (shows % and $ stake)
- `/api/bets/:id` PUT endpoint for bet updates
- Editable modal on Bet History page (closing line, result)
- CLV stats engine: % of bets that beat line, avg CLV %
- W/L/P summary counter on `/bets` page

## Improved
- BetCard UI now dynamically reflects bankroll + Kelly logic
- CLV % color-coded (green = beat line, red = missed line)