const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, logout, refreshAccessToken, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/validate');

const router = express.Router();

// Rate limiters (skip in test mode)
const isTest = process.env.NODE_ENV === 'test';
const noOp = (req, res, next) => next();

const signupLimiter = isTest ? noOp : rateLimit({
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

const passwordResetLimiter = isTest ? noOp : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many password reset attempts. Please try again after 15 minutes.',
    },
  },
});

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
