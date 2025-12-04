
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from typing import List
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to local MongoDB (replace with URI in production)
client = MongoClient("mongodb://localhost:27017")
db = client["ironman"]
bets_collection = db["bets"]

# Pydantic model for Bet
class Bet(BaseModel):
    user: str
    matchup: str
    sportsbook: str
    odds: float
    stake: float
    closing_odds: float = None

# Log bet with optional closing line value (CLV)
@app.post("/api/bets/log")
async def log_bet(bet: Bet):
    clv = round((bet.odds - bet.closing_odds) / abs(bet.closing_odds), 3) if bet.closing_odds else None
    bet_dict = bet.dict()
    bet_dict["clv"] = clv
    bet_dict["id"] = str(uuid.uuid4())
    bets_collection.insert_one(bet_dict)
    return {"status": "logged", "bet": bet_dict}

# Get all bets for a user
@app.get("/api/bets/history/{user}")
def get_user_bets(user: str):
    results = list(bets_collection.find({"user": user}, {"_id": 0}))
    return {"bets": results}

# Session tracking middleware
@app.middleware("http")
async def assign_user_id(request: Request, call_next):
    if "user-id" not in request.headers:
        request.state.user_id = "anonymous"
    else:
        request.state.user_id = request.headers["user-id"]
    response = await call_next(request)
    return response
