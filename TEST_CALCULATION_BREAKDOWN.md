# Testing the Calculation Breakdown Feature

## Overview
The calculation breakdown feature allows users to see detailed step-by-step calculations for:
- **CLV (Closing Line Value)**: Shows if you got better odds than closing
- **Expected Value (EV)**: Shows the theoretical profitability of your bet
- **Kelly Criterion**: Shows the optimal bet size based on edge

## How to Test

### Backend Testing

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install pytest  # for running tests
   ```

2. **Start the backend server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

3. **Test with curl (or Postman):**
   ```bash
   # Log a bet
   curl -X POST http://localhost:8000/api/bets/log \
     -H "Content-Type: application/json" \
     -d '{
       "user": "testuser",
       "matchup": "Lakers vs Celtics",
       "sportsbook": "FanDuel",
       "sport": "basketball",
       "odds": 2.1,
       "stake": 100,
       "closing_odds": 2.0
     }'

   # Get bet history (should include calculation_breakdown)
   curl http://localhost:8000/api/bets/history/testuser
   ```

4. **Expected Response Structure:**
   ```json
   {
     "status": "logged",
     "bet": {
       "user": "testuser",
       "matchup": "Lakers vs Celtics",
       "odds": 2.1,
       "closing_odds": 2.0,
       "clv": 0.05,
       "expectedValue": -4.76,
       "kellySize": 0.0,
       "calculation_breakdown": {
         "clv": {
           "formula": "(Your Odds - Closing Odds) / |Closing Odds|",
           "calculation": "(2.1 - 2.0) / |2.0|",
           "steps": [
             "Odds difference: 2.1 - 2.0 = 0.1",
             "Divide by closing odds: 0.1 / 2.0 = 0.05"
           ],
           "result": 0.05,
           "interpretation": "Positive CLV means you got better odds than closing"
         },
         "expected_value": {
           "formula": "((Implied Probability × Payout) - (1 - Implied Probability)) × 100",
           ...
         },
         "kelly": {
           "formula": "(b × p - q) / b",
           ...
         }
       }
     }
   }
   ```

### Frontend Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Test in browser:**
   - Navigate to `http://localhost:5173` (or the port Vite assigns)
   - Go to the Bet History section
   - Enter username: `testuser`
   - Click "Refresh"
   - Each bet should display a "▶ Show Calculation Details" button
   - Click the button to expand and see the full calculation breakdown

## Test Cases

### Test Case 1: Positive CLV Bet
```json
{
  "user": "testuser",
  "matchup": "Team A vs Team B",
  "sportsbook": "DraftKings",
  "sport": "football",
  "odds": 2.5,
  "stake": 100,
  "closing_odds": 2.2
}
```
**Expected:** CLV should be positive (~0.136), showing you got better odds

### Test Case 2: Negative CLV Bet
```json
{
  "user": "testuser",
  "matchup": "Team C vs Team D",
  "sportsbook": "FanDuel",
  "sport": "basketball",
  "odds": 1.9,
  "stake": 100,
  "closing_odds": 2.1
}
```
**Expected:** CLV should be negative (~-0.095), showing closing odds were better

### Test Case 3: No Closing Odds
```json
{
  "user": "testuser",
  "matchup": "Team E vs Team F",
  "sportsbook": "Caesars",
  "sport": "hockey",
  "odds": 3.0,
  "stake": 50
}
```
**Expected:** CLV section should say "N/A (no closing odds)"

## Manual Verification Checklist

- [ ] Backend API returns `calculation_breakdown` field in bet response
- [ ] Calculation breakdown includes all three metrics (CLV, EV, Kelly)
- [ ] Each metric shows formula, calculation, steps, result, and interpretation
- [ ] Frontend displays calculation breakdown in collapsible section
- [ ] Clicking "Show Calculation Details" expands/collapses the breakdown
- [ ] All calculation steps are readable and formatted correctly
- [ ] Colors are applied correctly (green for positive, red for negative)
- [ ] Bet history loads without errors
- [ ] Multiple bets can be displayed with their respective calculations

## Formula Verification

### CLV Formula
```
CLV = (Your Odds - Closing Odds) / |Closing Odds|
```
Example: odds=2.1, closing_odds=2.0
- (2.1 - 2.0) / 2.0 = 0.05 = 5% CLV ✓

### EV Formula
```
EV = ((Implied Probability × Payout) - (1 - Implied Probability)) × 100
```
Example: odds=2.1
- Implied Prob = 1/2.1 = 0.4762
- Payout = 2.1 - 1 = 1.1
- EV = ((0.4762 × 1.1) - (1 - 0.4762)) × 100 = -4.76% ✓

### Kelly Formula
```
Kelly Fraction = (b × p - q) / b
where b = payout, p = implied prob, q = 1 - p
```
Example: odds=2.1
- b = 1.1, p = 0.4762, q = 0.5238
- Kelly = (1.1 × 0.4762 - 0.5238) / 1.1 = 0 (max(0, result)) ✓
