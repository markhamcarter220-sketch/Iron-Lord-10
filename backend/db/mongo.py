from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

try:
    client = MongoClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
        maxPoolSize=50,
        minPoolSize=10,
        retryWrites=True
    )
    # Verify connection
    client.admin.command('ping')
    db = client["ironman"]
    logger.info("Successfully connected to MongoDB")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise Exception(f"MongoDB connection failed: {e}")

def get_bets_collection():
    """Get the bets collection from MongoDB."""
    return db["bets"]
