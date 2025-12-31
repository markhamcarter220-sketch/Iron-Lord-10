from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from utils.logger import log_requests
from utils.errors import odds_api_error_handler, validation_exception_handler, http_exception_handler

# CORRECT ENDPOINTS - Safe for deployment
from routes import health, ev, validated_odds

# DISABLED ENDPOINTS - Contain incorrect math or unsupported features
# from routes import clv, odds_best, bets, odds
# - bets: Uses incorrect EV formula (implied probability instead of true probability)
# - odds: Devig endpoint not part of MVP
# - clv: CLV calculation not part of MVP
# - odds_best: Best lines finder - needs review before enabling

app = FastAPI(
    title="Better Bets API",
    description="Mathematically correct betting EV calculator. MVP: Cash bets only.",
    version="0.1.0-mvp"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.middleware("http")(log_requests)

# ENABLED ROUTERS (MVP)
app.include_router(health.router)
app.include_router(ev.router)
app.include_router(validated_odds.router)

app.add_exception_handler(Exception, odds_api_error_handler)
app.add_exception_handler(422, validation_exception_handler)
app.add_exception_handler(404, http_exception_handler)
