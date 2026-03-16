const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ChargeConfig = require('../models/ChargeConfig');

// GET /api/v1/cart
const getCart = async (req, res, next) => {
  try {
    const items = await CartItem.find({ userId: req.user._id })
      .populate('productId', 'name image price stock description')
      .sort({ addedAt: -1 });

    let subtotal = 0;
    const cartItems = items.map((item) => {
      const itemTotal = item.productId.price * item.quantity;
      subtotal += itemTotal;
      return {
        _id: item._id,
        product: item.productId,
        quantity: item.quantity,
        itemTotal,
        addedAt: item.addedAt,
      };
    });

    const config = await ChargeConfig.findOne() || { deliveryCharge: 40, freeDeliveryThreshold: 500, surgeCharge: 0, handlingCharge: 5 };
    const deliveryCharge = subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryCharge;
    const handlingCharge = config.handlingCharge;
    const surgeCharge = config.surgeCharge;
    const grandTotal = subtotal + deliveryCharge + handlingCharge + surgeCharge;

    res.json({
      success: true,
      data: {
        items: cartItems,
        charges: { subtotal, deliveryCharge, surgeCharge, handlingCharge, grandTotal },
        itemCount: cartItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/cart
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' },
      });
    }

    const existing = await CartItem.findOne({ userId: req.user._id, productId });
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' },
        });
      }
      await existing.save();
      return res.json({ success: true, message: 'Cart updated', data: { item: existing } });
    }

    const item = await CartItem.create({ userId: req.user._id, productId, quantity });
    res.status(201).json({ success: true, message: 'Added to cart', data: { item } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/cart/:productId
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUANTITY', message: 'Quantity must be at least 1' },
      });
    }

    const product = await Product.findById(req.params.productId);
    if (product && quantity > product.stock) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' },
      });
    }

    const item = await CartItem.findOneAndUpdate(
      { userId: req.user._id, productId: req.params.productId },
      { quantity },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not in cart' },
      });
    }

    res.json({ success: true, message: 'Quantity updated', data: { item } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/cart/:productId
const removeCartItem = async (req, res, next) => {
  try {
    const item = await CartItem.findOneAndDelete({
      userId: req.user._id,
      productId: req.params.productId,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not in cart' },
      });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/cart
const clearCart = async (req, res, next) => {
  try {
    await CartItem.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
