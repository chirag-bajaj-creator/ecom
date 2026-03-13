const SearchHistory = require('../models/SearchHistory');

// GET /api/v1/search/recent
const getRecentSearches = async (req, res, next) => {
  try {
    const searches = await SearchHistory.find({ userId: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select('query searchedAt');

    res.json({ success: true, data: { searches } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/search/recent
const clearRecentSearches = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/search/trending
const getTrendingSearches = async (req, res, next) => {
  try {
    const trending = await SearchHistory.aggregate([
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          lastSearched: { $max: '$searchedAt' },
        },
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]);

    res.json({ success: true, data: { trending } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecentSearches, clearRecentSearches, getTrendingSearches };
