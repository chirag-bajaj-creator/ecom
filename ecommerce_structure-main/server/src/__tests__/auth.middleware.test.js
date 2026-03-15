const jwt = require('jsonwebtoken');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../config/env', () => ({
  JWT_ACCESS_SECRET: 'test-secret-key',
}));

const User = require('../models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

const createToken = (payload, secret = 'test-secret-key') => {
  return jwt.sign(payload, secret, { expiresIn: '15m' });
};

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
};

// ===================== authenticate =====================
describe('authenticate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes with valid token and attaches user to req', async () => {
    const token = createToken({ userId: mockUser._id, role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
  });

  test('rejects when no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = mockNext();

    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NO_TOKEN',
        }),
      })
    );
  });

  test('rejects when Authorization header has no Bearer prefix', async () => {
    const token = createToken({ userId: mockUser._id });
    const req = { headers: { authorization: token } };
    const res = mockRes();
    const next = mockNext();

    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NO_TOKEN',
        }),
      })
    );
  });

  test('rejects with invalid token (wrong secret)', async () => {
    const token = createToken({ userId: mockUser._id }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await authenticate(req, res, next);
    // Should call next with error (caught by error handler)
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('rejects with expired token', async () => {
    const token = jwt.sign(
      { userId: mockUser._id },
      'test-secret-key',
      { expiresIn: '0s' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    // Small delay to ensure token expires
    await new Promise((r) => setTimeout(r, 10));
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('rejects when user no longer exists in DB', async () => {
    const token = createToken({ userId: mockUser._id, role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'USER_NOT_FOUND',
        }),
      })
    );
  });
});

// ===================== requireRole =====================
describe('requireRole', () => {
  test('passes when user has required role', () => {
    const middleware = requireRole('user', 'admin');
    const req = { user: { role: 'user' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rejects when user has wrong role', () => {
    const middleware = requireRole('admin');
    const req = { user: { role: 'user' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'FORBIDDEN',
        }),
      })
    );
  });

  test('rejects when no user on request', () => {
    const middleware = requireRole('user');
    const req = {};
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_AUTHENTICATED',
        }),
      })
    );
  });

  test('allows admin role for admin-only routes', () => {
    const middleware = requireRole('admin');
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('allows delivery role for delivery-only routes', () => {
    const middleware = requireRole('delivery');
    const req = { user: { role: 'delivery' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rejects delivery boy accessing admin routes', () => {
    const middleware = requireRole('admin');
    const req = { user: { role: 'delivery' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('accepts multiple allowed roles', () => {
    const middleware = requireRole('user', 'admin');
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ===================== optionalAuth =====================
describe('optionalAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('attaches user when valid token provided', async () => {
    const token = createToken({ userId: mockUser._id, role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
  });

  test('continues without error when no token', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = mockNext();

    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('continues without error when token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = mockRes();
    const next = mockNext();

    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('continues without error when token is expired', async () => {
    const token = jwt.sign(
      { userId: mockUser._id },
      'test-secret-key',
      { expiresIn: '0s' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    await new Promise((r) => setTimeout(r, 10));
    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  test('continues when user not found in DB', async () => {
    const token = createToken({ userId: mockUser._id, role: 'user' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
