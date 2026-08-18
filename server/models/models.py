from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

from bson import ObjectId

def serialize_doc(doc: Any) -> Optional[dict]:
    if doc is None:
        return None
    
    serialized = {}
    for k, v in dict(doc).items():
        if isinstance(v, ObjectId):
            serialized[k] = str(v)
        elif isinstance(v, list):
            serialized[k] = [str(x) if isinstance(x, ObjectId) else x for x in v]
        elif isinstance(v, dict):
            serialized[k] = serialize_doc(v)
        else:
            serialized[k] = v
            
    if "id" not in serialized and "_id" in dict(doc):
        # Already string-converted in the loop above
        serialized["id"] = serialized["_id"]
        del serialized["_id"]
        
    return serialized

def serialize_docs(docs: List[Any]) -> List[dict]:
    return [serialize_doc(doc) for doc in docs if doc is not None]


# --- USER SCHEMAS ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    avatar: str = "🍿"
    preferredLanguages: List[str] = ["en"]
    favoriteGenres: List[int] = []
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None

class OnboardingUpdate(BaseModel):
    preferredLanguages: List[str]
    favoriteGenres: List[int]


# --- RATING SCHEMAS ---
class RatingSubmit(BaseModel):
    movieId: int
    movieTitle: str
    posterPath: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)

class RatingResponse(BaseModel):
    id: str
    userId: str
    movieId: int
    movieTitle: str
    posterPath: Optional[str] = None
    rating: int
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


# --- WATCHLIST SCHEMAS ---
class WatchlistAdd(BaseModel):
    movieId: int
    movieTitle: str
    posterPath: Optional[str] = None

class WatchlistResponse(BaseModel):
    id: str
    userId: str
    movieId: int
    movieTitle: str
    posterPath: Optional[str] = None
    watched: bool = False
    addedAt: datetime


# --- SEARCH & INTERACTIONS SCHEMAS ---
class SearchHistoryCreate(BaseModel):
    query: str

class UserInteractionCreate(BaseModel):
    movieId: int
    interactionType: str # view, click_trailer, search, watchlist_add, rate
