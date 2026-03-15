const Wishlist = require('../models/Wishlist');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

// GET /api/v1/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ userId: req.user._id })
      .populate('productId', 'name image price stock description')
      .sort({ addedAt: -1 });

    const wishlistItems = items.map((item) => ({
      _id: item._id,
      product: item.productId,
      addedAt: item.addedAt,
    }));

    res.json({ success: true, data: { items: wishlistItems } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const existing = await Wishlist.findOne({ userId: req.user._id, productId });
    if (existing) {
      return res.json({ success: true, message: 'Already in wishlist' });
    }

    const item = await Wishlist.create({ userId: req.user._id, productId });
    res.status(201).json({ success: true, message: 'Added to wishlist', data: { item } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
  try {
    const item = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId: req.params.productId,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not in wishlist' },
      });
    }

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/wishlist/:productId/move-to-cart
const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({ userId: req.user._id, productId });
    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not in wishlist' },
      });
    }

    const product = await Product.findById(productId);
    if (!product || product.stock < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'Product is out of stock' },
      });
    }

    const existingCart = await CartItem.findOne({ userId: req.user._id, productId });
    if (existingCart) {
      existingCart.quantity += 1;
      if (existingCart.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' },
        });
      }
      await existingCart.save();
    } else {
      await CartItem.create({ userId: req.user._id, productId, quantity: 1 });
    }

    await Wishlist.findByIdAndDelete(wishlistItem._id);

    res.json({ success: true, message: 'Moved to cart' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
