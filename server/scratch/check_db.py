import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def main():
    mongo_uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {mongo_uri[:30]}...")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    print(f"Default database name: {db.name}")
    
    # List collections
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    # Fetch last 3 users
    print("\n--- Recent Users ---")
    users = await db.users.find().sort("createdAt", -1).to_list(length=3)
    for u in users:
        print(f"ID: {u['_id']}, Name: {u.get('name')}, Email: {u.get('email')}, Langs: {u.get('preferredLanguages')}, Genres: {u.get('favoriteGenres')}")

    # Fetch last 3 ratings
    print("\n--- Recent Ratings ---")
    ratings = await db.ratings.find().sort("createdAt", -1).to_list(length=3)
    for r in ratings:
        print(f"User: {r.get('userId')}, Movie: {r.get('movieTitle')}, Rating: {r.get('rating')}")

    # Fetch last 3 preferences
    print("\n--- Recent UserPreferences ---")
    prefs = await db.userpreferences.find().to_list(length=3)
    for p in prefs:
        print(f"User: {p.get('userId')}, Langs: {p.get('preferredLanguages')}, Genres: {p.get('favoriteGenres')}")

if __name__ == "__main__":
    asyncio.run(main())
