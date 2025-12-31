"""
Database index setup script for optimal query performance.
Run this script once to create indexes on the bets collection.
"""

from mongo import get_bets_collection
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_indexes():
    """Create indexes on the bets collection for better query performance."""
    try:
        bets_collection = get_bets_collection()

        # Index on user field for fast user-specific queries
        bets_collection.create_index([("user", 1)])
        logger.info("Created index on 'user' field")

        # Index on loggedAt for time-based queries
        bets_collection.create_index([("loggedAt", -1)])
        logger.info("Created index on 'loggedAt' field")

        # Compound index for user + time queries (most common)
        bets_collection.create_index([("user", 1), ("loggedAt", -1)])
        logger.info("Created compound index on 'user' and 'loggedAt' fields")

        # Index on sport for filtering by sport
        bets_collection.create_index([("sport", 1)])
        logger.info("Created index on 'sport' field")

        # Index on sportsbook for filtering by sportsbook
        bets_collection.create_index([("sportsbook", 1)])
        logger.info("Created index on 'sportsbook' field")

        logger.info("All indexes created successfully!")

        # Show all indexes
        indexes = list(bets_collection.list_indexes())
        logger.info(f"Current indexes: {[idx['name'] for idx in indexes]}")

    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        raise

if __name__ == "__main__":
    setup_indexes()
