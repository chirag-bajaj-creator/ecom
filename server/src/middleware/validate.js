// Input validation middleware

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
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
  }

  const validRoles = ['user', 'delivery', 'admin', 'seller'];
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

// Helper: validation error response
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
    },
  });
};

// Validate MongoDB ObjectId in params
const validateObjectId = (...paramNames) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return (req, res, next) => {
    const errors = [];
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !objectIdRegex.test(value)) {
        errors.push(`Invalid ${param} format`);
      }
    }
    if (errors.length > 0) return validationError(res, errors);
    next();
  };
};

// Escape special regex characters to prevent ReDoS
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Validate search query
const validateSearch = (req, res, next) => {
  const { q } = req.query;
  if (q && typeof q === 'string') {
    req.query.q = q.trim();
    req.query._escapedQ = escapeRegex(q.trim());
  }
  next();
};

// Validate address fields
const validateAddress = (req, res, next) => {
  const { name, phone, addressLine1, city, state, pincode } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) errors.push('Name is required');
  if (!phone || !phoneRegex.test(phone)) errors.push('Phone must be exactly 10 digits');
  if (!addressLine1 || addressLine1.trim().length === 0) errors.push('Address line 1 is required');
  if (!city || city.trim().length === 0) errors.push('City is required');
  if (!state || state.trim().length === 0) errors.push('State is required');
  if (!pincode || !/^\d{6}$/.test(pincode)) errors.push('Pincode must be exactly 6 digits');

  if (errors.length > 0) return validationError(res, errors);

  req.body.name = name.trim();
  req.body.addressLine1 = addressLine1.trim();
  req.body.city = city.trim();
  req.body.state = state.trim();
  next();
};

// Validate checkout fields
const validateCheckout = (req, res, next) => {
  const { addressId, paymentMethod } = req.body;
  const errors = [];
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!addressId || !objectIdRegex.test(addressId)) errors.push('Valid address is required');
  if (!paymentMethod || !['upi', 'credit-debit', 'cod'].includes(paymentMethod)) {
    errors.push('Payment method must be one of: upi, credit-debit, cod');
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// Validate cart add
const validateCartAdd = (req, res, next) => {
  const { productId, quantity } = req.body;
  const errors = [];
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!productId || !objectIdRegex.test(productId)) errors.push('Valid product ID is required');
  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
    errors.push('Quantity must be a positive integer');
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// Validate delivery location
const validateLocation = (req, res, next) => {
  const { lat, lng } = req.body;
  const errors = [];

  if (lat == null || typeof lat !== 'number' || lat < -90 || lat > 90) {
    errors.push('lat must be a number between -90 and 90');
  }
  if (lng == null || typeof lng !== 'number' || lng < -180 || lng > 180) {
    errors.push('lng must be a number between -180 and 180');
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// Validate admin charge updates
const validateCharges = (req, res, next) => {
  const { deliveryCharge, freeDeliveryThreshold, surgeCharge, handlingCharge } = req.body;
  const errors = [];

  const fields = { deliveryCharge, freeDeliveryThreshold, surgeCharge, handlingCharge };
  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) {
      if (typeof value !== 'number' || value < 0) {
        errors.push(`${field} must be a non-negative number`);
      }
    }
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

// Validate payment process
const validatePayment = (req, res, next) => {
  const { orderId, method } = req.body;
  const errors = [];
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!orderId || !objectIdRegex.test(orderId)) errors.push('Valid order ID is required');
  if (!method || !['upi', 'credit-debit', 'cod'].includes(method)) {
    errors.push('Payment method must be one of: upi, credit-debit, cod');
  }

  if (errors.length > 0) return validationError(res, errors);
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateObjectId,
  escapeRegex,
  validateSearch,
  validateAddress,
  validateCheckout,
  validateCartAdd,
  validateLocation,
  validateCharges,
  validatePayment,
};
