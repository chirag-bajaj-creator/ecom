const Review = require('../models/Review');
const Order = require('../models/Order');

exports.createReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user._id;
    const { rating, title, comment } = req.body;

    // Check if user has purchased and received this product
    const hasPurchased = await Order.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered',
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received',
      });
    }

    const review = await Review.findOneAndUpdate(
      { productId, userId },
      { rating, title, comment },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: { review } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { star, sort = 'relevant', page = 1, limit = 10 } = req.query;

    const filter = { productId };
    if (star) filter.rating = Number(star);

    let sortOption = {};
    if (sort === 'best') sortOption = { rating: -1, createdAt: -1 };
    else if (sort === 'worst') sortOption = { rating: 1, createdAt: -1 };
    else sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name'),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { productId: new require('mongoose').Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        stats: stats[0] || { avgRating: 0, total: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
