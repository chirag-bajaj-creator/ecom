/**
 * Regression Tests
 * Verify that the 10 security changes didn't break existing features.
 * Focus: normal user flows still work with new middleware in place.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { app, connectTestDB, clearTestDB, disconnectTestDB } = require('../setup');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

let userToken;
let adminToken;
let category;
let product;
let addressId;

const normalUser = {
  name: "Raj Kumar O'Brien-Singh",
  email: 'raj@example.com',
  phone: '9876543210',
  password: 'Test@1234',
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
    name: 'Samsung Galaxy S24',
    slug: 'samsung-galaxy-s24',
    description: 'Latest Samsung phone with 200MP camera & AI features',
    price: 79999,
    stock: 25,
    categoryId: category._id,
  });

  await request(app).post('/api/v1/auth/signup').send(normalUser);
  await request(app).post('/api/v1/auth/signup').send(adminUser);

  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: normalUser.email, password: normalUser.password });
  userToken = userLogin.body.data.accessToken;

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.data.accessToken;

  const addr = await request(app)
    .post('/api/v1/profile/addresses')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Raj Kumar',
      phone: '9876543210',
      addressLine1: '42/B, 3rd Floor, M.G. Road',
      addressLine2: "Near St. John's Church",
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    });
  addressId = addr.body.data.address._id;
});

// ===================== 1. XSS sanitizer doesn't corrupt normal data =====================
describe('Regression — XSS sanitizer preserves normal data', () => {
  test('preserves apostrophes in names', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toContain("O'Brien");
  });

  test('preserves special chars in address', async () => {
    const addrs = await request(app)
      .get('/api/v1/profile/addresses')
      .set('Authorization', `Bearer ${userToken}`);

    expect(addrs.status).toBe(200);
    const addr = addrs.body.data.addresses[0];
    expect(addr.addressLine1).toContain('42/B');
    expect(addr.addressLine1).toContain('M.G. Road');
  });

  test('preserves & symbol in product description', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bread & Butter',
        price: 50,
        description: 'Fresh bread & butter combo — 100% organic',
        categoryId: category._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.product.description).toContain('&');
  });

  test('preserves numbers and decimals in prices', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Premium Cable',
        price: 299.99,
        stock: 100,
        categoryId: category._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.product.price).toBe(299.99);
  });
});

// ===================== 2. mongo-sanitize doesn't break valid queries =====================
describe('Regression — mongo-sanitize allows normal queries', () => {
  test('product listing works', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
  });

  test('category filter works', async () => {
    const res = await request(app).get('/api/v1/products?category=electronics');
    expect(res.status).toBe(200);
  });

  test('pagination works', async () => {
    const res = await request(app).get('/api/v1/products?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toBeDefined();
  });

  test('sorting works', async () => {
    const res = await request(app).get('/api/v1/products?sort=price_asc');
    expect(res.status).toBe(200);
  });

  test('user lookup by email still works (login)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: normalUser.email, password: normalUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

// ===================== 3. hpp doesn't break valid single params =====================
describe('Regression — hpp allows normal single params', () => {
  test('single sort param works', async () => {
    const res = await request(app).get('/api/v1/products?sort=price_desc');
    expect(res.status).toBe(200);
  });

  test('single status filter works for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders?status=ordered')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('single role filter works for admin users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?role=user')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ===================== 4. New validators don't reject valid requests =====================
describe('Regression — Validators accept valid data', () => {
  test('valid checkout works', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const res = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ addressId, paymentMethod: 'cod' });

    expect(res.status).toBe(201);
  });

  test('valid cart add works', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: product._id.toString(), quantity: 3 });

    expect(res.status).toBe(201);
  });

  test('valid address creation works', async () => {
    const res = await request(app)
      .post('/api/v1/profile/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Office',
        phone: '9123456789',
        addressLine1: '100, Nehru Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110019',
      });

    expect(res.status).toBe(201);
  });

  test('valid product by ObjectId works', async () => {
    const res = await request(app).get(`/api/v1/products/${product._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Samsung Galaxy S24');
  });

  test('valid payment process works', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const checkout = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ addressId, paymentMethod: 'upi' });

    const orderId = checkout.body.data.order._id;

    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId, method: 'upi' });

    expect(res.status).toBe(200);
    expect(res.body.data.payment.transactionId).toBeDefined();
  });

  test('valid admin charge update works', async () => {
    await request(app)
      .get('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryCharge: 45, handlingCharge: 7 });

    expect(res.status).toBe(200);
    expect(res.body.config.deliveryCharge).toBe(45);
  });
});

// ===================== 5. Search still works with escaped regex =====================
describe('Regression — Search works after regex escaping', () => {
  test('basic text search returns results', async () => {
    const res = await request(app).get('/api/v1/products/search?q=Samsung');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });

  test('partial text search works', async () => {
    const res = await request(app).get('/api/v1/products/search?q=galaxy');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });

  test('case insensitive search works', async () => {
    const res = await request(app).get('/api/v1/products/search?q=samsung');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });

  test('description search works', async () => {
    const res = await request(app).get('/api/v1/products/search?q=200MP');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });

  test('suggestions still work', async () => {
    const res = await request(app).get('/api/v1/products/suggestions?q=Sam');
    expect(res.status).toBe(200);
    expect(res.body.data.suggestions.length).toBeGreaterThan(0);
  });

  test('no results search returns empty array, not error', async () => {
    const res = await request(app).get('/api/v1/products/search?q=xyznotexist');
    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
  });
});

// ===================== 6. Full customer journey still works =====================
describe('Regression — Complete customer journey', () => {
  test('signup → login → browse → cart → checkout → order → cancel', async () => {
    // 1. Signup new user
    const signup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Journey Tester',
        email: 'journey@example.com',
        phone: '9988776655',
        password: 'Journey@1',
        role: 'user',
      });
    expect(signup.status).toBe(201);

    // 2. Login
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'journey@example.com', password: 'Journey@1' });
    expect(login.status).toBe(200);
    const token = login.body.data.accessToken;

    // 3. Browse products
    const products = await request(app).get('/api/v1/products');
    expect(products.status).toBe(200);
    const productId = products.body.data.products[0]._id;

    // 4. Search
    const search = await request(app).get('/api/v1/products/search?q=Samsung');
    expect(search.status).toBe(200);

    // 5. Add address
    const addr = await request(app)
      .post('/api/v1/profile/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Home',
        phone: '9988776655',
        addressLine1: '1 Test Street',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      });
    expect(addr.status).toBe(201);

    // 6. Add to cart
    const cart = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });
    expect(cart.status).toBe(201);

    // 7. View cart
    const viewCart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(viewCart.status).toBe(200);
    expect(viewCart.body.data.items).toHaveLength(1);

    // 8. Checkout
    const checkout = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ addressId: addr.body.data.address._id, paymentMethod: 'cod' });
    expect(checkout.status).toBe(201);
    const orderId = checkout.body.data.order._id;

    // 9. View orders
    const orders = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(orders.status).toBe(200);
    expect(orders.body.data.orders.length).toBeGreaterThan(0);

    // 10. View order detail
    const detail = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);

    // 11. Cancel order
    const cancel = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancel.status).toBe(200);

    // 12. Profile still works
    const profile = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.name).toBe('Journey Tester');

    // 13. Change password still works
    const changePw = await request(app)
      .post('/api/v1/profile/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Journey@1',
        newPassword: 'Journey@2',
        confirmPassword: 'Journey@2',
      });
    expect(changePw.status).toBe(200);

    // 14. Logout
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: login.body.data.refreshToken });
    expect(logout.status).toBe(200);
  });
});

// ===================== 7. Admin journey still works =====================
describe('Regression — Complete admin journey', () => {
  test('dashboard → products CRUD → orders → users → charges', async () => {
    // 1. Dashboard
    const dash = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dash.status).toBe(200);

    // 2. Create product
    const create = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Earbuds',
        price: 1999,
        stock: 50,
        description: 'Wireless earbuds with ANC',
        categoryId: category._id.toString(),
      });
    expect(create.status).toBe(201);
    const newProductId = create.body.data.product._id;

    // 3. Update product
    const update = await request(app)
      .put(`/api/v1/products/${newProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 1799, stock: 45 });
    expect(update.status).toBe(200);

    // 4. View users
    const users = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(users.status).toBe(200);

    // 5. View delivery boys
    const delivery = await request(app)
      .get('/api/v1/admin/delivery-boys')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delivery.status).toBe(200);

    // 6. Manage charges
    await request(app)
      .get('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`);

    const charges = await request(app)
      .patch('/api/v1/admin/charges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryCharge: 35 });
    expect(charges.status).toBe(200);

    // 7. Delete product
    const del = await request(app)
      .delete(`/api/v1/products/${newProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
  });
});
