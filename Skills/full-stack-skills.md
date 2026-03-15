---
Detailed integration skill guide for the @full-stack-dev agent

Description: Technical implementation guide — Axios config, auth flow, route guards, state management, loading/error patterns, debounce, WebSocket setup, and component-to-API mapping for connecting React frontend to Express backend.

---

# 1) Axios Setup & API Client Config

## Base Instance
- Create `src/api/axiosInstance.js`
- baseURL: `http://localhost:5000/api/v1` (dev) — read from env variable `REACT_APP_API_BASE_URL`
- timeout: 10000ms (10 seconds)
- Default headers: `Content-Type: application/json`
- withCredentials: true (for cookies if using httpOnly refresh token)

## Request Interceptor
- Before every request, read access token from memory (React state / context)
- Attach header: `Authorization: Bearer <accessToken>`
- If no token exists, let request go through without header (public routes like products, categories)

## Response Interceptor
- On 401 response:
  1. Pause the failed request
  2. Call `/auth/refresh-token` with refresh token
  3. If refresh succeeds → store new access token → retry the original failed request
  4. If refresh fails (401/403) → clear all tokens → redirect to `/login`
- On 403 response: show "Access denied" toast, do NOT retry
- On 429 response: show "Too many requests, try again later" toast
- On 500 response: show "Something went wrong" error banner
- On network error (no response): show "No internet connection" toast

## Export
- Export the configured instance as default
- All API call files import from `src/api/axiosInstance.js` — never use raw axios

## API Call Organization
- Group API calls by feature in `src/api/` folder:
  - `authApi.js` — login, signup, logout, refresh, forgot-password, reset-password
  - `productApi.js` — categories, products, search, suggestions
  - `cartApi.js` — get cart, add, update, remove, checkout
  - `wishlistApi.js` — get, add, remove, move-to-cart
  - `orderApi.js` — get orders, order detail, cancel, reorder
  - `profileApi.js` — get/update profile, addresses, change password, upload picture
  - `deliveryApi.js` — status toggle, current order, pickup, deliver, history, earnings
  - `adminApi.js` — analytics, products CRUD, delivery boys, charges, orders

---

# 2) Token Storage & Auth Flow

## Token Storage Strategy
- **Access token**: stored in memory only (React state via AuthContext) — never localStorage, never cookie
  - Why: XSS cannot steal in-memory tokens; they vanish on tab close (secure by design)
  - Downside: lost on page refresh — solved by silent refresh on app load
- **Refresh token**: stored in httpOnly secure cookie (set by backend via `Set-Cookie` header)
  - If backend doesn't support httpOnly cookies → fallback to localStorage (less secure, document the tradeoff)
- **User info (name, role, email)**: stored in AuthContext alongside access token

## Login Flow
1. User submits email + password to `/auth/login`
2. Backend returns `{ accessToken, refreshToken, user: { id, name, email, role } }`
3. Store access token in AuthContext state
4. Store user info in AuthContext state
5. Refresh token saved by backend as httpOnly cookie (or stored in localStorage as fallback)
6. Redirect based on role:
   - role = "user" → `/home`
   - role = "delivery" → `/delivery-dashboard`
   - role = "admin" → `/admin/dashboard`

## Signup Flow
1. User submits fields to `/auth/signup`
2. On success → redirect to `/login` with success toast "Account created, please login"
3. On 409 (duplicate email) → show inline error "Email already registered"

## Silent Refresh on App Load
1. On app mount (App.js useEffect), call `/auth/refresh-token`
2. If succeeds → store new access token + user info in AuthContext → user stays logged in
3. If fails → user remains logged out (no redirect, let them browse public pages)
4. Show full-page loading spinner during this check

## Logout Flow
1. Call `/auth/logout` (invalidates refresh token on backend)
2. Clear access token and user info from AuthContext
3. Clear refresh token cookie (backend clears via `Set-Cookie` with expired date)
4. Redirect to `/home`

## Forgot Password Flow
1. `/auth/forgot-password` with email → backend sends reset email
2. User clicks email link → lands on `/reset-password?token=xyz`
3. `/auth/reset-password` with token + new password → on success redirect to `/login`

---

# 3) Protected Route Guards

## ProtectedRoute Component
- Create `src/components/ProtectedRoute.jsx`
- Wraps around routes that require authentication
- Reads auth state from AuthContext

## Logic
```
if (authLoading) → show <FullPageSpinner />
if (!isAuthenticated) → <Navigate to="/login" />
if (requiredRole && user.role !== requiredRole) → <Navigate to="/" />
else → render <Outlet /> or children
```

## Role-Based Route Setup
```
/home, /products, /products/:id → public (no guard)
/cart, /wishlist, /my-orders, /my-profile, /checkout → ProtectedRoute (role: "user")
/delivery-dashboard, /delivery/history → ProtectedRoute (role: "delivery")
/admin/* → ProtectedRoute (role: "admin")
/login, /signup → if already logged in, redirect to role-based home
```

## Unauthorized Handling
- No `/unauthorized` page. If a user has a valid JWT but the wrong role, they are immediately and silently redirected to the Home page (`/`) — no message shown, no access control details revealed.

## Auth Loading State
- On initial app load, auth state is unknown (silent refresh hasn't completed yet)
- During this window, ProtectedRoute shows a full-page spinner — NOT a redirect
- This prevents flash of login page for already-authenticated users

---

# 4) State Management Strategy Per Page

## Global State (React Context)
- **AuthContext**: accessToken, user (id, name, email, role), isAuthenticated, authLoading, login(), logout(), silentRefresh()
- **CartContext**: cartItems[], cartCount, cartTotal, addToCart(), removeFromCart(), updateQuantity(), clearCart(), fetchCart()
  - cartCount shown in navbar badge — needs to be global

## Local State (useState / useReducer per page)

| Page | Local State |
|------|-------------|
| Landing Page | categories[], products[], selectedCategory, sortBy, currentPage, isLoading |
| Search | searchQuery, suggestions[], searchResults[], recentSearches[], trendingSearches[], isSearching |
| Product Detail | product{}, selectedQuantity, isLoading |
| Wishlist | wishlistItems[], isLoading |
| Cart Page | (reads from CartContext) + chargeBreakdown{}, isCheckingOut |
| Checkout/Payment | selectedMethod, paymentStatus, isProcessing |
| My Orders | orders[], selectedOrder, currentPage, isLoading |
| My Profile | formData{}, addresses[], isEditing, isSaving |
| Delivery Dashboard | isOnline, currentOrder{}, deliveryStatus, mapCoords{} |
| Delivery History | deliveries[], filter (today/week/month), earnings{} |
| Admin Analytics | orderStats{}, revenueData[], summaryCards{} |
| Admin Products | products[], currentPage, editingProduct{}, isModalOpen |
| Admin Delivery Boys | deliveryBoys[], filter (online/offline), stats{} |
| Admin Charges | chargeSettings{}, auditLog[], isEditing |
| Admin Orders | orders[], searchQuery, statusFilter, selectedOrder{}, currentPage |

## Rules
- Never store API response data in global context unless it's needed across multiple pages
- Cart is global because navbar badge needs cartCount everywhere
- Auth is global because every page needs to know login state and role
- Everything else stays local to the page that fetches it
- On page unmount, local state is discarded (no stale data on revisit — always fresh fetch)

---

# 5) Loading / Error UI States

## Loading Patterns
| Scenario | UI Pattern |
|----------|------------|
| Page initial load (products, orders, etc.) | Skeleton loader matching the layout shape |
| Button action (add to cart, checkout, save) | Button shows spinner + disabled state |
| Search autocomplete | Small spinner inside search dropdown |
| Full page auth check | Centered full-page spinner |
| Infinite scroll / pagination | Skeleton cards at bottom while loading next page |

## Error Patterns
| Scenario | UI Pattern |
|----------|------------|
| API returns 4xx/5xx | Error banner at top of section with retry button |
| Network error (offline) | Toast: "No internet connection" |
| 401 after refresh fails | Redirect to login (handled by interceptor) |
| 403 wrong role | Redirect to / (silent, no message) |
| 429 rate limited | Toast: "Too many requests, try again later" |
| Form validation error | Inline red text below the invalid field |
| Action failure (add to cart fails) | Toast: "Failed to add to cart, try again" (red) |
| Action success (order placed) | Toast: "Order placed successfully!" (green) |

## Empty States
| Page | Empty State Message | Action Button |
|------|--------------------|----|
| Cart | "Your cart is empty" | "Start Shopping" → /home |
| Wishlist | "Your wishlist is empty" | "Browse Products" → /home |
| My Orders | "No orders yet — start shopping!" | "Shop Now" → /home |
| Search Results | "No products found for 'xyz'" | "Clear Search" |
| Delivery History | "No deliveries yet" | — |
| Admin Orders (filtered) | "No orders match your filters" | "Clear Filters" |

## Toast Notification Config
- Position: top-right
- Auto-dismiss: 3 seconds for success, 5 seconds for errors
- Types: success (green), error (red), warning (yellow), info (blue)
- Max 3 toasts visible at once — oldest dismissed when 4th arrives
- Use a lightweight library like react-hot-toast or react-toastify

---

# 6) Search Debounce Strategy

## Debounce Config
- Debounce delay: 400ms (sweet spot — 300ms too eager, 500ms feels slow)
- Minimum query length before firing: 2 characters
- If query length < 2 → clear suggestions dropdown, don't call API

## Request Cancellation
- Use AbortController to cancel the previous pending request when a new keystroke triggers a new debounced call
- Flow: keystroke → reset debounce timer → after 400ms → cancel previous AbortController → create new AbortController → fire `/products/suggestions?q=<query>&limit=10`

## Autocomplete Dropdown
- Show below search bar as a dropdown list
- Each suggestion: product name (clickable → navigates to product detail page)
- Max 10 suggestions shown
- Keyboard navigation: arrow up/down to highlight, Enter to select, Escape to close
- Click outside dropdown → close it

## Search Submit (Enter or Click Search)
- On Enter key or search icon click → fire full search: `/products/search?q=<query>&page=1&limit=20`
- Display results as product cards in grid layout (same card format as landing page)
- Save search to history (only for logged-in users, fire-and-forget — don't await)

## Recent & Trending
- When search bar is focused and empty → show recent searches (logged-in) + trending searches
- Recent: last 10 searches
- Trending: top 10 popular terms
- Click any recent/trending term → fills search bar + fires full search

---

# 7) WebSocket Client for Real-Time Features

## Library
- Use native browser WebSocket API (no library needed for this scale)
- If reconnection logic gets complex later → consider socket.io-client

## Connection Setup
- Create `src/api/websocket.js` utility with connect/disconnect/onMessage functions
- WebSocket URL base: `ws://localhost:5000/api/v1` (dev) — read from environment variable `REACT_APP_WS_BASE_URL`
- Attach access token as query param on connect: `ws://host/api/v1/tracking/:orderId?token=<accessToken>`

## Where WebSockets Are Used

### User — Delivery Tracking (`/orders/:orderId/tracking`)
- Connect to tracking WebSocket for the specific order
- Receives every 5 seconds: `{ lat, lng, eta, status }`
- Update map pin position + ETA display in real-time
- On status = "delivered" → show "Order Delivered!" banner → close WebSocket
- Disconnect on page unmount (useEffect cleanup)

### Delivery Boy — Order Assignments (`/delivery-dashboard`)
- Connect to assignments WebSocket when online
- Receives: new order assignment details when matched
- Also connect to notifications WebSocket for alert notifications
- Disconnect when delivery boy toggles offline or logs out

### Admin — Delivery Boy Live Monitoring (`/admin/delivery-boys`)
- Connect to delivery boys live WebSocket
- Receives: real-time status changes (online/offline, assigned, delivered, new signup)
- Update delivery boy list in-place without page refresh
- Disconnect on page unmount

## Reconnection Strategy
- On disconnect (not intentional): wait 1 second → retry
- On second failure: wait 2 seconds → retry
- On third failure: wait 4 seconds → retry
- Exponential backoff: 1s, 2s, 4s, 8s, 16s — max 30 seconds between retries
- After 5 consecutive failures: show toast "Real-time updates unavailable, data may be stale" + show manual refresh button
- On successful reconnect: clear retry counter

## Cleanup Rules
- Every WebSocket connection must be closed in useEffect cleanup function
- Never leave orphan connections on page navigation
- On logout, close ALL active WebSocket connections

---

# 8) Component-to-API Mapping

Reference: All endpoint full details (request body, response body, models) are in backend-skills.md. This section maps WHICH component calls WHICH endpoint, with the HTTP method to avoid ambiguity, and WHEN.

## Legend
- **On Mount** = API called in useEffect on component load
- **On Action** = API called when user clicks/submits something
- **State Target** = which local/global state variable receives the response

---

### User Pages

| Component / Page | API Call | Trigger | State Target |
|-----------------|----------|---------|--------------|
| **Landing Page** | GET /categories | On Mount | categories[] |
| | GET /products?category=&page=&sort= | On Mount + filter/sort change | products[] |
| | GET /products/:id | On Action (click product card) | product{} (modal) |
| **Search Bar** | GET /products/suggestions?q= | On Input (debounced 400ms) | suggestions[] |
| | GET /products/search?q=&page= | On Action (Enter/click search) | searchResults[] |
| | GET /search/recent | On Focus (empty input, logged in) | recentSearches[] |
| | GET /search/trending | On Focus (empty input) | trendingSearches[] |
| **Wishlist Page** | GET /wishlist | On Mount | wishlistItems[] |
| | POST /wishlist | On Action (add from product card) | wishlistItems[] (append) |
| | DELETE /wishlist/:productId | On Action (remove button) | wishlistItems[] (filter out) |
| | POST /wishlist/:productId/move-to-cart | On Action (move to cart button) | wishlistItems[] (filter out) + CartContext.fetchCart() |
| **Cart Page** | GET /cart | On Mount | CartContext.cartItems[] |
| | POST /cart | On Action (add to cart button) | CartContext (append + update count) |
| | PATCH /cart/:productId | On Action (qty +/- buttons) | CartContext (update item) |
| | DELETE /cart/:productId | On Action (delete button) | CartContext (filter out) |
| | DELETE /cart | On Action (clear cart) | CartContext (empty) |
| | POST /cart/checkout | On Action (checkout button) | navigate to /checkout with order summary |
| **Checkout Page** | POST /payments/process | On Action (pay button) | paymentStatus |
| | GET /orders/:orderId/tracking | After payment success | redirect to tracking |
| **My Orders** | GET /orders?page= | On Mount | orders[] |
| | GET /orders/:orderId | On Action (click order card) | selectedOrder{} |
| | POST /orders/:orderId/cancel | On Action (cancel button) | orders[] (update status) |
| | POST /orders/:orderId/reorder | On Action (reorder button) | CartContext.fetchCart() + toast |
| **My Profile** | GET /profile | On Mount | formData{} |
| | PATCH /profile | On Action (save button) | formData{} (update) |
| | POST /profile/picture | On Action (upload photo) | formData.profilePicture |
| | GET /profile/addresses | On Mount | addresses[] |
| | POST /profile/addresses | On Action (add address save) | addresses[] (append) |
| | PATCH /profile/addresses/:id | On Action (edit address save) | addresses[] (update) |
| | DELETE /profile/addresses/:id | On Action (delete address) | addresses[] (filter out) |
| | PATCH /profile/addresses/:id/default | On Action (set default) | addresses[] (update badges) |
| | POST /profile/change-password | On Action (update password button) | toast success/error |
| **Auth (Login)** | POST /auth/login | On Action (submit) | AuthContext (token + user) |
| **Auth (Signup)** | POST /auth/signup | On Action (submit) | redirect to /login |
| **Auth (Forgot)** | POST /auth/forgot-password | On Action (submit) | toast + redirect |
| **Auth (Reset)** | POST /auth/reset-password | On Action (submit) | redirect to /login |
| **App.js (Silent Refresh)** | POST /auth/refresh-token | On Mount | AuthContext (token + user) |
| **Delivery Tracking** | GET /orders/:orderId/tracking | On Mount | trackingInfo{} |
| | WebSocket: /tracking/:orderId | On Mount (connect) | mapCoords{}, eta, status (live) |

---

### Delivery Boy Pages

| Component / Page | API Call | Trigger | State Target |
|-----------------|----------|---------|--------------|
| **Delivery Dashboard** | PATCH /delivery/status | On Action (online/offline toggle) | isOnline |
| | GET /delivery/current-order | On Mount (when online) | currentOrder{} |
| | POST /delivery/location | Auto (every 5s while online) | — (fire-and-forget) |
| | POST /delivery/pickup | On Action (picked up button) | currentOrder.status |
| | POST /delivery/deliver | On Action (delivered button + proof image) | currentOrder (clear) → next assignment |
| | WebSocket: /delivery/assignments | On Mount (when online) | currentOrder{} (new assignment) |
| | WebSocket: /delivery/notifications | On Mount (when online) | alert popup |
| **Delivery History** | GET /delivery/history?period=&page= | On Mount + filter change | deliveries[] |
| | GET /delivery/earnings | On Mount | earnings{} |

---

### Admin Pages

| Component / Page | API Call | Trigger | State Target |
|-----------------|----------|---------|--------------|
| **Analytics Dashboard** | GET /admin/analytics/orders | On Mount | orderStats{} |
| | GET /admin/analytics/revenue?period= | On Mount | revenueData[] |
| | GET /admin/analytics/summary | On Mount | summaryCards{} |
| **Product Inventory** | GET /admin/products?page= | On Mount | products[] |
| | POST /admin/products | On Action (create submit) | products[] (append) |
| | PATCH /admin/products/:id | On Action (edit submit) | products[] (update) |
| | DELETE /admin/products/:id | On Action (delete confirm) | products[] (filter out) |
| **Delivery Boy Monitoring** | GET /admin/delivery-boys?status=&page= | On Mount + filter change | deliveryBoys[] |
| | GET /admin/delivery-boys/:id | On Action (click row) | selectedBoy{} |
| | GET /admin/delivery-boys/stats | On Mount | stats{} |
| | WebSocket: /admin/delivery-boys/live | On Mount (connect) | deliveryBoys[] (live updates) |
| **Charge Management** | GET /admin/charges | On Mount | chargeSettings{} |
| | PATCH /admin/charges | On Action (save changes) | chargeSettings{} (update) |
| | GET /admin/charges/audit-log?page= | On Mount | auditLog[] |
| | GET /admin/charges/calculate?cartTotal= | On Action (test calculation) | chargeBreakdown{} |
| **Order Management** | GET /admin/orders?page=&status=&search= | On Mount + filter/search change | orders[] |
| | GET /admin/orders/:orderId | On Action (click row) | selectedOrder{} |
| | POST /admin/orders/:orderId/cancel | On Action (cancel button) | orders[] (update status) |
| | POST /admin/orders/:orderId/refund | On Action (refund button) | selectedOrder.paymentStatus |
| | PATCH /admin/orders/:orderId/status | On Action (status dropdown) | orders[] (update status) |
| | GET /admin/orders/stats | On Mount | orderStats{} |
