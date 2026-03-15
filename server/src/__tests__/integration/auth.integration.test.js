const request = require('supertest');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '9876543210',
  password: 'Test@1234',
  role: 'user',
};

describe('Auth Integration — Signup', () => {
  test('POST /api/v1/auth/signup — registers a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.role).toBe('user');
  });

  test('POST /api/v1/auth/signup — rejects duplicate email', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const res = await request(app).post('/api/v1/auth/signup').send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_ENTRY');
  });

  test('POST /api/v1/auth/signup — rejects invalid data', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ name: '', email: 'bad', phone: '123', password: 'weak', role: 'fake' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('POST /api/v1/auth/signup — rejects admin without invite code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...validUser, email: 'admin@test.com', role: 'admin' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('INVALID_INVITE_CODE');
  });
});

describe('Auth Integration — Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
  });

  test('POST /api/v1/auth/login — returns tokens on valid login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  test('POST /api/v1/auth/login — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'Wrong@1234' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('POST /api/v1/auth/login — rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noone@test.com', password: 'Test@1234' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('POST /api/v1/auth/login — same error for wrong email and wrong password (no enumeration)', async () => {
    const wrongEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noone@test.com', password: 'Test@1234' });

    const wrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'Wrong@1234' });

    expect(wrongEmail.body.error.message).toBe(wrongPass.body.error.message);
  });
});

describe('Auth Integration — Profile (GET /me)', () => {
  test('GET /api/v1/auth/me — returns user with valid token', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const token = login.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('GET /api/v1/auth/me — rejects without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });

  test('GET /api/v1/auth/me — rejects with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
  });
});

describe('Auth Integration — Refresh Token', () => {
  test('POST /api/v1/auth/refresh-token — returns new tokens', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const refreshToken = login.body.data.refreshToken;

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // New refresh token should be different (rotation)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  test('POST /api/v1/auth/refresh-token — rejects used token (rotation)', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const refreshToken = login.body.data.refreshToken;

    // Use the token once
    await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    // Try using the same token again — should fail
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });

  test('POST /api/v1/auth/refresh-token — rejects missing token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('Auth Integration — Logout', () => {
  test('POST /api/v1/auth/logout — invalidates refresh token', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const { accessToken, refreshToken } = login.body.data;

    // Logout
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Refresh token should no longer work
    const refresh = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(refresh.status).toBe(401);
  });
});

describe('Auth Integration — Forgot/Reset Password', () => {
  test('POST /api/v1/auth/forgot-password — same response for existing and non-existing email', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);

    const existing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });

    const nonExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@test.com' });

    expect(existing.status).toBe(200);
    expect(nonExisting.status).toBe(200);
    expect(existing.body.message).toBe(nonExisting.body.message);
  });

  test('POST /api/v1/auth/reset-password — resets password with valid token', async () => {
    await request(app).post('/api/v1/auth/signup').send(validUser);

    const forgot = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: validUser.email });

    const resetToken = forgot.body.data.resetToken;

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken, newPassword: 'NewPass@123' });

    expect(res.status).toBe(200);

    // Old password should no longer work
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(oldLogin.status).toBe(401);

    // New password should work
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'NewPass@123' });
    expect(newLogin.status).toBe(200);
  });

  test('POST /api/v1/auth/reset-password — rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken: 'fake-token', newPassword: 'NewPass@123' });

    expect(res.status).toBe(400);
  });
});
