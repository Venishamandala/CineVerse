const tmdbService = require('./tmdbService');
const Rating = require('../models/Rating');
const Watchlist = require('../models/Watchlist');
const UserPreference = require('../models/UserPreference');
const User = require('../models/User');

const generateRecommendationsForUser = async (userId) => {
  try {
    // 1. Fetch user preferences, ratings, and watchlist
    const [user, preference, ratings, watchlist] = await Promise.all([
      User.findById(userId),
      UserPreference.findOne({ userId }),
      Rating.find({ userId }),
      Watchlist.find({ userId })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Extract lists
    const favGenres = preference ? preference.favoriteGenres : (user.favoriteGenres || []);
    const prefLanguages = preference ? preference.preferredLanguages : (user.preferredLanguages || ['en']);
    
    const ratedMovieIds = ratings.map(r => r.movieId);
    const watchlistMovieIds = watchlist.map(w => w.movieId);
    const ratedMovieMap = new Map(ratings.map(r => [r.movieId, r.rating]));

    // 2. Build candidates pool
    const candidates = new Map(); // key: movieId, value: movieObject
    const similarToRatedMap = new Map(); // key: candidateMovieId, value: { sourceTitle, sourceRating }
    const similarToWatchlistSet = new Set(); // candidateMovieId is similar to watchlist

    // Fetch popular and top rated movies as base candidates
    const [popularData, topRatedData, trendingData] = await Promise.all([
      tmdbService.getPopularMovies({ page: 1 }),
      tmdbService.getTopRatedMovies({ page: 1 }),
      tmdbService.getTrendingMovies('week', { page: 1 })
    ]);

    const addCandidates = (movieList) => {
      if (movieList && Array.isArray(movieList)) {
        movieList.forEach(movie => {
          if (!candidates.has(movie.id)) {
            candidates.set(movie.id, movie);
          }
        });
      }
    };

    addCandidates(popularData.results);
    addCandidates(topRatedData.results);
    addCandidates(trendingData.results);

    // Fetch similar movies for user's high rated movies (rating >= 4)
    const highRatedMovies = ratings.filter(r => r.rating >= 4).sort((a, b) => b.rating - a.rating).slice(0, 3);
    for (const ratedMovie of highRatedMovies) {
      const similarData = await tmdbService.getSimilarMovies(ratedMovie.movieId);
      if (similarData && Array.isArray(similarData.results)) {
        similarData.results.forEach(movie => {
          if (!candidates.has(movie.id)) {
            candidates.set(movie.id, movie);
          }
          // Track that this movie is similar to a highly rated movie
          similarToRatedMap.set(movie.id, {
            title: ratedMovie.movieTitle,
            rating: ratedMovie.rating
          });
        });
      }
    }

    // Fetch similar movies for items in watchlist
    const watchlistSample = watchlist.slice(0, 3);
    for (const item of watchlistSample) {
      const similarData = await tmdbService.getSimilarMovies(item.movieId);
      if (similarData && Array.isArray(similarData.results)) {
        similarData.results.forEach(movie => {
          if (!candidates.has(movie.id)) {
            candidates.set(movie.id, movie);
          }
          similarToWatchlistSet.add(movie.id);
        });
      }
    }

    // 3. Score candidates
    const scoredList = [];

    // Genre helper maps genre IDs to names (for explanations)
    const genreMap = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
      99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
      27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
      10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
    };

    for (const [id, movie] of candidates.entries()) {
      // Filter out movies user has rated or already has in watchlist (unless they are marked unwatched in watchlist)
      // Standard practice: Recommend fresh movies!
      if (ratedMovieIds.includes(id)) {
        continue;
      }

      let genreScore = 0;
      let langScore = 0;
      let ratingsScore = 0;
      let watchlistScore = 0;
      let popularityScore = 0;

      // --- A. Genre Preference (30% weight) ---
      if (favGenres.length > 0 && movie.genre_ids && movie.genre_ids.length > 0) {
        const matchingGenres = movie.genre_ids.filter(gid => favGenres.includes(gid));
        genreScore = (matchingGenres.length / movie.genre_ids.length) * 30;
      } else {
        // Default if user has no genres
        genreScore = 15;
      }

      // --- B. Language Preference (20% weight) ---
      if (prefLanguages.length > 0) {
        if (prefLanguages.includes(movie.original_language)) {
          langScore = 20;
        }
      } else {
        langScore = 10;
      }

      // --- C. Previous Ratings Similarity (25% weight) ---
      if (similarToRatedMap.has(id)) {
        const source = similarToRatedMap.get(id);
        if (source.rating === 5) {
          ratingsScore = 25;
        } else if (source.rating === 4) {
          ratingsScore = 18;
        } else {
          ratingsScore = 10;
        }
      }

      // --- D. Watchlist Similarity (15% weight) ---
      if (similarToWatchlistSet.has(id)) {
        watchlistScore = 15;
      }

      // --- E. Popularity & Vote Average (10% weight) ---
      // Max 5 points for rating (vote_average out of 10)
      const voteAvg = movie.vote_average || 0;
      const voteScore = (voteAvg / 10) * 5;

      // Max 5 points for popularity (scaled relative to 400 popularity)
      const pop = movie.popularity || 0;
      const popScore = Math.min(pop / 400, 1) * 5;

      popularityScore = voteScore + popScore;

      // Total Score
      const totalScore = Math.round(genreScore + langScore + ratingsScore + watchlistScore + popularityScore);

      // Determine explanation reason
      let reason = '✨ Handpicked matching your taste';
      if (similarToRatedMap.has(id)) {
        const source = similarToRatedMap.get(id);
        reason = `🎬 Similar to "${source.title}" which you rated ${source.rating}★`;
      } else if (similarToWatchlistSet.has(id)) {
        reason = `🔖 Similar to a movie in your watchlist`;
      } else if (genreScore > 15) {
        const matches = movie.genre_ids
          .filter(gid => favGenres.includes(gid))
          .map(gid => genreMap[gid] || '')
          .filter(Boolean);
        if (matches.length > 0) {
          reason = `🍿 Recommended because you like ${matches.slice(0, 2).join(' + ')}`;
        }
      } else if (langScore > 0 && movie.vote_average > 7.5) {
        reason = `🌐 Popular high-rated film in your preferred languages`;
      } else if (popularityScore > 8) {
        reason = `🔥 Trending block-buster loved by many`;
      }

      scoredList.push({
        ...movie,
        score: totalScore,
        reason
      });
    }

    // Sort by recommendation score descending
    scoredList.sort((a, b) => b.score - a.score);

    // If new user (no scored items), return popular movies
    if (scoredList.length === 0) {
      const defaultData = popularData.results || [];
      return defaultData.map(movie => ({
        ...movie,
        score: 75,
        reason: '🍿 Discovering popular choices to kickstart your deck'
      })).filter(m => !watchlistMovieIds.includes(m.id));
    }

    // Limit to top 20 recommendations
    return scoredList.slice(0, 20);
  } catch (error) {
    console.error(`🚨 Recommendation generation error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateRecommendationsForUser
};
