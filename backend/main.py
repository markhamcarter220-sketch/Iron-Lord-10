from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from utils.logger import log_requests
from utils.errors import odds_api_error_handler, validation_exception_handler, http_exception_handler

from routes import clv, odds_best, health, bets, odds

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=[settings.CORS_ORIGIN], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.middleware("http")(log_requests)

app.include_router(health.router)
app.include_router(bets.router)
app.include_router(odds.router)

app.add_exception_handler(Exception, odds_api_error_handler)
app.add_exception_handler(422, validation_exception_handler)
app.add_exception_handler(404, http_exception_handler)

app.include_router(odds_best.router)

app.include_router(clv.router)
