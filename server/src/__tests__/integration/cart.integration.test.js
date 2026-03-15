const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let token;
let category;
let product1;
let product2;

const validUser = {
  name: 'Cart Tester',
  email: 'cart@example.com',
  phone: '9876543210',
  password: 'Test@1234',
  role: 'user',
};

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create category and products directly in DB
  category = await Category.create({ name: 'Electronics', slug: 'electronics' });
  product1 = await Product.create({
    name: 'Phone',
    slug: 'phone',
    description: 'A smartphone',
    price: 15000,
    stock: 10,
    categoryId: category._id,
  });
  product2 = await Product.create({
    name: 'Laptop',
    slug: 'laptop',
    description: 'A laptop',
    price: 50000,
    stock: 5,
    categoryId: category._id,
  });

  // Signup and login
  await request(app).post('/api/v1/auth/signup').send(validUser);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: validUser.email, password: validUser.password });
  token = login.body.data.accessToken;
});

describe('Cart Integration — Add to Cart', () => {
  test('POST /api/v1/cart — adds product to cart', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.quantity).toBe(2);
  });

  test('POST /api/v1/cart — increments quantity if product already in cart', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 2 });

    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.item.quantity).toBe(5);
  });

  test('POST /api/v1/cart — rejects invalid productId', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'bad-id', quantity: 1 });

    expect(res.status).toBe(400);
  });

  test('POST /api/v1/cart — rejects non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: fakeId, quantity: 1 });

    expect(res.status).toBe(404);
  });

  test('POST /api/v1/cart — rejects quantity exceeding stock', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  test('POST /api/v1/cart — rejects without auth', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .send({ productId: product1._id.toString(), quantity: 1 });

    expect(res.status).toBe(401);
  });
});

describe('Cart Integration — Get Cart', () => {
  test('GET /api/v1/cart — returns empty cart', async () => {
    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.itemCount).toBe(0);
  });

  test('GET /api/v1/cart — returns cart with items and charges', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 2 });

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product2._id.toString(), quantity: 1 });

    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.itemCount).toBe(2);
    expect(res.body.data.charges.subtotal).toBe(80000); // 15000*2 + 50000*1
    expect(res.body.data.charges.grandTotal).toBeDefined();
  });
});

describe('Cart Integration — Update Quantity', () => {
  test('PATCH /api/v1/cart/:productId — updates quantity', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/${product1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.item.quantity).toBe(5);
  });

  test('PATCH /api/v1/cart/:productId — rejects quantity exceeding stock', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/${product1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 999 });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/v1/cart/:productId — rejects zero quantity', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/${product1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 0 });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/v1/cart/:productId — rejects invalid productId', async () => {
    const res = await request(app)
      .patch('/api/v1/cart/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(400);
  });
});

describe('Cart Integration — Remove Item', () => {
  test('DELETE /api/v1/cart/:productId — removes item from cart', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    const res = await request(app)
      .delete(`/api/v1/cart/${product1._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify cart is empty
    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(cart.body.data.items).toHaveLength(0);
  });

  test('DELETE /api/v1/cart/:productId — returns 404 for item not in cart', async () => {
    const res = await request(app)
      .delete(`/api/v1/cart/${product1._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('Cart Integration — Clear Cart', () => {
  test('DELETE /api/v1/cart — clears entire cart', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product1._id.toString(), quantity: 1 });

    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product2._id.toString(), quantity: 1 });

    const res = await request(app)
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(cart.body.data.items).toHaveLength(0);
  });
});
