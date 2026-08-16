const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d' // automatically expire queries after 30 days
    }
  }
);

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
