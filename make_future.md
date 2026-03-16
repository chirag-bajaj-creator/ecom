# make_future.md — Changes to Remove Password Complexity & Login Rate Limit

## Overview
Two changes needed:
1. **Remove complex password validation** — allow any password (simple passwords accepted)
2. **Remove 5 login attempts / 15 minute lockout** — no login rate limiting

---

## Change 1: Remove Password Complexity Check

### Files Affected
- `server/src/middleware/validate.js` (signup validation)
- `server/src/controllers/profile.controller.js` (change password)

### BEFORE — `server/src/middleware/validate.js` (lines 3, 25-29)

```js
// Line 3: Complex regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Lines 25-29: Validation using regex
if (!password) {
  errors.push('Password is required');
} else if (!passwordRegex.test(password)) {
  errors.push('Password must be min 8 chars with 1 uppercase, 1 lowercase, 1 number, 1 special character');
}
```

### AFTER — `server/src/middleware/validate.js`

```js
// Line 3: REMOVED passwordRegex entirely

// Lines 25-27: Only check password exists
if (!password) {
  errors.push('Password is required');
}
```

### Process
- Delete the `passwordRegex` line (line 3)
- Remove the `else if (!passwordRegex.test(password))` block (lines 27-29)
- Keep only the `if (!password)` check

---

### BEFORE — `server/src/controllers/profile.controller.js` (lines 85-95)

```js
// Password rules: min 8, 1 uppercase, 1 special, 1 number
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({
    success: false,
    error: {
      code: "WEAK_PASSWORD",
      message: "Password must be min 8 chars with 1 uppercase, 1 number, 1 special character",
    },
  });
}
```

### AFTER — `server/src/controllers/profile.controller.js`

```js
// REMOVED — no password complexity check. Any password accepted.
```

### Process
- Delete the entire `passwordRegex` declaration and `if (!passwordRegex.test(...))` block (lines 85-95)

---

## Change 2: Remove Login Rate Limiter (5 attempts / 15 min)

### Files Affected
- `server/src/routes/auth.routes.js`

### BEFORE — `server/src/routes/auth.routes.js` (lines 13-23, 49-50)

```js
// Lines 13-23: Login rate limiter definition
const loginLimiter = isTest ? noOp : rateLimit({
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

// Line 50: loginLimiter used on login route
router.post('/login', loginLimiter, validateLogin, login);
```

### AFTER — `server/src/routes/auth.routes.js`

```js
// Lines 13-23: REMOVED loginLimiter entirely

// Line 50: login route without rate limiter
router.post('/login', validateLogin, login);
```

### Process
- Delete the entire `loginLimiter` const block (lines 13-23)
- Change `router.post('/login', loginLimiter, validateLogin, login)` to `router.post('/login', validateLogin, login)`

---

## Summary Table

| What | Before | After |
|------|--------|-------|
| Password on signup | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char | Any password accepted (just can't be empty) |
| Password on change | Min 8 chars, 1 uppercase, 1 number, 1 special char | Any password accepted |
| Login attempts | 5 attempts per 15 minutes, then blocked | No limit, unlimited login attempts |

## Note
- Signup rate limiter (3 per hour) and password reset rate limiter (3 per 15 min) are NOT removed — only the login limiter is removed as requested.
- To restore these security features in the future, reverse the changes above.
