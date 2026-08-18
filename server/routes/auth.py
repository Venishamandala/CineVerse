from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from server.models.models import UserRegister, UserLogin, OnboardingUpdate, serialize_doc
from server.middleware.auth import hash_password, verify_password, generate_token, get_current_user
from server.config.db import get_db
from datetime import datetime

router = APIRouter()

@router.post("/register")
async def register(data: UserRegister):
    db = get_db()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered with this email"
        )
        
    # Hash password and create user document
    hashed_pwd = hash_password(data.password)
    new_user = {
        "name": data.name.strip(),
        "email": data.email.lower(),
        "passwordHash": hashed_pwd,
        "avatar": "🍿",
        "preferredLanguages": ["en"],
        "favoriteGenres": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = generate_token(user_id)
    
    # Fetch created user info (excluding password hash)
    created_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return {
        "success": True,
        "token": token,
        "user": serialize_doc(created_user)
    }

@router.post("/login")
async def login(data: UserLogin):
    db = get_db()
    
    # Find user
    user = await db.users.find_one({"email": data.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid login credentials"
        )
        
    # Validate password
    if not verify_password(data.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid login credentials"
        )
        
    # Generate token
    token = generate_token(str(user["_id"]))
    
    return {
        "success": True,
        "token": token,
        "user": serialize_doc(user)
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": serialize_doc(current_user)
    }

@router.put("/onboarding")
async def onboarding(data: OnboardingUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    # Update onboarding settings
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "preferredLanguages": data.preferredLanguages,
                "favoriteGenres": data.favoriteGenres,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    # Update userpreferences collection as well (MERN sync behavior)
    await db.userpreferences.update_one(
        {"userId": current_user["_id"]},
        {
            "$set": {
                "preferredLanguages": data.preferredLanguages,
                "favoriteGenres": data.favoriteGenres,
                "updatedAt": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "success": True,
        "message": "Preferences updated successfully",
        "user": serialize_doc(updated_user)
    }
