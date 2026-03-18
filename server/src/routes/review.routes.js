const express = require('express');
const { createReview, getReviews } = require('../controllers/review.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.post('/products/:id/reviews', authenticate, requireRole('user'), validateObjectId('id'), createReview);
router.get('/products/:id/reviews', validateObjectId('id'), getReviews);

module.exports = router;
