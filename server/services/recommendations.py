import logging
from bson import ObjectId
from server.config.db import get_db
import server.services.tmdb as tmdb

logger = logging.getLogger("cineverse.recommendations")

GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
}

async def generate_recommendations_for_user(user_id: str) -> list:
    try:
        db = get_db()
        
        # 1. Fetch user preferences, ratings, and watchlist in parallel (as far as motor allows)
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError("User not found")
            
        preference = await db.userpreferences.find_one({"userId": ObjectId(user_id)})
        
        ratings_cursor = db.ratings.find({"userId": ObjectId(user_id)})
        ratings = await ratings_cursor.to_list(length=100)
        
        watchlist_cursor = db.watchlists.find({"userId": ObjectId(user_id)})
        watchlist = await watchlist_cursor.to_list(length=100)
        
        # Extract user profile filters
        fav_genres = preference.get("favoriteGenres", []) if preference else user.get("favoriteGenres", [])
        pref_languages = preference.get("preferredLanguages", ["en"]) if preference else user.get("preferredLanguages", ["en"])
        
        rated_movie_ids = [r["movieId"] for r in ratings]
        watchlist_movie_ids = [w["movieId"] for w in watchlist]
        
        # 2. Build candidates pool
        candidates = {} # movieId -> movieDict
        similar_to_rated_map = {} # candidateMovieId -> { title, rating }
        similar_to_watchlist_set = set()
        
        # Fetch base lists from TMDB
        popular_data = await tmdb.get_popular_movies({"page": 1})
        top_rated_data = await tmdb.get_top_rated_movies({"page": 1})
        trending_data = await tmdb.get_trending_movies("week", {"page": 1})
        
        def add_candidates(movie_list):
            if movie_list and isinstance(movie_list, list):
                for movie in movie_list:
                    m_id = movie.get("id")
                    if m_id and m_id not in candidates:
                        candidates[m_id] = movie
                        
        add_candidates(popular_data.get("results", []))
        add_candidates(top_rated_data.get("results", []))
        add_candidates(trending_data.get("results", []))
        
        # Fetch similar movies for user's high rated movies (rating >= 4)
        high_rated_movies = [r for r in ratings if r.get("rating", 0) >= 4]
        high_rated_movies = sorted(high_rated_movies, key=lambda x: x.get("rating", 0), reverse=True)[:3]
        
        for rated_movie in high_rated_movies:
            similar_data = await tmdb.get_similar_movies(rated_movie["movieId"])
            results = similar_data.get("results", [])
            if results and isinstance(results, list):
                for movie in results:
                    m_id = movie.get("id")
                    if m_id:
                        if m_id not in candidates:
                            candidates[m_id] = movie
                        similar_to_rated_map[m_id] = {
                            "title": rated_movie["movieTitle"],
                            "rating": rated_movie["rating"]
                        }
                        
        # Fetch similar movies for items in watchlist
        watchlist_sample = watchlist[:3]
        for item in watchlist_sample:
            similar_data = await tmdb.get_similar_movies(item["movieId"])
            results = similar_data.get("results", [])
            if results and isinstance(results, list):
                for movie in results:
                    m_id = movie.get("id")
                    if m_id:
                        if m_id not in candidates:
                            candidates[m_id] = movie
                        similar_to_watchlist_set.add(m_id)
                        
        # 3. Score candidates
        scored_list = []
        
        for m_id, movie in candidates.items():
            # Skip if user has rated this movie
            if m_id in rated_movie_ids:
                continue
                
            genre_score = 0
            lang_score = 0
            ratings_score = 0
            watchlist_score = 0
            popularity_score = 0
            
            movie_genres = movie.get("genre_ids", [])
            
            # --- A. Genre Preference (30% weight) ---
            if fav_genres and movie_genres:
                matching_genres = [g for g in movie_genres if g in fav_genres]
                genre_score = (len(matching_genres) / len(movie_genres)) * 30
            else:
                genre_score = 15
                
            # --- B. Language Preference (20% weight) ---
            if pref_languages:
                if movie.get("original_language") in pref_languages:
                    lang_score = 20
            else:
                lang_score = 10
                
            # --- C. Previous Ratings Similarity (25% weight) ---
            if m_id in similar_to_rated_map:
                source = similar_to_rated_map[m_id]
                if source["rating"] == 5:
                    ratings_score = 25
                elif source["rating"] == 4:
                    ratings_score = 18
                else:
                    ratings_score = 10
                    
            # --- D. Watchlist Similarity (15% weight) ---
            if m_id in similar_to_watchlist_set:
                watchlist_score = 15
                
            # --- E. Popularity & Vote Average (10% weight) ---
            vote_avg = movie.get("vote_average", 0)
            vote_score = (vote_avg / 10) * 5
            
            pop = movie.get("popularity", 0)
            pop_score = min(pop / 400, 1.0) * 5
            
            popularity_score = vote_score + pop_score
            
            # Total Score
            total_score = round(genre_score + lang_score + ratings_score + watchlist_score + popularity_score)
            
            # Determine explanation reason
            reason = '✨ Handpicked matching your taste'
            if m_id in similar_to_rated_map:
                source = similar_to_rated_map[m_id]
                reason = f"🎬 Similar to \"{source['title']}\" which you rated {source['rating']}★"
            elif m_id in similar_to_watchlist_set:
                reason = f"🔖 Similar to a movie in your watchlist"
            elif genre_score > 15:
                matches = [GENRE_MAP[gid] for gid in movie_genres if gid in fav_genres and gid in GENRE_MAP]
                if matches:
                    reason = f"🍿 Recommended because you like {', '.join(matches[:2])}"
            elif lang_score > 0 and vote_avg > 7.5:
                reason = f"🌐 Popular high-rated film in your preferred languages"
            elif popularity_score > 8:
                reason = f"🔥 Trending blockbuster loved by many"
                
            movie_copy = dict(movie)
            movie_copy["score"] = total_score
            movie_copy["reason"] = reason
            scored_list.append(movie_copy)
            
        # Sort by score descending
        scored_list = sorted(scored_list, key=lambda x: x["score"], reverse=True)
        
        # If new user (no scored items), return popular movies
        if not scored_list:
            default_data = popular_data.get("results", [])
            return [
                {**m, "score": 75, "reason": "🍿 Discovering popular choices to kickstart your deck"}
                for m in default_data if m.get("id") not in watchlist_movie_ids
            ]
            
        return scored_list[:20]
    except Exception as e:
        logger.error(f"🚨 Recommendation generation error: {str(e)}")
        raise e
