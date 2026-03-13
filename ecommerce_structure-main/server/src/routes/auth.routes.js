const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, logout, refreshAccessToken, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: 'Too many login attempts. Please try again after 15 minutes.',
    },
  },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_SIGNUPS',
      message: 'Too many signup attempts. Please try again after 1 hour.',
    },
  },
});

router.post('/signup', signupLimiter, validateSignup, signup);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
