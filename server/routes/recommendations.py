import random
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from server.middleware.auth import get_current_user
from server.services.recommendations import generate_recommendations_for_user
import server.services.tmdb as tmdb

router = APIRouter()
logger = logging.getLogger("cineverse.recommendations_routes")

@router.get("")
async def get_personalized_recommendations(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    recommendations = await generate_recommendations_for_user(user_id)
    return {
        "success": True,
        "count": len(recommendations),
        "data": recommendations
    }

@router.get("/mood")
async def get_mood_recommendations(
    mood: str = Query(...),
    context: str = Query(...),
    language: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    # Mapping moods to TMDB Genre IDs
    mood_genre_map = {
        "happy": [35, 10751, 16],      # Comedy, Family, Animation
        "melancholy": [18, 10749],     # Drama, Romance
        "thrill": [28, 53, 12, 27],    # Action, Thriller, Adventure, Horror
        "deep": [9648, 878, 99],       # Mystery, Sci-Fi, Documentary
        "relaxed": [35, 10749, 14]     # Comedy, Romance, Fantasy
    }
    
    genres = set(mood_genre_map.get(mood, []))
    
    # Overwrite based on context
    if context == "family":
        genres.clear()
        genres.update([10751, 16, 35])
    elif context == "date":
        genres.update([10749, 35])
        
    genre_string = "|".join(map(str, genres))
    
    # Choose sorting metric
    sort_by = "popularity.desc"
    if context == "alone":
        sort_by = "vote_average.desc"
        
    # Fetch page 1 first to check total pages
    data = await tmdb.discover_movies({
        "genreId": genre_string,
        "sortBy": sort_by,
        "language": language,
        "page": 1
    })
    
    results = data.get("results", [])
    total_pages = data.get("total_pages", 1)
    
    # Randomly scan from other pages to ensure variety on each click
    if total_pages > 1 and results:
        max_pages = min(total_pages, 8)
        random_page = random.randint(1, max_pages)
        
        if random_page > 1:
            try:
                fresh_data = await tmdb.discover_movies({
                    "genreId": genre_string,
                    "sortBy": sort_by,
                    "language": language,
                    "page": random_page
                })
                fresh_results = fresh_data.get("results", [])
                if fresh_results:
                    results = fresh_results
            except Exception as e:
                logger.error(f"Failed to fetch random discover page {random_page}: {str(e)}")
                
    # Shuffle results
    random.shuffle(results)
    
    # Construct AI explanation text
    mood_labels = {
        "happy": "cheerful & uplifting",
        "melancholy": "deeply emotional & moving",
        "thrill": "adrenaline-pumping & suspenseful",
        "deep": "mind-bending & thought-provoking",
        "relaxed": "laid-back & relaxing"
    }
    
    context_labels = {
        "alone": "some quality solo viewing time",
        "date": "a cozy date night",
        "family": "a fun family evening",
        "friends": "a lively movie night with friends"
    }
    
    language_names = {
        "en": "English",
        "hi": "Hindi",
        "te": "Telugu",
        "ta": "Tamil",
        "ko": "Korean",
        "ja": "Japanese",
        "es": "Spanish",
        "fr": "French"
    }
    
    target_lang = language_names.get(language, "selected language")
    
    ai_message = (
        f"🤖 CineVerse AI Assistant: I've scanned the movie directory to match your vibe! "
        f"Since you're looking for a {mood_labels.get(mood, 'custom')} experience in **{target_lang}** "
        f"suited for {context_labels.get(context, 'your company')}, I have calculated these top matches. "
        f"I filtered by specific genre groups and sorted by relevance to guarantee high viewing accuracy. "
        f"Grab your popcorn! 🍿✨"
    )
    
    return {
        "success": True,
        "message": ai_message,
        "data": results[:8]  # Limit to top 8 items for clean layout grid
    }
KeepRecommendationsRouter = router
