from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class OddsAPIError(Exception):
    def __init__(self, message):
        self.message = message

async def odds_api_error_handler(request: Request, exc: OddsAPIError):
    return JSONResponse(status_code=500, content={"ok": False, "error": {"type": "OddsAPIError", "message": str(exc.message)}})

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"ok": False, "error": {"type": "ValidationError", "message": str(exc)}})

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"ok": False, "error": {"type": "HTTPException", "message": exc.detail}})
