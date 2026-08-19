import logging
import random
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

# Ordered genre keys to maintain feature index consistency
GENRE_KEYS = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37]

# --- DECISION TREE & RANDOM FOREST REGRESSOR MODELS ---

class Node:
    """
    Represents a single node in a decision tree.
    If it is a leaf, it holds a predicted value. Otherwise, it holds splitting thresholds.
    """
    def __init__(self, feature=None, threshold=None, left=None, right=None, *, value=None):
        self.feature = feature       # Index of the feature to split on
        self.threshold = threshold   # Splitting threshold
        self.left = left             # Left child branch (<= threshold)
        self.right = right           # Right child branch (> threshold)
        self.value = value           # Mean target prediction value (leaf nodes only)

    def is_leaf(self) -> bool:
        return self.value is not None

class DecisionTreeRegressor:
    """
    A lightweight, pure-Python Decision Tree Regressor using variance reduction.
    Supports random feature bagging at splits for Random Forest integration.
    """
    def __init__(self, max_depth=5, min_samples_split=2, max_features=None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features  # Number of features to consider randomly at each split
        self.root = None

    def fit(self, X: List[List[float]], y: List[float]):
        self.root = self._build_tree(X, y, depth=0)

    def _variance(self, y: List[float]) -> float:
        if not y:
            return 0.0
        mean = sum(y) / len(y)
        return sum((val - mean) ** 2 for val in y) / len(y)

    def _build_tree(self, X: List[List[float]], y: List[float], depth: int) -> Node:
        num_samples = len(X)
        if num_samples == 0:
            return Node(value=0.0)

        num_features = len(X[0])

        # Base case / Stopping criteria
        if depth >= self.max_depth or num_samples < self.min_samples_split or len(set(y)) == 1:
            leaf_value = sum(y) / num_samples
            return Node(value=leaf_value)

        # Randomly select a subset of features to split on (for Random Forest feature bagging)
        feature_indices = list(range(num_features))
        if self.max_features is not None:
            k = min(self.max_features, num_features)
            feature_indices = random.sample(feature_indices, k)

        # Search for the best feature and split point using Variance Reduction
        best_feature, best_threshold, best_variance_reduction = None, None, -1.0
        parent_variance = self._variance(y)

        for feat in feature_indices:
            feat_values = [sample[feat] for sample in X]
            thresholds = set(feat_values)
            
            for thresh in thresholds:
                # Divide y targets based on threshold split
                left_y = [y[i] for i in range(num_samples) if X[i][feat] <= thresh]
                right_y = [y[i] for i in range(num_samples) if X[i][feat] > thresh]

                if len(left_y) == 0 or len(right_y) == 0:
                    continue

                # Variance reduction calculations
                w_left = len(left_y) / num_samples
                w_right = len(right_y) / num_samples
                child_variance = w_left * self._variance(left_y) + w_right * self._variance(right_y)
                variance_reduction = parent_variance - child_variance

                if variance_reduction > best_variance_reduction:
                    best_variance_reduction = variance_reduction
                    best_feature = feat
                    best_threshold = thresh

        # If no split improves variance, create leaf node
        if best_variance_reduction <= 0.0 or best_feature is None:
            leaf_value = sum(y) / num_samples
            return Node(value=leaf_value)

        # Split samples and recursively build left & right child branches
        left_idx = [i for i in range(num_samples) if X[i][best_feature] <= best_threshold]
        right_idx = [i for i in range(num_samples) if X[i][best_feature] > best_threshold]

        X_left = [X[i] for i in left_idx]
        y_left = [y[i] for i in left_idx]
        X_right = [X[i] for i in right_idx]
        y_right = [y[i] for i in right_idx]

        left_child = self._build_tree(X_left, y_left, depth + 1)
        right_child = self._build_tree(X_right, y_right, depth + 1)

        return Node(feature=best_feature, threshold=best_threshold, left=left_child, right=right_child)

    def predict_one(self, x: List[float]) -> float:
        node = self.root
        if not node:
            return 0.0
        while not node.is_leaf():
            if x[node.feature] <= node.threshold:
                node = node.left
            else:
                node = node.right
        return node.value

    def predict(self, X: List[List[float]]) -> List[float]:
        return [self.predict_one(x) for x in X]


class RandomForestRegressor:
    """
    A lightweight, pure-Python Random Forest Regressor.
    Constructs an ensemble of Decision Trees trained on bootstrapped samples.
    """
    def __init__(self, n_estimators=10, max_depth=5, min_samples_split=2, max_features=None):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.trees = []

    def fit(self, X: List[List[float]], y: List[float]):
        self.trees = []
        num_samples = len(X)
        if num_samples == 0:
            return

        for _ in range(self.n_estimators):
            # Bootstrap sample: sample with replacement
            indices = [random.randint(0, num_samples - 1) for _ in range(num_samples)]
            X_sample = [X[idx] for idx in indices]
            y_sample = [y[idx] for idx in indices]

            # Fit individual trees with feature subset selection
            tree = DecisionTreeRegressor(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=self.max_features
            )
            tree.fit(X_sample, y_sample)
            self.trees.append(tree)

    def predict_one(self, x: List[float]) -> float:
        if not self.trees:
            return 0.0
        preds = [tree.predict_one(x) for tree in self.trees]
        return sum(preds) / len(self.trees)

    def predict(self, X: List[List[float]]) -> List[float]:
        return [self.predict_one(x) for x in X]

# --- METADATA FEATURE EXTRACTION ---

def extract_features(
    movie: dict,
    fav_genres: List[int],
    pref_languages: List[str],
    watchlist_ids: Set[int],
    similar_to_rated_map: dict,
    similar_to_watchlist_set: Set[int]
) -> List[float]:
    """
    Converts a movie's metadata into a 25-dimensional numeric feature vector.
    
    Dimensions:
    - 0 to 18 (19 dims): Binary indicator of movie genre presence.
    - 19 (1 dim): Preferred language match (1.0 = match, 0.0 = mismatch).
    - 20 (1 dim): Normalized popularity metric (scaled [0, 1]).
    - 21 (1 dim): Normalized vote rating (scaled [0, 1]).
    - 22 (1 dim): Watchlist inclusion flag (1.0 = yes, 0.0 = no).
    - 23 (1 dim): Similarity score multiplier matching high-rated user logs.
    - 24 (1 dim): Similarity flag to user watchlist (1.0 = yes, 0.0 = no).
    """
    # 19 binary genre dimensions
    genre_ids = movie.get("genre_ids", [])
    if "genres" in movie:
        for g in movie["genres"]:
            if isinstance(g, dict) and "id" in g:
                genre_ids.append(g["id"])
            elif isinstance(g, int):
                genre_ids.append(g)

    genre_features = []
    for gkey in GENRE_KEYS:
        genre_features.append(1.0 if gkey in genre_ids else 0.0)

    # 1 language match feature
    lang_match = 0.0
    lang = movie.get("original_language", "")
    if pref_languages and lang in pref_languages:
        lang_match = 1.0

    # 2 normalized global features
    popularity = min(movie.get("popularity", 0.0) / 400.0, 1.0)
    vote_avg = movie.get("vote_average", 0.0) / 10.0

    # 3 interaction features
    m_id = movie.get("id")
    in_watchlist = 1.0 if m_id in watchlist_ids else 0.0

    similar_rated = 0.0
    if m_id in similar_to_rated_map:
        rating = similar_to_rated_map[m_id].get("rating", 0)
        similar_rated = rating / 5.0

    similar_watchlist = 1.0 if m_id in similar_to_watchlist_set else 0.0

    return genre_features + [lang_match, popularity, vote_avg, in_watchlist, similar_rated, similar_watchlist]


def calculate_metrics(X: List[List[float]], y: List[float], dt: DecisionTreeRegressor, rf: RandomForestRegressor) -> dict:
    """
    Computes evaluation metrics (Accuracy, Precision, Recall, F1-Score, and Mean Squared Error)
    for the ensemble models on the training dataset.
    """
    if not X or not y:
        return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, "mse": 0.0}

    num_samples = len(X)
    predictions = []
    for x in X:
        dt_pred = dt.predict_one(x)
        rf_pred = rf.predict_one(x)
        hybrid_pred = (0.4 * dt_pred) + (0.6 * rf_pred)
        predictions.append(hybrid_pred)

    # Compute Mean Squared Error (MSE)
    mse = sum((y[i] - predictions[i]) ** 2 for i in range(num_samples)) / num_samples

    # Compute Classification Metrics at liking threshold 0.6
    threshold = 0.6
    tp, tn, fp, fn = 0, 0, 0, 0
    for i in range(num_samples):
        true_class = 1 if y[i] >= threshold else 0
        pred_class = 1 if predictions[i] >= threshold else 0

        if true_class == 1 and pred_class == 1:
            tp += 1
        elif true_class == 0 and pred_class == 0:
            tn += 1
        elif true_class == 0 and pred_class == 1:
            fp += 1
        elif true_class == 1 and pred_class == 0:
            fn += 1

    accuracy = (tp + tn) / num_samples if num_samples > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "accuracy": round(accuracy * 100, 1),
        "precision": round(precision * 100, 1),
        "recall": round(recall * 100, 1),
        "f1_score": round(f1_score * 100, 1),
        "mse": round(mse, 4)
    }

# --- MAIN RECOMENDATION ROUTINE ---

async def generate_recommendations_for_user(user_id: str) -> tuple:
    try:
        db = get_db()

        # 1. Fetch user preferences, ratings, and watchlists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError("User not found")

        preference = await db.userpreferences.find_one({"userId": ObjectId(user_id)})

        ratings_cursor = db.ratings.find({"userId": ObjectId(user_id)})
        ratings = await ratings_cursor.to_list(length=100)

        watchlist_cursor = db.watchlists.find({"userId": ObjectId(user_id)})
        watchlist = await watchlist_cursor.to_list(length=100)

        # Extract user profile configurations
        fav_genres = preference.get("favoriteGenres", []) if preference else user.get("favoriteGenres", [])
        pref_languages = preference.get("preferredLanguages", ["en"]) if preference else user.get("preferredLanguages", ["en"])

        rated_movie_ids = [r["movieId"] for r in ratings]
        watchlist_movie_ids = [w["movieId"] for w in watchlist]

        # 2. Build candidates pool
        candidates = {} # movieId -> movieDict
        similar_to_rated_map = {} # candidateMovieId -> { title, rating }
        similar_to_watchlist_set = set()

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
            fallback_metrics = {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, "mse": 0.0}
            return [
                {**m, "score": 75, "reason": "🍿 Discovering popular choices to kickstart your taste"}
                for m in default_data if m.get("id") not in watchlist_movie_ids
            ], fallback_metrics

        # 3. Compile training dataset (X, y)
        X_train = []
        y_train = []

        # A. Actual rated movie samples
        for r in ratings:
            try:
                m_details = await tmdb.get_movie_details(r["movieId"])
                if m_details:
                    feats = extract_features(m_details, fav_genres, pref_languages, set(watchlist_movie_ids), similar_to_rated_map, similar_to_watchlist_set)
                    X_train.append(feats)
                    y_train.append(r.get("rating", 3.0) / 5.0)  # Normalize rating [0, 1]
            except Exception as e:
                logger.warning(f"Error fetching training rated movie details: {str(e)}")

        # B. Watchlist movie samples
        for w in watchlist:
            try:
                m_details = await tmdb.get_movie_details(w["movieId"])
                if m_details:
                    feats = extract_features(m_details, fav_genres, pref_languages, set(watchlist_movie_ids), similar_to_rated_map, similar_to_watchlist_set)
                    X_train.append(feats)
                    y_train.append(0.8) # High target indicating positive interest
            except Exception as e:
                logger.warning(f"Error fetching training watchlist movie details: {str(e)}")

        # C. Synthetic/Baseline Samples derived from onboarding choices
        # (Ensures model has enough samples to converge and avoids cold start)
        synthetic_pool = popular_data.get("results", [])[:15] + top_rated_data.get("results", [])[:15]
        for movie in synthetic_pool:
            m_id = movie.get("id")
            if m_id in rated_movie_ids or m_id in watchlist_movie_ids:
                continue

            feats = extract_features(movie, fav_genres, pref_languages, set(watchlist_movie_ids), similar_to_rated_map, similar_to_watchlist_set)
            
            movie_genres = movie.get("genre_ids", [])
            has_genre_match = any(g in fav_genres for g in movie_genres) if fav_genres else True
            has_lang_match = movie.get("original_language") in pref_languages if pref_languages else True

            if has_genre_match and has_lang_match:
                label = 0.8
            elif has_genre_match or has_lang_match:
                label = 0.5
            else:
                label = 0.2

            X_train.append(feats)
            y_train.append(label)

        # 4. Train decision tree and random forest regressors
        # Standard configuration: max_features = sqrt(25) = 5 for Random Forest bagging
        dt = DecisionTreeRegressor(max_depth=5, min_samples_split=2)
        rf = RandomForestRegressor(n_estimators=10, max_depth=5, min_samples_split=2, max_features=5)

        dt.fit(X_train, y_train)
        rf.fit(X_train, y_train)

        # Calculate diagnostics metrics on training set
        metrics = calculate_metrics(X_train, y_train, dt, rf)

        # 5. Score candidates using the ensemble hybrid tree models
        scored_list = []
        for m_id, movie in candidates.items():
            if m_id in rated_movie_ids:
                continue

            feats = extract_features(movie, fav_genres, pref_languages, set(watchlist_movie_ids), similar_to_rated_map, similar_to_watchlist_set)
            
            # Predict from both tree structures
            dt_pred = dt.predict_one(feats)
            rf_pred = rf.predict_one(feats)
            
            # Weighted average combination
            hybrid_pred = (0.4 * dt_pred) + (0.6 * rf_pred)
            total_score = round(hybrid_pred * 100)
            
            # Bound check
            total_score = max(min(total_score, 100), 0)

            # Determine dynamic reasoning matching tree nodes
            matching_genre_names = []
            movie_genres = movie.get("genre_ids", [])
            for g in movie_genres:
                if g in fav_genres and g in GENRE_MAP:
                    matching_genre_names.append(GENRE_MAP[g])

            reason = "🌲 Recommended by Random Forest ensemble"
            if m_id in similar_to_rated_map:
                source = similar_to_rated_map[m_id]
                reason = f"🎬 Similar to \"{source['title']}\" which you rated {source['rating']}★"
            elif m_id in similar_to_watchlist_set:
                reason = f"🔖 Similar to a movie in your watchlist"
            elif matching_genre_names:
                reason = f"🌲 Tree Model Match matching your favorite genre: {matching_genre_names[0]}"
            elif movie.get("original_language") in pref_languages:
                reason = f"🌐 Language matches your preference profile"
            elif movie.get("vote_average", 0.0) > 7.5:
                reason = f"🔥 Highly rated global recommendation"

            movie_copy = dict(movie)
            movie_copy["score"] = total_score
            movie_copy["reason"] = reason
            scored_list.append(movie_copy)

        # Sort by prediction score descending
        scored_list = sorted(scored_list, key=lambda x: x["score"], reverse=True)

        if not scored_list:
            default_data = popular_data.get("results", [])
            return [
                {**m, "score": 75, "reason": "🍿 Discovering popular choices to kickstart your taste"}
                for m in default_data if m.get("id") not in watchlist_movie_ids
            ], metrics

        return scored_list[:20], metrics

    except Exception as e:
        logger.error(f"🚨 Recommendation generation error: {str(e)}")
        raise e
