import logging
from fastapi import Request

logger = logging.getLogger("ironman")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def log_requests(request: Request, call_next):
    logger.info(f">>> {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"<<< {response.status_code} {request.method} {request.url}")
    return response
