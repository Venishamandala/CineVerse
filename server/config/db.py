import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("cineverse.db")

db_client = None
db = None

async def connect_db():
    global db_client, db
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        logger.error("🚨 MONGODB_URI is not set in environment variables!")
        raise RuntimeError("MONGODB_URI is missing")
    
    try:
        db_client = AsyncIOMotorClient(mongo_uri)
        # Ping the server to check connectivity
        await db_client.admin.command('ping')
        # Retrieve the database from the connection string or fallback to 'cineverse'
        db = db_client.get_default_database(default="cineverse")
        logger.info(f"📡 MongoDB Connected: {db.name}")
    except Exception as e:
        logger.error(f"🚨 MongoDB Connection Error: {str(e)}")
        raise e

def get_db():
    global db
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return db
