const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist, moveToCart } = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/:productId/move-to-cart', moveToCart);

module.exports = router;
