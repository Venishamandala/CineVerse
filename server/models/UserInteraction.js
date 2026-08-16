const mongoose = require('mongoose');

const UserInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    movieId: {
      type: Number,
      required: true
    },
    interactionType: {
      type: String,
      enum: ['view', 'click_trailer', 'search', 'watchlist_add', 'rate'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model('UserInteraction', UserInteractionSchema);
