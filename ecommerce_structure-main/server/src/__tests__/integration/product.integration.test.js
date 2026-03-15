const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let userToken;
let adminToken;
let category;
let product;

const validUser = {
  name: 'Product Tester',
  email: 'product@example.com',
  phone: '9876543210',
  password: 'Test@1234',
  role: 'user',
};

const adminUser = {
  name: 'Admin Tester',
  email: 'admin@example.com',
  phone: '9876543211',
  password: 'Admin@1234',
  role: 'admin',
  inviteCode: 'ADMIN-INVITE-2024',
};

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create categories and products
  category = await Category.create({ name: 'Electronics', slug: 'electronics' });
  const category2 = await Category.create({ name: 'Clothing', slug: 'clothing' });

  product = await Product.create({
    name: 'Smartphone Pro',
    slug: 'smartphone-pro',
    description: 'Latest smartphone with amazing camera',
    price: 25000,
    stock: 15,
    categoryId: category._id,
  });

  await Product.create({
    name: 'Laptop Ultra',
    slug: 'laptop-ultra',
    description: 'Powerful laptop for developers',
    price: 75000,
    stock: 8,
    categoryId: category._id,
  });

  await Product.create({
    name: 'Cotton T-Shirt',
    slug: 'cotton-t-shirt',
    description: 'Comfortable cotton t-shirt',
    price: 500,
    stock: 50,
    categoryId: category2._id,
  });

  // Signup and login as user
  await request(app).post('/api/v1/auth/signup').send(validUser);
  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: validUser.email, password: validUser.password });
  userToken = userLogin.body.data.accessToken;

  // Signup and login as admin
  await request(app).post('/api/v1/auth/signup').send(adminUser);
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.data.accessToken;
});

// ===================== Categories =====================
describe('Product Integration — Categories', () => {
  test('GET /api/v1/categories — returns all categories', async () => {
    const res = await request(app).get('/api/v1/categories');

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toHaveLength(2);
    expect(res.body.data.categories[0].name).toBeDefined();
    expect(res.body.data.categories[0].slug).toBeDefined();
  });

  test('GET /api/v1/categories — works without auth (public)', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
  });
});

// ===================== Get Products =====================
describe('Product Integration — Get Products', () => {
  test('GET /api/v1/products — returns all products', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(3);
    expect(res.body.data.pagination.total).toBe(3);
  });

  test('GET /api/v1/products — filters by category', async () => {
    const res = await request(app).get('/api/v1/products?category=electronics');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(2);
  });

  test('GET /api/v1/products — paginates results', async () => {
    const res = await request(app).get('/api/v1/products?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(2);
    expect(res.body.data.pagination.pages).toBe(2);
  });

  test('GET /api/v1/products — sorts by price ascending', async () => {
    const res = await request(app).get('/api/v1/products?sort=price_asc');

    expect(res.status).toBe(200);
    const prices = res.body.data.products.map((p) => p.price);
    expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    expect(prices[1]).toBeLessThanOrEqual(prices[2]);
  });

  test('GET /api/v1/products — sorts by price descending', async () => {
    const res = await request(app).get('/api/v1/products?sort=price_desc');

    expect(res.status).toBe(200);
    const prices = res.body.data.products.map((p) => p.price);
    expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
    expect(prices[1]).toBeGreaterThanOrEqual(prices[2]);
  });

  test('GET /api/v1/products — works without auth (public)', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
  });
});

// ===================== Get Product By Id =====================
describe('Product Integration — Get Product By Id', () => {
  test('GET /api/v1/products/:id — returns product details', async () => {
    const res = await request(app).get(`/api/v1/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Smartphone Pro');
    expect(res.body.data.product.price).toBe(25000);
    expect(res.body.data.product.categoryId).toBeDefined();
  });

  test('GET /api/v1/products/:id — returns 404 for non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/products/${fakeId}`);

    expect(res.status).toBe(404);
  });

  test('GET /api/v1/products/:id — returns 400 for invalid id', async () => {
    const res = await request(app).get('/api/v1/products/bad-id');

    expect(res.status).toBe(400);
  });
});

// ===================== Search =====================
describe('Product Integration — Search', () => {
  test('GET /api/v1/products/search?q= — finds products by name', async () => {
    const res = await request(app).get('/api/v1/products/search?q=smartphone');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Smartphone Pro');
  });

  test('GET /api/v1/products/search?q= — finds products by description', async () => {
    const res = await request(app).get('/api/v1/products/search?q=developer');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Laptop Ultra');
  });

  test('GET /api/v1/products/search?q= — returns empty for no matches', async () => {
    const res = await request(app).get('/api/v1/products/search?q=xyznotfound');

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
  });

  test('GET /api/v1/products/search?q= — rejects empty query', async () => {
    const res = await request(app).get('/api/v1/products/search?q=');

    expect(res.status).toBe(400);
  });

  test('GET /api/v1/products/search?q= — handles regex special chars safely', async () => {
    const res = await request(app).get('/api/v1/products/search?q=(a%2B)%2B%24');

    expect(res.status).toBe(200);
    // Should not crash — ReDoS protection
    expect(res.body.data.products).toHaveLength(0);
  });
});

// ===================== Suggestions =====================
describe('Product Integration — Suggestions', () => {
  test('GET /api/v1/products/suggestions?q= — returns matching suggestions', async () => {
    const res = await request(app).get('/api/v1/products/suggestions?q=Smart');

    expect(res.status).toBe(200);
    expect(res.body.data.suggestions.length).toBeGreaterThan(0);
    expect(res.body.data.suggestions[0].name).toContain('Smartphone');
  });

  test('GET /api/v1/products/suggestions?q= — returns empty for no match', async () => {
    const res = await request(app).get('/api/v1/products/suggestions?q=zzz');

    expect(res.status).toBe(200);
    expect(res.body.data.suggestions).toHaveLength(0);
  });

  test('GET /api/v1/products/suggestions?q= — returns empty for empty query', async () => {
    const res = await request(app).get('/api/v1/products/suggestions?q=');

    expect(res.status).toBe(200);
    expect(res.body.data.suggestions).toHaveLength(0);
  });
});

// ===================== Admin CRUD =====================
describe('Product Integration — Admin CRUD', () => {
  test('POST /api/v1/products — admin creates product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Tablet',
        price: 20000,
        stock: 10,
        description: 'A new tablet',
        categoryId: category._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.product.name).toBe('New Tablet');
    expect(res.body.data.product.slug).toBe('new-tablet');
  });

  test('POST /api/v1/products — rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No name or price' });

    expect(res.status).toBe(400);
  });

  test('POST /api/v1/products — rejects invalid category', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', price: 100, categoryId: fakeId });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CATEGORY');
  });

  test('POST /api/v1/products — user cannot create product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Hacked Product',
        price: 1,
        categoryId: category._id.toString(),
      });

    expect(res.status).toBe(403);
  });

  test('PUT /api/v1/products/:id — admin updates product', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 22000, stock: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.product.price).toBe(22000);
    expect(res.body.data.product.stock).toBe(20);
  });

  test('PUT /api/v1/products/:id — user cannot update product', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 1 });

    expect(res.status).toBe(403);
  });

  test('DELETE /api/v1/products/:id — admin deletes product', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // Verify deleted
    const check = await request(app).get(`/api/v1/products/${product._id}`);
    expect(check.status).toBe(404);
  });

  test('DELETE /api/v1/products/:id — user cannot delete product', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test('DELETE /api/v1/products/:id — returns 404 for non-existent', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/v1/products/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
