from pymongo import MongoClient
from config.settings import settings

client = MongoClient(settings.MONGO_URI)
db = client["ironman"]

def get_bets_collection():
    return db["bets"]
