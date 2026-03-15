const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');
const { validateCartAdd, validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', validateCartAdd, addToCart);
router.patch('/:productId', validateObjectId('productId'), updateCartItem);
router.delete('/:productId', validateObjectId('productId'), removeCartItem);
router.delete('/', clearCart);

module.exports = router;
