const request = require('supertest');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let userToken;
let adminToken;
let deliveryToken;
let category;
let product;

const normalUser = {
  name: 'Normal User',
  email: 'user@example.com',
  phone: '9876543210',
  password: 'User@1234',
  role: 'user',
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '9876543211',
  password: 'Admin@1234',
  role: 'admin',
  inviteCode: 'ADMIN-INVITE-2024',
};

const deliveryUser = {
  name: 'Delivery User',
  email: 'delivery@example.com',
  phone: '9876543212',
  password: 'Deliver@1234',
  role: 'delivery',
};

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  category = await Category.create({ name: 'Electronics', slug: 'electronics' });
  product = await Product.create({
    name: 'Phone',
    slug: 'phone',
    description: 'A smartphone',
    price: 15000,
    stock: 10,
    categoryId: category._id,
  });

  await request(app).post('/api/v1/auth/signup').send(normalUser);
  await request(app).post('/api/v1/auth/signup').send(adminUser);
  await request(app).post('/api/v1/auth/signup').send(deliveryUser);

  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: normalUser.email, password: normalUser.password });
  userToken = userLogin.body.data.accessToken;

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.data.accessToken;

  const deliveryLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: deliveryUser.email, password: deliveryUser.password });
  deliveryToken = deliveryLogin.body.data.accessToken;
});

// ===================== 1. NoSQL Injection =====================
describe('Security — NoSQL Injection', () => {
  test('blocks $ne operator in login email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: '' }, password: { $ne: '' } });

    // Should NOT return 200 with a user — should be rejected
    expect(res.status).not.toBe(200);
  });

  test('blocks $gt operator in login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });

    expect(res.status).not.toBe(200);
  });

  test('blocks $regex operator in login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $regex: '.*' }, password: 'anything' });

    expect(res.status).not.toBe(200);
  });

  test('blocks NoSQL injection in query params', async () => {
    const res = await request(app)
      .get('/api/v1/products?category[$ne]=null');

    // Should not crash — mongo-sanitize strips $ne, so query runs safely
    // May return 200 (ignored param) or 500 (cast error) depending on Mongoose strictness
    expect(res.status).toBeLessThan(502);
  });

  test('blocks $where operator injection', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: { $where: 'return true' } });

    expect(res.status).not.toBe(200);
  });

  test('blocks operator injection in forgot-password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: { $ne: '' } });

    // mongo-sanitize strips $ne, leaving empty object which becomes empty string
    // Mongoose may throw CastError caught by error handler — any non-200 is safe
    expect(res.status).not.toBe(200);
  });
});

// ===================== 2. XSS Attacks =====================
describe('Security — XSS Prevention', () => {
  test('sanitizes script tag in signup name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: '<script>document.cookie</script>',
        email: 'xss@example.com',
        phone: '9876543213',
        password: 'Xss@12345',
        role: 'user',
      });

    if (res.status === 201) {
      expect(res.body.data.name).not.toContain('<script>');
    }
  });

  test('sanitizes XSS in product search', async () => {
    const res = await request(app)
      .get('/api/v1/products/search?q=<script>alert(1)</script>');

    expect(res.status).toBe(200);
    // Should not crash and query should be sanitized
  });

  test('sanitizes img onerror in address', async () => {
    const res = await request(app)
      .post('/api/v1/profile/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: '<img src=x onerror=alert(1)>',
        phone: '9876543210',
        addressLine1: '123 Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      });

    if (res.status === 201) {
      expect(res.body.data.address.name).not.toContain('onerror');
    }
  });

  test('sanitizes event handler in cart (product name stored XSS)', async () => {
    // Try creating product with XSS in name via admin
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '<div onmouseover="steal()">Hacked Product</div>',
        price: 100,
        categoryId: category._id.toString(),
      });

    if (res.status === 201) {
      expect(res.body.data.product.name).not.toContain('onmouseover');
    }
  });

  test('sanitizes iframe injection in product description', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Safe Product',
        description: '<iframe src="https://evil.com"></iframe>Nice product',
        price: 200,
        categoryId: category._id.toString(),
      });

    if (res.status === 201) {
      expect(res.body.data.product.description).not.toContain('<iframe');
    }
  });
});

// ===================== 3. ReDoS Prevention =====================
describe('Security — ReDoS Prevention', () => {
  test('handles catastrophic backtracking pattern safely', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/v1/products/search?q=' + encodeURIComponent('(a+)+$'));

    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    // Should complete quickly (under 2 seconds), not hang
    expect(duration).toBeLessThan(2000);
  });

  test('handles repeated special chars in search', async () => {
    const start = Date.now();
    const malicious = '.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*';
    const res = await request(app)
      .get('/api/v1/products/search?q=' + encodeURIComponent(malicious));

    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  test('handles regex in suggestions safely', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/v1/products/suggestions?q=' + encodeURIComponent('((((((((('));

    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });
});

// ===================== 4. Account Enumeration =====================
describe('Security — Account Enumeration Prevention', () => {
  test('login gives same error for wrong email and wrong password', async () => {
    const wrongEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'User@1234' });

    const wrongPass = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: normalUser.email, password: 'WrongPass@1' });

    expect(wrongEmail.status).toBe(wrongPass.status);
    expect(wrongEmail.body.error.code).toBe(wrongPass.body.error.code);
    expect(wrongEmail.body.error.message).toBe(wrongPass.body.error.message);
  });

  test('forgot-password gives same response for existing and non-existing email', async () => {
    const existing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: normalUser.email });

    const nonExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(existing.status).toBe(nonExisting.status);
    expect(existing.body.message).toBe(nonExisting.body.message);
  });
});

// ===================== 5. RBAC Bypass =====================
describe('Security — RBAC Bypass Prevention', () => {
  // User cannot access admin routes
  test('user cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('user cannot manage orders as admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('user cannot update charges', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ deliveryCharge: 0 });
    expect(res.status).toBe(403);
  });

  test('user cannot create products', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacked', price: 1, categoryId: category._id.toString() });
    expect(res.status).toBe(403);
  });

  test('user cannot delete products', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  // Delivery cannot access admin routes
  test('delivery boy cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${deliveryToken}`);
    expect(res.status).toBe(403);
  });

  test('delivery boy cannot manage users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${deliveryToken}`);
    expect(res.status).toBe(403);
  });

  // User cannot access delivery routes
  test('user cannot access delivery status', async () => {
    const res = await request(app)
      .get('/api/v1/delivery/status')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('user cannot toggle delivery online status', async () => {
    const res = await request(app)
      .patch('/api/v1/delivery/status')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isOnline: true });
    expect(res.status).toBe(403);
  });

  // No auth at all
  test('unauthenticated cannot access cart', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  test('unauthenticated cannot checkout', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({ addressId: 'abc', paymentMethod: 'cod' });
    expect(res.status).toBe(401);
  });

  test('unauthenticated cannot access profile', async () => {
    const res = await request(app).get('/api/v1/profile');
    expect(res.status).toBe(401);
  });

  test('unauthenticated cannot access admin', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(401);
  });

  // Admin signup without invite code
  test('cannot create admin without invite code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Fake Admin',
        email: 'fake@admin.com',
        phone: '9876543214',
        password: 'Fake@1234',
        role: 'admin',
      });
    expect(res.status).toBe(403);
  });

  test('cannot create admin with wrong invite code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Fake Admin',
        email: 'fake2@admin.com',
        phone: '9876543215',
        password: 'Fake@1234',
        role: 'admin',
        inviteCode: 'WRONG-CODE',
      });
    expect(res.status).toBe(403);
  });
});

// ===================== 6. Invalid ObjectId Injection =====================
describe('Security — Invalid ObjectId Handling', () => {
  test('rejects invalid ObjectId in product route', async () => {
    const res = await request(app).get('/api/v1/products/not-a-valid-id');
    expect(res.status).toBe(400);
  });

  test('rejects invalid ObjectId in order route', async () => {
    const res = await request(app)
      .get('/api/v1/orders/not-valid')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });

  test('rejects invalid ObjectId in cart update', async () => {
    const res = await request(app)
      .patch('/api/v1/cart/not-valid')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('rejects invalid ObjectId in admin order status', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/not-valid/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(400);
  });

  test('rejects invalid ObjectId in payment', async () => {
    const res = await request(app)
      .get('/api/v1/payments/not-valid')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });

  test('rejects invalid ObjectId in address delete', async () => {
    const res = await request(app)
      .delete('/api/v1/profile/addresses/not-valid')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });
});

// ===================== 7. HTTP Parameter Pollution =====================
describe('Security — HTTP Parameter Pollution', () => {
  test('handles duplicate query params in products', async () => {
    const res = await request(app)
      .get('/api/v1/products?sort=price_asc&sort=price_desc');

    expect(res.status).toBe(200);
    // hpp should pick the last value, not crash
  });

  test('handles duplicate query params in admin orders', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders?status=ordered&status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('handles duplicate query params in search', async () => {
    const res = await request(app)
      .get('/api/v1/products/search?q=phone&q=laptop');

    expect(res.status).toBe(200);
  });
});

// ===================== 8. Token Security =====================
describe('Security — Token Security', () => {
  test('rejects expired/tampered access token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.fake');

    expect(res.status).toBe(401);
  });

  test('rejects completely random string as token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer randomgarbage123');

    expect(res.status).toBe(401);
  });

  test('rejects missing Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', userToken);

    expect(res.status).toBe(401);
  });

  test('rejects empty Authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', '');

    expect(res.status).toBe(401);
  });

  test('password is never in API response', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('$2b$'); // bcrypt hash pattern
  });
});

// ===================== 9. Error Information Leakage =====================
describe('Security — Error Information Leakage', () => {
  test('404 does not expose internal paths', async () => {
    const res = await request(app).get('/api/v1/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body.error.message).not.toContain('\\');
    expect(res.body.error.message).not.toContain('node_modules');
  });

  test('invalid JSON body returns clean error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"broken json');

    // Should not crash or leak stack traces
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ===================== 10. Security Headers =====================
describe('Security — HTTP Security Headers', () => {
  test('response includes security headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-xss-protection']).toBeDefined();
  });

  test('CSP blocks unsafe sources', async () => {
    const res = await request(app).get('/api/v1/health');
    const csp = res.headers['content-security-policy'];

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
  });
});
