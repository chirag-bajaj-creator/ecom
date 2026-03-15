const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let token;
let category;
let product;
let addressId;

const validUser = {
  name: 'Checkout Tester',
  email: 'checkout@example.com',
  phone: '9876543210',
  password: 'Test@1234',
  role: 'user',
};

const validAddress = {
  name: 'Home',
  phone: '9876543210',
  addressLine1: '123 Main Street',
  addressLine2: 'Near Park',
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

  // Signup, login, add address
  await request(app).post('/api/v1/auth/signup').send(validUser);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: validUser.email, password: validUser.password });
  token = login.body.data.accessToken;

  const addr = await request(app)
    .post('/api/v1/profile/addresses')
    .set('Authorization', `Bearer ${token}`)
    .send(validAddress);
  addressId = addr.body.data.address._id;
});

describe('Checkout Integration — Full Purchase Flow', () => {
  test('complete flow: add to cart → checkout → view order', async () => {
    // 1. Add to cart
    const cartRes = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });
    expect(cartRes.status).toBe(201);

    // 2. Checkout
    const checkoutRes = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'cod' });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    expect(checkoutRes.body.data.order).toBeDefined();
    expect(checkoutRes.body.data.order.status).toBe('ordered');
    expect(checkoutRes.body.data.order.grandTotal).toBeDefined();

    const orderId = checkoutRes.body.data.order._id;

    // 3. Cart should be empty after checkout
    const cartAfter = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartAfter.body.data.items).toHaveLength(0);

    // 4. Order should be visible in orders list
    const orders = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(orders.status).toBe(200);
    expect(orders.body.data.orders.length).toBeGreaterThan(0);

    // 5. Order detail should be accessible
    const detail = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.order.items).toHaveLength(1);
    expect(detail.body.data.order.items[0].name).toBe('Phone');
    expect(detail.body.data.order.items[0].quantity).toBe(2);

    // 6. Stock should be reduced
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(8); // 10 - 2
  });
});

describe('Checkout Integration — Validation', () => {
  beforeEach(async () => {
    // Add item to cart for each test
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 });
  });

  test('rejects checkout with invalid addressId', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: 'bad-id', paymentMethod: 'cod' });

    expect(res.status).toBe(400);
  });

  test('rejects checkout with non-existent address', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: fakeId, paymentMethod: 'cod' });

    expect(res.status).toBe(404);
  });

  test('rejects checkout with invalid payment method', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'bitcoin' });

    expect(res.status).toBe(400);
  });

  test('rejects checkout with empty cart', async () => {
    // Clear cart first
    await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'cod' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_CART');
  });

  test('rejects checkout without auth', async () => {
    const res = await request(app)
      .post('/api/v1/checkout')
      .send({ addressId, paymentMethod: 'cod' });

    expect(res.status).toBe(401);
  });

  test('accepts all valid payment methods', async () => {
    for (const method of ['upi', 'credit-debit', 'cod']) {
      // Re-add to cart (checkout clears it)
      await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product._id.toString(), quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId, paymentMethod: method });

      expect(res.status).toBe(201);
    }
  });
});

describe('Checkout Integration — Charges', () => {
  test('GET /api/v1/checkout/charges — returns charges for cart total', async () => {
    const res = await request(app)
      .get('/api/v1/checkout/charges?cartTotal=300')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deliveryCharge).toBe(40); // below 500
    expect(res.body.data.handlingCharge).toBe(5);
  });

  test('GET /api/v1/checkout/charges — free delivery above threshold', async () => {
    const res = await request(app)
      .get('/api/v1/checkout/charges?cartTotal=600')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deliveryCharge).toBe(0); // above 500
  });
});

describe('Checkout Integration — Order Cancellation', () => {
  test('POST /api/v1/orders/:orderId/cancel — cancels ordered status', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    const checkout = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'cod' });

    const orderId = checkout.body.data.order._id;

    const res = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Stock should be restored
    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(10); // restored from 8
  });
});

describe('Checkout Integration — Insufficient Stock', () => {
  test('rejects checkout when product stock is insufficient', async () => {
    // Add more than available stock to cart
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 5 });

    // Reduce stock directly in DB to simulate concurrent purchase
    await Product.findByIdAndUpdate(product._id, { stock: 2 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId, paymentMethod: 'cod' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});
