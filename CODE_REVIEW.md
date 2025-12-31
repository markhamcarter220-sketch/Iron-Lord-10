# Code Review & Recommendations - Iron Lord 10

## Executive Summary
Overall, the calculation breakdown feature is well-implemented with clear, educational breakdowns. However, there are several critical issues, security concerns, and optimization opportunities across the codebase.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Sport Field in Bet Model** ⚠️
**File:** `backend/models/bet.py:7`

**Issue:** The `Bet` model doesn't have a `sport` field, but the test in `test_api.py` sends it, and `BetHistory.jsx:139` tries to display it.

**Impact:** Will cause errors when logging bets with sport field or displaying bet history.

**Fix:**
```python
class Bet(BaseModel):
    user: str
    matchup: str
    sportsbook: str
    sport: str  # ADD THIS
    odds: float
    stake: float
    # ... rest of fields
```

### 2. **Division by Zero Risk in Kelly Calculation**
**File:** `backend/services/bet_service.py:20`

**Issue:** If `b = 0` (when odds = 1.0), division by zero occurs in Kelly formula.

**Current Code:**
```python
kelly_fraction = max(0, round(((b * p - q) / b), 4)) if b > 0 else 0
```

**Recommendation:** Already protected, but should validate odds > 1.0 at API level.

### 3. **MongoDB Connection Not Validated**
**File:** `backend/db/mongo.py:4`

**Issue:** MongoDB connection created globally without error handling or connection pooling configuration.

**Risk:** App will crash silently if MongoDB is unavailable.

**Fix:**
```python
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config.settings import settings

try:
    client = MongoClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
        maxPoolSize=50
    )
    # Verify connection
    client.admin.command('ping')
    db = client["ironman"]
except ConnectionFailure as e:
    raise Exception(f"Failed to connect to MongoDB: {e}")

def get_bets_collection():
    return db["bets"]
```

---

## 🔒 SECURITY CONCERNS

### 1. **CORS Wide Open** 🚨
**File:** `backend/config/settings.py:7` & `backend/main.py:11`

**Issue:** `CORS_ORIGIN: str = "*"` allows any domain to access your API.

**Risk:** CSRF attacks, unauthorized access from malicious sites.

**Fix:**
```python
# settings.py
CORS_ORIGIN: str = "http://localhost:5173,https://yourdomain.com"

# main.py
origins = settings.CORS_ORIGIN.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Not "*"
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Be specific
    allow_headers=["Content-Type", "Authorization"]
)
```

### 2. **No Input Validation on User Field**
**Files:** `backend/routes/bets.py:14`, `backend/routes/clv.py:8`

**Issue:** User parameter not validated - could be injection attack vector.

**Risk:** NoSQL injection, unauthorized data access.

**Fix:**
```python
from pydantic import BaseModel, validator
import re

class UserRequest(BaseModel):
    user: str

    @validator('user')
    def validate_user(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', v):
            raise ValueError('Invalid username format')
        return v

@router.get("/history/{user}")
def get_history(user: str):
    # Add validation
    if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', user):
        raise HTTPException(status_code=400, detail="Invalid username")
    return {"bets": fetch_bets(user)}
```

### 3. **No Rate Limiting**

**Issue:** No rate limiting on API endpoints.

**Risk:** DDoS attacks, resource exhaustion.

**Fix:** Add rate limiting middleware:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/log")
@limiter.limit("10/minute")
def log_bet_route(request: Request, bet: Bet):
    # ...
```

### 4. **Sensitive Data in Logs**

**Issue:** Could be logging sensitive bet data.

**Recommendation:** Ensure PII (user info, stakes) aren't logged in production.

---

## ⚡ PERFORMANCE ISSUES

### 1. **Missing Database Indexes**

**Issue:** Queries on `user` field without indexes will be slow at scale.

**Fix:** Create indexes:
```python
# Add to mongo.py or migration script
def setup_indexes():
    bets_collection = get_bets_collection()
    bets_collection.create_index([("user", 1)])
    bets_collection.create_index([("loggedAt", -1)])
    bets_collection.create_index([("user", 1), ("loggedAt", -1)])
```

### 2. **Frontend Fetches All Bets**
**File:** `src/components/BetHistory.jsx:13`

**Issue:** `fetch_bets(user)` returns ALL bets for a user with no pagination.

**Impact:** Will slow down dramatically as bet history grows.

**Fix:** Add pagination:
```python
# Backend
def fetch_bets(user: str, skip: int = 0, limit: int = 50):
    return list(
        get_bets_collection()
        .find({"user": user}, {"_id": 0})
        .sort("loggedAt", -1)
        .skip(skip)
        .limit(limit)
    )

# Frontend
const [page, setPage] = useState(0);
const response = await fetch(
  `/api/bets/history/${username}?skip=${page * 50}&limit=50`
);
```

### 3. **useEffect Missing Dependency**
**File:** `src/components/BetHistory.jsx:23-25`

**Issue:**
```javascript
useEffect(() => {
  fetchBets();
}, []); // fetchBets not in dependency array
```

**Fix:**
```javascript
useEffect(() => {
  fetchBets();
}, [username]); // Re-fetch when username changes

// OR wrap fetchBets in useCallback
const fetchBets = useCallback(async () => {
  // ...
}, [username]);
```

### 4. **MongoDB Connection Pool Not Configured**

**Issue:** Default connection pool settings may not be optimal.

**Fix:** See Critical Issue #3 above.

---

## 🧹 CODE QUALITY & BEST PRACTICES

### 1. **Calculation Breakdown Has Redundant Rounding**
**File:** `backend/services/bet_service.py:22-63`

**Issue:** Rounding happens in calculation breakdown, then again in display. Can cause inconsistencies.

**Recommendation:**
- Store raw values in breakdown
- Apply rounding only in frontend for display
- Or document that breakdown values are display values

### 2. **Inconsistent Naming Conventions**

**Issues:**
- `loggedAt` (camelCase) vs `closing_odds` (snake_case) in same model
- `kellySize` vs `expectedValue`

**Fix:** Choose one convention:
```python
# Option 1: All snake_case (Python convention)
logged_at: datetime
kelly_size: Optional[float]
expected_value: Optional[float]

# Option 2: Use alias for JSON serialization
class Bet(BaseModel):
    logged_at: datetime = Field(alias='loggedAt')
    kelly_size: Optional[float] = Field(alias='kellySize')

    class Config:
        populate_by_name = True
```

### 3. **Magic Numbers in Code**

**Examples:**
- `backend/services/bet_service.py:9` - rounding to 3 decimals
- `backend/services/bet_service.py:14` - multiplying by 100

**Fix:** Use constants:
```python
# At top of file
CLV_DECIMAL_PLACES = 3
EV_DECIMAL_PLACES = 2
KELLY_DECIMAL_PLACES = 4
PERCENTAGE_MULTIPLIER = 100
```

### 4. **Error Handling Missing**

**Issue:** No error handling in `log_bet` if MongoDB insert fails.

**Fix:**
```python
def log_bet(bet: Bet):
    try:
        # ... calculation logic ...
        get_bets_collection().insert_one(bet_dict)
        return bet_dict
    except Exception as e:
        logger.error(f"Failed to log bet: {e}")
        raise HTTPException(status_code=500, detail="Failed to log bet")
```

### 5. **Component Styles Should Be Extracted**
**File:** `src/components/BetHistory.jsx`

**Issue:** 100+ lines of inline styles make component hard to read.

**Fix:**
```javascript
// Create styles.js
export const betHistoryStyles = {
  container: { margin: '16px 0', padding: 16, ... },
  header: { display: 'flex', ... },
  // etc.
};

// In component
import { betHistoryStyles as styles } from './styles';
<div style={styles.container}>
```

Or use CSS modules/styled-components.

---

## 🏗️ ARCHITECTURE & DESIGN

### 1. **Business Logic in Service Layer (Good!) ✅**

Your separation of concerns is good:
- Models define data structure
- Services contain business logic
- Routes are thin controllers

**Keep this pattern!**

### 2. **Missing Data Validation Layer**

**Issue:** Odds can be negative or zero, stake can be negative.

**Fix:** Add validators:
```python
from pydantic import validator

class Bet(BaseModel):
    odds: float
    stake: float

    @validator('odds')
    def validate_odds(cls, v):
        if v <= 1.0:
            raise ValueError('Odds must be greater than 1.0')
        if v > 1000:
            raise ValueError('Odds seem unrealistic')
        return v

    @validator('stake')
    def validate_stake(cls, v):
        if v <= 0:
            raise ValueError('Stake must be positive')
        if v > 100000:
            raise ValueError('Stake seems unrealistic')
        return v
```

### 3. **Consider Separating Calculation Logic**

**Recommendation:** Create a `calculations.py` module:

```python
# backend/utils/calculations.py
from typing import Dict, Optional

def calculate_clv(odds: float, closing_odds: Optional[float]) -> Optional[float]:
    """Calculate Closing Line Value."""
    if not closing_odds:
        return None
    return round((odds - closing_odds) / abs(closing_odds), 3)

def calculate_expected_value(odds: float) -> float:
    """Calculate Expected Value percentage."""
    implied_prob = 1 / odds
    payout = odds - 1
    return round(((implied_prob * payout) - (1 - implied_prob)) * 100, 2)

def calculate_kelly_fraction(odds: float) -> float:
    """Calculate Kelly Criterion fraction."""
    implied_prob = 1 / odds
    payout = odds - 1
    fraction = ((payout * implied_prob) - (1 - implied_prob)) / payout
    return max(0, round(fraction, 4))

def generate_calculation_breakdown(
    odds: float,
    closing_odds: Optional[float],
    stake: float
) -> Dict:
    """Generate detailed calculation breakdown."""
    # ... breakdown logic ...
    return breakdown
```

**Benefits:**
- Testable in isolation
- Reusable (e.g., in KellyCalculator component)
- Cleaner service layer

### 4. **Frontend State Management**

**Issue:** As app grows, prop drilling and component state will become unwieldy.

**Recommendation:** Consider:
- React Context for user/theme state
- React Query for server state (bets, odds)

Example:
```javascript
// Using React Query
import { useQuery } from '@tanstack/react-query';

function BetHistory() {
  const [username, setUsername] = useState('testuser');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bets', username],
    queryFn: () => fetch(`/api/bets/history/${username}`).then(r => r.json()),
    staleTime: 30000, // Cache for 30s
  });

  // Automatic caching, refetching, error handling
}
```

---

## 💡 UX/UI IMPROVEMENTS

### 1. **BetLogger Component Not Implemented**

**File:** `src/components/BetLogger.jsx:4`

**Issue:** Placeholder text instead of functional component.

**Impact:** Users can't actually log bets from UI - have to use API directly.

**Recommendation:** HIGH PRIORITY - Implement bet logging form.

### 2. **Loading States Could Be Better**

**Current:**
```javascript
{loading ? 'Loading...' : 'Refresh'}
```

**Better:**
- Add spinner/skeleton screens
- Disable inputs during loading
- Show optimistic updates

### 3. **Error States Missing**

**Issue:** No error handling in frontend fetch.

**Fix:**
```javascript
const [error, setError] = useState(null);

const fetchBets = async () => {
  try {
    setError(null);
    // ... fetch logic ...
  } catch (error) {
    setError(error.message);
  }
};

// In render
{error && <div style={errorStyle}>{error}</div>}
```

### 4. **Calculation Breakdown Could Use Icons**

**Recommendation:**
- Add checkmark icon for positive CLV/EV
- Add warning icon for negative CLV/EV
- Makes visual scanning faster

### 5. **Mobile Responsiveness**

**Issue:** Fixed width styles, may not work on mobile.

**Fix:**
```javascript
const statsRowStyle = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',  // ADD THIS
  // ...
};
```

### 6. **Empty State Could Be More Helpful**

**Current:**
```
"No bets found. Start logging your picks!"
```

**Better:**
```
No bets found.
[Log Your First Bet] button
Or learn more about CLV and Kelly Criterion
```

---

## 🧪 TESTING & RELIABILITY

### 1. **Test Coverage Gaps**

**File:** `backend/tests/test_api.py`

**Missing Tests:**
- Calculation breakdown structure validation
- Edge cases (odds = 1.01, odds = 100, negative stakes)
- Invalid user inputs
- MongoDB connection failures

**Add:**
```python
def test_calculation_breakdown_structure():
    payload = {...}
    res = client.post("/api/bets/log", json=payload)
    bet = res.json()["bet"]

    assert "calculation_breakdown" in bet
    assert "clv" in bet["calculation_breakdown"]
    assert "formula" in bet["calculation_breakdown"]["clv"]
    assert "steps" in bet["calculation_breakdown"]["clv"]

def test_invalid_odds():
    payload = {**base_payload, "odds": 0.5}  # Invalid
    res = client.post("/api/bets/log", json=payload)
    assert res.status_code == 422

def test_negative_stake():
    payload = {**base_payload, "stake": -100}
    res = client.post("/api/bets/log", json=payload)
    assert res.status_code == 422
```

### 2. **No Frontend Tests**

**Recommendation:** Add tests for:
- CalculationBreakdown component rendering
- BetHistory fetching and display
- Expand/collapse behavior

### 3. **Missing Integration Tests**

**Add:** End-to-end tests for full bet logging flow.

---

## 📊 MONITORING & OBSERVABILITY

### 1. **Add Health Check for MongoDB**

**File:** `backend/routes/health.py`

**Current:** Probably just returns `{"ok": True}`

**Better:**
```python
@router.get("/health")
def health_check():
    health = {"ok": True, "services": {}}

    # Check MongoDB
    try:
        client.admin.command('ping')
        health["services"]["mongodb"] = "healthy"
    except Exception as e:
        health["services"]["mongodb"] = "unhealthy"
        health["ok"] = False

    return health
```

### 2. **Add Metrics/Analytics**

Track:
- Bets logged per day
- Average CLV by user
- Most used sportsbooks
- Calculation breakdown views

---

## 🎯 QUICK WINS (Do These First)

1. ✅ **Add `sport` field to Bet model** (1 min)
2. ✅ **Restrict CORS origins** (2 min)
3. ✅ **Add input validation on user parameter** (5 min)
4. ✅ **Add MongoDB connection error handling** (5 min)
5. ✅ **Fix useEffect dependency** (1 min)
6. ✅ **Add database indexes** (5 min)
7. ✅ **Add error state to BetHistory** (5 min)
8. ✅ **Implement BetLogger component** (30 min)

---

## 📈 MEDIUM PRIORITY

- Add pagination to bet history
- Extract calculation logic to separate module
- Add odds/stake validation
- Improve error handling throughout
- Add unit tests for calculations
- Implement rate limiting

---

## 🚀 LONG TERM

- Add authentication/authorization
- Implement React Query for state management
- Add real-time updates (WebSockets)
- Create dashboard with analytics
- Mobile app
- Export bet history to CSV/PDF

---

## Summary Score

| Category | Score | Notes |
|----------|-------|-------|
| **Functionality** | 8/10 | Works well, missing BetLogger |
| **Security** | 4/10 | ⚠️ Major concerns with CORS, validation |
| **Performance** | 6/10 | Will struggle at scale without indexes/pagination |
| **Code Quality** | 7/10 | Good separation, some inconsistencies |
| **Testing** | 5/10 | Basic tests, missing edge cases |
| **UX/UI** | 7/10 | Clean, but missing error/loading states |

**Overall: 6.2/10** - Solid foundation with critical security/performance issues to address.
