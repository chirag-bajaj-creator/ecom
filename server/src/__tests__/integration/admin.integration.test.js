const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let adminToken;
let userToken;
let deliveryToken;
let orderId;
let category;
let product;

const adminUser = {
  name: 'Admin Boss',
  email: 'admin@example.com',
  phone: '9876543211',
  password: 'Admin@1234',
  role: 'admin',
  inviteCode: 'ADMIN-INVITE-2024',
};

const normalUser = {
  name: 'Normal User',
  email: 'user@example.com',
  phone: '9876543210',
  password: 'User@1234',
  role: 'user',
};

const deliveryUser = {
  name: 'Delivery Guy',
  email: 'delivery@example.com',
  phone: '9876543212',
  password: 'Deliver@1234',
  role: 'delivery',
};

const validAddress = {
  name: 'Home',
  phone: '9876543210',
  addressLine1: '123 Main Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create category and product
  category = await Category.create({ name: 'Electronics', slug: 'electronics' });
  product = await Product.create({
    name: 'Phone',
    slug: 'phone',
    description: 'A smartphone',
    price: 15000,
    stock: 10,
    categoryId: category._id,
  });

  // Signup all 3 roles
  await request(app).post('/api/v1/auth/signup').send(adminUser);
  await request(app).post('/api/v1/auth/signup').send(normalUser);
  await request(app).post('/api/v1/auth/signup').send(deliveryUser);

  // Login all 3
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.data.accessToken;

  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: normalUser.email, password: normalUser.password });
  userToken = userLogin.body.data.accessToken;

  const deliveryLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: deliveryUser.email, password: deliveryUser.password });
  deliveryToken = deliveryLogin.body.data.accessToken;

  // Create an order: add address → add to cart → checkout
  const addr = await request(app)
    .post('/api/v1/profile/addresses')
    .set('Authorization', `Bearer ${userToken}`)
    .send(validAddress);

  await request(app)
    .post('/api/v1/cart')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ productId: product._id.toString(), quantity: 2 });

  const checkout = await request(app)
    .post('/api/v1/checkout')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ addressId: addr.body.data.address._id, paymentMethod: 'cod' });

  orderId = checkout.body.data.order._id;
});

// ===================== Access Control =====================
describe('Admin Integration — Access Control', () => {
  test('rejects normal user accessing admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test('rejects delivery boy accessing admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${deliveryToken}`);

    expect(res.status).toBe(403);
  });

  test('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');

    expect(res.status).toBe(401);
  });
});

// ===================== Dashboard =====================
describe('Admin Integration — Dashboard', () => {
  test('GET /api/v1/admin/dashboard — returns stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBe(1);
    expect(res.body.totalUsers).toBe(1); // only 'user' role
    expect(res.body.totalDeliveryBoys).toBe(1);
    expect(res.body.totalProducts).toBe(1);
    expect(res.body.totalRevenue).toBeGreaterThan(0);
    expect(res.body.recentOrders).toHaveLength(1);
  });
});

// ===================== Order Management =====================
describe('Admin Integration — Order Management', () => {
  test('GET /api/v1/admin/orders — lists all orders', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  test('GET /api/v1/admin/orders?status= — filters by status', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders?status=ordered')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);

    const noResults = await request(app)
      .get('/api/v1/admin/orders?status=delivered')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(noResults.body.orders).toHaveLength(0);
  });

  test('PATCH /api/v1/admin/orders/:id/status — updates order status', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('shipped');
  });

  test('PATCH /api/v1/admin/orders/:id/status — rejects invalid status', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/v1/admin/orders/:id/status — rejects invalid ObjectId', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/orders/bad-id/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    expect(res.status).toBe(400);
  });

  test('POST /api/v1/admin/orders/:id/cancel — cancels order and restores stock', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');

    // Stock should be restored
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(10); // 10 - 2 + 2 = 10
  });

  test('POST /api/v1/admin/orders/:id/cancel — cannot cancel already cancelled', async () => {
    await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test('POST /api/v1/admin/orders/:id/cancel — cannot cancel after pickup (shipped)', async () => {
    // First change status to shipped
    await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    const res = await request(app)
      .post(`/api/v1/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});

// ===================== User Management =====================
describe('Admin Integration — User Management', () => {
  test('GET /api/v1/admin/users — lists all users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
    // Password should never be returned
    res.body.users.forEach((user) => {
      expect(user.password).toBeUndefined();
    });
  });

  test('GET /api/v1/admin/users?role= — filters by role', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?role=delivery')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].role).toBe('delivery');
  });

  test('GET /api/v1/admin/users — paginates results', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(2);
    expect(res.body.totalPages).toBeDefined();
  });
});

// ===================== Delivery Boys =====================
describe('Admin Integration — Delivery Boys', () => {
  test('GET /api/v1/admin/delivery-boys — lists delivery boys', async () => {
    const res = await request(app)
      .get('/api/v1/admin/delivery-boys')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deliveryBoys).toBeDefined();
  });
});

// ===================== Charges =====================
describe('Admin Integration — Charges', () => {
  test('GET /api/v1/admin/charges — returns charge config', async () => {
    const res = await request(app)
      .get('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deliveryCharge).toBeDefined();
    expect(res.body.freeDeliveryThreshold).toBeDefined();
    expect(res.body.handlingCharge).toBeDefined();
  });

  test('PATCH /api/v1/admin/charges — updates charges with audit log', async () => {
    // First get to create default config
    await request(app)
      .get('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryCharge: 50, handlingCharge: 10 });

    expect(res.status).toBe(200);
    expect(res.body.config.deliveryCharge).toBe(50);
    expect(res.body.config.handlingCharge).toBe(10);
    expect(res.body.config.auditLog.length).toBeGreaterThan(0);
  });

  test('PATCH /api/v1/admin/charges — rejects negative values', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryCharge: -10 });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/v1/admin/charges — rejects string values', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ handlingCharge: 'free' });

    expect(res.status).toBe(400);
  });
});
