# CHANGELOG_IronLord7.md

## Added
- Direct "Log Bet" button to all scan results (EV, CLV, Arb)
- Fully prefilled logging modal from scan cards
- Bonus Bets tool now functional: EV > 0% flagged as eligible
- Bonus EV formula added: EV = p × payout (no loss penalty)
- Bonus badge displayed on BetCards with +EV
- Scan deduplication: prevent duplicate logs via backend
- Rate limiting middleware for scan routes (10 req/min/IP)
- Tooltips for EV, CLV, Kelly, and Bonus explanations
- Responsive layout improved for mobile spacing

## Improved
- Scan-to-log workflow reduced to 1 click
- Backend guards for duplicate bet entries