const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    preferredLanguages: {
      type: [String],
      default: ['en']
    },
    favoriteGenres: {
      type: [Number], // TMDB genre IDs
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);
