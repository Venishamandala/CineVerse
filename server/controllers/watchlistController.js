const Watchlist = require('../models/Watchlist');
const UserInteraction = require('../models/UserInteraction');

// @desc    Add movie to watchlist
// @route   POST /api/watchlist
// @access  Private
const addToWatchlist = async (req, res, next) => {
  try {
    const { movieId, movieTitle, posterPath } = req.body;
    const userId = req.user.id;

    // Check if already in watchlist
    const exists = await Watchlist.findOne({ userId, movieId });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Movie is already in your watchlist.'
      });
    }

    const watchlistItem = await Watchlist.create({
      userId,
      movieId,
      movieTitle,
      posterPath
    });

    // Save interaction
    await UserInteraction.create({
      userId,
      movieId,
      interactionType: 'watchlist_add'
    });

    res.status(201).json({
      success: true,
      message: 'Movie added to watchlist.',
      data: watchlistItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from watchlist
// @route   DELETE /api/watchlist/:movieId
// @access  Private
const removeFromWatchlist = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOneAndDelete({ userId, movieId });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found in watchlist.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle watched status of movie in watchlist
// @route   PATCH /api/watchlist/:movieId/watched
// @access  Private
const toggleWatched = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const userId = req.user.id;
    const { watched } = req.body;

    const watchlistItem = await Watchlist.findOne({ userId, movieId });
    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found in watchlist.'
      });
    }

    watchlistItem.watched = watched !== undefined ? watched : !watchlistItem.watched;
    await watchlistItem.save();

    res.status(200).json({
      success: true,
      message: `Movie marked as ${watchlistItem.watched ? 'watched' : 'unwatched'}.`,
      data: watchlistItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const list = await Watchlist.find({ userId }).sort({ addedAt: -1 });

    res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if movie is in user's watchlist
// @route   GET /api/watchlist/:movieId/check
// @access  Private
const checkWatchlistStatus = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const userId = req.user.id;

    const item = await Watchlist.findOne({ userId, movieId });

    res.status(200).json({
      success: true,
      inWatchlist: !!item,
      watched: item ? item.watched : false
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  toggleWatched,
  getWatchlist,
  checkWatchlistStatus
};
