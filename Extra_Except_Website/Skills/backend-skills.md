Custom skills for the @back-dev agent

description: Technical implementation guide — API endpoints, database models, HTTP methods, error handling, middleware, and validation rules for all backend features.

---

# Global Standards (Apply to All Endpoints)

## Database
- MongoDB running via Docker Desktop — use `docker-compose.yml` in project root
- MongoDB container image: `mongo:latest`, port 27017, named volume for data persistence
- Connection string read from environment variable `MONGODB_URI`
- Use Mongoose as ODM

## API Versioning
- All routes prefixed with /api/v1/

## Middleware Stack
- cors — allow frontend origins only
- helmet — security headers
- express-rate-limit — rate limiting (configured per route group)
- morgan — HTTP request logging
- compression — gzip response compression
- express.json() — body parsing (limit: 10mb for image uploads)

## Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

## HTTP Status Codes Used
- 200 OK — successful GET/PATCH
- 201 Created — successful POST (resource created)
- 204 No Content — successful DELETE
- 400 Bad Request — validation error, missing fields
- 401 Unauthorized — missing/invalid/expired JWT
- 403 Forbidden — valid JWT but wrong role (RBAC violation)
- 404 Not Found — resource not found
- 409 Conflict — duplicate entry (e.g. email already registered)
- 422 Unprocessable Entity — business logic error (e.g. can't cancel delivered order)
- 429 Too Many Requests — rate limit exceeded
- 500 Internal Server Error — unhandled server error

## Input Validation Rules
- Email: valid format via regex, max 255 chars
- Phone: exactly 10 digits, numeric only
- Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 special character, 1 number
- Product name: max 200 chars, required
- Price/stock: numeric, >= 0
- Image uploads: max 2MB, jpg/png/webp only
- Pagination: page >= 1, limit between 1-100 (default 20)
- All string inputs trimmed and sanitized against XSS

## Authentication Middleware
- JWT access token in Authorization header: Bearer <token>
- Access token expires in 15 minutes, refresh token in 7 days
- Middleware extracts userId and role from token, attaches to req.user
- Role-based middleware: requireRole("user"), requireRole("delivery"), requireRole("admin")

## Rate Limiting
- Login: max 5 attempts per 15 min per IP
- Signup: max 3 per hour per IP
- Password reset: max 3 per hour per email
- Search autocomplete: max 30 per minute per user
- General API: max 100 per minute per user

---

# for user APIs

1) Landing page — Products & Categories API
- API to return all categories list [FRUITS/VEGETABLE, DAIRY PRODUCTS, HEALTHCARE, EASY CARE, ETC]
- API to return products under each category — each product should return: image URL, name, price, productId
- API to search products by keyword — takes search query, returns matching products in same format (image, name, price, productId)
- API to return single product detail — when user clicks on product popup it should return: large image URL, product name, description, price, stock availability
- all product list APIs should support pagination (page number, limit per page) so frontend can load more as user scrolls
- products should be filterable by category and sortable by price (low to high, high to low)

## Database models needed:
- Category: id, name, slug, image
- Product: id, name, slug, description, price, image, categoryId, stock, createdAt, updatedAt

## API endpoints:
- GET /api/v1/categories → returns all categories
- GET /api/v1/products?category=fruits&page=1&limit=20&sort=price_asc → returns paginated products, filterable by category, sortable
- GET /api/v1/products/search?q=milk&page=1&limit=20 → search products by keyword
- GET /api/v1/products/:id → returns single product full detail
- GET /api/v1/products/suggestions?q=mi&limit=10 → autocomplete suggestions as user types (returns top matching product names)

2) Search Bar

- Reuses product search & product detail endpoints from section 1
- API to return autocomplete suggestions as user types — takes partial query, returns top 5-10 matching product names
- API to store and return recent search history for logged-in users — last 10 searches
- API to return trending/popular search terms — top searched keywords across all users

## Database model needed:
- SearchHistory: id, userId, query, searchedAt
  (Product and Category models already defined in section 1 — no duplication)

## API endpoints:
- GET /api/v1/products/suggestions?q=mi&limit=10 → autocomplete suggestions (reuses section 1)
- GET /api/v1/products/search?q=milk&page=1&limit=20 → full search results (reuses section 1)
- GET /api/v1/products/:id → single product detail popup (reuses section 1)
- GET /api/v1/search/recent → returns last 10 searches for logged-in user (auth required)
- DELETE /api/v1/search/recent → clears user's search history
- GET /api/v1/search/trending → returns top 10 trending search terms across all users 
3) Wishlist

- API to return all products saved in user's wishlist — returns product data (image URL, name, price, productId, stock availability)
- API to add a product to wishlist — accepts productId, saves to user's wishlist in database
- API to remove a product from wishlist — accepts productId, deletes from user's wishlist
- API to move product from wishlist to cart — accepts productId, adds to cart and removes from wishlist in one request

## Database model needed:
- Wishlist: id, userId, productId, addedAt
  (Product model already defined in section 1 — no duplication)

## API endpoints:
- GET /api/v1/wishlist → returns all products in user's wishlist (auth required)
- POST /api/v1/wishlist → adds product to wishlist (body: { productId })
- DELETE /api/v1/wishlist/:productId → removes specific product from wishlist
- POST /api/v1/wishlist/:productId/move-to-cart → moves product from wishlist to cart and removes from wishlist in one request

---

4) Add to Cart

- API to add product to cart — accepts productId and quantity, stores in user's cart in database
- API to return all cart items — returns list of products in cart with image URL, name, price, quantity, subtotal per item, and cart total
- API to update item quantity in cart — accepts productId and new quantity (increase/decrease)
- API to remove single item from cart — accepts productId, deletes from cart
- API to remove multiple/all items from cart — accepts array of productIds or flag to clear entire cart
- API to initiate checkout from cart — accepts selected cart item IDs, creates an order, returns order summary for payment

## Database model needed:
- CartItem: id, userId, productId, quantity, addedAt
  (Product model already defined in section 1 — no duplication)

## API endpoints:
- GET /api/v1/cart → returns all cart items with product details, subtotals, and cart total (auth required)
- POST /api/v1/cart → adds product to cart (body: { productId, quantity })
- PATCH /api/v1/cart/:productId → updates quantity (body: { quantity })
- DELETE /api/v1/cart/:productId → removes single item from cart
- DELETE /api/v1/cart → clears entire cart (or body: { productIds: [...] } to remove multiple)
- POST /api/v1/cart/checkout → initiates checkout (body: { cartItemIds: [...] }), creates order, returns order summary

---

5) Footer / Static Pages

- Reuses cart APIs (section 4) and wishlist APIs (section 3) for /add-to-cart and /wishlist pages
- API to return static content for about-us and help pages

## Database model needed:
- Page: id, slug, title, content, updatedAt

## API endpoints:
- GET /api/v1/pages/about-us → returns company info, mission, contact details
- GET /api/v1/pages/help → returns FAQs, support phone number, email, help topics

---

6) Authentication — Shared Module (User, Delivery Boy, Admin)

- Single auth module serving all three roles — role is determined by the route prefix and verified from database
- RBAC enforced: user credentials cannot access admin/delivery portals and vice versa
- JWT token contains userId and role — middleware validates role on every protected route
- Password hashing with bcrypt, minimum 10 salt rounds
- Password rules enforced: minimum 8 chars, at least 1 uppercase, 1 special character, 1 number
- Email format validated with regex, phone number must be 10 digits
- Rate limiting: max 5 login attempts per 15 minutes per IP, max 3 password reset requests per hour

## Database model needed:
- User: id, name, email, phone, password (hashed), role (enum: "user" | "delivery" | "admin"), isVerified, profilePicture, createdAt, updatedAt
- RefreshToken: id, userId, token, expiresAt, createdAt

## API endpoints:
- POST /api/v1/auth/signup → registers new user (body: { name, email, phone, password, role }); admin signup requires preset invite code
- POST /api/v1/auth/login → authenticates user (body: { email, password }); validates role against database, returns { accessToken, refreshToken }
- POST /api/v1/auth/logout → invalidates refresh token (auth required)
- POST /api/v1/auth/refresh-token → issues new access token using refresh token
- POST /api/v1/auth/forgot-password → sends password reset email (body: { email }); generates time-limited reset token
- POST /api/v1/auth/reset-password → resets password (body: { resetToken, newPassword, confirmPassword })
- GET /api/v1/auth/me → returns current user profile based on JWT (auth required)

---

7) Payment (Mock)

- Mock payment API — always returns payment successful for now (real integration later)
- Stores payment record linked to order

## Database model needed:
- Payment: id, orderId, userId, amount, method (enum: "upi" | "credit-debit" | "cod"), status (enum: "pending" | "success" | "failed" | "refunded"), transactionId, paidAt

## API endpoints:
- POST /api/v1/payments/process → mock payment (body: { orderId, method }); always returns { status: "success", transactionId }
- GET /api/v1/payments/:orderId → returns payment details for an order (auth required)

---

8) Track Delivery

- After checkout + payment, user can track their delivery in real-time
- Uses WebSocket for live location updates from delivery boy to user
- Returns delivery boy info, ETA, and live GPS coordinates

## Database model needed:
- DeliveryTracking: id, orderId, deliveryBoyId, currentLat, currentLng, status (enum: "assigned" | "picking_up" | "picked_up" | "on_the_way" | "delivered"), estimatedArrival, updatedAt

## API endpoints:
- GET /api/v1/orders/:orderId/tracking → returns current delivery status, delivery boy name, phone, ETA, last known location
- WebSocket: ws://host/api/v1/tracking/:orderId → real-time stream of { lat, lng, eta, status } updates every 5 seconds

---

9) My Orders

- API to return all orders for logged-in user — current and past, with cancel and reorder options
- Returns empty state message when no orders exist

## Database model needed:
- Order: id, userId, items (array of { productId, name, image, quantity, price }), totalAmount, deliveryCharge, surgeCharge, handlingCharge, grandTotal, status (enum: "ordered" | "shipped" | "out_for_delivery" | "delivered" | "cancelled"), deliveryBoyId, deliveryAddress, paymentMethod, paymentStatus, createdAt, updatedAt
- OrderStatusHistory: id, orderId, status, changedAt

## API endpoints:
- GET /api/v1/orders?page=1&limit=10 → returns paginated orders for logged-in user, newest first; each order has: orderId, date, totalAmount, status, item thumbnails (auth required)
- GET /api/v1/orders/:orderId → returns full order detail: items (image, name, qty, price), delivery address, payment method, tracking info
- POST /api/v1/orders/:orderId/cancel → cancels order (only if status is "ordered" or "shipped"); triggers refund if payment made
- POST /api/v1/orders/:orderId/reorder → adds all items from past order back into cart

---

10) My Profile & Addresses

- API to manage user profile, addresses, and password

## Database model needed:
- Address: id, userId, name, phone, addressLine1, addressLine2, city, state, pincode, isDefault, createdAt, updatedAt
  (User model already defined in section 6 — no duplication)

## API endpoints:
- GET /api/v1/profile → returns user profile: name, email (verified badge), phone, profilePicture (auth required)
- PATCH /api/v1/profile → updates name, phone (body: { name, phone })
- POST /api/v1/profile/picture → uploads/changes profile picture (multipart/form-data, max 2MB, jpg/png only)
- GET /api/v1/profile/addresses → returns all saved addresses
- POST /api/v1/profile/addresses → adds new address (body: { name, phone, addressLine1, addressLine2, city, state, pincode })
- PATCH /api/v1/profile/addresses/:addressId → updates address fields
- DELETE /api/v1/profile/addresses/:addressId → deletes address
- PATCH /api/v1/profile/addresses/:addressId/default → sets address as default (unmarks previous default)
- POST /api/v1/profile/change-password → changes password (body: { currentPassword, newPassword, confirmPassword }); enforces same password rules as signup

---

# API for Delivery Man

11) Delivery Boy Auth

- Uses shared auth module from section 6 with role = "delivery"
- Signup, login, forgot-password, reset-password — all same endpoints with role validation
- No additional endpoints needed — section 6 handles everything

---

12) Delivery Dashboard

- Delivery boy can toggle online/offline status to receive order assignments
- Nearest-delivery-boy assignment algorithm (Ola/Uber/Zepto style) based on GPS proximity
- QR code verification flow: scan at pickup, image verification at delivery
- WebSocket for real-time order assignment notifications and GPS streaming

## Database models needed:
- DeliveryBoy: id, userId, isOnline, currentLat, currentLng, totalDeliveries, totalEarnings, currentOrderId, lastActiveAt
- DeliveryVerification: id, orderId, deliveryBoyId, pickupQrImage, deliveryProofImage, isVerified, verifiedAt
- GpsViolation: id, deliveryBoyId, orderId, violationType (enum: "fake_pickup" | "fake_delivery"), expectedLat, expectedLng, actualLat, actualLng, detectedAt

## API endpoints:
- PATCH /api/v1/delivery/status → toggles online/offline (body: { isOnline: true/false }); when online, starts receiving order assignments
- GET /api/v1/delivery/current-order → returns current assigned order: customer name, address, items list, payment method, pickup location, drop location
- POST /api/v1/delivery/location → updates delivery boy GPS location (body: { lat, lng }); called every 5 seconds by delivery app
- WebSocket: ws://host/api/v1/delivery/assignments → real-time stream for new order assignments; sends "finding customer..." status while searching, then order details when assigned
- POST /api/v1/delivery/pickup → marks order as picked up; generates QR code with product image for verification (body: { orderId })
- POST /api/v1/delivery/deliver → marks order as delivered; requires proof image upload (multipart/form-data: { orderId, proofImage }); backend verifies against pickup QR image — only assigns next order if verified
- GET /api/v1/delivery/history?period=today&page=1&limit=20 → returns past deliveries filtered by today/week/month with per-delivery earnings
- GET /api/v1/delivery/earnings → returns total earnings, earnings today, this week, this month
- WebSocket: ws://host/api/v1/delivery/notifications → sends alert notifications like "Ek aur delivery" when new order is available

---

# Admin Backend

13) Admin Auth (RBAC)

- Uses shared auth module from section 6 with role = "admin"
- Admin signup requires preset invite code (stored as env variable) — without it, signup is rejected
- One preset admin account seeded in database on first deployment
- No additional endpoints needed — section 6 handles everything with RBAC middleware

---

14) Admin Analytics Dashboard

- APIs to return aggregated data for charts and graphs

## Database models needed:
  (Order and Payment models already defined in sections 9 and 7 — no duplication; analytics are aggregation queries)

## API endpoints:
- GET /api/v1/admin/analytics/orders → returns order stats: total placed, total cancelled, total delivered; data formatted for orders placed vs cancelled graph and delivered vs cancelled graph
- GET /api/v1/admin/analytics/revenue?period=30d → returns daily revenue for last 30 days; supports period=6m for month-wise revenue comparison
- GET /api/v1/admin/analytics/summary → returns dashboard summary: total revenue, total orders, total users, total delivery boys, orders today

---

15) Admin Product Inventory CRUD

- Admin can view all products and perform create, read, update, delete operations

## Database models needed:
  (Product model already defined in section 1 — no duplication)

## API endpoints:
- GET /api/v1/admin/products?page=1&limit=20 → returns paginated product table: image, name, category, price, stock, productId
- POST /api/v1/admin/products → creates new product (multipart/form-data: { image, name, category, price, stock }); all fields mandatory
- PATCH /api/v1/admin/products/:productId → updates product fields
- DELETE /api/v1/admin/products/:productId → deletes product

---

16) Admin Delivery Boy Monitoring

- Real-time view of all delivery boys with live status updates

## Database models needed:
  (DeliveryBoy model already defined in section 12 — no duplication)

## API endpoints:
- GET /api/v1/admin/delivery-boys?status=online&page=1&limit=20 → returns paginated list of delivery boys: name, phone, onlineStatus, totalDeliveries, currentOrder; filterable by status (online/offline/on-delivery), searchable by name, sortable by totalDeliveries or joinDate
- GET /api/v1/admin/delivery-boys/:deliveryBoyId → returns full delivery boy profile: name, email, phone, onlineStatus, totalDeliveries, currentOrder details, past delivery history summary
- GET /api/v1/admin/delivery-boys/stats → returns: total registered, total online, total on delivery
- WebSocket: ws://host/api/v1/admin/delivery-boys/live → real-time updates when delivery boy logs in, goes online/offline, gets assigned, completes delivery, or new delivery boy signs up

---

17) Admin Delivery Charge & Surge Charge Management

- Admin can view and modify delivery charges and surge pricing settings

## Database model needed:
- ChargeSettings: id, baseDeliveryCharge, handlingCharge, surgeMultiplier, surgeActive (boolean), peakHoursStart, peakHoursEnd, freeDeliveryThreshold, demandSurgeThreshold, updatedBy (adminId), updatedAt
- ChargeAuditLog: id, adminId, field, oldValue, newValue, changedAt

## API endpoints:
- GET /api/v1/admin/charges → returns current charge settings: base delivery charge, surge multiplier, surge active status, surge conditions, handling charge
- PATCH /api/v1/admin/charges → updates charge settings (body: any combination of { baseDeliveryCharge, handlingCharge, surgeMultiplier, surgeActive, peakHoursStart, peakHoursEnd, freeDeliveryThreshold, demandSurgeThreshold }); validates all values ≥ 0; logs change to audit trail
- GET /api/v1/admin/charges/audit-log?page=1&limit=20 → returns paginated audit log of all charge changes with admin name, old value, new value, timestamp
- GET /api/v1/admin/charges/calculate?cartTotal=500 → returns charge breakdown for given cart total: base delivery, surge (if active), handling, total delivery cost

---

18) Admin Order Management

- Admin can view, search, filter all orders; cancel orders and process refunds

## Database model needed:
- Refund: id, orderId, refundAmount, refundMethod, refundStatus (enum: "initiated" | "processing" | "completed"), initiatedBy (adminId), initiatedAt, completedAt
  (Order model already defined in section 9 — no duplication)

## API endpoints:
- GET /api/v1/admin/orders?page=1&limit=20&status=ordered&search=ORD123 → returns paginated orders table: orderId, customerName, totalAmount, status, deliveryBoyName, orderDate; supports search by orderId or customerName, filter by status (multiple allowed)
- GET /api/v1/admin/orders/:orderId → returns full order detail: customer info, items list (image, name, qty, price, subtotal), delivery address, payment method + status, delivery info (boy name, phone, assignedAt, pickedUpAt, deliveredAt, ETA), order timeline (status history with timestamps), amount breakdown (items total, delivery charge, surge, handling, grand total)
- POST /api/v1/admin/orders/:orderId/cancel → cancels order (validates: only "ordered" or "shipped" can be cancelled); triggers auto-refund if payment was made; notifies customer and delivery boy
- POST /api/v1/admin/orders/:orderId/refund → processes refund (body: { amount, reason }); supports full or partial refund; creates refund record; updates payment status to "refunded"
- PATCH /api/v1/admin/orders/:orderId/status → manually updates order status (body: { status }); validates transition order (ordered→shipped→out_for_delivery→delivered, no skipping or reversing); logs change with admin who made it
- GET /api/v1/admin/orders/stats → returns: total orders, orders by status, orders today/this week/this month, total revenue from delivered orders, total refunds processed

