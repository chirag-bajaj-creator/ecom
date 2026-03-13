const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Address = require("../models/Address");
const { assignOrder } = require("../services/orderAssignment");

// POST /api/v1/checkout
const checkout = async (req, res, next) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const userId = req.user._id;

    // Validate payment method
    if (!["upi", "credit-debit", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_PAYMENT", message: "Invalid payment method" },
      });
    }

    // Validate address
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        error: { code: "ADDRESS_NOT_FOUND", message: "Address not found" },
      });
    }

    // Get cart items
    const cartItems = await CartItem.find({ userId }).populate(
      "productId",
      "name image price stock"
    );

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "EMPTY_CART", message: "Cart is empty" },
      });
    }

    // Validate stock and build order items
    const orderItems = [];
    for (const item of cartItems) {
      const product = item.productId;
      if (!product) {
        return res.status(400).json({
          success: false,
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "Product no longer available",
          },
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INSUFFICIENT_STOCK",
            message: `"${product.name}" only has ${product.stock} in stock`,
          },
        });
      }
      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.image || "",
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Calculate charges
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = totalAmount >= 500 ? 0 : 40;
    const handlingCharge = 5;
    const surgeCharge = 0;
    const grandTotal = totalAmount + deliveryCharge + handlingCharge + surgeCharge;

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      deliveryCharge,
      surgeCharge,
      handlingCharge,
      grandTotal,
      status: "ordered",
      deliveryAddress: {
        name: address.name,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    });

    // Reduce stock for each product
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    await CartItem.deleteMany({ userId });

    // Assign to nearest delivery boy (async, non-blocking)
    assignOrder(order._id).catch((err) =>
      console.error("Order assignment error:", err.message)
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/checkout/charges
const getCharges = async (req, res, next) => {
  try {
    const cartTotal = parseFloat(req.query.cartTotal) || 0;

    const deliveryCharge = cartTotal >= 500 ? 0 : 40;
    const handlingCharge = 5;
    const surgeCharge = 0;
    const grandTotal = cartTotal + deliveryCharge + handlingCharge + surgeCharge;

    res.json({
      success: true,
      data: {
        cartTotal,
        deliveryCharge,
        surgeCharge,
        handlingCharge,
        grandTotal,
        freeDeliveryThreshold: 500,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkout, getCharges };
