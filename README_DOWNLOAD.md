# Iron Lord 10 - Complete Project Package

**Betting Analytics Application with CLV, EV, and Kelly Criterion Calculations**

---

## 📦 What's Included

This zip contains the complete Iron Lord 10 application, ready to run locally or deploy to production.

### 🎯 Key Features

- **Bet Logging**: Full-featured form to log your sports bets
- **Calculation Breakdowns**: Detailed step-by-step math for:
  - CLV (Closing Line Value)
  - Expected Value (EV)
  - Kelly Criterion
- **Bet History**: View all your bets with expandable calculation details
- **Security**: Input validation, CORS protection, NoSQL injection prevention
- **Production Ready**: Configured for Render (backend) + Vercel (frontend)

---

## 📁 Project Structure

```
Iron-Lord-10/
├── backend/                    # FastAPI Backend
│   ├── main.py                # App entry point
│   ├── models/                # Pydantic models
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   ├── db/                    # Database setup
│   ├── config/                # Settings
│   ├── utils/                 # Helpers
│   ├── tests/                 # API tests
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
│
├── src/                       # React Frontend
│   ├── components/            # React components
│   │   ├── BetLogger.jsx     # Bet logging form
│   │   ├── BetHistory.jsx    # Bet history display
│   │   └── CalculationBreakdown.jsx
│   └── main.jsx              # App entry point
│
├── DEPLOYMENT.md              # Complete deployment guide
├── CODE_REVIEW.md             # Code analysis & recommendations
├── IMPLEMENTATION_SUMMARY.md  # Features & improvements summary
├── TEST_CALCULATION_BREAKDOWN.md  # Testing guide
├── package.json               # Node dependencies
├── vite.config.js            # Build configuration
├── render.yaml               # Render deployment config
├── vercel.json               # Vercel deployment config
└── .env.example              # Frontend environment template
```

---

## 🚀 Quick Start - Local Development

### Prerequisites

- Node.js 18+ (https://nodejs.org)
- Python 3.11+ (https://python.org)
- MongoDB (https://www.mongodb.com/try/download/community)

### 1. Extract the Zip

```bash
unzip Iron-Lord-10.zip
cd Iron-Lord-10
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Required: MONGO_URI, ODDS_API_KEY

# Set up database indexes (run once)
cd db
python setup_indexes.py
cd ..

# Start backend
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 3. Frontend Setup

```bash
# In a new terminal, navigate to project root
cd Iron-Lord-10

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local
# Set: VITE_API_URL=http://localhost:8000

# Start frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### 4. Access the App

Open your browser to: **http://localhost:5173**

---

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017

# Get from https://the-odds-api.com/
ODDS_API_KEY=your_api_key_here

# CORS origins (comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Port (optional, default 8000)
PORT=8000

# Log level
LOG_LEVEL=info
```

### Frontend Environment Variables

Edit `.env.local`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000
```

---

## 🌐 Production Deployment

This project is configured for easy deployment:

- **Backend**: Render.com (FastAPI + MongoDB)
- **Frontend**: Vercel.com (React/Vite)

**Read `DEPLOYMENT.md` for complete step-by-step instructions.**

### Quick Deployment Steps:

1. **Set up MongoDB Atlas** (free tier available)
2. **Deploy to Render** (backend)
3. **Deploy to Vercel** (frontend)
4. **Update CORS settings** with production URLs

Total time: ~30 minutes | Cost: Free tier available

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `DEPLOYMENT.md` | Complete deployment guide (400+ lines) |
| `CODE_REVIEW.md` | Code analysis, security review, recommendations |
| `IMPLEMENTATION_SUMMARY.md` | Features implemented, improvements made |
| `TEST_CALCULATION_BREAKDOWN.md` | How to test calculation features |

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
pip install pytest
pytest tests/
```

### Test the API

```bash
# Health check
curl http://localhost:8000/health

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

# Get bet history
curl http://localhost:8000/api/bets/history/testuser
```

---

## 🔒 Security Features

✅ CORS restricted to specific origins
✅ Username validation (prevents NoSQL injection)
✅ Input validation on all bet fields
✅ Odds must be > 1.0 and < 1000
✅ Stakes must be > 0 and < $100,000
✅ MongoDB connection pooling & error handling
✅ Environment variables (no secrets in code)

---

## 📊 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - Document database
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Vanilla CSS** - Styling (no framework)

### Deployment
- **Render** - Backend hosting
- **Vercel** - Frontend hosting
- **MongoDB Atlas** - Managed database

---

## 💡 Key Features Explained

### 1. Calculation Breakdown

Shows users the exact math behind each metric:

```
CLV = (Your Odds - Closing Odds) / |Closing Odds|
Example: (2.1 - 2.0) / 2.0 = 0.05 = 5% CLV
```

Each bet displays:
- Formula
- Substituted values
- Step-by-step calculation
- Final result
- Plain English interpretation

### 2. Bet Logger

Full-featured form with:
- All required fields (user, sport, matchup, book, odds, stake)
- Optional fields (closing odds, result)
- Validation (HTML5 + backend)
- Success/error feedback
- Auto-clear after submission

### 3. Bet History

- Displays all bets for a user
- Color-coded stats (green = positive, red = negative)
- Expandable calculation details
- Error handling with user-friendly messages
- Loading states

---

## 🛠️ Troubleshooting

### MongoDB Connection Failed

**Error:** `Failed to connect to MongoDB`

**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check connection string in `.env`
3. For MongoDB Atlas, whitelist your IP

### CORS Errors

**Error:** `Access-Control-Allow-Origin` error

**Solution:**
1. Check `CORS_ORIGIN` in `backend/.env`
2. Must match frontend URL exactly
3. Restart backend after changing

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Dependencies Won't Install

**Backend:**
```bash
# Upgrade pip
pip install --upgrade pip

# Clear cache
pip cache purge

# Reinstall
pip install -r requirements.txt
```

**Frontend:**
```bash
# Clear cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 Next Steps

After getting the app running:

1. ✅ Test logging bets through the UI
2. ✅ Check calculation breakdowns
3. ✅ Review `CODE_REVIEW.md` for improvements
4. ✅ Read `DEPLOYMENT.md` to go live
5. ✅ Set up monitoring (UptimeRobot)
6. ✅ Configure custom domain (optional)
7. ✅ Add more features from backlog

---

## 📞 Support & Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Docs:** https://react.dev
- **MongoDB Docs:** https://www.mongodb.com/docs
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

## 🎯 Project Stats

- **Backend Files:** 20+ Python files
- **Frontend Files:** 8 React components
- **Documentation:** 1500+ lines
- **Total Code:** ~3000 lines
- **Security Score:** 8.5/10
- **Production Ready:** ✅

---

## ⚖️ License

This project is provided as-is for educational and personal use.

---

## 🙏 Acknowledgments

Built with:
- FastAPI for the blazing-fast backend
- React for the interactive UI
- MongoDB for flexible data storage
- Render & Vercel for easy deployment

---

**Ready to track your betting performance like a pro?**

Start by running `npm run dev` (frontend) and `uvicorn main:app --reload` (backend)!

🚀 Happy Betting Analytics!
