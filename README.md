# LA FIN™ Luxury Fragrances — Platform & Admin Security Architecture

A luxury e-commerce fragrance platform featuring client and server-side route protection, hidden admin access, real-time perfume inventory management, customer session tracking, and individual customer Excel (`.xlsx`) dossier exports.

---

## 🔐 Master Administrator Credentials & Hidden Direct URL Access

**All admin buttons, links, and pathways have been completely removed from the storefront.** Regular customers will never see any admin options or links. Only administrators who know the direct URL and master credentials can access the administration system:

| Field | Setting / Value |
| :--- | :--- |
| **Admin Direct URL (Login Gateway)** | [`admin-login.html`](public/admin-login.html) |
| **Admin Dashboard URL** | [`admin.html`](public/admin.html) *(Auto-redirects to login if not authenticated)* |
| **Production Credentials** | Set via `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) |
| **Local / Static Demo Login** | `dhamechaharsh1@gmail.com` / `H@rsh 566` |
| **Role** | Super Administrator (`admin`) |

> **Security Note:** If any normal customer or unauthenticated visitor types `admin.html` into their browser URL bar, both the server route guard and the client-side gatekeeper immediately block them and redirect to `admin-login.html`. If a customer attempts to log in with customer credentials at the admin gateway, access is strictly rejected:  
> *"Access Denied: Customer accounts do not have administrator privileges."*

---

## 📋 Comprehensive Log of Changes Made

### 1. Stealth Mode: Complete Removal of Public Admin UI & Paths
* **Removed from Navigation Bar ([`Homepage.html`](Homepage.html)):**
  - Deleted the `Admin Portal ↗` link from the header navigation.
* **Removed from Customer Dropdown ([`Homepage.html`](Homepage.html)):**
  - Removed the `Admin Portal (Restricted)` item from the user profile dropdown. Customers now only see their customer info (Name, Email, Account ID, Login count, and Sign Out).
* **Removed from Footer ([`Homepage.html`](Homepage.html)):**
  - Removed the `Admin Security Gateway` footer link entirely.
* **Removed from Customer Auth Modal ([`Homepage.html`](Homepage.html), [`Homepage.js`](Homepage.js), [`Homepage.css`](Homepage.css)):**
  - Removed the *"Admin Access"* tab and all admin credential notices from the customer modal. The modal now solely contains *Customer Sign In* and *Register New Account*.
  - Cleaned up JavaScript event handlers and CSS styles related to public admin access tabs.

### 2. Admin Login Protection & Route Guards
* **Dedicated Direct URL Gateway ([`admin-login.html`](public/admin-login.html)):**
  - Accessible only via direct URL navigation.
  - Features obsidian and gold luxury design, password visibility toggle, session persistence, and credential verification.
  - Validates login requests securely via server-side verification in Node mode or against configurable admin credentials in static demo mode.
* **Central Authentication & Security Engine ([`auth.js`](public/auth.js)):**
  - Manages signed session tokens, expiry timestamps (2-hour rolling session), and role checks.
  - Cross-tab synchronization via `lafin_admin_auth_change` (signing out in one tab terminates all open admin tabs).
* **Client-Side Route Guard ([`admin.html`](public/admin.html) & [`admin.js`](public/admin.js)):**
  - Blocks non-authenticated users before DOM rendering and redirects to `admin-login.html?unauthorized=1`.
  - Populates the authenticated administrator profile in the top navbar.
  - Provides a **`[🚪 Logout Admin]`** button to terminate the admin session.

### 3. Server-Side Route Guard & Protected REST APIs ([`server.js`](server.js), [`package.json`](package.json))
* **Node.js + Express Backend Server:**
  - Token and cookie-based authentication middleware (`requireAdmin`).
  - **Server Route Guard:** Direct GET requests to `http://localhost:3000/admin.html` or `/admin` require a valid admin token cookie; otherwise, the server responds with a `302 Redirect` to `/admin-login.html`.
  - **Protected Admin REST Endpoints:**
    - `POST /api/admin/login`: Issues signed HTTP-only auth cookies.
    - `POST /api/admin/logout`: Destroys admin session.
    - `GET /api/admin/verify`: Validates token status.
    - `GET /api/admin/customers`: Returns all customer records (**403 Forbidden** for non-admins).
    - `GET /api/admin/customers/:id`: Retrieves particular customer records.
    - `POST /api/admin/customers`: Creates a customer record.
    - `PUT /api/admin/customers/:id`: Updates customer details.
    - `DELETE /api/admin/customers/:id`: Deletes a customer.
    - `PUT /api/admin/stocks/:id`: Updates stock inventory.
    - `POST /api/admin/stocks`: Adds new fragrance lines.
    - `DELETE /api/admin/stocks/:id`: Deletes fragrances.
    - `GET /api/admin/logs`: Returns security audit logs.
  - **Public Customer Endpoints:**
    - `POST /api/customers/login` and `POST /api/customers/register`: Handles storefront customer authentication with `role: 'customer'`.
    - `GET /api/stocks`: Returns public stock levels.
* **Persistent Database (`database.json`):**
  - Persists products, customer accounts, and audit trails.

### 4. Customer Login & Bag Experience ([`Homepage.html`](Homepage.html), [`Homepage.js`](Homepage.js))
* **Login Button Next to Bag:**
  - `👤 Sign In` button placed directly next to `Bag (0)` in the top navigation bar.
* **Customer Sign In & Registration:**
  - Stores customer details upon sign in: Full Name, Email, Phone, City, Registration Date, Login Count, and active shopping bag.
  - Displays customer's first name on the button (e.g. `👤 Aarav`) with account info dropdown upon click.

### 5. Fragrance Stocks & Inventory Management
* **Inventory Control in Admin Dashboard:**
  - Tracks fragrance SKU, category, notes, price, current stock, min stock threshold, and valuation.
  - Instant `+` and `−` stepper buttons directly on table rows to adjust stock counts.
* **Live Storefront Synchronization:**
  - Product cards on `Homepage.html` update stock pills dynamically (`45 in stock`, `Low Stock (8 left)`, or `Out of Stock`).
  - Adding items to the bag decrements available stock in real time. Items with 0 stock are disabled with a *"Sold Out"* label.

### 6. Excel Export for Individual Customer Records
* **Particular Customer Download:**
  - In `admin.html`, each customer row has a dedicated **`📥 Excel`** button.
  - Downloads `LA_FIN_Customer_[CustomerID]_[Name].xlsx` (or `.xls` fallback).
  - Includes:
    1. **Customer Profile Sheet:** Personal identity, contact, address, registration date, and lifetime spend.
    2. **Login Audit Trail Sheet:** Session index, exact timestamps, platform/browser, and IP address.
    3. **Active Shopping Bag Sheet:** Fragrance name, price, quantity, and total bag value.
* **Dual-Engine Export:**
  - `SheetJS` for native `.xlsx` workbooks, with an embedded Excel XML (`.xls`) fallback that works completely offline.

---

## 📁 Project File Structure

```
e:\LA FIN\
├── public/               # Browser-ready static web directory (Cloudflare assets)
│   ├── index.html        # Root redirect to Homepage.html
│   ├── Homepage.html     # Public perfume storefront (Zero admin links/buttons visible)
│   ├── Homepage.css      # Storefront styles (obsidian, cream, gold typography)
│   ├── Homepage.js       # Customer cart, live stock sync, customer sign in
│   ├── shop.html         # Full perfume collection & filtering
│   ├── shop.css          # Shop catalogue styling
│   ├── shop.js           # Shop catalogue interaction & bag integration
│   ├── cart.html         # Shopping bag, express checkout & order placement
│   ├── cart.css          # Cart & checkout styling
│   ├── cart.js           # Cart management & payment processing
│   ├── history.html      # Order history & live tracking page
│   ├── history.css       # Order history styling
│   ├── history.js        # Live tracking timeline & status management
│   ├── admin.html        # Protected Admin Dashboard (Access via direct URL only)
│   ├── admin.css         # Dashboard styling and modal systems
│   ├── admin.js          # Admin Dashboard controller, stocks & Excel export
│   ├── admin-login.html  # Dedicated Admin Security Gateway (Access via direct URL only)
│   ├── auth.js           # Central authentication service, tokens, and route guards
│   ├── store.js          # Unified client data layer, local database, and Excel engine
│   └── *.png             # High-resolution perfume and brand assets
├── server.js             # Optional Node.js + Express backend with protected REST APIs
├── package.json          # Node.js package manifest and start scripts
├── wrangler.jsonc        # Cloudflare static deployment configuration
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusion rules
└── README.md             # Platform documentation and security guide
```

---

## 🚀 How to Access & Run

### 1. Direct Administrator Access (Hidden from Users)
- **Direct Admin Login URL:**
  - If running Node server: `http://localhost:3000/admin-login.html`
  - If deployed to Cloudflare: `https://<your-worker>.workers.dev/admin-login.html`
- Enter admin credentials:
  - **Email:** Defined in `.env` (`ADMIN_EMAIL`, default: `dhamechaharsh1@gmail.com`)
  - **Password:** Defined in `.env` (`ADMIN_PASSWORD`, default local demo: `H@rsh 566`)
- Click *"Authenticate & Access Dashboard"* to enter [`admin.html`](public/admin.html).

### 2. Static Preview & Cloudflare Deployment
- Test locally with Wrangler:
  ```bash
  npx wrangler dev
  ```
- Deploy to Cloudflare Workers / Pages:
  ```bash
  npx wrangler deploy
  ```

### 3. Running the Server (Optional Backend Mode)
```bash
npm install
npm start
```
- Storefront: `http://localhost:3000/`
- Direct Admin Login: `http://localhost:3000/admin-login.html`
- Direct Admin Dashboard: `http://localhost:3000/admin.html` *(Protected by server middleware)*
