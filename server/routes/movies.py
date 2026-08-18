from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from typing import Optional
from datetime import datetime
import server.services.tmdb as tmdb
from server.middleware.auth import get_optional_user
from server.config.db import get_db

router = APIRouter()

@router.get("/popular")
async def get_popular(page: int = Query(1, ge=1)):
    data = await tmdb.get_popular_movies({"page": page})
    return {"success": True, "data": data}

@router.get("/trending")
async def get_trending(page: int = Query(1, ge=1)):
    data = await tmdb.get_trending_movies("day", {"page": page})
    return {"success": True, "data": data}

@router.get("/top-rated")
async def get_top_rated(page: int = Query(1, ge=1)):
    data = await tmdb.get_top_rated_movies({"page": page})
    return {"success": True, "data": data}

@router.get("/upcoming")
async def get_upcoming(page: int = Query(1, ge=1)):
    data = await tmdb.get_upcoming_movies({"page": page})
    return {"success": True, "data": data}

@router.get("/search")
async def search(q: str = Query(None), page: int = Query(1, ge=1), current_user: Optional[dict] = Depends(get_optional_user)):
    if not q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Query parameter "q" is required.'
        )
    
    data = await tmdb.search_movies(q, {"page": page})
    
    # Save search query history if authenticated
    if current_user and len(q.strip()) > 1:
        db = get_db()
        await db.searchhistories.insert_one({
            "userId": current_user["_id"],
            "query": q.strip(),
            "createdAt": datetime.utcnow()
        })
        
    return {"success": True, "data": data}

@router.get("/genres")
async def get_genres():
    data = await tmdb.get_genres()
    return {"success": True, "data": data}

@router.get("/discover")
async def discover(
    genre: Optional[str] = None,
    language: Optional[str] = None,
    year: Optional[str] = None,
    sortBy: Optional[str] = None,
    page: int = Query(1, ge=1)
):
    params = {"page": page}
    if genre:
        params["genreId"] = genre
    if language:
        params["language"] = language
    if year:
        params["year"] = year
    if sortBy:
        params["sortBy"] = sortBy
        
    data = await tmdb.discover_movies(params)
    return {"success": True, "data": data}

@router.get("/{movie_id}")
async def get_movie_by_id(movie_id: int, current_user: Optional[dict] = Depends(get_optional_user)):
    data = await tmdb.get_movie_details(movie_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found on TMDB"
        )
        
    # Query and attach watch providers
    try:
        providers = await tmdb.get_watch_providers(movie_id)
        data["watch_providers"] = providers.get("results", {})
    except Exception:
        data["watch_providers"] = {}
        
    # Log user view interaction if authenticated
    if current_user:
        db = get_db()
        await db.userinteractions.insert_one({
            "userId": current_user["_id"],
            "movieId": movie_id,
            "interactionType": "view",
            "timestamp": datetime.utcnow()
        })
        
    return {"success": True, "data": data}

@router.get("/{movie_id}/credits")
async def get_movie_credits(movie_id: int):
    data = await tmdb.get_movie_credits(movie_id)
    return {"success": True, "data": data}

@router.get("/{movie_id}/videos")
async def get_movie_videos(movie_id: int, current_user: Optional[dict] = Depends(get_optional_user)):
    data = await tmdb.get_movie_videos(movie_id)
    
    # Log user click trailer interaction if authenticated
    if current_user:
        db = get_db()
        await db.userinteractions.insert_one({
            "userId": current_user["_id"],
            "movieId": movie_id,
            "interactionType": "click_trailer",
            "timestamp": datetime.utcnow()
        })
        
    return {"success": True, "data": data}

@router.get("/{movie_id}/similar")
async def get_similar(movie_id: int):
    data = await tmdb.get_similar_movies(movie_id)
    return {"success": True, "data": data}
