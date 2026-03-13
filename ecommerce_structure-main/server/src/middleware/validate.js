// Input validation middleware

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const validateSignup = (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  } else if (email.length > 255) {
    errors.push('Email must be under 255 characters');
  }

  if (!phone || !phoneRegex.test(phone)) {
    errors.push('Phone must be exactly 10 digits');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!passwordRegex.test(password)) {
    errors.push('Password must be min 8 chars with 1 uppercase, 1 lowercase, 1 number, 1 special character');
  }

  const validRoles = ['user', 'delivery', 'admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push('Role must be one of: user, delivery, admin');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
    });
  }

  // Sanitize inputs
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

module.exports = { validateSignup, validateLogin };
