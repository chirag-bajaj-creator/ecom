const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

searchHistorySchema.index({ userId: 1, searchedAt: -1 });
searchHistorySchema.index({ query: 1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
