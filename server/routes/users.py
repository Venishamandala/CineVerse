from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any
from server.models.models import OnboardingUpdate, serialize_doc
from server.middleware.auth import get_current_user
from server.config.db import get_db

router = APIRouter()

GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
}

LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "te": "Telugu", "ta": "Tamil", "ml": "Malayalam",
    "kn": "Kannada", "ko": "Korean", "ja": "Japanese", "es": "Spanish", "fr": "French"
}

@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["_id"]
    
    # Run counts in parallel
    ratings_count = await db.ratings.count_documents({"userId": user_id})
    watchlist_count = await db.watchlists.count_documents({"userId": user_id, "watched": False})
    watched_count = await db.watchlists.count_documents({"userId": user_id, "watched": True})
    
    return {
        "success": True,
        "data": {
            "id": str(user_id),
            "name": current_user["name"],
            "email": current_user["email"],
            "avatar": current_user.get("avatar", "🍿"),
            "preferredLanguages": current_user.get("preferredLanguages", ["en"]),
            "favoriteGenres": current_user.get("favoriteGenres", []),
            "createdAt": current_user.get("createdAt"),
            "stats": {
                "moviesRated": ratings_count,
                "watchlistCount": watchlist_count,
                "moviesWatched": watched_count
            }
        }
    }

@router.post("/preferences")
async def update_preferences(data: OnboardingUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["_id"]
    now = datetime.utcnow()
    
    # Update in User table
    await db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "preferredLanguages": data.preferredLanguages,
                "favoriteGenres": data.favoriteGenres,
                "updatedAt": now
            }
        }
    )
    
    # Update or Create in UserPreference collection (MERN sync behavior)
    await db.userpreferences.update_one(
        {"userId": user_id},
        {
            "$set": {
                "preferredLanguages": data.preferredLanguages,
                "favoriteGenres": data.favoriteGenres,
                "updatedAt": now
            }
        },
        upsert=True
    )
    
    # Fetch preferences
    preference = await db.userpreferences.find_one({"userId": user_id})
    
    return {
        "success": True,
        "message": "Preferences updated successfully.",
        "data": serialize_doc(preference)
    }

@router.get("/analytics")
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["_id"]
    
    # A. Rating distribution
    ratings_cursor = db.ratings.find({"userId": user_id})
    ratings = await ratings_cursor.to_list(length=1000)
    
    rating_distribution = [
        {"name": "1★", "count": 0},
        {"name": "2★", "count": 0},
        {"name": "3★", "count": 0},
        {"name": "4★", "count": 0},
        {"name": "5★", "count": 0}
    ]
    
    for r in ratings:
        val = int(r.get("rating", 0))
        idx = val - 1
        if 0 <= idx < 5:
            rating_distribution[idx]["count"] += 1
            
    # B. Favorite genres analysis
    favorite_genres_data = []
    favorite_genres = current_user.get("favoriteGenres", [])
    for gid in favorite_genres:
        favorite_genres_data.append({
            "name": GENRE_MAP.get(gid, "Other"),
            "value": 10
        })
        
    if not favorite_genres_data:
        # Default placeholder metrics to prevent empty charts rendering weirdly
        favorite_genres_data = [
            {"name": "Action", "value": 0},
            {"name": "Drama", "value": 0},
            {"name": "Comedy", "value": 0},
            {"name": "Sci-Fi", "value": 0}
        ]
        
    # C. Preferred Languages breakdown
    preferred_languages_data = []
    preferred_languages = current_user.get("preferredLanguages", [])
    for lang in preferred_languages:
        preferred_languages_data.append({
            "name": LANGUAGE_NAMES.get(lang, lang.upper()),
            "value": 1
        })
        
    # D. User Activity over time (grouped interactions by date)
    interactions_cursor = db.userinteractions.find({"userId": user_id}).sort("timestamp", 1)
    interactions = await interactions_cursor.to_list(length=100)
    
    activity_data = []
    date_map = {}
    
    for inter in interactions:
        ts = inter.get("timestamp")
        if ts:
            # Format: 'Aug 18'
            date_str = ts.strftime('%b %d')
            date_map[date_str] = date_map.get(date_str, 0) + 1
            
    for date, count in date_map.items():
        activity_data.append({
            "date": date,
            "interactions": count
        })
        
    # Fallback: If no activity logs yet, create standard empty onboarding point
    if not activity_data:
        today_str = datetime.utcnow().strftime('%b %d')
        activity_data.append({"date": today_str, "interactions": 1})
        
    return {
        "success": True,
        "data": {
            "ratingDistribution": rating_distribution,
            "favoriteGenres": favorite_genres_data,
            "preferredLanguages": preferred_languages_data,
            "activityData": activity_data
        }
    }
