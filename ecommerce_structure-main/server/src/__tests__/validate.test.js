const {
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
} = require('../middleware/validate');

// Helper: mock Express req, res, next
const mockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

// ===================== validateSignup =====================
describe('validateSignup', () => {
  test('passes with valid data', () => {
    const req = mockReq({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      password: 'Test@1234',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('fails with missing name', () => {
    const req = mockReq({
      name: '',
      email: 'john@example.com',
      phone: '9876543210',
      password: 'Test@1234',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('fails with invalid email', () => {
    const req = mockReq({
      name: 'John',
      email: 'not-an-email',
      phone: '9876543210',
      password: 'Test@1234',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with short password missing special char', () => {
    const req = mockReq({
      name: 'John',
      email: 'john@example.com',
      phone: '9876543210',
      password: 'short',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid phone (not 10 digits)', () => {
    const req = mockReq({
      name: 'John',
      email: 'john@example.com',
      phone: '12345',
      password: 'Test@1234',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid role', () => {
    const req = mockReq({
      name: 'John',
      email: 'john@example.com',
      phone: '9876543210',
      password: 'Test@1234',
      role: 'superadmin',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sanitizes inputs (trim, lowercase email)', () => {
    const req = mockReq({
      name: '  John  ',
      email: 'JOHN@Example.COM',
      phone: '9876543210',
      password: 'Test@1234',
      role: 'user',
    });
    const res = mockRes();
    const next = mockNext();

    validateSignup(req, res, next);
    expect(req.body.name).toBe('John');
    expect(req.body.email).toBe('john@example.com');
  });
});

// ===================== validateLogin =====================
describe('validateLogin', () => {
  test('passes with valid data', () => {
    const req = mockReq({ email: 'john@example.com', password: 'Test@1234' });
    const res = mockRes();
    const next = mockNext();

    validateLogin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with missing email', () => {
    const req = mockReq({ email: '', password: 'Test@1234' });
    const res = mockRes();
    const next = mockNext();

    validateLogin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing password', () => {
    const req = mockReq({ email: 'john@example.com', password: '' });
    const res = mockRes();
    const next = mockNext();

    validateLogin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ===================== validateObjectId =====================
describe('validateObjectId', () => {
  test('passes with valid ObjectId', () => {
    const middleware = validateObjectId('id');
    const req = mockReq({}, { id: '507f1f77bcf86cd799439011' });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with invalid ObjectId', () => {
    const middleware = validateObjectId('id');
    const req = mockReq({}, { id: 'not-valid-id' });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  test('fails with too short id', () => {
    const middleware = validateObjectId('id');
    const req = mockReq({}, { id: '507f1f' });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validates multiple params', () => {
    const middleware = validateObjectId('orderId', 'userId');
    const req = mockReq({}, { orderId: 'invalid', userId: '507f1f77bcf86cd799439011' });
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ===================== escapeRegex =====================
describe('escapeRegex', () => {
  test('escapes special regex characters', () => {
    expect(escapeRegex('hello.*+?^${}()|[]\\world')).toBe(
      'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world'
    );
  });

  test('leaves normal text unchanged', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });

  test('escapes ReDoS attack pattern', () => {
    const malicious = '(a+)+$';
    const escaped = escapeRegex(malicious);
    expect(escaped).toBe('\\(a\\+\\)\\+\\$');
    // Should not cause catastrophic backtracking
    const regex = new RegExp(escaped, 'i');
    expect(regex.test('aaaaaaaaaaaaaaaa')).toBe(false);
  });
});

// ===================== validateSearch =====================
describe('validateSearch', () => {
  test('sets _escapedQ for search query', () => {
    const req = mockReq({}, {}, { q: 'test.*query' });
    const res = mockRes();
    const next = mockNext();

    validateSearch(req, res, next);
    expect(req.query._escapedQ).toBe('test\\.\\*query');
    expect(next).toHaveBeenCalled();
  });

  test('trims search query', () => {
    const req = mockReq({}, {}, { q: '  hello  ' });
    const res = mockRes();
    const next = mockNext();

    validateSearch(req, res, next);
    expect(req.query.q).toBe('hello');
    expect(next).toHaveBeenCalled();
  });

  test('passes with empty query', () => {
    const req = mockReq({}, {}, {});
    const res = mockRes();
    const next = mockNext();

    validateSearch(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ===================== validateAddress =====================
describe('validateAddress', () => {
  const validAddress = {
    name: 'John Doe',
    phone: '9876543210',
    addressLine1: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  };

  test('passes with valid address', () => {
    const req = mockReq(validAddress);
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with missing name', () => {
    const req = mockReq({ ...validAddress, name: '' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid phone', () => {
    const req = mockReq({ ...validAddress, phone: '12345' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing addressLine1', () => {
    const req = mockReq({ ...validAddress, addressLine1: '' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid pincode (not 6 digits)', () => {
    const req = mockReq({ ...validAddress, pincode: '1234' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing city', () => {
    const req = mockReq({ ...validAddress, city: '' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing state', () => {
    const req = mockReq({ ...validAddress, state: '' });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('trims inputs', () => {
    const req = mockReq({
      ...validAddress,
      name: '  John  ',
      city: '  Mumbai  ',
    });
    const res = mockRes();
    const next = mockNext();

    validateAddress(req, res, next);
    expect(req.body.name).toBe('John');
    expect(req.body.city).toBe('Mumbai');
  });
});

// ===================== validateCheckout =====================
describe('validateCheckout', () => {
  test('passes with valid data', () => {
    const req = mockReq({
      addressId: '507f1f77bcf86cd799439011',
      paymentMethod: 'upi',
    });
    const res = mockRes();
    const next = mockNext();

    validateCheckout(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with invalid addressId', () => {
    const req = mockReq({ addressId: 'bad-id', paymentMethod: 'upi' });
    const res = mockRes();
    const next = mockNext();

    validateCheckout(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid payment method', () => {
    const req = mockReq({
      addressId: '507f1f77bcf86cd799439011',
      paymentMethod: 'bitcoin',
    });
    const res = mockRes();
    const next = mockNext();

    validateCheckout(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('accepts all valid payment methods', () => {
    for (const method of ['upi', 'credit-debit', 'cod']) {
      const req = mockReq({
        addressId: '507f1f77bcf86cd799439011',
        paymentMethod: method,
      });
      const res = mockRes();
      const next = mockNext();

      validateCheckout(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });
});

// ===================== validateCartAdd =====================
describe('validateCartAdd', () => {
  test('passes with valid productId and quantity', () => {
    const req = mockReq({ productId: '507f1f77bcf86cd799439011', quantity: 2 });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('passes with valid productId and no quantity (defaults in controller)', () => {
    const req = mockReq({ productId: '507f1f77bcf86cd799439011' });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with invalid productId', () => {
    const req = mockReq({ productId: 'bad', quantity: 1 });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with zero quantity', () => {
    const req = mockReq({ productId: '507f1f77bcf86cd799439011', quantity: 0 });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with negative quantity', () => {
    const req = mockReq({ productId: '507f1f77bcf86cd799439011', quantity: -1 });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with non-integer quantity', () => {
    const req = mockReq({ productId: '507f1f77bcf86cd799439011', quantity: 1.5 });
    const res = mockRes();
    const next = mockNext();

    validateCartAdd(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ===================== validateLocation =====================
describe('validateLocation', () => {
  test('passes with valid coordinates', () => {
    const req = mockReq({ lat: 19.076, lng: 72.8777 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with lat out of range', () => {
    const req = mockReq({ lat: 91, lng: 72.8777 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with lng out of range', () => {
    const req = mockReq({ lat: 19.076, lng: 181 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with string lat', () => {
    const req = mockReq({ lat: 'abc', lng: 72.8777 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing lng', () => {
    const req = mockReq({ lat: 19.076 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('passes with boundary values', () => {
    const req = mockReq({ lat: -90, lng: -180 });
    const res = mockRes();
    const next = mockNext();

    validateLocation(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ===================== validateCharges =====================
describe('validateCharges', () => {
  test('passes with valid charges', () => {
    const req = mockReq({
      deliveryCharge: 40,
      freeDeliveryThreshold: 500,
      surgeCharge: 10,
      handlingCharge: 5,
    });
    const res = mockRes();
    const next = mockNext();

    validateCharges(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('passes with partial update', () => {
    const req = mockReq({ deliveryCharge: 50 });
    const res = mockRes();
    const next = mockNext();

    validateCharges(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with negative charge', () => {
    const req = mockReq({ deliveryCharge: -10 });
    const res = mockRes();
    const next = mockNext();

    validateCharges(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with string charge', () => {
    const req = mockReq({ handlingCharge: 'free' });
    const res = mockRes();
    const next = mockNext();

    validateCharges(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('passes with zero values', () => {
    const req = mockReq({ surgeCharge: 0 });
    const res = mockRes();
    const next = mockNext();

    validateCharges(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ===================== validatePayment =====================
describe('validatePayment', () => {
  test('passes with valid data', () => {
    const req = mockReq({
      orderId: '507f1f77bcf86cd799439011',
      method: 'upi',
    });
    const res = mockRes();
    const next = mockNext();

    validatePayment(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('fails with invalid orderId', () => {
    const req = mockReq({ orderId: 'bad', method: 'upi' });
    const res = mockRes();
    const next = mockNext();

    validatePayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with invalid method', () => {
    const req = mockReq({
      orderId: '507f1f77bcf86cd799439011',
      method: 'paypal',
    });
    const res = mockRes();
    const next = mockNext();

    validatePayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('fails with missing orderId', () => {
    const req = mockReq({ method: 'cod' });
    const res = mockRes();
    const next = mockNext();

    validatePayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
