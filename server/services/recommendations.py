import logging
import re
import math
from typing import List, Dict, Set, Optional, Any
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

# --- TF-IDF & COSINE SIMILARITY UTILITIES ---

class SimpleTFIDF:
    """
    A lightweight, pure-Python TF-IDF vectorizer that cleans text, 
    removes stopwords, calculates IDFs with smoothing, and transforms text to TF-IDF vectors.
    """
    def __init__(self):
        self.idf = {}
        self.vocabulary = set()
        
    def _tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        text = text.lower()
        # Remove non-alphanumeric characters
        text = re.sub(r'[^a-z0-9\s]', '', text)
        words = text.split()
        
        # Standard English stopwords to filter out noisy terms
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'in', 'on', 'at', 
            'by', 'of', 'with', 'about', 'as', 'into', 'from', 'this', 'that', 'these', 'those', 'it', 'its', 
            'they', 'them', 'their', 'who', 'whom', 'which', 'what', 'he', 'him', 'his', 'she', 'her', 'hers', 
            'you', 'your', 'we', 'us', 'our', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 
            'should', 'can', 'could', 'may', 'might', 'must', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 
            'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 
            'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 
            'too', 'very', 's', 't', 'just', 'now'
        }
        # Keep words that are longer than 2 characters and not in stopwords
        return [w for w in words if w not in stopwords and len(w) > 2]

    def fit(self, documents: List[str]):
        tokenized_docs = [self._tokenize(doc) for doc in documents]
        num_docs = len(documents)
        
        # Count document frequency of each word
        doc_counts = {}
        for doc in tokenized_docs:
            unique_words = set(doc)
            for word in unique_words:
                doc_counts[word] = doc_counts.get(word, 0) + 1
                
        self.idf = {}
        self.vocabulary = set(doc_counts.keys())
        for word, count in doc_counts.items():
            # Standard smoothed IDF formula
            self.idf[word] = math.log((1 + num_docs) / (1 + count)) + 1

    def transform(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        
        tf = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
            
        doc_len = len(tokens)
        vector = {}
        for word, freq in tf.items():
            if word in self.idf:
                tf_val = freq / doc_len
                vector[word] = tf_val * self.idf[word]
                
        return vector

def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """
    Computes cosine similarity between two sparse TF-IDF vectors.
    Returns a float between 0.0 and 1.0.
    """
    if not vec1 or not vec2:
        return 0.0
    
    # Calculate dot product
    dot_product = 0.0
    for word, val1 in vec1.items():
        if word in vec2:
            dot_product += val1 * vec2[word]
            
    # Calculate magnitudes
    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
    
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
        
    return dot_product / (mag1 * mag2)

def extract_movie_text(movie: dict) -> str:
    """
    Extracts text features from a movie object including title, overview, and genre names.
    """
    title = movie.get("title") or movie.get("movieTitle") or movie.get("original_title") or ""
    overview = movie.get("overview") or ""
    
    genre_names = []
    if "genre_ids" in movie:
        genre_names = [GENRE_MAP.get(gid, "") for gid in movie["genre_ids"] if gid in GENRE_MAP]
    elif "genres" in movie:
        for g in movie["genres"]:
            if isinstance(g, dict) and "name" in g:
                genre_names.append(g["name"])
            elif isinstance(g, int) and g in GENRE_MAP:
                genre_names.append(GENRE_MAP[g])
                
    genres_str = " ".join([name for name in genre_names if name])
    return f"{title} {overview} {genres_str}"

# --- MAIN RECOMMENDATION LOGIC ---

async def generate_recommendations_for_user(user_id: str) -> list:
    try:
        db = get_db()
        
        # 1. Fetch user preferences, ratings, and watchlist
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
        
        # 2. Build candidates pool from TMDB
        candidates = {} # movieId -> movieDict
        similar_to_rated_map = {} # candidateMovieId -> { title, rating }
        similar_to_watchlist_set = set()
        
        # Fetch base lists
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

        # If candidates pool is empty, return popular fallback
        if not candidates:
            default_data = popular_data.get("results", [])
            return [
                {**m, "score": 75, "reason": "🍿 Discovering popular choices to kickstart your taste"}
                for m in default_data if m.get("id") not in watchlist_movie_ids
            ]

        # 3. Content Profile Construction & TF-IDF vectorization
        user_profile_docs = []
        
        # Fetch detailed metadata (including overviews) for rated movies to build profile text
        for rated_movie in high_rated_movies:
            try:
                m_details = await tmdb.get_movie_details(rated_movie["movieId"])
                if m_details:
                    user_profile_docs.append(extract_movie_text(m_details))
            except Exception as e:
                logger.warning(f"Error fetching rated movie details {rated_movie['movieId']}: {str(e)}")
                
        # Fetch detailed metadata for watchlist movies to build profile text
        for watch_item in watchlist_sample:
            try:
                m_details = await tmdb.get_movie_details(watch_item["movieId"])
                if m_details:
                    user_profile_docs.append(extract_movie_text(m_details))
            except Exception as e:
                logger.warning(f"Error fetching watchlist movie details {watch_item['movieId']}: {str(e)}")
                
        # Fallback profile using onboarding choices if no items are rated/watchlisted
        if not user_profile_docs:
            onboarding_genre_names = [GENRE_MAP.get(gid, "") for gid in fav_genres if gid in GENRE_MAP]
            user_profile_docs.append(" ".join(onboarding_genre_names + pref_languages))
            
        # Compile all candidate documents
        candidate_docs = []
        candidate_ids = []
        for m_id, movie in candidates.items():
            candidate_docs.append(extract_movie_text(movie))
            candidate_ids.append(m_id)
            
        # Build TF-IDF on complete text corpus (user profile docs + candidate docs)
        corpus = user_profile_docs + candidate_docs
        tfidf = SimpleTFIDF()
        tfidf.fit(corpus)
        
        # Construct centroid user profile vector
        user_vectors = [tfidf.transform(doc) for doc in user_profile_docs]
        user_profile_vector = {}
        for vec in user_vectors:
            for word, val in vec.items():
                user_profile_vector[word] = user_profile_vector.get(word, 0.0) + val
                
        if user_vectors:
            for word in user_profile_vector:
                user_profile_vector[word] /= len(user_vectors)
                
        # 4. Score candidates using the Hybrid Recommendation algorithm
        scored_list = []
        
        for m_id, movie in candidates.items():
            # Skip if user has already rated this movie
            if m_id in rated_movie_ids:
                continue
                
            # --- A. TF-IDF & Cosine Similarity Score (30% weight) ---
            candidate_vector = tfidf.transform(extract_movie_text(movie))
            cosine_sim = cosine_similarity(candidate_vector, user_profile_vector)
            tfidf_score = cosine_sim * 30
            
            # Identify overlapping terms that contributed most to the similarity score
            overlapping_terms = []
            for word, val in candidate_vector.items():
                if word in user_profile_vector and val > 0 and user_profile_vector[word] > 0:
                    overlapping_terms.append((word, val * user_profile_vector[word]))
            overlapping_terms.sort(key=lambda x: x[1], reverse=True)
            top_terms = [word for word, _ in overlapping_terms[:3]]
            
            # --- B. Genre Preference Score (20% weight) ---
            movie_genres = movie.get("genre_ids", [])
            genre_score = 0
            if fav_genres and movie_genres:
                matching_genres = [g for g in movie_genres if g in fav_genres]
                genre_score = (len(matching_genres) / len(movie_genres)) * 20
            else:
                genre_score = 10
                
            # --- C. Language Preference Score (20% weight) ---
            lang_score = 10
            if pref_languages and movie.get("original_language") in pref_languages:
                lang_score = 20
                
            # --- D. Previous Ratings Similarity (15% weight) ---
            ratings_score = 0
            if m_id in similar_to_rated_map:
                source = similar_to_rated_map[m_id]
                if source["rating"] == 5:
                    ratings_score = 15
                elif source["rating"] == 4:
                    ratings_score = 10
                else:
                    ratings_score = 5
                    
            # --- E. Watchlist Similarity (10% weight) ---
            watchlist_score = 0
            if m_id in similar_to_watchlist_set:
                watchlist_score = 10
                
            # --- F. Popularity & Vote Average (10% weight) ---
            vote_avg = movie.get("vote_average", 0)
            vote_score = (vote_avg / 10) * 5
            
            pop = movie.get("popularity", 0)
            pop_score = min(pop / 400, 1.0) * 5
            
            popularity_score = vote_score + pop_score
            
            # Combined Hybrid Score (Max: 30 + 20 + 20 + 15 + 10 + 10 = 100)
            total_score = round(tfidf_score + genre_score + lang_score + ratings_score + watchlist_score + popularity_score)
            
            # 5. Determine personalized explanation reason
            reason = '✨ Handpicked matching your taste'
            if m_id in similar_to_rated_map:
                source = similar_to_rated_map[m_id]
                reason = f"🎬 Similar to \"{source['title']}\" which you rated {source['rating']}★"
            elif m_id in similar_to_watchlist_set:
                reason = f"🔖 Similar to a movie in your watchlist"
            elif tfidf_score > 10 and top_terms:
                reason = f"🍿 Matches your taste in themes like: {', '.join(top_terms)}"
            elif genre_score > 10:
                matches = [GENRE_MAP[gid] for gid in movie_genres if gid in fav_genres and gid in GENRE_MAP]
                if matches:
                    reason = f"🍿 Recommended because you like {', '.join(matches[:2])}"
            elif lang_score > 10 and vote_avg > 7.5:
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
                {**m, "score": 75, "reason": "🍿 Discovering popular choices to kickstart your taste"}
                for m in default_data if m.get("id") not in watchlist_movie_ids
            ]
            
        return scored_list[:20]
    except Exception as e:
        logger.error(f"🚨 Recommendation generation error: {str(e)}")
        raise e
