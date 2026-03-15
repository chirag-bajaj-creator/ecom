const errorHandler = require('../middleware/errorHandler');

const mockReq = () => ({});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

// Suppress console.error during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

describe('Error Handler Middleware', () => {
  // ===== Production vs Dev =====
  describe('production mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'production';
    });
    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('hides internal error message in production', () => {
      const err = new Error('Database connection string exposed');
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Internal server error',
          }),
        })
      );
    });

    test('does not leak stack trace in production', () => {
      const err = new Error('secret info');
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      errorHandler(err, req, res, next);
      const response = res.json.mock.calls[0][0];
      expect(response.error.message).not.toContain('secret info');
    });
  });

  describe('development mode', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'development';
    });
    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('shows actual error message in development', () => {
      const err = new Error('Something broke');
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Something broke',
          }),
        })
      );
    });
  });

  // ===== Mongoose Validation Error =====
  test('handles Mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        name: { message: 'Name is required' },
      },
    };
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['Email is required', 'Name is required'],
        }),
      })
    );
  });

  // ===== Mongoose Duplicate Key Error =====
  test('handles Mongoose duplicate key error (code 11000)', () => {
    const err = {
      code: 11000,
      keyValue: { email: 'john@example.com' },
    };
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_ENTRY',
          message: 'email already exists',
        }),
      })
    );
  });

  // ===== JWT Errors =====
  test('handles JsonWebTokenError', () => {
    const err = { name: 'JsonWebTokenError' };
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
        }),
      })
    );
  });

  test('handles TokenExpiredError', () => {
    const err = { name: 'TokenExpiredError' };
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TOKEN_EXPIRED',
        }),
      })
    );
  });

  // ===== Custom status codes =====
  test('uses custom statusCode from error', () => {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    process.env.NODE_ENV = 'development';
    errorHandler(err, req, res, next);
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

  // ===== Default fallback =====
  test('defaults to 500 and INTERNAL_ERROR when no statusCode or code', () => {
    const err = new Error('Unknown error');
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    process.env.NODE_ENV = 'development';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });
});
