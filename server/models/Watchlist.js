const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    movieId: {
      type: Number,
      required: [true, 'TMDB movieId is required']
    },
    movieTitle: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    posterPath: {
      type: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    watched: {
      type: Boolean,
      default: false
    }
  }
);

// Prevent duplicate watchlist items for the same user and movie
WatchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
