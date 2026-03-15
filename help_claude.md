# Help Claude — Full Project Context

> This file helps Claude remember everything across sessions. Last updated: 2026-03-13 (end of day 2).

---

## Project Overview

Full-stack ecommerce marketplace (Amazon-like) with 3 user roles: **Customer**, **Delivery Boy**, **Admin** — each with separate portals and strict RBAC.

**Tech Stack:** React + Vite + Axios (frontend), Node.js + Express (backend), MongoDB via Docker (database), WebSocket via `ws` (real-time features), Leaflet + react-leaflet (maps)

**Approach:** "Furniture inspection" — test every phase thoroughly on localhost before moving to next phase. User approves each phase plan before building.

**Project is divided into 6 phases. Phases 1-5 are COMPLETE. Phase 6 (Admin Portal) is NEXT.**

---

## Folder Structure (Important Paths)

```
ecommerce_structure-main/ecommerce_structure-main/
├── server/                          # Backend root
│   ├── server.js                    # Entry point (HTTP + WebSocket server)
│   ├── docker-compose.yml           # MongoDB container
│   ├── seed.js                      # Seed script for sample products
│   ├── uploads/                     # Profile picture uploads
│   └── src/
│       ├── app.js                   # Express app with all middleware + routes
│       ├── config/
│       │   ├── db.js                # MongoDB connection
│       │   └── env.js               # Environment variables
│       ├── middleware/
│       │   ├── auth.js              # authenticate, requireRole, optionalAuth
│       │   ├── errorHandler.js      # Global error handler
│       │   └── validate.js          # Signup/login validation
│       ├── models/
│       │   ├── User.js              # 3 roles: user, delivery, admin
│       │   ├── RefreshToken.js      # JWT refresh tokens
│       │   ├── Product.js           # Product catalog
│       │   ├── CartItem.js          # Shopping cart
│       │   ├── Wishlist.js          # Wishlist
│       │   ├── Order.js             # Orders with items, charges, status
│       │   ├── Payment.js           # Payment records
│       │   ├── Address.js           # User addresses
│       │   ├── DeliveryBoy.js       # Delivery boy profile (online, GPS, earnings)
│       │   ├── DeliveryTracking.js  # Real-time delivery tracking
│       │   └── ChargeConfig.js     # Configurable charges + audit log
│       ├── controllers/
│       │   ├── auth.controller.js   # signup, login, logout, refresh, forgot-password
│       │   ├── product.controller.js# CRUD + search + filters
│       │   ├── cart.controller.js   # Cart CRUD
│       │   ├── wishlist.controller.js# Wishlist CRUD
│       │   ├── checkout.controller.js# Cart→Order + assign delivery boy
│       │   ├── order.controller.js  # Orders list, detail, cancel, reorder, tracking
│       │   ├── payment.controller.js# Mock payment processing
│       │   ├── profile.controller.js# Profile CRUD + addresses + change password
│       │   ├── delivery.controller.js# Toggle online, current order, pickup, deliver, location
│       │   ├── deliveryHistory.controller.js # History + earnings
│       │   └── admin.controller.js    # Dashboard, orders, users, delivery, charges
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── product.routes.js
│       │   ├── search.routes.js
│       │   ├── cart.routes.js
│       │   ├── wishlist.routes.js
│       │   ├── checkout.routes.js
│       │   ├── order.routes.js
│       │   ├── payment.routes.js
│       │   ├── profile.routes.js
│       │   ├── delivery.routes.js
│       │   └── admin.routes.js        # Admin endpoints (requireRole admin)
│       ├── services/
│       │   └── orderAssignment.js   # Nearest delivery boy algorithm (Haversine)
│       └── websocket/
│           └── deliverySocket.js    # WebSocket server for delivery + tracking
│
├── client/                          # Frontend root
│   ├── vite.config.js               # Proxy: /api, /uploads, /ws → localhost:5000
│   └── src/
│       ├── main.jsx                 # App entry with AuthProvider, CartProvider, DeliveryProvider
│       ├── App.jsx                  # All routes defined here
│       ├── api/
│       │   └── axios.js             # Axios instance with token refresh interceptor
│       ├── contexts/
│       │   ├── AuthContext.jsx       # Auth state (login, signup, logout, token refresh)
│       │   ├── CartContext.jsx       # Cart + wishlist (guest localStorage + auth API)
│       │   └── DeliveryContext.jsx   # Delivery boy state (online, orders, GPS, WebSocket)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx        # Main navbar with search, cart, profile dropdown
│       │   │   ├── Footer.jsx
│       │   │   └── AdminSidebar.jsx + AdminSidebar.css  # Admin sidebar nav
│       │   └── search/
│       │       └── SearchBar.jsx     # Debounced search with autocomplete
│       ├── routes/
│       │   └── ProtectedRoute.jsx    # Role-based route protection
│       └── pages/
│           ├── auth/
│           │   ├── Login.jsx
│           │   ├── Signup.jsx
│           │   ├── ForgotPassword.jsx
│           │   └── ResetPassword.jsx
│           ├── customer/
│           │   ├── Home.jsx
│           │   ├── SearchResults.jsx
│           │   ├── Cart.jsx + Cart.css
│           │   ├── Wishlist.jsx + Wishlist.css
│           │   ├── Checkout.jsx + Checkout.css
│           │   ├── MyOrders.jsx + MyOrders.css
│           │   ├── MyProfile.jsx + MyProfile.css
│           │   └── OrderTracking.jsx + OrderTracking.css  (Leaflet map)
│           ├── delivery/
│           │   ├── DeliveryDashboard.jsx + DeliveryDashboard.css
│           │   └── DeliveryHistory.jsx + DeliveryHistory.css
│           └── admin/
│               ├── AdminDashboard.jsx + AdminDashboard.css
│               ├── AdminProducts.jsx + AdminProducts.css
│               ├── AdminOrders.jsx + AdminOrders.css
│               ├── AdminUsers.jsx + AdminUsers.css
│               ├── AdminDelivery.jsx + AdminDelivery.css
│               └── AdminCharges.jsx + AdminCharges.css
```

---

## Completed Phases — Detailed

### Phase 1 — Foundation (COMPLETE & TESTED on 2026-03-12)

**Backend:**
- Docker + MongoDB on port 27017 via docker-compose.yml
- Express server with cors, helmet, rate-limit, morgan, compression
- JWT auth: access token 15min, refresh token 7 days
- 3 roles: user (customer), delivery, admin
- Admin signup requires invite code: `ADMIN-INVITE-2024`
- Password: bcrypt 10 salt rounds, min 8 chars, 1 uppercase, 1 special, 1 number
- Auth routes with rate limiting (5 login/15min, 3 signup/hr)
- Forgot password with reset token flow

**Frontend:**
- Vite + React Router + Axios with interceptors (auto token refresh)
- AuthContext with login/signup/logout
- ProtectedRoute with role-based access
- Pages: Login, Signup, ForgotPassword, ResetPassword, Home
- Navbar with profile dropdown (My Orders, My Profile links)
- Footer

**Issues Fixed During Testing:**
- MongoDB auth error — resolved by resetting Docker volumes (`docker-compose down -v` then `docker-compose up`)
- Port 27017 conflict — stopped competing MongoDB instance on host
- Forgot password flow — built complete reset password feature when user discovered button didn't work

---

### Phase 2 — Product Catalog (COMPLETE & TESTED on 2026-03-13)

**Backend:**
- `models/Product.js` — name, description, price, stock, image, category, subcategory
- `controllers/product.controller.js` — CRUD + search with filters + suggestions autocomplete
- `routes/product.routes.js` — Public: GET list/detail/suggestions. Admin: POST/PUT/DELETE
- `seed.js` — Sample products with placeholder images (run `node seed.js`)

**Frontend:**
- Product listing page with responsive grid (2 mobile / 3 tablet / 4-5 desktop)
- Product detail page
- SearchBar component: 400ms debounce, autocomplete dropdown, recent searches, trending searches
- Input validation/sanitization on search (blocks gibberish queries like random characters)
- Category/subcategory filtering

**Key API Routes:**
- GET `/api/v1/products` — List with pagination + filters
- GET `/api/v1/products/:id` — Single product detail
- GET `/api/v1/products/suggestions?q=` — Search autocomplete
- POST/PUT/DELETE `/api/v1/products` — Admin CRUD

**Issues Fixed:**
- Products 404 after re-seed: old product IDs in frontend didn't match new DB IDs after re-seeding
- Gibberish search hitting API: added input validation to block random character queries

---

### Phase 3 — Cart & Wishlist (COMPLETE & TESTED on 2026-03-13)

**Backend:**
- `models/CartItem.js` — userId + productId + quantity (unique index)
- `models/Wishlist.js` — userId + productId (unique index)
- Cart controller: getCart (with charge calculations), addToCart, updateCartItem, removeCartItem, clearCart
- Wishlist controller: getWishlist, addToWishlist, removeFromWishlist, moveToCart
- All routes require authentication

**Frontend:**
- `CartContext.jsx` — Dual mode: guest (localStorage) + authenticated (API)
  - Guest cart stored in `guest_cart` localStorage key
  - Guest wishlist stored in `guest_wishlist` localStorage key
  - Auto-syncs guest data to DB on login
- `Cart.jsx` — Quantity controls (+/-), move to wishlist, remove, clear cart, order summary with charges
- `Wishlist.jsx` — Responsive grid, move to cart, remove, stock status display
- Routes: `/add-to-cart`, `/wishlist`

**Key Design Decision (User's UX Choice):**
- Cart/wishlist works WITHOUT login (guest mode via localStorage)
- Login required ONLY at checkout (reduces bounce rate)
- Guest data syncs to DB automatically on login

**Charge Calculations:**
- Delivery: FREE if subtotal ≥ ₹500, else ₹40
- Handling: ₹5 flat
- Surge: ₹0 (configurable by admin in Phase 6)

---

### Phase 4 — Checkout, Orders, Payments, Profile (COMPLETE & TESTED on 2026-03-13)

**Backend Models:**
- `Order.js` — items array, charges (totalAmount, deliveryCharge, surgeCharge, handlingCharge, grandTotal), status enum (ordered/shipped/out_for_delivery/delivered/cancelled), deliveryAddress embedded, paymentMethod, paymentStatus
- `Payment.js` — orderId, userId, amount, method (upi/credit-debit/cod), status (pending/success/failed/refunded), transactionId
- `Address.js` — userId, name, phone (10 digits), addressLine1/2, city, state, pincode (6 digits), isDefault

**Backend Controllers:**
- `checkout.controller.js` — POST `/checkout` creates order from cart (validates stock, calculates charges, reduces stock, clears cart, triggers delivery boy assignment). GET `/checkout/charges` calculates charges for a given cart total.
- `order.controller.js` — GET `/orders` (paginated, newest first), GET `/orders/:id` (detail), POST `/orders/:id/cancel` (only if ordered/shipped, restores stock, auto-refunds), POST `/orders/:id/reorder` (adds items back to cart with stock validation), GET `/orders/:id/tracking` (returns tracking + delivery boy info)
- `payment.controller.js` — POST `/payments/process` (mock payment, always succeeds, generates transactionId for non-COD), GET `/payments/:orderId`
- `profile.controller.js` — GET/PATCH `/profile`, POST `/profile/picture` (multer, 2MB max, jpg/png), POST `/profile/change-password`, full address CRUD: GET/POST `/profile/addresses`, PATCH/DELETE `/profile/addresses/:id`, PATCH `/profile/addresses/:id/default`

**Backend Routes registered in app.js:**
- `/api/v1/checkout` → checkout.routes.js
- `/api/v1/orders` → order.routes.js
- `/api/v1/payments` → payment.routes.js
- `/api/v1/profile` → profile.routes.js
- `/uploads` → static files (profile pictures)

**Frontend Pages:**
- `Checkout.jsx` — 3-step flow:
  - Step 1: Select delivery address (or add new one inline)
  - Step 2: Select payment method (UPI / Credit-Debit / Cash on Delivery) — card-based UI
  - Step 3: Review & confirm (address, payment, items, charges breakdown) → Place Order
  - After placing → redirects to My Orders
- `MyOrders.jsx` — Vertical order cards (newest first), each shows order ID, date, total, status badge
  - Status badge colors: Ordered=blue, Shipped=orange, Out for Delivery=yellow, Delivered=green, Cancelled=red
  - Click card → expands with full detail (items with images, delivery address, payment method, charges breakdown)
  - Buttons: Reorder (adds items to cart), Track Order (purple, for active orders), Cancel Order (red, only if ordered/shipped)
  - Skeleton loading, pagination
  - Empty state: "No orders yet — start shopping!"
- `MyProfile.jsx` — Three sections:
  - Profile info: avatar (first letter or uploaded pic), editable name + phone, email (read-only with verified badge), "Change" link for picture upload
  - Manage Addresses: cards with name/address/phone, "Default" badge, Edit/Delete/Set Default buttons, "Add New Address" form with validation (10-digit phone, 6-digit pincode)
  - Change Password: current + new + confirm, enforces same password rules as signup

**Navbar Already Had:** My Orders + My Profile links in profile dropdown (built in Phase 3)

**Issues Fixed During Testing:**
- Navbar/Footer import paths: components were in `components/layout/` not `components/` — fixed imports in Checkout, MyOrders, MyProfile
- Cart "Proceed to Checkout" button was a stub `// Phase 4 checkout` — fixed to navigate to `/checkout`
- Profile picture not showing: Vite proxy only forwarded `/api`, not `/uploads` — added `/uploads` proxy to vite.config.js
- Needed `multer` package installed: `npm install multer` in server
- Needed `uploads` folder created: `mkdir server\uploads`

**Order Status Flow:**
```
ordered → shipped → out_for_delivery → delivered (success path)
ordered → cancelled (user/admin cancels)
shipped → cancelled (user/admin cancels)
```

**Payment is MOCK:** Always succeeds. UPI/Card get a transactionId, COD stays pending.

---

### Phase 5 — Delivery Boy Portal + Customer Tracking (COMPLETE on 2026-03-13, awaiting testing)

**Backend Models:**
- `DeliveryBoy.js` — userId (ref User), isOnline, currentLat, currentLng, totalDeliveries, totalEarnings, currentOrderId, lastActiveAt
- `DeliveryTracking.js` — orderId, deliveryBoyId, currentLat, currentLng, status (assigned/picking_up/picked_up/on_the_way/delivered), estimatedArrival, pickedUpAt, deliveredAt

**Backend Controllers:**
- `delivery.controller.js`:
  - GET `/delivery/status` — returns isOnline + hasActiveOrder
  - PATCH `/delivery/status` — toggle online/offline (auto-creates DeliveryBoy record if first time)
  - GET `/delivery/current-order` — returns current assigned order + tracking info
  - POST `/delivery/location` — updates GPS (lat/lng) every 5 seconds, also updates tracking record, broadcasts to customer WebSocket
  - POST `/delivery/pickup` — confirms pickup (validates order is assigned to this boy, updates tracking to "picked_up", updates order to "shipped", broadcasts to customer)
  - POST `/delivery/deliver` — confirms delivery (updates tracking to "delivered", updates order to "delivered", adds earning to delivery boy stats, clears currentOrderId, broadcasts to customer)
- `deliveryHistory.controller.js`:
  - GET `/delivery/history?period=today|week|month&page=1&limit=20` — paginated delivery history for selected period
  - GET `/delivery/earnings` — earnings summary (today, week, month, all-time) + delivery counts

**Order Assignment Service (`services/orderAssignment.js`):**
- Called automatically after checkout (non-blocking, async)
- Finds all online delivery boys with no active order who have GPS coordinates
- Uses **Haversine formula** to calculate distance from each delivery boy to pickup location
- Assigns to nearest delivery boy
- Creates DeliveryTracking record with ETA (estimated from distance)
- Notifies delivery boy via WebSocket
- If no delivery boys available → logs to console (order stays unassigned)
- Default pickup location: Delhi (28.6139, 77.209) — in production would come from seller data

**WebSocket Server (`websocket/deliverySocket.js`):**
- Runs on `/ws` path, attached to HTTP server in server.js
- Authentication via `?token=` query parameter (JWT verified)
- Two connection types:
  - `?type=delivery` — delivery boy connection, tagged with `deliveryBoyUserId`
  - `?type=tracking&orderId=xxx` — customer tracking connection, tagged with `orderId`
- Heartbeat every 30 seconds to keep connections alive
- Messages sent to delivery boys: `{ type: "order_assigned", orderId, deliveryAddress, items, ... }`
- Messages sent to customers: `{ type: "location_update", lat, lng, status }` and `{ type: "status_update", status }`

**server.js Changes:**
- Now uses `http.createServer(app)` instead of `app.listen()` to support WebSocket
- WebSocket initialized with `initWebSocket(server)`
- Console logs WebSocket ready URL on startup

**checkout.controller.js Changes:**
- After creating order + clearing cart, calls `assignOrder(order._id)` asynchronously
- Non-blocking: doesn't wait for assignment, responds immediately to customer

**order.controller.js Changes:**
- Added `getOrderTracking` — GET `/orders/:orderId/tracking` returns order status, tracking data (GPS, ETA, status), delivery boy name + phone

**Frontend — Delivery Boy Portal:**
- `DeliveryContext.jsx` — State: isOnline, currentOrder, tracking, earnings
  - Manages WebSocket connection (connect on online, disconnect on offline)
  - GPS location polling every 5 seconds via `navigator.geolocation` + POST `/delivery/location`
  - Methods: toggleOnlineStatus, fetchCurrentOrder, markPickedUp, markDelivered, fetchEarnings
  - WebSocket listens for `order_assigned` → auto-fetches current order
- `DeliveryDashboard.jsx` — Main delivery boy page:
  - Header: title, greeting, History link, Logout button
  - Big toggle button: "Go Online" (green) / "Go Offline" (red) with status indicator
  - When offline: "You are offline. Go online to receive deliveries."
  - When online + no order: Spinner + "Finding customer..." message
  - When online + order assigned: Full order detail card:
    - Status display (assigned/picking up/picked up/on the way)
    - Delivery address card (name, full address, phone)
    - Items list with quantities and prices + total
    - Payment info (method, COD alert to collect cash)
    - ETA card (green background, shows arrival time)
    - Action buttons: "Confirm Pickup" (orange) or "Confirm Delivery" (green) based on status
- `DeliveryHistory.jsx` — History page:
  - Summary cards at top: Deliveries count, Earnings (green), Avg per delivery
  - All-time stats line
  - Period filter tabs: Today / This Week / This Month
  - Delivery cards: order ID, customer name, earning (+₹XX green), "Delivered" badge, location, item count, timestamps
  - Pagination

**Frontend — Customer Order Tracking:**
- `OrderTracking.jsx` — Live tracking page with Leaflet map:
  - Fetches tracking data from GET `/orders/:orderId/tracking`
  - Connects to WebSocket `ws://host:5000/ws?token=xxx&type=tracking&orderId=xxx`
  - Receives live GPS updates → moves marker on map
  - Receives status updates → updates status bar
  - Components:
    - Header with back link + order ID
    - "Order Delivered!" green banner when delivered
    - Status progress bar (5 dots: assigned → picking_up → picked_up → on_the_way → delivered) with colors
    - ETA display (calculates minutes remaining from estimatedArrival)
    - Delivery boy info card (avatar, name, phone)
    - Leaflet map with delivery boy marker (auto-updates position)
    - Delivery address card
  - Uses Leaflet default markers with CDN icon URLs (fixes broken default icons)
  - Cleanup: closes WebSocket on unmount
- `MyOrders.jsx` updated: "Track Order" button (purple) for orders with status ordered/shipped/out_for_delivery

**App.jsx Routes Added:**
- `/orders/:orderId/tracking` → OrderTracking
- `/delivery/dashboard` → DeliveryDashboard (was placeholder, now real component)
- `/delivery/history` → DeliveryHistory (new)

**main.jsx Updated:** Added DeliveryProvider wrapping App

**vite.config.js Updated:** Added `/ws` proxy with `ws: true` for WebSocket

**Packages to Install:**
- Server: `npm install ws` (WebSocket library)
- Client: `npm install leaflet react-leaflet` (map components)

**Delivery Status Flow:**
```
assigned → picking_up → picked_up → on_the_way → delivered
```

**Deferred to Later (not built in Phase 5):**
- GPS violation detection (fraud prevention) — flagging fake pickup/delivery
- Image verification (QR code at pickup, proof photo at delivery)
- Google Maps / route drawing on map (using basic Leaflet markers instead)
- "Ek aur delivery" notification popup (basic WebSocket assignment instead)

---

## Phase 6 — Admin Portal (COMPLETE & TESTED on 2026-03-14)

**Backend:**
- `models/ChargeConfig.js` — deliveryCharge, freeDeliveryThreshold, surgeCharge, handlingCharge + auditLog array
- `controllers/admin.controller.js` — 8 endpoints: getDashboardStats, getAllOrders, updateOrderStatus, cancelOrder, getAllUsers, getDeliveryBoys, getCharges, updateCharges
- `routes/admin.routes.js` — all routes protected with `authenticate, requireRole('admin')`
- `app.js` — registered `/api/v1/admin` route
- Added product CRUD routes: POST/PUT/DELETE `/api/v1/products` with admin auth
- Added `createProduct`, `updateProduct`, `deleteProduct` to product.controller.js

**Frontend:**
- `components/layout/AdminSidebar.jsx + .css` — sidebar nav with 6 links, responsive (collapses to icons on mobile)
- `pages/admin/AdminDashboard.jsx + .css` — stats cards (orders, revenue, refunds, products, users, delivery boys), orders by status bars, recent orders table
- `pages/admin/AdminProducts.jsx + .css` — product table with category dropdown, add/edit modal, delete with confirm, pagination
- `pages/admin/AdminOrders.jsx + .css` — order list with status filter, expandable detail (items, address, charges), status update buttons, cancel (only before pickup)
- `pages/admin/AdminUsers.jsx + .css` — user list with role filter, avatar, role badges, pagination
- `pages/admin/AdminDelivery.jsx + .css` — delivery boy cards with online/offline status, active order info, GPS, earnings, refresh button
- `pages/admin/AdminCharges.jsx + .css` — charge config editor with audit log (old → new values)

**App.jsx routes added:**
- `/admin/dashboard` → AdminDashboard
- `/admin/products` → AdminProducts
- `/admin/orders` → AdminOrders
- `/admin/users` → AdminUsers
- `/admin/delivery` → AdminDelivery
- `/admin/charges` → AdminCharges

**Bugs fixed during Phase 6:**
- Product CRUD routes didn't exist — added POST/PUT/DELETE with admin auth
- Product model uses `categoryId` (ObjectId ref to Category) not `category` string — updated AdminProducts to use category dropdown from `/api/v1/categories`
- Product `slug` field required but not set in create — explicitly generate slug in createProduct controller
- Order charges are flat fields (`grandTotal`, `totalAmount`, `deliveryCharge`, `surgeCharge`, `handlingCharge`) NOT nested under `charges` — fixed all admin controllers and frontend references
- Cancel order restricted to `status === 'ordered'` only (before pickup) — both admin and customer side — to reduce refund rate

**Key Design Decision:**
- Cancel only allowed when status is "ordered" (before delivery boy picks up). Once picked up, no cancellation allowed. This reduces refund rate.

---

## All Phases COMPLETE — Security Audit Pending

All 6 phases are built and tested. Next step is security hardening before deployment.

---

## Security Audit Results (2026-03-14)

### Already Implemented ✓
- Helmet.js security headers
- CORS restricted to frontend URL
- Global rate limiting (100 req/min)
- Body size limit (10MB)
- bcrypt password hashing (10 salt rounds)
- JWT access token (15min) + refresh token (7 days)
- RBAC — requireRole middleware (user, delivery, admin)
- User enumeration prevention (same error for invalid email vs wrong password)
- Password reset with crypto tokens (15min expiry)
- Refresh token rotation (old deleted, new issued)
- Admin invite code from environment variable
- File upload — 2MB limit, jpg/png only, safe filename generation
- Error handler — no stack traces leaked to client
- Stock validation at checkout
- Password excluded from JSON responses (toJSON method)
- Input validation (email regex, 10-digit phone, strong password rules)

### CRITICAL — Must Fix Before Deployment ✗
1. **Stock race condition** — stock check and decrement are separate DB operations, overselling possible under concurrent requests. Fix: use MongoDB transactions or atomic $inc with $gte condition
2. **No XSS sanitization** — user input (name, address, product description) not sanitized before storage/display. Fix: add sanitize-html or DOMPurify
3. **Tokens in localStorage** — access + refresh tokens stored in localStorage, vulnerable to XSS. Fix: move to httpOnly secure cookies
4. **No CSRF protection** — no CSRF tokens or SameSite cookie enforcement. Fix: add csurf middleware or double-submit pattern (required if moving to cookies)
5. **Password reset token returned in response body** — should be sent via email only, not exposed in API response. Fix: integrate email service (nodemailer)

### HIGH — Should Fix Before Deployment ✗
6. **No per-endpoint rate limiting** — login, signup, forgot-password share global 100/min limit. Fix: add specific rate limiters (5 login/15min, 3 signup/hr already defined in auth routes but need verification)
7. **No account lockout** — unlimited password attempts after rate limit resets. Fix: track failed attempts per user, lock after 5 failures for 15min
8. **/uploads directory listing exposed** — express.static serves all files, directory browsable. Fix: disable directory listing or add access control
9. **No file magic byte validation** — only checks file extension, not actual file content. Fix: use file-type package to verify magic bytes
10. **Weak dev fallback secrets in env.js** — guessable default values for JWT secrets and admin invite code. Fix: remove fallbacks, require env vars in production

### MEDIUM — Should Fix ✗
11. No custom CSP policy (only Helmet defaults) — configure strict Content-Security-Policy
12. No security event logging (failed logins, suspicious activity) — add structured logging
13. No audit trail for sensitive operations (password change, order cancel, admin actions)
14. No NoSQL injection protection — MongoDB operator injection ($ne, $gt) not blocked
15. Address fields not validated (city, state accept any string, pincode format not enforced)

---

## All API Routes Summary

### Auth (`/api/v1/auth`)
- POST `/signup` — register (user/delivery/admin)
- POST `/login` — authenticate
- POST `/logout` — invalidate refresh token
- POST `/refresh-token` — new access token
- POST `/forgot-password` — send reset email
- POST `/reset-password` — reset with token
- GET `/me` — current user

### Products (`/api/v1/products`)
- GET `/` — list with pagination + filters
- GET `/:id` — detail
- GET `/suggestions?q=` — autocomplete
- POST `/` — create (admin, requires name + price + categoryId)
- PUT `/:id` — update (admin)
- DELETE `/:id` — delete (admin)

### Search (`/api/v1/search`)
- GET `/` — search products

### Cart (`/api/v1/cart`)
- GET `/` — get cart with charges
- POST `/` — add to cart
- PATCH `/:productId` — update quantity
- DELETE `/:productId` — remove item
- DELETE `/` — clear cart

### Wishlist (`/api/v1/wishlist`)
- GET `/` — get wishlist
- POST `/` — add to wishlist
- DELETE `/:productId` — remove
- POST `/:productId/move-to-cart` — move to cart

### Checkout (`/api/v1/checkout`)
- POST `/` — create order from cart
- GET `/charges?cartTotal=` — calculate charges

### Orders (`/api/v1/orders`)
- GET `/` — list orders (paginated)
- GET `/:orderId` — order detail
- GET `/:orderId/tracking` — tracking info + delivery boy
- POST `/:orderId/cancel` — cancel order
- POST `/:orderId/reorder` — add items back to cart

### Payments (`/api/v1/payments`)
- POST `/process` — mock payment
- GET `/:orderId` — payment details

### Profile (`/api/v1/profile`)
- GET `/` — get profile
- PATCH `/` — update name/phone
- POST `/picture` — upload profile pic (multer, 2MB, jpg/png)
- POST `/change-password` — change password
- GET `/addresses` — list addresses
- POST `/addresses` — add address
- PATCH `/addresses/:id` — update address
- DELETE `/addresses/:id` — delete address
- PATCH `/addresses/:id/default` — set default

### Delivery (`/api/v1/delivery`)
- GET `/status` — get online status
- PATCH `/status` — toggle online/offline
- GET `/current-order` — current assigned order
- POST `/location` — update GPS (every 5s)
- POST `/pickup` — confirm pickup
- POST `/deliver` — confirm delivery
- GET `/history?period=&page=&limit=` — delivery history
- GET `/earnings` — earnings summary

### Admin (`/api/v1/admin`) — all require admin role
- GET `/dashboard` — stats (total orders, revenue, refunds, users, products, delivery boys)
- GET `/orders?status=&page=&limit=` — all orders with filters
- PATCH `/orders/:id/status` — update order status
- POST `/orders/:id/cancel` — cancel order (only if status=ordered) + refund + restore stock
- GET `/users?role=&page=&limit=` — all users with role filter
- GET `/delivery-boys` — all delivery boys with status + active orders
- GET `/charges` — current charge config
- PATCH `/charges` — update charges with audit log

### WebSocket (`/ws`)
- `?type=delivery&token=` — delivery boy connection
- `?type=tracking&orderId=&token=` — customer tracking

---

## Frontend Routes Summary

| Route | Page | Auth Required |
|-------|------|--------------|
| `/` | Home | No |
| `/login` | Login | No |
| `/login/admin` | Admin Login | No |
| `/signup` | Signup | No |
| `/forgot-password` | Forgot Password | No |
| `/reset-password` | Reset Password | No |
| `/search` | Search Results | No |
| `/add-to-cart` | Cart | No (guest mode) |
| `/wishlist` | Wishlist | No (guest mode) |
| `/checkout` | Checkout | Yes (redirects to login) |
| `/my-orders` | My Orders | Yes |
| `/my-profile` | My Profile | Yes |
| `/orders/:orderId/tracking` | Order Tracking (Leaflet map) | Yes |
| `/delivery/dashboard` | Delivery Dashboard | Yes (delivery role) |
| `/delivery/history` | Delivery History | Yes (delivery role) |
| `/admin/dashboard` | Admin Dashboard (stats, charts) | Yes (admin role) |
| `/admin/products` | Admin Product Management (CRUD) | Yes (admin role) |
| `/admin/orders` | Admin Order Management | Yes (admin role) |
| `/admin/users` | Admin User Management | Yes (admin role) |
| `/admin/delivery` | Admin Delivery Boy Monitoring | Yes (admin role) |
| `/admin/charges` | Admin Charge Management + Audit Log | Yes (admin role) |
| `/dashboard` | Role-based redirect | Yes |

---

## Key Technical Decisions

1. **Guest cart/wishlist** — localStorage for non-logged-in users, syncs to DB on login
2. **Login delayed until checkout** — reduces bounce rate (user's UX decision)
3. **Mock payments** — always succeed, generate fake transactionId for UPI/Card
4. **Nearest delivery boy** — Haversine distance formula, auto-assign on checkout
5. **WebSocket over polling** — real-time delivery tracking + order assignments
6. **Leaflet over Google Maps** — free, no API key needed, open-source
7. **Multer for file uploads** — profile pictures, 2MB limit, jpg/png only
8. **Order assignment is async** — checkout responds immediately, assignment happens in background

---

## User Preferences & Rules (MUST FOLLOW)

1. **Save every prompt** to `prompt_save.md` — this is ALWAYS the first task before anything else
2. **Save all decisions/progress** to memory between sessions — user lost context before and was upset
3. **No placeholder/filler text** on UI without explicit approval — user got angry when "Phase 1 — What you can test" appeared on Home page
4. **Ask before editing each file** — one file at a time, wait for approval before writing
5. **Plan before code** — show architecture, get approval, then build
6. **Keep responses short** — save credits, no unnecessary explanations
7. **User decides everything** — don't propose things they didn't ask for
8. **Test each phase on localhost** before moving to next
9. **User prefers running commands manually** to save credits — just tell them what to run

---

## Safety Rules

- BLOCK edits to `.env` or `.gitignore`
- BLOCK `git push`, `git pull`, `git force`, `git reset --hard`
- BLOCK `rm -rf` on project root
- WARN before editing any file unless user explicitly said "edit", "write", "make", "create", "update", "change", or "fix"

---

## DPDP 2025 Compliance (To implement in deployment phase)

- Encrypt PII at rest (AES-256), in transit (TLS 1.3)
- Consent management with granular checkboxes
- Breach notification within 72 hours
- Data retention with auto-purge
- User rights: access, correction, erasure endpoints

---

## How to Start the Project

```bash
# Terminal 1 — Database (from ecommerce_structure-main/ecommerce_structure-main/)
docker-compose up

# Terminal 2 — Backend
cd server
npm install
npm run dev

# Terminal 3 — Frontend
cd client
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- MongoDB: localhost:27017
- WebSocket: ws://localhost:5000/ws

**Admin invite code:** `ADMIN-INVITE-2024`

---

## Issues Fixed Across All Phases (for reference)

1. MongoDB auth error → reset Docker volumes
2. Port 27017 conflict → stopped competing MongoDB instance
3. Forgot password button not working → built full reset flow
4. Products 404 after re-seed → old IDs didn't match new ones
5. Gibberish search hitting API → added input validation
6. Navbar/Footer import paths → components in `layout/` subfolder
7. Cart checkout button was a stub → fixed to navigate to `/checkout`
8. Profile picture not showing → added `/uploads` proxy in vite.config.js
9. docker-compose not found → user was in wrong directory (outer vs inner folder)

---

## Session Timeline

**Day 1 (2026-03-12):**
- Set up as principal software architect
- Planned 6-phase architecture, user approved
- Built Phase 1 (Foundation) — auth, JWT, React scaffold
- Tested on localhost — fixed MongoDB issues

**Day 2 (2026-03-13):**
- Phase 2 (Product Catalog) — built + tested in ~10 minutes
- Phase 3 (Cart & Wishlist) — built + tested
- Phase 4 (Checkout, Orders, Payments, Profile) — built + tested, fixed multiple issues
- Phase 5 (Delivery Boy Portal + Customer Tracking) — built, awaiting testing
- Created help_claude.md for cross-session memory

**Day 3 (2026-03-14):**
- Phase 5 confirmed tested and working
- Phase 6 (Admin Portal) — built + tested
- Fixed product CRUD (missing routes, categoryId, slug), order charges field paths, cancel-only-before-pickup
- Full security audit completed — 16 items implemented, 15 items pending
- All 6 phases COMPLETE
- Next: Security hardening (critical + high items), then deployment to Render + Vercel + MongoDB Atlas
