const RecentlyViewed = require('../models/RecentlyViewed');

exports.trackView = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user._id;

    await RecentlyViewed.findOneAndUpdate(
      { userId, productId },
      { viewedAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { exclude } = req.query;

    const filter = { userId };
    if (exclude) filter.productId = { $ne: exclude };

    const items = await RecentlyViewed.find(filter)
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate('productId', 'name price image stock');

    const products = items
      .filter((item) => item.productId)
      .map((item) => item.productId);

    res.json({ success: true, data: { products } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
