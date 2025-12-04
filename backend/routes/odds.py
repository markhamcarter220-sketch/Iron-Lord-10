
from fastapi import APIRouter, Query
from services.odds_service import devig_odds

router = APIRouter(prefix="/api/odds", tags=["odds"])

@router.get("/devig")
def devig_endpoint(home: int = Query(...), away: int = Query(...)):
    true_probs = devig_odds(home, away)
    return {
        "input": { "home": home, "away": away },
        "true_probabilities": true_probs,
        "margin": round(sum(true_probs.values()), 4)
    }
