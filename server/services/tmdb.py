import os
import logging
import httpx
from typing import Dict, Any, List, Optional

logger = logging.getLogger("cineverse.tmdb")

# Load environment configs
def get_api_key() -> Optional[str]:
    key = os.getenv("TMDB_API_KEY")
    if not key or key == "YOUR_TMDB_API_KEY":
        return None
    return key

def get_access_token() -> Optional[str]:
    token = os.getenv("TMDB_ACCESS_TOKEN")
    if not token or token == "YOUR_TMDB_ACCESS_TOKEN":
        return None
    return token

BASE_URL = "https://api.themoviedb.org/3"

# Offline local fallback dataset
FALLBACK_MOVIES = [
    {
        "id": 299534,
        "title": "Avengers: Endgame",
        "overview": "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos actions and restore balance to the universe.",
        "poster_path": "/or0650GuJ623nBg4wjC6P1COjtw.jpg",
        "backdrop_path": "/7RyG42NGmBSGc61m9r1g4Xm50c6.jpg",
        "release_date": "2019-04-24",
        "vote_average": 8.3,
        "vote_count": 24000,
        "popularity": 185.4,
        "original_language": "en",
        "genre_ids": [28, 12, 878]
    },
    {
        "id": 27205,
        "title": "Inception",
        "overview": "Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is offered a chance to have his history erased as payment for a seemingly impossible task: \"inception\", the implantation of another person's idea into a target's subconscious.",
        "poster_path": "/o01vCoZSZk88m94IeoB58u8rCcS.jpg",
        "backdrop_path": "/s3TBrRGB1K7jY4P7n5TIc712XU3.jpg",
        "release_date": "2010-07-15",
        "vote_average": 8.4,
        "vote_count": 34000,
        "popularity": 120.5,
        "original_language": "en",
        "genre_ids": [28, 12, 878, 9648]
    },
    {
        "id": 157336,
        "title": "Interstellar",
        "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
        "poster_path": "/gEU2QvEOm36v1nszLX34vRPxsjB.jpg",
        "backdrop_path": "/rAiXDVeL0G4v4ZhjHdZMAv6LI0k.jpg",
        "release_date": "2014-11-05",
        "vote_average": 8.4,
        "vote_count": 32000,
        "popularity": 145.2,
        "original_language": "en",
        "genre_ids": [12, 18, 878]
    },
    {
        "id": 603,
        "title": "The Matrix",
        "overview": "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
        "poster_path": "/f89U3wL3CUBMRZyZdvi26ONDEen.jpg",
        "backdrop_path": "/lMF0w83vYW6QZJ3ISrAT4CYNs7I.jpg",
        "release_date": "1999-03-30",
        "vote_average": 8.2,
        "vote_count": 24000,
        "popularity": 98.4,
        "original_language": "en",
        "genre_ids": [28, 878]
    },
    {
        "id": 578,
        "title": "Spirited Away",
        "overview": "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
        "poster_path": "/39wmItIWsg5JmZ72uy3hbvtGBWB.jpg",
        "backdrop_path": "/Ab8nDFiVnTHnNSbiLxJuFSgfkJu.jpg",
        "release_date": "2001-07-20",
        "vote_average": 8.5,
        "vote_count": 15000,
        "popularity": 85.9,
        "original_language": "ja",
        "genre_ids": [14, 12, 16, 10751]
    },
    {
        "id": 129,
        "title": "Parasite",
        "overview": "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
        "poster_path": "/7IiCm095zkfsBM3tZsW0VfXc7Eg.jpg",
        "backdrop_path": "/hiKSL3X6eeie36je7w84kq4slE1.jpg",
        "release_date": "2019-05-30",
        "vote_average": 8.5,
        "vote_count": 17000,
        "popularity": 92.3,
        "original_language": "ko",
        "genre_ids": [35, 18, 53]
    },
    {
        "id": 680,
        "title": "Pulp Fiction",
        "overview": "A burger-loving hitman, his philosophical partner, a drug-addled gangster's moll, and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that weave in and out of chronological order.",
        "poster_path": "/d5i251k4CU92tt5xydgG21V3U7C.jpg",
        "backdrop_path": "/sua755ssGGE162wz1twCkdWgGNY.jpg",
        "release_date": "1994-09-10",
        "vote_average": 8.5,
        "vote_count": 26000,
        "popularity": 110.2,
        "original_language": "en",
        "genre_ids": [53, 80]
    },
    {
        "id": 13,
        "title": "Forrest Gump",
        "overview": "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. Yet, despite all the things he has attained, his one true love, Jenny, eludes him.",
        "poster_path": "/arw2vcJz275qp6jm6B4GIgV34ev.jpg",
        "backdrop_path": "/3h1JZgV8YPjPnX96m11qj7R1JbF.jpg",
        "release_date": "1994-06-23",
        "vote_average": 8.5,
        "vote_count": 25000,
        "popularity": 104.5,
        "original_language": "en",
        "genre_ids": [35, 18, 10749]
    }
]

GENRES = [
    {"id": 28, "name": "Action"},
    {"id": 12, "name": "Adventure"},
    {"id": 16, "name": "Animation"},
    {"id": 35, "name": "Comedy"},
    {"id": 80, "name": "Crime"},
    {"id": 99, "name": "Documentary"},
    {"id": 18, "name": "Drama"},
    {"id": 10751, "name": "Family"},
    {"id": 14, "name": "Fantasy"},
    {"id": 36, "name": "History"},
    {"id": 27, "name": "Horror"},
    {"id": 10402, "name": "Music"},
    {"id": 9648, "name": "Mystery"},
    {"id": 10749, "name": "Romance"},
    {"id": 878, "name": "Science Fiction"},
    {"id": 10770, "name": "TV Movie"},
    {"id": 53, "name": "Thriller"},
    {"id": 10752, "name": "War"},
    {"id": 37, "name": "Western"}
]

LANGUAGES = [
    {"iso_639_1": "en", "english_name": "English", "name": "English"},
    {"iso_639_1": "hi", "english_name": "Hindi", "name": "हिन्दी"},
    {"iso_639_1": "te", "english_name": "Telugu", "name": "తెలుగు"},
    {"iso_639_1": "ta", "english_name": "Tamil", "name": "தமிழ்"},
    {"iso_639_1": "ml", "english_name": "Malayalam", "name": "മലയാളം"},
    {"iso_639_1": "kn", "english_name": "Kannada", "name": "ಕನ್ನಡ"},
    {"iso_639_1": "ko", "english_name": "Korean", "name": "한국어"},
    {"iso_639_1": "ja", "english_name": "Japanese", "name": "日本語"},
    {"iso_639_1": "es", "english_name": "Spanish", "name": "Español"},
    {"iso_639_1": "fr", "english_name": "French", "name": "Français"}
]

def check_api_key_warning() -> bool:
    if not get_api_key() and not get_access_token():
        logger.warning("⚠️ Warning: TMDB_API_KEY is not set. CineVerse will run in offline mode using local fallback data.")
        return True
    return False

# Asynchronous helper to query external TMDB endpoint with fallback support
async def safe_request(path: str, params: dict = None, fallback_data: Any = None) -> Any:
    if check_api_key_warning():
        return fallback_data
        
    api_key = get_api_key()
    token = get_access_token()
    
    headers = {}
    query_params = params.copy() if params else {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    elif api_key:
        query_params["api_key"] = api_key
        
    url = f"{BASE_URL}{path}"
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=query_params, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"🚨 TMDB Request returned status {response.status_code}: {response.text}")
                return fallback_data
    except Exception as e:
        logger.error(f"🚨 TMDB API Request failed: {str(e)}. Returning fallback dataset.")
        return fallback_data


# --- TMDB WRAPPER METHODS ---
async def get_popular_movies(params: dict = None) -> dict:
    return await safe_request("/movie/popular", params, {"results": FALLBACK_MOVIES, "page": 1, "total_pages": 1})

async def get_trending_movies(time_window: str = "day", params: dict = None) -> dict:
    return await safe_request(f"/trending/movie/{time_window}", params, {"results": FALLBACK_MOVIES, "page": 1, "total_pages": 1})

async def get_top_rated_movies(params: dict = None) -> dict:
    sorted_fallbacks = sorted(FALLBACK_MOVIES, key=lambda m: m["vote_average"], reverse=True)
    return await safe_request("/movie/top_rated", params, {"results": sorted_fallbacks, "page": 1, "total_pages": 1})

async def get_now_playing_movies(params: dict = None) -> dict:
    return await safe_request("/movie/now_playing", params, {"results": FALLBACK_MOVIES, "page": 1, "total_pages": 1})

async def get_upcoming_movies(params: dict = None) -> dict:
    return await safe_request("/movie/upcoming", params, {"results": FALLBACK_MOVIES, "page": 1, "total_pages": 1})

async def search_movies(query: str, params: dict = None) -> dict:
    if not query:
        return {"results": []}
    clean_params = params.copy() if params else {}
    clean_params["query"] = query
    
    fallback_filter = [
        m for m in FALLBACK_MOVIES 
        if query.lower() in m["title"].lower() or query.lower() in m["overview"].lower()
    ]
    return await safe_request(
        "/search/movie", 
        clean_params, 
        {"results": fallback_filter, "page": 1, "total_pages": 1}
    )

async def get_movie_details(movie_id: int) -> dict:
    fallback = next((m for m in FALLBACK_MOVIES if m["id"] == movie_id), FALLBACK_MOVIES[0])
    return await safe_request(f"/movie/{movie_id}", None, fallback)

async def get_movie_credits(movie_id: int) -> dict:
    fallback = {
        "cast": [
            {"id": 1, "name": "Leonardo DiCaprio", "character": "Cobb", "profile_path": None},
            {"id": 2, "name": "Robert Downey Jr.", "character": "Tony Stark", "profile_path": None},
            {"id": 3, "name": "Matthew McConaughey", "character": "Cooper", "profile_path": None},
            {"id": 4, "name": "Keanu Reeves", "character": "Neo", "profile_path": None}
        ],
        "crew": [
            {"id": 10, "name": "Christopher Nolan", "job": "Director"},
            {"id": 11, "name": "Lana Wachowski", "job": "Director"}
        ]
    }
    return await safe_request(f"/movie/{movie_id}/credits", None, fallback)

async def get_movie_videos(movie_id: int) -> dict:
    fallback = {
        "results": [
            {
                "id": "5c6",
                "key": "YoHD9OB-Y3k",
                "name": "Official Trailer",
                "site": "YouTube",
                "type": "Trailer"
            }
        ]
    }
    return await safe_request(f"/movie/{movie_id}/videos", None, fallback)

async def get_watch_providers(movie_id: int) -> dict:
    fallback = {
        "results": {
            "IN": {
                "flatrate": [
                    {"logo_path": "/t2zUg4hxY04d4rj3xhyPRjlheh9.jpg", "provider_name": "Netflix"},
                    {"logo_path": "/5NyHN4tZ69x1jC2cy1j31b5u4jF.jpg", "provider_name": "Amazon Prime Video"},
                    {"logo_path": "/9A1Uz9x4rZCY2rJ1P2b3c4d5eF.jpg", "provider_name": "Disney+ Hotstar"}
                ]
            }
        }
    }
    return await safe_request(f"/movie/{movie_id}/watch/providers", None, fallback)

async def get_similar_movies(movie_id: int, params: dict = None) -> dict:
    fallback = [m for m in FALLBACK_MOVIES if m["id"] != movie_id]
    return await safe_request(f"/movie/{movie_id}/similar", params, {"results": fallback, "page": 1, "total_pages": 1})

async def get_recommendations(movie_id: int, params: dict = None) -> dict:
    fallback = [m for m in FALLBACK_MOVIES if m["id"] != movie_id]
    return await safe_request(f"/movie/{movie_id}/recommendations", params, {"results": fallback, "page": 1, "total_pages": 1})

async def get_genres() -> dict:
    return await safe_request("/genre/movie/list", None, {"genres": GENRES})

async def get_languages() -> dict:
    return {"languages": LANGUAGES}

async def discover_movies(params: dict = None) -> dict:
    query_params = {}
    if params:
        if "genreId" in params:
            query_params["with_genres"] = params["genreId"]
        if "language" in params:
            query_params["with_original_language"] = params["language"]
        if "year" in params:
            query_params["primary_release_year"] = params["year"]
        if "sortBy" in params:
            query_params["sort_by"] = params["sortBy"]
        if "page" in params:
            query_params["page"] = params["page"]
            
    return await safe_request("/discover/movie", query_params, {"results": FALLBACK_MOVIES, "page": 1, "total_pages": 1})
