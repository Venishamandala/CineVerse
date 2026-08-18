from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from server.models.models import RatingSubmit, serialize_doc, serialize_docs
from server.middleware.auth import get_current_user
from server.config.db import get_db

router = APIRouter()

@router.get("")
async def get_ratings(current_user: dict = Depends(get_current_user)):
    db = get_db()
    ratings_cursor = db.ratings.find({"userId": current_user["_id"]})
    ratings_list = await ratings_cursor.to_list(length=200)
    
    return {
        "success": True,
        "data": serialize_docs(ratings_list)
    }

@router.post("")
async def submit_rating(data: RatingSubmit, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Check if rating already exists for this movie by this user
    existing = await db.ratings.find_one({
        "userId": current_user["_id"],
        "movieId": data.movieId
    })
    
    now = datetime.utcnow()
    
    if existing:
        # Update existing rating
        await db.ratings.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "rating": data.rating,
                    "movieTitle": data.movieTitle,
                    "posterPath": data.posterPath,
                    "updatedAt": now
                }
            }
        )
        rating_id = existing["_id"]
    else:
        # Create new rating
        new_rating = {
            "userId": current_user["_id"],
            "movieId": data.movieId,
            "movieTitle": data.movieTitle,
            "posterPath": data.posterPath,
            "rating": data.rating,
            "createdAt": now,
            "updatedAt": now
        }
        result = await db.ratings.insert_one(new_rating)
        rating_id = result.inserted_id
        
    # Log 'rate' interaction
    await db.userinteractions.insert_one({
        "userId": current_user["_id"],
        "movieId": data.movieId,
        "interactionType": "rate",
        "timestamp": now
    })
    
    # Fetch and return rating
    created_rating = await db.ratings.find_one({"_id": rating_id})
    
    return {
        "success": True,
        "message": "Rating submitted successfully",
        "data": serialize_doc(created_rating)
    }

@router.delete("/{movie_id}")
async def delete_rating(movie_id: int, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    result = await db.ratings.delete_one({
        "userId": current_user["_id"],
        "movieId": movie_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found for this movie"
        )
        
    return {
        "success": True,
        "message": "Rating deleted successfully"
    }
