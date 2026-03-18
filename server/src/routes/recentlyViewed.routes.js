const express = require('express');
const { trackView, getRecentlyViewed } = require('../controllers/recentlyViewed.controller');
const { authenticate } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');

const router = express.Router();

router.post('/products/:id/view', authenticate, validateObjectId('id'), trackView);
router.get('/recently-viewed', authenticate, getRecentlyViewed);

module.exports = router;
