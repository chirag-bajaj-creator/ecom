const express = require('express');
const { getRecentSearches, clearRecentSearches, getTrendingSearches } = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/recent', authenticate, getRecentSearches);
router.delete('/recent', authenticate, clearRecentSearches);
router.get('/trending', getTrendingSearches);

module.exports = router;
