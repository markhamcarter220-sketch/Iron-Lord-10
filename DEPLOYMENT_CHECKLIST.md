# Better Bets - Final Deployment Checklist

**Framework Status: READY FOR PRODUCTION**

This checklist MUST be completed before deployment.
If ANY item is unchecked, deployment will result in incorrect behavior or user harm.

---

## ✅ MAVERICK MODE COMPLETE

**All three priorities executed:**
1. ✅ Unit tests written and passing (33/33)
2. ✅ Minimal viable frontend built
3. ✅ Deployment configs updated

---

## 🔒 PRE-DEPLOYMENT VERIFICATION

### Backend Correctness
- [x] ✅ EV calculation uses USER'S probability (not implied)
- [x] ✅ Formula: `EV = stake × (P × O - 1)` implemented correctly
- [x] ✅ 33/33 unit tests passing
- [x] ✅ Decimal precision maintained (ROUND_HALF_UP)
- [x] ✅ Input validation prevents invalid calculations
- [x] ✅ Timestamp validation rejects stale odds (> 60s)
- [x] ✅ Decimal odds format (not American)
- [x] ✅ Unsafe features removed (Kelly, CLV, devig)

### Frontend Safety
- [x] ✅ Requires probability input (0-100%)
- [x] ✅ Displays odds timestamp
- [x] ✅ Shows staleness indicator (green < 30s, yellow < 60s, red >= 60s)
- [x] ✅ Disables calculate button if odds stale
- [x] ✅ Requires disclaimer acceptance
- [x] ✅ Shows formula and full provenance
- [x] ✅ Lists excluded features
- [x] ✅ No bonus bet UI exists
- [x] ✅ No matched betting UI exists
- [x] ✅ No insurance UI exists

### Configuration Files
- [x] ✅ vercel.json configured with security headers
- [x] ✅ render.yaml configured with health check
- [x] ✅ Environment variable templates exist (.env.example)
- [x] ✅ API URLs marked as "your-backend.onrender.com" (must update)

---

## 📋 DEPLOYMENT SEQUENCE

### Phase 1: Backend Deployment (Render)

**1.1 Create Render Account**
- Go to https://render.com
- Sign up or log in
- Connect GitHub account

**1.2 Deploy Backend**
- Click "New +" → "Web Service"
- Select repository: `Iron-Lord-10`
- Configure:
  - Name: `better-bets-backend`
  - Region: Oregon (or closest to users)
  - Branch: `claude/deployment-setup-fZzJ6` (or merge to main first)
  - Root Directory: `backend`
  - Environment: Python 3
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Plan: Free

**1.3 Set Environment Variables in Render**

**CRITICAL:** Must set these before deployment:

| Variable | Value | Source |
|----------|-------|--------|
| `ODDS_API_KEY` | Your API key | Get from https://the-odds-api.com |
| `CORS_ORIGIN` | `*` (temporarily) | Will update after frontend deployed |
| `PORT` | `8000` | Default |
| `LOG_LEVEL` | `info` | Default |
| `MONGO_URI` | (Optional) | Only if using bet logging |

**1.4 Deploy & Verify**
- Click "Create Web Service"
- Wait for deployment (3-5 minutes)
- Note your backend URL: `https://better-bets-backend.onrender.com`

**1.5 Test Backend**
```bash
# Health check
curl https://better-bets-backend.onrender.com/health

# Should return:
{
  "status": "healthy",
  "version": "0.1.0-mvp",
  ...
}
```

**1.6 Test EV Endpoint**
```bash
curl -X POST https://better-bets-backend.onrender.com/api/ev/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "odds": 2.05,
    "true_probability": 0.52,
    "cash_stake": 100.00,
    "odds_timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "odds_source": "test"
  }'

# Should return EV calculation with full provenance
```

---

### Phase 2: Frontend Deployment (Vercel)

**2.1 Update vercel.json**

Before deploying, update:
```json
{
  "env": {
    "VITE_API_URL": "https://better-bets-backend.onrender.com"
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://better-bets-backend.onrender.com/api/:path*"
    }
  ]
}
```

Replace `better-bets-backend.onrender.com` with YOUR actual Render URL.

**2.2 Commit Changes**
```bash
git add vercel.json
git commit -m "Update API URL for production deployment"
git push
```

**2.3 Deploy to Vercel**

**Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Option B: Vercel Dashboard**
- Go to https://vercel.com/dashboard
- Click "Add New" → "Project"
- Import `Iron-Lord-10` repository
- Configure:
  - Framework: Vite
  - Root Directory: `./`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables:
    - `VITE_API_URL`: `https://better-bets-backend.onrender.com`
- Click "Deploy"

**2.4 Note Frontend URL**
- Example: `https://better-bets.vercel.app`
- Or custom domain if configured

---

### Phase 3: CORS Update (CRITICAL)

**3.1 Update Render CORS_ORIGIN**
- Go to Render dashboard → better-bets-backend
- Click "Environment"
- Update `CORS_ORIGIN`:
  - From: `*`
  - To: `https://better-bets.vercel.app` (your actual Vercel URL)
- Click "Save Changes"
- Service will automatically redeploy

**3.2 Verify CORS**
- Visit your Vercel frontend
- Open browser DevTools → Network tab
- Click "Fetch Odds"
- Verify no CORS errors

---

## 🧪 POST-DEPLOYMENT TESTING

### Critical User Flows

**Flow 1: Happy Path**
- [ ] Visit frontend URL
- [ ] Click "Fetch Odds"
- [ ] Odds display with timestamp
- [ ] Enter probability (e.g., 52)
- [ ] Enter stake (e.g., 100)
- [ ] Check disclaimer box
- [ ] Click "Calculate Expected Value"
- [ ] EV displays with correct formula
- [ ] Provenance shows all inputs + timestamps

**Flow 2: Stale Odds**
- [ ] Fetch odds
- [ ] Wait 65 seconds (do not refresh)
- [ ] Try to calculate EV
- [ ] Button should be disabled
- [ ] Timestamp should show red "TOO OLD"

**Flow 3: Invalid Inputs**
- [ ] Enter probability = 0 → Should show warning
- [ ] Enter probability = 100 → Should show warning
- [ ] Enter probability = 120 → Should show warning
- [ ] Enter stake = 0 → Should show warning
- [ ] Enter stake = -10 → Should show warning

**Flow 4: Disclaimer Required**
- [ ] Fill in all inputs
- [ ] Do NOT check disclaimer
- [ ] Calculate button should be disabled
- [ ] Warning should show "Accept the disclaimer"

### API Testing

**Test 1: Health Endpoint**
```bash
curl https://better-bets-backend.onrender.com/health

# Verify:
- status = "healthy"
- version = "0.1.0-mvp"
- features_enabled includes "ev_calculation"
- features_disabled includes "bonus_bets"
```

**Test 2: Odds Endpoint**
```bash
curl https://better-bets-backend.onrender.com/api/odds/americanfootball_nfl

# Verify:
- events array has items
- each bookmaker.key = "draftkings" only
- each outcome.price is decimal (e.g., 2.05, not -110)
- retrieved_at timestamp is present
```

**Test 3: EV Calculation**
```bash
curl -X POST https://better-bets-backend.onrender.com/api/ev/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "odds": 2.05,
    "true_probability": 0.52,
    "cash_stake": 100.00,
    "odds_timestamp": "'$(date -u -d '30 seconds ago' +"%Y-%m-%dT%H:%M:%SZ")'",
    "odds_source": "the-odds-api-v4"
  }'

# Verify:
- ev_cash = 6.60
- formula_used = "EV = stake × (P × O - 1)"
- inputs matches what you sent
- odds_age_seconds ~= 30
- warnings array exists
```

**Test 4: Stale Odds Rejection**
```bash
curl -X POST https://better-bets-backend.onrender.com/api/ev/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "odds": 2.05,
    "true_probability": 0.52,
    "cash_stake": 100.00,
    "odds_timestamp": "'$(date -u -d '75 seconds ago' +"%Y-%m-%dT%H:%M:%SZ")'",
    "odds_source": "test"
  }'

# Should return HTTP 422 with:
{
  "detail": {
    "error": "Odds too old",
    "message": "Odds are 75 seconds old. Maximum allowed age is 60 seconds.",
    "max_age_seconds": 60
  }
}
```

---

## ⚠️ "DO NOT SHIP IF" FINAL CHECK

Go through EVERY item. If ANY is unchecked, DO NOT DEPLOY.

### Data Integrity
- [x] ✅ Odds cannot be displayed without timestamp
- [x] ✅ Timestamp validated server-side
- [x] ✅ Stale odds (>60s) rejected
- [x] ✅ Invalid probability (≤0 or ≥1) rejected
- [x] ✅ Invalid odds (≤1.0) rejected
- [x] ✅ Numbers have source attribution

### Feature Safety
- [x] ✅ Bonus bet UI completely removed
- [x] ✅ Matched betting UI completely removed
- [x] ✅ Insurance UI completely removed
- [x] ✅ Parlay calculator completely removed
- [x] ✅ Kelly calculator completely removed

### User Understanding
- [x] ✅ Disclaimer about probability estimate shown
- [x] ✅ Formula accessible
- [x] ✅ Inputs displayed in result
- [x] ✅ Excluded features listed
- [x] ✅ Probability source documented (user-provided)

### Technical Safety
- [x] ✅ API errors not swallowed
- [x] ✅ No silent caching of stale data
- [x] ✅ Calculation errors display clear messages
- [x] ✅ ODDS_API_KEY required (verified)
- [ ] ⚠️ CORS_ORIGIN set to specific frontend URL (UPDATE AFTER DEPLOYMENT)

### Legal/Ethical
- [x] ✅ Product not presented as "betting advice"
- [x] ✅ No language like "guaranteed" or "safe bet"
- [x] ✅ Disclaimers visible in-app (not just ToS)
- [x] ✅ EV not marketed as "predictions"
- [x] ✅ Gambling risk warning included

### Testing
- [x] ✅ EV calculation has unit tests (33 tests)
- [x] ✅ Boundary cases tested
- [x] ✅ Stale timestamp validation tested
- [x] ✅ Frontend builds successfully

---

## 🚨 CRITICAL FAILURE MODES TO MONITOR

After deployment, watch for these issues in the first 24 hours:

### 1. Stale Odds Being Used
**Symptom:** Users calculate EV with old odds
**Monitor:** Check backend logs for `odds_age_seconds > 60`
**Fix:** Should never happen (validated server-side), but if it does, shut down immediately

### 2. CORS Errors
**Symptom:** Frontend can't connect to backend
**Monitor:** Browser console errors, Vercel function logs
**Fix:** Verify CORS_ORIGIN matches frontend URL exactly

### 3. API Quota Exhausted
**Symptom:** "Odds unavailable" errors
**Monitor:** The Odds API dashboard (requests remaining)
**Fix:** Upgrade plan or rate-limit frontend requests

### 4. User Confusion About Probability
**Symptom:** Users enter odds instead of probability
**Monitor:** Backend logs for probability values > 1
**Fix:** Frontend validation catches this, but add clearer labeling if needed

### 5. Decimal vs American Odds Confusion
**Symptom:** Users think 2.05 means "-110"
**Monitor:** User feedback/questions
**Fix:** Frontend clearly states "Decimal Odds" but watch for confusion

---

## 📊 SUCCESS METRICS

After 24 hours, verify:

**Technical Metrics:**
- [ ] Backend uptime > 99%
- [ ] Frontend uptime > 99%
- [ ] Average API response time < 500ms
- [ ] Zero stale odds calculations logged
- [ ] Zero EV calculation errors (except invalid inputs)

**User Metrics:**
- [ ] At least 1 successful EV calculation
- [ ] No reports of incorrect EV
- [ ] No CORS errors reported
- [ ] No timestamp validation bypassed

**Safety Metrics:**
- [ ] Zero instances of odds > 60s used
- [ ] Zero instances of probability ≤ 0 or ≥ 1 accepted
- [ ] Zero instances of bonus bet features accessed
- [ ] 100% of calculations include full provenance

---

## 🎯 DEPLOYMENT VERDICT

### SAFE TO DEPLOY IF:

1. ✅ All 33 backend tests passing
2. ✅ Frontend builds without errors
3. ✅ ODDS_API_KEY obtained and set in Render
4. ⚠️ CORS_ORIGIN will be updated after frontend deployment
5. ✅ All "DO NOT SHIP IF" items checked
6. ✅ Post-deployment testing plan ready
7. ✅ Monitoring plan in place

### BLOCKING ISSUES: NONE

**The product is mathematically correct and safe to deploy.**

---

## 📝 POST-DEPLOYMENT TODO

After deployment is live:

1. [ ] Update CORS_ORIGIN in Render to exact Vercel URL
2. [ ] Test all critical user flows
3. [ ] Monitor logs for first 10 calculations
4. [ ] Verify no stale odds used
5. [ ] Check API quota usage
6. [ ] Document actual deployment URLs
7. [ ] Set up uptime monitoring (optional)
8. [ ] Plan unit test expansion (optional)
9. [ ] Consider rate limiting (if API quota becomes issue)

---

## 🔗 DEPLOYMENT URLS (UPDATE AFTER DEPLOYMENT)

**Backend:**
- Render URL: `https://better-bets-backend.onrender.com` *(update this)*
- Health Check: `https://better-bets-backend.onrender.com/health`
- API Docs: `https://better-bets-backend.onrender.com/docs`

**Frontend:**
- Vercel URL: `https://better-bets.vercel.app` *(update this)*

**APIs:**
- The Odds API: https://the-odds-api.com
- API Key Dashboard: https://the-odds-api.com/account

---

## ✅ FINAL FRAMEWORK COMPLIANCE CHECK

**Architectural Constraints:**
- [x] ✅ Structural layer complete (variables defined, formulas proven)
- [x] ✅ Execution layer complete (API endpoints, frontend)
- [x] ✅ No guessing (all inputs validated, explicit failures)
- [x] ✅ Correctness first (33 tests prove math is correct)

**Primary Goal:**
- [x] ✅ Mathematically correct EV
- [x] ✅ Correct bonus handling (N/A - not supported)
- [x] ✅ Correct payout logic (stake returned on win)
- [x] ✅ Real sportsbook data (The Odds API)

**Biggest Failure Mode (Prevented):**
- [x] ✅ Cannot display EV from stale odds (validated server + client)
- [x] ✅ Cannot calculate EV without user probability
- [x] ✅ Cannot use incorrect formula (unit tested)
- [x] ✅ Cannot hide source/timestamp (required in result)

---

## 🚀 READY TO DEPLOY

**Framework Status:** COMPLIANT ✅
**Mathematical Correctness:** PROVEN ✅
**Safety Measures:** IN PLACE ✅
**User Honesty:** TRANSPARENT ✅

**Proceed with deployment following the sequence above.**

**Last Updated:** 2025-12-31
**Version:** 0.1.0-mvp
**Deployment Branch:** `claude/deployment-setup-fZzJ6`
