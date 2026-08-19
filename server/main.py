import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cineverse")

from server.config.db import connect_db
from server.routes.auth import router as auth_router
from server.routes.movies import router as movies_router
from server.routes.watchlist import router as watchlist_router
from server.routes.ratings import router as ratings_router
from server.routes.recommendations import router as recommendations_router
from server.routes.users import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect database on startup
    await connect_db()
    yield
    # Cleanup on shutdown if needed
    logger.info("👋 Shutting down backend server...")

app = FastAPI(
    title="CineVerse API",
    description="Python FastAPI backend for CineVerse Premium Movie Recommender",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS (Cross-Origin Resource Sharing)
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
origins = [client_url]
for fallback in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]:
    if fallback not in origins:
        origins.append(fallback)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOUNT API ROUTERS ---
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(movies_router, prefix="/api/movies", tags=["Movies"])
app.include_router(watchlist_router, prefix="/api/watchlist", tags=["Watchlist"])
app.include_router(ratings_router, prefix="/api/ratings", tags=["Ratings"])
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])

# Basic check/ping route
@app.get("/health")
async def health():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# --- SERVE STATIC FRONTEND IN PRODUCTION ---
# Resolve absolute path to client build directory
CLIENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../client/dist"))

if os.path.exists(CLIENT_DIR):
    logger.info(f"✨ Production mode active. Mounting static assets from: {CLIENT_DIR}")
    
    # Mount the CSS/JS assets directory
    assets_dir = os.path.join(CLIENT_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    # Mount favicon and direct assets
    public_icons = os.path.join(CLIENT_DIR, "favicon.svg")
    if os.path.exists(public_icons):
        @app.get("/favicon.svg")
        async def get_favicon():
            return FileResponse(public_icons)

    # Wildcard catch-all route to serve the React SPA for routing requests
    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        # Ignore API request queries
        if catchall.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        return FileResponse(os.path.join(CLIENT_DIR, "index.html"))
else:
    logger.warning("⚠️ Warning: Client build directory ('client/dist') not found. Serving API endpoints only.")
