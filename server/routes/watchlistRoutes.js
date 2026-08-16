const express = require('express');
const router = express.Router();
const {
  addToWatchlist,
  removeFromWatchlist,
  toggleWatched,
  getWatchlist,
  checkWatchlistStatus
} = require('../controllers/watchlistController');
const { validateWatchlist } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all watchlist routes

router.route('/')
  .post(validateWatchlist, addToWatchlist)
  .get(getWatchlist);

router.route('/:movieId')
  .delete(removeFromWatchlist);

router.route('/:movieId/check')
  .get(checkWatchlistStatus);

router.route('/:movieId/watched')
  .patch(toggleWatched);

module.exports = router;
