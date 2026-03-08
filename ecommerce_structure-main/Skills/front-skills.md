Detailed UI/UX skill guide for the @front-dev agent

---

# User Pages

## 1) Landing Page
- Navbar layout (left to right): logo (orange+blue gradient, clear typography) → search bar → add to cart button → wishlist button → help button → login button → profile icon (dropdown: my orders, my profile, logout)
- Product cards: image, product name, price, add to cart button, wishlist button — displayed as cards
- Responsive grid: 2 cards mobile / 3 cards tablet / 4-5 cards desktop
- Categories stacked vertically one below other; products scroll horizontally per category
- Category examples: FRUITS/VEGETABLE, DAIRY PRODUCTS, HEALTHCARE, EASY CARE, etc.
- Skeleton cards shown while products load from API
- Footer in 2-column layout:
  - Column 1: website name, email, phone number
  - Column 2: links — add to cart, wishlist, about us, help page
  - All footer links route to: /add-to-cart, /wishlist, /about-us, /help-page

### Routes from Landing Page
- /add-to-cart — shows cart products in card form (image, name, price, add to cart, wishlist)
- /wishlist — shows wishlist products in same card form + extra "move to cart" option
- /help — popup with phone number and email for support
- /home — product popup: large image, product name, description, price, quantity selector, Add to Cart button, close (X) button

---

## 2) Login / Signup (JWT Authentication)

**This is a shared auth UI used by all three roles: user, delivery boy, and admin. Same popup flow, same field structure. The only difference is the entry point route.**

### /login (Popup)
- Fields: email/phone number, password
- "Forgot password?" link below password field
- Bottom line: "New to website? Signup" — routes to /signup

### /signup (Popup)
- Fields: email/phone number, enter password, confirm password
- Bottom line: "Already have account? Login" — routes to /login
- On successful signup → redirect to /login

### /forgot-pwd (Popup)
- Fields: new password, confirm password
- Submit button → redirects to /login

### Auth UX Rules
- Delay login prompt until checkout to reduce bounce rate (users can browse without logging in)
- Password guidelines displayed inline: first letter capital, include special character, min 8 chars
- Email/phone format verified on input (real-time validation)
- Admin login entry: /login/admin — same popup, but admin signup requires invite code

---

## 3) Add to Cart Page (/add-to-cart)
- Cart items displayed vertically, one below other
- Each item shows: large image, product name, description, price, quantity selector (increase/decrease), delete button, "move to wishlist" button
- Wishlist button in page routes to /wishlist (back via browser back button)
- Bottom section: charge breakdown — surge charge, delivery charge, handling charges, grand total
- Checkout button at the end

---

## 4) Payment Options (/checkout)
- Payment method cards: UPI, Credit/Debit, Cash on Delivery
- Selected method highlighted visually
- Demo/mock payment integration (real integration later)
- After payment success: show estimated arrival time + live map with delivery boy pin tracking

---

## 5) My Orders (/my-orders)
- Vertical order cards, newest first
- Each card shows: order ID, date placed, total amount, status badge, small thumbnails of items
- Status badge colors: Ordered=blue, Shipped=orange, Out for Delivery=yellow, Delivered=green, Cancelled=red
- Click any order card → expands to show: full item list (image, name, qty, price), delivery address, payment method used, tracking info
- Buttons per order: "Reorder" (adds same items to cart), "Need Help" (routes to /help)
- Empty state: "No orders yet — start shopping!" with button to /home
- Skeleton cards while loading from API
- Pagination or infinite scroll for many orders

---

## 6) My Profile (/my-profile)
- Clean form layout with editable fields: Name, Email (shown with verified badge, not editable), Phone Number, Profile Picture (upload/change)
- "Save Changes" button — disabled until user edits something
- Manage Addresses section: saved addresses as cards, each showing: name, full address, phone, "Default" badge on primary
  - Actions per address: Edit, Delete, Set as Default
  - "Add New Address" button → form: Name, Phone, Address Line 1, Address Line 2, City, State, Pincode, Save button
- Change Password section: Current Password, New Password, Confirm New Password, "Update Password" button
  - Same password guidelines as signup enforced
- Success/error toast messages on all save operations

---

# Delivery Boy Pages

## 7) Delivery Boy Login / Signup
- Uses same shared auth UI from section 2 (popup-based, JWT auth)
- Separate portal entry point for delivery personnel

---

## 8) Delivery Dashboard (/delivery-dashboard)
- Navbar: Online/Offline toggle button, Logout button
- Toggle online → auto-assigned to nearest order (Ola/Uber/Zepto style algorithm)
- "Finding customer..." loading message while waiting for assignment
- When assigned, dashboard shows: customer name, address, items list, payment method (COD = collect cash), "Picked Up" button, "Delivered" button
- ETA display: decreases in real-time, shown on map with route drawn for both delivery boy and user
- Map flow: first show pickup location → after pickup, show user delivery location
- Alert popup notification style: "Ek aur delivery" (loud, can't miss — vibration + popup can be missed)

---

## 9) Delivery Security & GPS Monitoring
- Live GPS location monitored at all times while online
- GPS violation flagging: if delivery boy marks "Picked Up" without being at pickup location, or marks "Delivered" without being at user location — violation saved to database
- This is backend-tracked but affects UI: violation warnings may appear on admin dashboard

---

## 10) Delivery History (/history)
- Accessed from button on /delivery-dashboard
- Past deliveries list filterable by: today / week / month
- Shows: total earnings, per-delivery earning breakdown

---

# Admin Pages

## 11) Admin Login (/login/admin)
- Uses same shared auth UI from section 2 (popup flow)
- Signup requires preset invite code — no open registration (RBAC enforced)

---

## 12) Analytics Dashboard
- Graphs: orders placed vs cancelled, orders delivered vs cancelled
- Charts: last 30 days daily revenue, 6-month month-wise revenue comparison
- Summary cards: total revenue, total orders placed

---

## 13) Product Inventory Management
- Product table with columns: image, name, category, price, stock, actions
- CRUD operations: Add new product, Edit existing, Delete
- Create/Update form fields: image (upload), name, category, price, stock — all mandatory

---

## 14) Delivery Boy Monitoring
- Real-time list of all delivery boys
- Details per delivery boy: online/offline status, total deliveries, current order (if any)
- Live updates without page refresh (WebSocket/SSE from backend)
- Reflects immediately when new delivery boy signs up

---

## 15) Delivery Charge & Surge Charge Management
- View current base delivery charge and surge multiplier
- Admin can edit both values directly
- Changes take effect immediately for new orders

---

## 16) Order Management
- Orders table with columns: Order ID, Customer name, Total amount, Status (Ordered/Shipped/Delivered/Cancelled), Delivery boy name, Date
- Search by order ID or customer name
- Filter by status (dropdown or checkboxes)
- Click any row → full detail view: items list, delivery address, payment method, delivery info
- Admin actions from detail view: Cancel order button, Process refund button

