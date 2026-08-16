const tmdbService = require('../services/tmdbService');
const SearchHistory = require('../models/SearchHistory');
const UserInteraction = require('../models/UserInteraction');

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
const getPopularMovies = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdbService.getPopularMovies({ page });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
const getTrendingMovies = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdbService.getTrendingMovies('day', { page });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
const getTopRatedMovies = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdbService.getTopRatedMovies({ page });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming movies
// @route   GET /api/movies/upcoming
// @access  Public
const getUpcomingMovies = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdbService.getUpcomingMovies({ page });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public (Optional Auth to track history)
const searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
    }

    const data = await tmdbService.searchMovies(q, { page });

    // If request contains authorization, save query to history
    // We handle auth optional here by checking if req.user exists
    if (req.user && q.trim().length > 1) {
      await SearchHistory.create({
        userId: req.user.id,
        query: q.trim()
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get movie details by ID
// @route   GET /api/movies/:id
// @access  Public (Optional Auth to log view interactions)
const getMovieById = async (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    const data = await tmdbService.getMovieDetails(movieId);

    if (!data) {
      return res.status(404).json({ success: false, message: 'Movie not found on TMDB' });
    }

    // Fetch and attach watch providers (streaming platforms)
    try {
      const providersData = await tmdbService.getWatchProviders(movieId);
      data.watch_providers = providersData.results || {};
    } catch (providerErr) {
      console.error('Failed to attach watch providers:', providerErr.message);
      data.watch_providers = {};
    }

    // Save interaction if logged in
    if (req.user) {
      await UserInteraction.create({
        userId: req.user.id,
        movieId,
        interactionType: 'view'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get movie cast and crew credits
// @route   GET /api/movies/:id/credits
// @access  Public
const getMovieCredits = async (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    const data = await tmdbService.getMovieCredits(movieId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get movie trailers/videos
// @route   GET /api/movies/:id/videos
// @access  Public (Optional Auth to log trailer click)
const getMovieVideos = async (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    const data = await tmdbService.getMovieVideos(movieId);

    // Save click trailer interaction
    if (req.user) {
      await UserInteraction.create({
        userId: req.user.id,
        movieId,
        interactionType: 'click_trailer'
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get similar movies
// @route   GET /api/movies/:id/similar
// @access  Public
const getSimilarMovies = async (req, res, next) => {
  try {
    const movieId = Number(req.params.id);
    const data = await tmdbService.getSimilarMovies(movieId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Discover movies with advanced filters
// @route   GET /api/movies/discover
// @access  Public
const discoverMovies = async (req, res, next) => {
  try {
    const { genre, language, year, sortBy, page = 1 } = req.query;
    const data = await tmdbService.discoverMovies({
      genreId: genre,
      language,
      year,
      sortBy,
      page
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getGenresList = async (req, res, next) => {
  try {
    const data = await tmdbService.getGenres();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieById,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  discoverMovies,
  getGenresList
};

