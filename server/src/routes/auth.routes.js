const express = require('express');
const { signup, login, logout, refreshAccessToken, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
