const Rating = require('../models/Rating');
const UserInteraction = require('../models/UserInteraction');

// @desc    Add or update a movie rating
// @route   POST /api/ratings
// @access  Private
const upsertRating = async (req, res, next) => {
  try {
    const { movieId, movieTitle, posterPath, rating } = req.body;
    const userId = req.user.id;

    // Save or update in MongoDB
    const movieRating = await Rating.findOneAndUpdate(
      { userId, movieId },
      { movieTitle, posterPath, rating: Number(rating) },
      { new: true, upsert: true }
    );

    // Save rate interaction
    await UserInteraction.create({
      userId,
      movieId,
      interactionType: 'rate'
    });

    res.status(200).json({
      success: true,
      message: 'Rating saved successfully.',
      data: movieRating
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's rating for a specific movie
// @route   GET /api/ratings/:movieId
// @access  Private
const getMovieRating = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const userId = req.user.id;

    const movieRating = await Rating.findOne({ userId, movieId });

    res.status(200).json({
      success: true,
      rating: movieRating ? movieRating.rating : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ratings for logged in user
// @route   GET /api/ratings
// @access  Private
const getUserRatings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ratings = await Rating.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie rating
// @route   DELETE /api/ratings/:movieId
// @access  Private
const deleteRating = async (req, res, next) => {
  try {
    const movieId = Number(req.params.movieId);
    const userId = req.user.id;

    const rating = await Rating.findOneAndDelete({ userId, movieId });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found for this movie.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertRating,
  getMovieRating,
  getUserRatings,
  deleteRating
};
