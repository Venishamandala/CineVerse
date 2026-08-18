from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from server.models.models import WatchlistAdd, serialize_doc, serialize_docs
from server.middleware.auth import get_current_user
from server.config.db import get_db

router = APIRouter()

# Schema for watched status toggle request
class WatchedToggle(BaseModel):
    watched: Optional[bool] = None

@router.get("")
async def get_watchlist(current_user: dict = Depends(get_current_user)):
    db = get_db()
    watchlist_cursor = db.watchlists.find({"userId": current_user["_id"]})
    watchlist_items = await watchlist_cursor.to_list(length=200)
    
    return {
        "success": True,
        "data": serialize_docs(watchlist_items)
    }

@router.post("")
async def add_to_watchlist(data: WatchlistAdd, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Check if duplicate exists
    existing = await db.watchlists.find_one({
        "userId": current_user["_id"],
        "movieId": data.movieId
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie already exists in your watchlist"
        )
        
    # Create watchlist item
    new_item = {
        "userId": current_user["_id"],
        "movieId": data.movieId,
        "movieTitle": data.movieTitle,
        "posterPath": data.posterPath,
        "watched": False,
        "addedAt": datetime.utcnow()
    }
    
    result = await db.watchlists.insert_one(new_item)
    
    # Log watchlist_add interaction
    await db.userinteractions.insert_one({
        "userId": current_user["_id"],
        "movieId": data.movieId,
        "interactionType": "watchlist_add",
        "timestamp": datetime.utcnow()
    })
    
    # Fetch and return the created item
    created_item = await db.watchlists.find_one({"_id": result.inserted_id})
    
    return {
        "success": True,
        "message": "Movie added to watchlist",
        "data": serialize_doc(created_item)
    }

@router.get("/{movie_id}/check")
async def check_watchlist_status(movie_id: int, current_user: dict = Depends(get_current_user)):
    db = get_db()
    item = await db.watchlists.find_one({
        "userId": current_user["_id"],
        "movieId": movie_id
    })
    
    return {
        "success": True,
        "inWatchlist": bool(item),
        "watched": item.get("watched", False) if item else False
    }

@router.patch("/{movie_id}/watched")
async def toggle_watched(movie_id: int, data: WatchedToggle, current_user: dict = Depends(get_current_user)):
    db = get_db()
    item = await db.watchlists.find_one({
        "userId": current_user["_id"],
        "movieId": movie_id
    })
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found in watchlist"
        )
        
    watched_val = data.watched if data.watched is not None else not item.get("watched", False)
    
    await db.watchlists.update_one(
        {"_id": item["_id"]},
        {"$set": {"watched": watched_val}}
    )
    
    updated_item = await db.watchlists.find_one({"_id": item["_id"]})
    
    return {
        "success": True,
        "message": f"Movie marked as {'watched' if watched_val else 'unwatched'}.",
        "data": serialize_doc(updated_item)
    }

@router.delete("/{movie_id}")
async def remove_from_watchlist(movie_id: int, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    result = await db.watchlists.delete_one({
        "userId": current_user["_id"],
        "movieId": movie_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found in your watchlist"
        )
        
    return {
        "success": True,
        "message": "Movie removed from watchlist"
    }
