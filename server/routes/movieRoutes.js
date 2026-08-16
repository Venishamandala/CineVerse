const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/movieController');

const { protect } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional Authentication Middleware to track searches and views without locking routes
const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cineverse_secure_random_jwt_secret_token_19384729384');
      req.user = await User.findById(decoded.id);
    } catch (e) {
      // Ignore token failure for optional protect
    }
  }
  next();
};

router.get('/popular', getPopularMovies);
router.get('/trending', getTrendingMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/genres', getGenresList);
router.get('/discover', discoverMovies);
router.get('/search', optionalProtect, searchMovies);
router.get('/:id', optionalProtect, getMovieById);
router.get('/:id/credits', getMovieCredits);
router.get('/:id/videos', optionalProtect, getMovieVideos);
router.get('/:id/similar', getSimilarMovies);

module.exports = router;
