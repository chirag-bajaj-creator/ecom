const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
