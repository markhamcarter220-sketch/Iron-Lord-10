from pydantic import BaseSettings

class Settings(BaseSettings):
    ODDS_API_KEY: str
    MONGO_URI: str = "mongodb://localhost:27017"
    PORT: int = 8000
    CORS_ORIGIN: str = "*"
    LOG_LEVEL: str = "info"

    class Config:
        env_file = ".env"

settings = Settings()
