const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating (1-5) is required'],
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate ratings: a user can only rate a specific movie once
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
