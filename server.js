/**
 * LA FIN Luxury Fragrances - Secure Backend Server (Node.js & Express)
 * Provides authenticated admin route protection, JWT security, and protected REST APIs.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Optional dependencies (with graceful fallbacks if not yet installed)
let cookieParser = null;
try {
    cookieParser = require('cookie-parser');
} catch (e) {
    // Basic fallback cookie parser
    cookieParser = () => (req, res, next) => {
        req.cookies = {};
        const cookieHeader = req.headers.cookie;
        if (cookieHeader) {
            cookieHeader.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                req.cookies[parts[0].trim()] = (parts[1] || '').trim();
            });
        }
        next();
    };
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'LA_FIN_DEV_JWT_SECRET_REPLACE_IN_PRODUCTION';

// Directory containing static web assets (public folder preferred)
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;

// ============================================================
// OFFICIAL ADMIN CREDENTIALS (READ FROM ENVIRONMENT)
// ============================================================
const ADMIN_CREDENTIALS = {
    email: (process.env.ADMIN_EMAIL || 'admin@lafin.luxury').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    name: process.env.ADMIN_NAME || 'Store Administrator',
    role: 'admin'
};

// ============================================================
// DATA STORAGE (FILE & MEMORY BACKED)
// ============================================================
const DB_FILE = path.join(__dirname, 'database.json');

const INITIAL_DB = {
    products: [
        {
            id: 1,
            name: 'Ocean Rush',
            sku: 'GRD-001',
            category: 'Fresh Aquatic',
            notes: 'CITRUS · AQUATIC · MUSK',
            price: 599,
            stock: 45,
            minStock: 10,
            tag: '01 / FRESH',
            image: 'perfume1.png',
            fallbackImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85'
        },
        {
            id: 2,
            name: 'Midnight Ember',
            sku: 'GRD-002',
            category: 'Warm & Spicy',
            notes: 'WOODY · AMBER · VANILLA',
            price: 699,
            stock: 28,
            minStock: 10,
            tag: '02 / INTENSE',
            image: 'perfume2.png',
            fallbackImage: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=85'
        },
        {
            id: 3,
            name: 'Velvet Oud',
            sku: 'GRD-003',
            category: 'Oriental Woody',
            notes: 'OUD · SANDALWOOD · MUSK',
            price: 799,
            stock: 8,
            minStock: 10,
            tag: '03 / MYSTERY',
            image: 'perfume3.png',
            fallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=85'
        }
    ],
    customers: [
        {
            id: 'CUST-1001',
            name: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            phone: '+91 98765 43210',
            city: 'Mumbai, Maharashtra',
            role: 'customer',
            registeredAt: '2026-10-15 14:30:00',
            lastLogin: '2026-11-01 10:15:22',
            loginCount: 12,
            status: 'Active',
            cart: [
                { name: 'Ocean Rush', price: 599, qty: 1 },
                { name: 'Velvet Oud', price: 799, qty: 1 }
            ],
            totalOrders: 3,
            totalSpent: 4196,
            loginHistory: [
                { timestamp: '2026-11-01 10:15:22', device: 'Chrome / Windows 11', ip: '192.168.1.104', status: 'Success' },
                { timestamp: '2026-10-28 19:40:11', device: 'Safari / iPhone 15', ip: '192.168.1.104', status: 'Success' }
            ]
        },
        {
            id: 'CUST-1002',
            name: 'Priya Patel',
            email: 'priya.patel@example.com',
            phone: '+91 98234 56789',
            city: 'Ahmedabad, Gujarat',
            role: 'customer',
            registeredAt: '2026-10-20 09:12:00',
            lastLogin: '2026-10-31 18:45:10',
            loginCount: 7,
            status: 'Active',
            cart: [
                { name: 'Midnight Ember', price: 699, qty: 2 }
            ],
            totalOrders: 2,
            totalSpent: 2796,
            loginHistory: [
                { timestamp: '2026-10-31 18:45:10', device: 'Firefox / macOS', ip: '172.16.4.88', status: 'Success' }
            ]
        }
    ],
    auditLogs: [
        { id: 1, customerId: 'ADMIN-001', customerName: 'Store Administrator', email: 'admin@lafin.luxury', action: 'System Initialized', timestamp: '2026-11-01 09:00:00', device: 'Server Core' }
    ]
};

function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Using default database state:', e.message);
    }
    return INITIAL_DB;
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to write database file:', e.message);
    }
}

let db = loadDatabase();

// ============================================================
// TOKEN & SECURITY UTILITIES
// ============================================================
function generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 2 * 60 * 60 * 1000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    if (!token) return null;
    try {
        const [header, body, signature] = token.split('.');
        if (!header || !body || !signature) return null;

        const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expectedSig) return null;

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (Date.now() > payload.exp) return null; // Expired

        return payload;
    } catch (e) {
        return null;
    }
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Server-level admin authentication middleware
function requireAdmin(req, res, next) {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
        token = req.cookies.admin_token;
    } else if (req.headers['x-admin-token']) {
        token = req.headers['x-admin-token'];
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin' || payload.email !== ADMIN_CREDENTIALS.email) {
        return res.status(403).json({
            success: false,
            error: 'Forbidden: Access restricted to authorized administrator accounts.'
        });
    }

    req.admin = payload;
    next();
}

// Protect direct navigation to admin.html at the server route level
app.get(['/admin.html', '/admin'], (req, res, next) => {
    let token = req.cookies && req.cookies.admin_token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin' || payload.email !== ADMIN_CREDENTIALS.email) {
        // Redirect unauthorized users or customers to the dedicated admin login page
        return res.redirect('/admin-login.html?unauthorized=1');
    }

    // Admin is verified, proceed to serve admin.html
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// ============================================================
// ADMIN AUTHENTICATION API ROUTES
// ============================================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { email, password, remember } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check if a normal customer is attempting to access admin
    const customer = db.customers.find(c => c.email.toLowerCase() === cleanEmail);
    if (customer && cleanEmail !== ADMIN_CREDENTIALS.email.toLowerCase()) {
        return res.status(403).json({
            success: false,
            error: 'Access Denied: Customer accounts do not have administrator privileges. Please sign in with an authorized Admin account.'
        });
    }

    // Verify admin credentials
    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && cleanPassword === ADMIN_CREDENTIALS.password) {
        const token = generateToken({
            email: ADMIN_CREDENTIALS.email,
            name: ADMIN_CREDENTIALS.name,
            role: 'admin'
        });

        // Set secure HTTP cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
            sameSite: 'strict'
        });

        // Add audit log
        db.auditLogs.unshift({
            id: Date.now(),
            customerId: 'ADMIN-001',
            customerName: ADMIN_CREDENTIALS.name,
            email: ADMIN_CREDENTIALS.email,
            action: 'Admin Authenticated (Server API)',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            device: req.headers['user-agent'] || 'Web Browser'
        });
        saveDatabase(db);

        return res.json({
            success: true,
            token,
            admin: {
                name: ADMIN_CREDENTIALS.name,
                email: ADMIN_CREDENTIALS.email,
                role: 'admin'
            }
        });
    }

    return res.status(401).json({
        success: false,
        error: 'Invalid administrator email or password.'
    });
});

// Admin Session Verification
app.get('/api/admin/verify', (req, res) => {
    let token = (req.cookies && req.cookies.admin_token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    const payload = verifyToken(token);

    if (payload && payload.role === 'admin' && payload.email === ADMIN_CREDENTIALS.email) {
        return res.json({ authenticated: true, admin: payload });
    }
    return res.json({ authenticated: false });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    return res.json({ success: true, message: 'Admin session terminated.' });
});

// ============================================================
// PROTECTED ADMIN APIS: CUSTOMERS & STOCKS
// ============================================================

// Get All Customers (Protected)
app.get('/api/admin/customers', requireAdmin, (req, res) => {
    res.json({ success: true, customers: db.customers });
});

// Get Specific Customer Record (Protected)
app.get('/api/admin/customers/:id', requireAdmin, (req, res) => {
    const customer = db.customers.find(c => c.id === req.params.id);
    if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer record not found.' });
    }
    res.json({ success: true, customer });
});

// Create Customer (Protected)
app.post('/api/admin/customers', requireAdmin, (req, res) => {
    const { name, email, phone, city, status } = req.body;
    const newId = `CUST-${1000 + db.customers.length + 1}`;
    const newCustomer = {
        id: newId,
        name,
        email,
        phone,
        city,
        role: 'customer',
        registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
        loginCount: 1,
        status: status || 'Active',
        cart: [],
        totalOrders: 0,
        totalSpent: 0,
        loginHistory: []
    };
    db.customers.unshift(newCustomer);
    saveDatabase(db);
    res.json({ success: true, customer: newCustomer });
});

// Update Customer (Protected)
app.put('/api/admin/customers/:id', requireAdmin, (req, res) => {
    const idx = db.customers.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    db.customers[idx] = { ...db.customers[idx], ...req.body };
    saveDatabase(db);
    res.json({ success: true, customer: db.customers[idx] });
});

// Delete Customer (Protected)
app.delete('/api/admin/customers/:id', requireAdmin, (req, res) => {
    db.customers = db.customers.filter(c => c.id !== req.params.id);
    saveDatabase(db);
    res.json({ success: true, message: 'Customer record deleted.' });
});

// Get Stocks (Public & Admin)
app.get('/api/stocks', (req, res) => {
    res.json({ success: true, products: db.products });
});

// Update Stock Quantity & Details (Protected)
app.put('/api/admin/stocks/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const product = db.products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    Object.assign(product, req.body);
    saveDatabase(db);
    res.json({ success: true, product });
});

// Add New Fragrance (Protected)
app.post('/api/admin/stocks', requireAdmin, (req, res) => {
    const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: req.body.name,
        sku: req.body.sku || `GRD-00${newId}`,
        category: req.body.category || 'Luxury Fragrance',
        notes: req.body.notes || '',
        price: Number(req.body.price) || 599,
        stock: Number(req.body.stock) || 20,
        minStock: Number(req.body.minStock) || 10,
        tag: `0${newId} / SIGNATURE`,
        image: 'perfume1.png',
        fallbackImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85'
    };
    db.products.push(newProduct);
    saveDatabase(db);
    res.json({ success: true, product: newProduct });
});

// Delete Fragrance (Protected)
app.delete('/api/admin/stocks/:id', requireAdmin, (req, res) => {
    db.products = db.products.filter(p => p.id !== Number(req.params.id));
    saveDatabase(db);
    res.json({ success: true, message: 'Fragrance removed from inventory.' });
});

// Get Audit Logs (Protected)
app.get('/api/admin/logs', requireAdmin, (req, res) => {
    res.json({ success: true, logs: db.auditLogs });
});

// ============================================================
// PUBLIC CUSTOMER AUTHENTICATION APIS
// ============================================================
app.post('/api/customers/login', (req, res) => {
    const { email, name } = req.body;
    let customer = db.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (customer) {
        customer.lastLogin = now;
        customer.loginCount = (customer.loginCount || 0) + 1;
        customer.loginHistory.unshift({
            timestamp: now,
            device: req.headers['user-agent'] || 'Web Client',
            ip: req.ip || '127.0.0.1',
            status: 'Success'
        });
    } else {
        customer = {
            id: `CUST-${1000 + db.customers.length + 1}`,
            name: name || 'Valued Customer',
            email,
            role: 'customer',
            registeredAt: now,
            lastLogin: now,
            loginCount: 1,
            status: 'Active',
            cart: [],
            totalOrders: 0,
            totalSpent: 0,
            loginHistory: [{
                timestamp: now,
                device: req.headers['user-agent'] || 'Web Client',
                ip: req.ip || '127.0.0.1',
                status: 'Registration'
            }]
        };
        db.customers.unshift(customer);
    }

    saveDatabase(db);
    res.json({ success: true, customer });
});

// ============================================================
// SERVE STATIC ASSETS
// ============================================================
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'Homepage.html'));
});

app.get(['/cart', '/cart.html'], (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'cart.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`
======================================================
  👑 LA FIN LUXURY PERFUMES - SECURE BACKEND ACTIVE
======================================================
  Storefront:     http://localhost:${PORT}/
  Admin Portal:   http://localhost:${PORT}/admin.html
  Admin Login:    http://localhost:${PORT}/admin-login.html

  Authorized Administrator:
  Email:    ${ADMIN_CREDENTIALS.email}
  Password: [CONFIGURED VIA ADMIN_PASSWORD ENV VAR]
======================================================
    `);
});

