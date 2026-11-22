/**
 * LA FIN Luxury Fragrances - Central Data Store & Management Layer
 * Handles stocks inventory, customer records, session logins, and Excel exports.
 */

const STORAGE_KEYS = {
    PRODUCTS: 'lafin_products_stocks',
    CUSTOMERS: 'lafin_customers',
    CURRENT_USER: 'lafin_current_user',
    LOGIN_LOGS: 'lafin_login_logs',
    ORDERS: 'lafin_orders'
};

// Migrate legacy storage data if present
if (typeof localStorage !== 'undefined') {
    ['products_stocks', 'customers', 'current_user', 'login_logs'].forEach(key => {
        const legacyVal = localStorage.getItem('greed_' + key);
        if (legacyVal && !localStorage.getItem('lafin_' + key)) {
            localStorage.setItem('lafin_' + key, legacyVal);
        }
    });

    // Clean up sample demo orders so new users have 0 orders until they actually place an order
    try {
        const existingOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (existingOrders) {
            const parsed = JSON.parse(existingOrders);
            const demoIds = ['LAF-ORD-849210', 'LAF-ORD-719340', 'LAF-ORD-652190', 'LAF-ORD-519084'];
            if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(o => demoIds.includes(o.id))) {
                localStorage.removeItem(STORAGE_KEYS.ORDERS);
            }
        }
    } catch(e) {}
}

// Initial default stock data
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: 'Ocean Rush',
        sku: 'LAF-001',
        category: 'Fresh Aquatic',
        notes: 'CITRUS · AQUATIC · MUSK',
        price: 599,
        stock: 45,
        minStock: 10,
        tag: '01 / FRESH',
        image: 'perfume1.png',
        fallbackImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85',
        description: 'Crisp morning ocean spray fused with zesty Mediterranean bergamot and warm amber musk.'
    },
    {
        id: 2,
        name: 'Midnight Ember',
        sku: 'LAF-002',
        category: 'Warm & Spicy',
        notes: 'WOODY · AMBER · VANILLA',
        price: 699,
        stock: 28,
        minStock: 10,
        tag: '02 / INTENSE',
        image: 'perfume2.png',
        fallbackImage: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=85',
        description: 'A seductive blend of smoked vanilla bean, dark golden amber, and toasted cedarwood.'
    },
    {
        id: 3,
        name: 'Velvet Oud',
        sku: 'LAF-003',
        category: 'Oriental Woody',
        notes: 'OUD · SANDALWOOD · MUSK',
        price: 799,
        stock: 8,
        minStock: 10,
        tag: '03 / MYSTERY',
        image: 'perfume3.png',
        fallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=85',
        description: 'Rare Cambodian oud resin kissed by creamy Mysore sandalwood and velvet black musk.'
    }
];

// Initial realistic customer database
const DEFAULT_CUSTOMERS = [
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
            { timestamp: '2026-10-28 19:40:11', device: 'Safari / iPhone 15', ip: '192.168.1.104', status: 'Success' },
            { timestamp: '2026-10-22 11:20:05', device: 'Chrome / Windows 11', ip: '192.168.1.104', status: 'Success' },
            { timestamp: '2026-10-15 14:30:00', device: 'Chrome / Windows 11', ip: '192.168.1.104', status: 'Registration' }
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
            { timestamp: '2026-10-31 18:45:10', device: 'Firefox / macOS', ip: '172.16.4.88', status: 'Success' },
            { timestamp: '2026-10-25 16:30:22', device: 'Firefox / macOS', ip: '172.16.4.88', status: 'Success' },
            { timestamp: '2026-10-20 09:12:00', device: 'Firefox / macOS', ip: '172.16.4.88', status: 'Registration' }
        ]
    },
    {
        id: 'CUST-1003',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        phone: '+91 97112 34567',
        city: 'New Delhi, Delhi',
        role: 'customer',
        registeredAt: '2026-10-25 19:05:00',
        lastLogin: '2026-11-01 08:30:45',
        loginCount: 4,
        status: 'Active',
        cart: [
            { name: 'Velvet Oud', price: 799, qty: 1 }
        ],
        totalOrders: 1,
        totalSpent: 799,
        loginHistory: [
            { timestamp: '2026-11-01 08:30:45', device: 'Chrome / Android 14', ip: '10.0.0.42', status: 'Success' },
            { timestamp: '2026-10-29 21:10:02', device: 'Chrome / Android 14', ip: '10.0.0.42', status: 'Success' },
            { timestamp: '2026-10-25 19:05:00', device: 'Chrome / Android 14', ip: '10.0.0.42', status: 'Registration' }
        ]
    }
];

// Initial realistic default orders with courier tracking checkpoints
const DEFAULT_ORDERS = [
    {
        id: 'LAF-ORD-849210',
        customerId: 'CUST-1001',
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav.sharma@example.com',
        customerPhone: '+91 98765 43210',
        shippingAddress: 'Flat 402, Sea Crest Towers, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        items: [
            { id: 1, name: 'Ocean Rush', price: 599, qty: 1, image: 'perfume1.png', notes: 'CITRUS · AQUATIC · MUSK', tag: '01 / FRESH' },
            { id: 3, name: 'Velvet Oud', price: 799, qty: 1, image: 'perfume3.png', notes: 'OUD · SANDALWOOD · MUSK', tag: '03 / MYSTERY' }
        ],
        subtotal: 1398,
        deliveryFee: 50,
        total: 1448,
        paymentMethod: 'upi',
        paymentStatus: 'Paid Successfully',
        paymentDetails: { upiId: 'aarav.sharma@okhdfcbank' },
        orderStatus: 'In Transit',
        createdAt: '2026-11-01 10:15:22',
        estimatedDelivery: 'Nov 03, 2026',
        courier: {
            name: 'BlueDart Luxury Air Express',
            awb: 'BD-884920192-IN',
            currentCity: 'Mumbai Central Freight Hub',
            stage: 4,
            checkpoints: [
                { time: '2026-11-01 14:30', stage: 'In Transit', title: 'Package In Transit to City Facility', location: 'Mumbai Central Air Cargo Hub', desc: 'Arrived at destination sorting center; sorted for delivery hub dispatch.' },
                { time: '2026-10-31 21:00', stage: 'Dispatched', title: 'Departed Origin Hub via Air Cargo', location: 'Ahmedabad Air Freight Center', desc: 'Flight BD-604 departed on schedule with tamper-proof security container.' },
                { time: '2026-10-31 16:00', stage: 'Picked Up', title: 'Shipment Handed Over to Courier', location: 'LA FIN Fragrance Atelier, Surat', desc: 'Courier agent collected consignment with verified master manifest.' },
                { time: '2026-10-31 14:00', stage: 'Packaged', title: 'Quality Inspected & Luxury Sealed', location: 'LA FIN Atelier Packaging Dept', desc: 'Sealed in signature magnetic gold-embossed box with wax seal.' },
                { time: '2026-10-31 11:30', stage: 'Processing', title: 'Artisan Blending & Bottling Completed', location: 'LA FIN Fragrance Atelier', desc: 'Hand-poured 50ml Eau de Parfum, verified olfactory profile.' },
                { time: '2026-10-31 10:15', stage: 'Confirmed', title: 'Order Confirmed & Payment Verified', location: 'LA FIN Online Store Gateway', desc: 'Payment received via UPI. Order registered in production queue.' }
            ]
        }
    },
    {
        id: 'LAF-ORD-719340',
        customerId: 'CUST-1001',
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav.sharma@example.com',
        customerPhone: '+91 98765 43210',
        shippingAddress: 'Flat 402, Sea Crest Towers, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        items: [
            { id: 2, name: 'Midnight Ember', price: 699, qty: 2, image: 'perfume2.png', notes: 'WOODY · AMBER · VANILLA', tag: '02 / INTENSE' }
        ],
        subtotal: 1398,
        deliveryFee: 50,
        total: 1448,
        paymentMethod: 'card',
        paymentStatus: 'Paid Successfully',
        paymentDetails: { cardLast4: '4242' },
        orderStatus: 'Delivered',
        createdAt: '2026-10-22 14:20:00',
        estimatedDelivery: 'Oct 25, 2026',
        courier: {
            name: 'BlueDart Luxury Air Express',
            awb: 'BD-662910482-IN',
            currentCity: 'Mumbai, Delivered',
            stage: 6,
            checkpoints: [
                { time: '2026-10-25 15:40', stage: 'Delivered', title: 'Delivered Successfully', location: 'Bandra West, Mumbai', desc: 'Delivered to recipient Aarav Sharma. Signature OTP verified.' },
                { time: '2026-10-25 09:15', stage: 'Out for Delivery', title: 'Out for Doorstep Delivery', location: 'Bandra Delivery Depot', desc: 'Assigned to delivery officer Rajesh K.' },
                { time: '2026-10-24 18:30', stage: 'In Transit', title: 'Arrived at City Distribution Hub', location: 'Mumbai Central Logistics Facility', desc: 'Scanned and bagged for local route delivery.' },
                { time: '2026-10-23 12:00', stage: 'Dispatched', title: 'Dispatched from LA FIN Atelier', location: 'Surat Central Depot', desc: 'Consignment cleared for express interstate dispatch.' },
                { time: '2026-10-22 14:20', stage: 'Confirmed', title: 'Order Confirmed', location: 'LA FIN Gateway', desc: 'Order received and card payment confirmed.' }
            ]
        }
    },
    {
        id: 'LAF-ORD-652190',
        customerId: 'CUST-1002',
        customerName: 'Priya Patel',
        customerEmail: 'priya.patel@example.com',
        customerPhone: '+91 98234 56789',
        shippingAddress: '44 Gulmohar Greens, Bodakdev',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        items: [
            { id: 2, name: 'Midnight Ember', price: 699, qty: 2, image: 'perfume2.png', notes: 'WOODY · AMBER · VANILLA', tag: '02 / INTENSE' },
            { id: 1, name: 'Ocean Rush', price: 599, qty: 1, image: 'perfume1.png', notes: 'CITRUS · AQUATIC · MUSK', tag: '01 / FRESH' }
        ],
        subtotal: 1997,
        deliveryFee: 50,
        total: 2047,
        paymentMethod: 'upi',
        paymentStatus: 'Paid Successfully',
        paymentDetails: { upiId: 'priya.patel@icici' },
        orderStatus: 'Out for Delivery',
        createdAt: '2026-10-31 18:45:10',
        estimatedDelivery: 'Nov 02, 2026',
        courier: {
            name: 'Delhivery Luxury Cargo',
            awb: 'DL-993810245-IN',
            currentCity: 'Ahmedabad Bodakdev Depot',
            stage: 5,
            checkpoints: [
                { time: '2026-11-01 11:20', stage: 'Out for Delivery', title: 'Out for Delivery', location: 'Ahmedabad Bodakdev Hub', desc: 'Out with delivery specialist. Expected before 6:00 PM.' },
                { time: '2026-11-01 06:40', stage: 'In Transit', title: 'Arrived at City Hub', location: 'Ahmedabad Central Logistics Hub', desc: 'Processed at local facility.' },
                { time: '2026-10-31 22:00', stage: 'Dispatched', title: 'Dispatched from LA FIN Atelier', location: 'Surat Express Facility', desc: 'Transit container dispatched on express road carrier.' },
                { time: '2026-10-31 18:45', stage: 'Confirmed', title: 'Order Confirmed', location: 'LA FIN Gateway', desc: 'Payment approved.' }
            ]
        }
    },
    {
        id: 'LAF-ORD-519084',
        customerId: 'CUST-1003',
        customerName: 'Rohan Mehta',
        customerEmail: 'rohan.mehta@example.com',
        customerPhone: '+91 97112 34567',
        shippingAddress: 'B-12 Greater Kailash I',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110048',
        items: [
            { id: 3, name: 'Velvet Oud', price: 799, qty: 1, image: 'perfume3.png', notes: 'OUD · SANDALWOOD · MUSK', tag: '03 / MYSTERY' }
        ],
        subtotal: 799,
        deliveryFee: 50,
        total: 849,
        paymentMethod: 'cod',
        paymentStatus: 'Payable on Delivery',
        paymentDetails: {},
        orderStatus: 'Processing',
        createdAt: '2026-11-01 08:30:45',
        estimatedDelivery: 'Nov 04, 2026',
        courier: {
            name: 'BlueDart Luxury Air Express',
            awb: 'BD-551029481-IN',
            currentCity: 'LA FIN Atelier',
            stage: 2,
            checkpoints: [
                { time: '2026-11-01 12:00', stage: 'Processing', title: 'Perfume Blending & Maturation', location: 'LA FIN Perfumery Atelier', desc: 'Formulation blending underway by master perfumer.' },
                { time: '2026-11-01 08:30', stage: 'Confirmed', title: 'COD Order Confirmed', location: 'LA FIN Gateway', desc: 'Phone verification completed. Added to packaging schedule.' }
            ]
        }
    }
];

const Store = {
    // ---- PRODUCTS & STOCKS ----
    getProducts() {
        const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
            return DEFAULT_PRODUCTS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Error parsing products from storage', e);
            return DEFAULT_PRODUCTS;
        }
    },

    saveProducts(products) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.notifyChange('products');
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === Number(id) || p.sku === id);
    },

    getProductByName(name) {
        const products = this.getProducts();
        return products.find(p => p.name.toLowerCase() === name.toLowerCase());
    },

    updateStock(id, newStock) {
        const products = this.getProducts();
        const product = products.find(p => p.id === Number(id));
        if (product) {
            product.stock = Math.max(0, parseInt(newStock, 10) || 0);
            this.saveProducts(products);
            return product;
        }
        return null;
    },

    adjustStock(id, delta) {
        const products = this.getProducts();
        const product = products.find(p => p.id === Number(id));
        if (product) {
            product.stock = Math.max(0, (product.stock || 0) + delta);
            this.saveProducts(products);
            return product;
        }
        return null;
    },

    addProduct(productData) {
        const products = this.getProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            name: productData.name || 'New Fragrance',
            sku: productData.sku || `LAF-00${newId}`,
            category: productData.category || 'Luxury Fragrance',
            notes: productData.notes || 'TOP · HEART · BASE',
            price: Number(productData.price) || 599,
            stock: Number(productData.stock) || 20,
            minStock: Number(productData.minStock) || 10,
            tag: productData.tag || `0${newId} / SIGNATURE`,
            image: productData.image || 'perfume1.png',
            fallbackImage: productData.fallbackImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85',
            description: productData.description || 'Handcrafted luxury fragrance.'
        };
        products.push(newProduct);
        this.saveProducts(products);
        return newProduct;
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== Number(id));
        this.saveProducts(products);
    },

    // ---- CUSTOMER MANAGEMENT ----
    getCustomers() {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
            return DEFAULT_CUSTOMERS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Error parsing customers', e);
            return DEFAULT_CUSTOMERS;
        }
    },

    saveCustomers(customers) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        this.notifyChange('customers');
    },

    getCustomerById(id) {
        const customers = this.getCustomers();
        return customers.find(c => c.id === id);
    },

    getCustomerByEmail(email) {
        if (!email) return null;
        const customers = this.getCustomers();
        return customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    },

    /**
     * Records a customer login or signs them up.
     * Stores full customer profile with role 'customer' and logs session.
     */
    recordCustomerLogin(profile) {
        const customers = this.getCustomers();
        const now = new Date();
        const formattedDate = this.formatDateTime(now);
        const device = this.detectDevice();

        let customer = customers.find(c => c.email.toLowerCase() === profile.email.toLowerCase());

        if (customer) {
            // Existing customer login
            customer.name = profile.name || customer.name;
            customer.role = 'customer';
            if (profile.phone) customer.phone = profile.phone;
            if (profile.city) customer.city = profile.city;
            customer.lastLogin = formattedDate;
            customer.loginCount = (customer.loginCount || 0) + 1;
            customer.status = 'Active';

            if (!customer.loginHistory) customer.loginHistory = [];
            customer.loginHistory.unshift({
                timestamp: formattedDate,
                device: device,
                ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
                status: 'Success'
            });

            // Keep max 25 login logs per customer
            if (customer.loginHistory.length > 25) {
                customer.loginHistory.pop();
            }
        } else {
            // New customer registration on login
            const newId = 'CUST-' + (1000 + customers.length + 1);
            customer = {
                id: newId,
                name: profile.name || 'Valued Customer',
                email: profile.email.toLowerCase(),
                phone: profile.phone || '+91 98000 00000',
                city: profile.city || 'Mumbai, Maharashtra',
                role: 'customer',
                registeredAt: formattedDate,
                lastLogin: formattedDate,
                loginCount: 1,
                status: 'Active',
                cart: profile.cart || [],
                totalOrders: 0,
                totalSpent: 0,
                loginHistory: [
                    {
                        timestamp: formattedDate,
                        device: device,
                        ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
                        status: 'Registration'
                    }
                ]
            };
            customers.unshift(customer);
        }

        this.saveCustomers(customers);
        this.setCurrentUser(customer);
        this.addAuditLog({
            customerId: customer.id,
            customerName: customer.name,
            email: customer.email,
            action: 'Customer Login',
            timestamp: formattedDate,
            device: device
        });

        return customer;
    },

    updateCustomer(id, updatedFields) {
        const customers = this.getCustomers();
        const idx = customers.findIndex(c => c.id === id);
        if (idx !== -1) {
            customers[idx] = { ...customers[idx], ...updatedFields };
            this.saveCustomers(customers);
            // If currently logged in, update current user too
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === id) {
                this.setCurrentUser(customers[idx]);
            }
            return customers[idx];
        }
        return null;
    },

    deleteCustomer(id) {
        let customers = this.getCustomers();
        customers = customers.filter(c => c.id !== id);
        this.saveCustomers(customers);
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === id) {
            this.logoutUser();
        }
    },

    // ---- CURRENT LOGGED IN USER SESSION ----
    getCurrentUser() {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        this.notifyChange('auth');
    },

    logoutUser() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        this.notifyChange('auth');
    },

    // ---- CART MANAGEMENT (Customer Auth Required) ----
    /**
     * Gets the current customer's shopping bag.
     * Returns empty array if not logged in.
     */
    getCart() {
        const user = this.getCurrentUser();
        if (!user) return [];
        const saved = localStorage.getItem(`lafin_cart_${user.id}`);
        if (saved) {
            try { return JSON.parse(saved); } catch(e) {}
        }
        return user.cart || [];
    },

    /**
     * Saves cart for current user.
     */
    saveCart(cart) {
        const user = this.getCurrentUser();
        if (!user) return;
        localStorage.setItem(`lafin_cart_${user.id}`, JSON.stringify(cart));
        user.cart = cart;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        this.updateCustomer(user.id, { cart });
        this.notifyChange('cart');
    },

    /**
     * Adds an item to bag. Requires customer login.
     * If user is not logged in, returns { success: false, requireLogin: true }.
     */
    addToCart(item, qty = 1) {
        const user = this.getCurrentUser();
        if (!user) {
            return {
                success: false,
                requireLogin: true,
                message: 'Please sign in to your LA FIN account first before adding to bag.'
            };
        }

        const cart = this.getCart();
        const existing = cart.find(c => c.id === item.id || (item.name && c.name.toLowerCase() === item.name.toLowerCase()));
        
        // Stock check
        const product = item.id ? this.getProductById(item.id) : this.getProductByName(item.name);
        const currentStock = product ? product.stock : 99;
        const currentQty = existing ? existing.qty : 0;

        if (currentQty + qty > currentStock) {
            return {
                success: false,
                requireLogin: false,
                message: `Only ${currentStock} units of ${item.name} available in stock.`
            };
        }

        if (existing) {
            existing.qty = (existing.qty || 1) + qty;
        } else {
            cart.push({
                id: item.id || (product ? product.id : Date.now()),
                name: item.name,
                price: Number(item.price),
                qty: qty,
                image: item.image || (product ? product.image : 'perfume1.png'),
                fallbackImage: item.fallbackImage || (product ? product.fallbackImage : ''),
                notes: item.notes || (product ? product.notes : '')
            });
        }

        this.saveCart(cart);
        return {
            success: true,
            requireLogin: false,
            cart,
            message: `${item.name} added to your bag.`
        };
    },

    /**
     * Updates item quantity in cart.
     */
    updateCartQty(productId, qty) {
        const cart = this.getCart();
        const idx = cart.findIndex(c => c.id === productId);
        if (idx !== -1) {
            if (qty <= 0) {
                cart.splice(idx, 1);
            } else {
                const product = this.getProductById(productId);
                const maxStock = product ? product.stock : 99;
                cart[idx].qty = Math.min(qty, maxStock);
            }
            this.saveCart(cart);
        }
        return cart;
    },

    /**
     * Removes an item from cart.
     */
    removeFromCart(productId) {
        let cart = this.getCart();
        cart = cart.filter(c => c.id !== productId);
        this.saveCart(cart);
        return cart;
    },

    /**
     * Clears all items in current user's cart.
     */
    clearCart() {
        this.saveCart([]);
    },

    /**
     * Returns total item count in bag.
     */
    getCartCount() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    },

    /**
     * Calculates cart subtotal, delivery fee, and grand total.
     * Fixed delivery charge is ₹50.
     */
    getCartSummary() {
        const cart = this.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
        // Fixed Delivery Fee of Rs 50 if cart has items
        const deliveryFee = cart.length > 0 ? 50 : 0;
        const total = subtotal + deliveryFee;
        return {
            items: cart,
            count: cart.reduce((sum, item) => sum + (item.qty || 1), 0),
            subtotal,
            deliveryFee,
            total
        };
    },

    // ---- ORDER MANAGEMENT ----
    getOrders() {
        const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            return [];
        }
    },

    saveOrders(orders) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        this.notifyChange('orders');
    },

    getOrderById(id) {
        if (!id) return null;
        const cleanId = String(id).trim().toUpperCase();
        const orders = this.getOrders();
        return orders.find(o => o.id && o.id.toUpperCase() === cleanId) || null;
    },

    getOrdersForCustomer(customerEmailOrId) {
        if (!customerEmailOrId) return [];
        const clean = String(customerEmailOrId).trim().toLowerCase();
        const orders = this.getOrders();
        return orders.filter(o =>
            (o.customerId && o.customerId.toLowerCase() === clean) ||
            (o.customerEmail && o.customerEmail.toLowerCase() === clean)
        );
    },

    updateOrderStatus(orderId, newStatus, trackingNote = '', locationName = '') {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return null;

        order.orderStatus = newStatus;
        if (!order.courier) {
            order.courier = {
                name: 'BlueDart Luxury Air Express',
                awb: 'BD-' + Math.floor(100000000 + Math.random() * 900000000) + '-IN',
                currentCity: locationName || 'In Transit Facility',
                stage: 1,
                checkpoints: []
            };
        }

        const stageMap = {
            'Confirmed': 1,
            'Processing': 2,
            'Packaged': 3,
            'Dispatched': 4,
            'In Transit': 4,
            'Out for Delivery': 5,
            'Delivered': 6,
            'Cancelled': 0
        };

        order.courier.stage = stageMap[newStatus] !== undefined ? stageMap[newStatus] : 1;
        if (locationName) {
            order.courier.currentCity = locationName;
        }

        const now = this.formatDateTime();
        order.courier.checkpoints.unshift({
            time: now,
            stage: newStatus,
            title: `Order Status: ${newStatus}`,
            location: locationName || (newStatus === 'Delivered' ? `${order.city || 'Delivery Address'}, Delivered` : 'Regional Hub Facility'),
            desc: trackingNote || `Package status transitioned to ${newStatus}.`
        });

        this.saveOrders(orders);

        this.addAuditLog({
            customerId: order.customerId || 'ADMIN',
            customerName: order.customerName,
            email: order.customerEmail,
            action: `Order ${orderId} Status Updated: ${newStatus}`,
            timestamp: now,
            device: this.detectDevice()
        });

        return order;
    },

    cancelOrder(orderId, reason = 'Customer request') {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return { success: false, message: 'Order reference not found.' };

        if (order.orderStatus === 'Delivered') {
            return { success: false, message: 'Delivered orders cannot be cancelled.' };
        }

        order.orderStatus = 'Cancelled';
        if (order.courier) {
            order.courier.stage = 0;
            order.courier.checkpoints.unshift({
                time: this.formatDateTime(),
                stage: 'Cancelled',
                title: 'Order Cancelled',
                location: 'Client Services',
                desc: `Order cancelled (${reason}). Inventory restocked.`
            });
        }

        // Restock inventory for each product
        order.items.forEach(item => {
            if (item.id) {
                this.adjustStock(item.id, item.qty || 1);
            } else {
                const prod = this.getProductByName(item.name);
                if (prod) this.adjustStock(prod.id, item.qty || 1);
            }
        });

        this.saveOrders(orders);
        return { success: true, order };
    },

    /**
     * Creates and records an order with delivery charge, courier tracking, and payment details.
     */
    createOrder(orderData) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('Please sign in to place an order.');
        }

        const summary = this.getCartSummary();
        if (summary.items.length === 0) {
            throw new Error('Your bag is empty.');
        }

        const orderId = 'LAF-ORD-' + Math.floor(100000 + Math.random() * 900000);
        const timestamp = this.formatDateTime();

        const estDate = new Date();
        estDate.setDate(estDate.getDate() + 3);
        const estDateStr = estDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const awbCode = 'BD-' + Math.floor(100000000 + Math.random() * 900000000) + '-IN';

        const newOrder = {
            id: orderId,
            customerId: user.id,
            customerName: orderData.name || user.name,
            customerEmail: user.email,
            customerPhone: orderData.phone || user.phone || '',
            shippingAddress: orderData.address || user.city || '',
            city: orderData.city || 'Mumbai',
            state: orderData.state || 'Maharashtra',
            pincode: orderData.pincode || '',
            items: summary.items.map(i => {
                const prod = this.getProductByName(i.name) || {};
                return {
                    id: i.id || prod.id,
                    name: i.name,
                    price: i.price,
                    qty: i.qty,
                    image: i.image || prod.image || 'perfume1.png',
                    notes: prod.notes || 'CITRUS · AMBER · MUSK',
                    tag: prod.tag || '01 / SIGNATURE'
                };
            }),
            subtotal: summary.subtotal,
            deliveryFee: 50, // Fixed ₹50 delivery charge
            total: summary.subtotal + 50,
            paymentMethod: orderData.paymentMethod || 'cod', // 'cod' | 'upi' | 'card' | 'netbanking'
            paymentDetails: orderData.paymentDetails || {},
            paymentStatus: orderData.paymentMethod === 'cod' ? 'Payable on Delivery' : 'Paid Successfully',
            orderStatus: 'Confirmed',
            createdAt: timestamp,
            estimatedDelivery: estDateStr,
            courier: {
                name: 'BlueDart Luxury Air Express',
                awb: awbCode,
                currentCity: 'LA FIN Perfumery Atelier',
                stage: 1,
                checkpoints: [
                    {
                        time: timestamp,
                        stage: 'Confirmed',
                        title: 'Order Confirmed & Artisan Queue Scheduled',
                        location: 'LA FIN Fragrance Atelier',
                        desc: 'Order securely received. Master perfumer assigned for formulation preparation.'
                    }
                ]
            }
        };

        // Deduct inventory stock for each product ordered
        summary.items.forEach(item => {
            if (item.id) {
                this.adjustStock(item.id, -(item.qty || 1));
            } else {
                const prod = this.getProductByName(item.name);
                if (prod) this.adjustStock(prod.id, -(item.qty || 1));
            }
        });

        // Save order to history
        const orders = this.getOrders();
        orders.unshift(newOrder);
        this.saveOrders(orders);

        // Update customer profile metrics
        const updatedTotalSpent = (user.totalSpent || 0) + newOrder.total;
        const updatedTotalOrders = (user.totalOrders || 0) + 1;
        this.updateCustomer(user.id, {
            totalSpent: updatedTotalSpent,
            totalOrders: updatedTotalOrders,
            phone: newOrder.customerPhone,
            city: newOrder.shippingAddress
        });

        // Clear bag
        this.clearCart();

        // Audit entry
        this.addAuditLog({
            customerId: user.id,
            customerName: user.name,
            email: user.email,
            action: `Order Placed: ${orderId} (₹${newOrder.total}) via ${newOrder.paymentMethod.toUpperCase()}`,
            timestamp: timestamp,
            device: this.detectDevice()
        });

        return newOrder;
    },

    // ---- AUDIT & LOGIN LOGS ----
    getAuditLogs() {
        const data = localStorage.getItem(STORAGE_KEYS.LOGIN_LOGS);
        if (!data) {
            const initialLogs = [
                { id: 1, customerId: 'ADMIN-001', customerName: 'Store Administrator', email: 'dhamechaharsh1@gmail.com', action: 'Admin System Initialized', timestamp: '2026-11-01 09:00:00', device: 'Desktop System' },
                { id: 2, customerId: 'CUST-1001', customerName: 'Aarav Sharma', email: 'aarav.sharma@example.com', action: 'Customer Login', timestamp: '2026-11-01 10:15:22', device: 'Chrome / Windows 11' },
                { id: 3, customerId: 'CUST-1003', customerName: 'Rohan Mehta', email: 'rohan.mehta@example.com', action: 'Customer Login', timestamp: '2026-11-01 08:30:45', device: 'Chrome / Android 14' }
            ];
            localStorage.setItem(STORAGE_KEYS.LOGIN_LOGS, JSON.stringify(initialLogs));
            return initialLogs;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    },

    addAuditLog(entry) {
        const logs = this.getAuditLogs();
        const newLog = {
            id: Date.now(),
            ...entry
        };
        logs.unshift(newLog);
        if (logs.length > 100) logs.pop();
        localStorage.setItem(STORAGE_KEYS.LOGIN_LOGS, JSON.stringify(logs));
    },

    // ---- HELPERS ----
    formatDateTime(d = new Date()) {
        const pad = (n) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const mins = pad(d.getMinutes());
        const secs = pad(d.getSeconds());
        return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
    },

    detectDevice() {
        const ua = navigator.userAgent || '';
        let browser = 'Browser';
        if (ua.includes('Edg/')) browser = 'Edge';
        else if (ua.includes('Chrome/')) browser = 'Chrome';
        else if (ua.includes('Safari/')) browser = 'Safari';
        else if (ua.includes('Firefox/')) browser = 'Firefox';

        let os = 'Desktop';
        if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Macintosh/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        return `${browser} / ${os}`;
    },

    notifyChange(type) {
        window.dispatchEvent(new CustomEvent('lafin_store_update', { detail: { type } }));
        window.dispatchEvent(new CustomEvent('greed_store_update', { detail: { type } }));
    },

    // Reset database to initial defaults
    resetToDefaults() {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.LOGIN_LOGS);
        this.notifyChange('all');
    },

    // ==========================================
    // EXCEL EXPORT ENGINE
    // ==========================================

    /**
     * Generates and downloads a detailed Excel spreadsheet (.xlsx or XML Excel)
     * for a SPECIFIC customer record.
     * Contains customer profile, account overview, login history, and bag/orders.
     */
    exportParticularCustomerToExcel(customer) {
        if (!customer) {
            alert('Customer record not found.');
            return;
        }

        const fileName = `LA_FIN_Customer_${customer.id}_${customer.name.replace(/\s+/g, '_')}.xlsx`;

        // Check if SheetJS library is loaded
        if (typeof XLSX !== 'undefined') {
            try {
                const wb = XLSX.utils.book_new();

                // 1. Profile Sheet Data
                const profileData = [
                    ['LA FIN LUXURY FRAGRANCES - CUSTOMER RECORD REPORT'],
                    ['Report Generated At:', this.formatDateTime()],
                    [''],
                    ['CUSTOMER IDENTIFICATION & PERSONAL INFORMATION'],
                    ['Field', 'Value'],
                    ['Customer ID', customer.id],
                    ['Full Name', customer.name],
                    ['Email Address', customer.email],
                    ['Phone Number', customer.phone || 'N/A'],
                    ['Shipping / City Address', customer.city || 'N/A'],
                    ['Account Role', customer.role || 'customer'],
                    ['Account Status', customer.status || 'Active'],
                    ['Account Registered Date', customer.registeredAt || 'N/A'],
                    ['Total Logins Recorded', customer.loginCount || 1],
                    ['Last Login Timestamp', customer.lastLogin || 'N/A'],
                    ['Lifetime Orders Placed', customer.totalOrders || 0],
                    ['Lifetime Spend (₹)', customer.totalSpent || 0],
                    ['Current Items in Bag', (customer.cart && customer.cart.length) || 0],
                    ['Current Bag Total Value (₹)', (customer.cart || []).reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0)]
                ];

                const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
                wsProfile['!cols'] = [{ wch: 30 }, { wch: 45 }];
                XLSX.utils.book_append_sheet(wb, wsProfile, 'Customer Profile');

                // 2. Login Logs Sheet Data
                const loginLogsData = [
                    ['CUSTOMER LOGIN AUDIT TRAIL'],
                    ['Customer ID:', customer.id, 'Customer Name:', customer.name],
                    [''],
                    ['Session #', 'Login Timestamp', 'Device & Operating System', 'IP Address', 'Login Status']
                ];

                if (customer.loginHistory && customer.loginHistory.length > 0) {
                    customer.loginHistory.forEach((log, index) => {
                        loginLogsData.push([
                            customer.loginHistory.length - index,
                            log.timestamp,
                            log.device,
                            log.ip || '192.168.1.1',
                            log.status || 'Success'
                        ]);
                    });
                } else {
                    loginLogsData.push([1, customer.lastLogin, 'Web Session', '192.168.1.1', 'Success']);
                }

                const wsLogins = XLSX.utils.aoa_to_sheet(loginLogsData);
                wsLogins['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 28 }, { wch: 18 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, wsLogins, 'Login History');

                // 3. Cart & Shopping Activity Sheet
                const cartData = [
                    ['CUSTOMER SHOPPING BAG & ACTIVITY'],
                    ['Customer ID:', customer.id, 'Customer Name:', customer.name],
                    [''],
                    ['Item #', 'Product Fragrance', 'Unit Price (₹)', 'Quantity', 'Subtotal (₹)']
                ];

                if (customer.cart && customer.cart.length > 0) {
                    customer.cart.forEach((item, index) => {
                        const qty = item.qty || 1;
                        cartData.push([
                            index + 1,
                            item.name,
                            item.price,
                            qty,
                            item.price * qty
                        ]);
                    });
                    const totalCart = customer.cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
                    cartData.push(['', '', '', 'TOTAL BAG VALUE:', totalCart]);
                } else {
                    cartData.push(['-', 'No active items currently in bag', '-', '-', '-']);
                }

                const wsCart = XLSX.utils.aoa_to_sheet(cartData);
                wsCart['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 16 }, { wch: 12 }, { wch: 18 }];
                XLSX.utils.book_append_sheet(wb, wsCart, 'Shopping Bag');

                // Write binary .xlsx and trigger download
                XLSX.writeFile(wb, fileName);
                return true;
            } catch (err) {
                console.warn('SheetJS export error, falling back to XML/CSV:', err);
            }
        }

        // Native Excel XML / CSV Fallback (Works 100% offline without any CDN)
        this.downloadExcelFallback(customer);
        return true;
    },

    /**
     * Fallback Excel file generator using Excel XML Spreadsheet format.
     */
    downloadExcelFallback(customer) {
        const sanitize = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const bagTotal = (customer.cart || []).reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

        let loginRowsXml = '';
        const logins = customer.loginHistory && customer.loginHistory.length > 0
            ? customer.loginHistory
            : [{ timestamp: customer.lastLogin || this.formatDateTime(), device: 'Web Desktop', ip: '192.168.1.1', status: 'Success' }];

        logins.forEach((log, idx) => {
            loginRowsXml += `
            <Row>
                <Cell ss:StyleID="Data"><Data ss:Type="Number">${idx + 1}</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(log.timestamp)}</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(log.device)}</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(log.ip || '192.168.1.1')}</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(log.status || 'Success')}</Data></Cell>
            </Row>`;
        });

        let cartRowsXml = '';
        if (customer.cart && customer.cart.length > 0) {
            customer.cart.forEach((item, idx) => {
                const qty = item.qty || 1;
                cartRowsXml += `
                <Row>
                    <Cell ss:StyleID="Data"><Data ss:Type="Number">${idx + 1}</Data></Cell>
                    <Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(item.name)}</Data></Cell>
                    <Cell ss:StyleID="Data"><Data ss:Type="Number">${item.price}</Data></Cell>
                    <Cell ss:StyleID="Data"><Data ss:Type="Number">${qty}</Data></Cell>
                    <Cell ss:StyleID="Data"><Data ss:Type="Number">${item.price * qty}</Data></Cell>
                </Row>`;
            });
        } else {
            cartRowsXml += `
            <Row>
                <Cell ss:StyleID="Data"><Data ss:Type="String">-</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">No active items in bag</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">-</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">-</Data></Cell>
                <Cell ss:StyleID="Data"><Data ss:Type="String">-</Data></Cell>
            </Row>`;
        }

        const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#C6A56B"/>
   <Interior ss:Color="#11110F" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#232320" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#11110F"/>
   <Interior ss:Color="#EAE5D9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B59E75"/>
   </Borders>
  </Style>
  <Style ss:ID="FieldLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#333333"/>
   <Interior ss:Color="#F8F6F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#11110F"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#11110F"/>
   <Interior ss:Color="#EAE5D9" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Customer Profile">
  <Table ss:DefaultColumnWidth="160">
   <Column ss:Width="200"/>
   <Column ss:Width="280"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">LA FIN LUXURY FRAGRANCES - CUSTOMER RECORD</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String">Export Date: ${this.formatDateTime()}</Data></Cell></Row>
   <Row></Row>
   <Row>
    <Cell ss:MergeAcross="1" ss:StyleID="SectionHeader"><Data ss:Type="String">1. CUSTOMER IDENTITY &amp; CONTACT</Data></Cell>
   </Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Customer ID</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.id)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Full Name</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.name)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Email Address</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.email)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Phone Number</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.phone)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Delivery Address / City</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.city)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Account Role</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.role || 'customer')}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Account Status</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.status || 'Active')}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Registered Since</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.registeredAt)}</Data></Cell></Row>
   <Row></Row>
   <Row>
    <Cell ss:MergeAcross="1" ss:StyleID="SectionHeader"><Data ss:Type="String">2. ENGAGEMENT &amp; LOGIN ACTIVITY</Data></Cell>
   </Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Total Logins Recorded</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="Number">${customer.loginCount || 1}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Last Login Recorded</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="String">${sanitize(customer.lastLogin)}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Lifetime Orders</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="Number">${customer.totalOrders || 0}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Lifetime Spend (₹)</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="Number">${customer.totalSpent || 0}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Current Bag Items</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="Number">${(customer.cart && customer.cart.length) || 0}</Data></Cell></Row>
   <Row><Cell ss:StyleID="FieldLabel"><Data ss:Type="String">Current Bag Value (₹)</Data></Cell><Cell ss:StyleID="Data"><Data ss:Type="Number">${bagTotal}</Data></Cell></Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Login Audit History">
  <Table ss:DefaultColumnWidth="140">
   <Column ss:Width="80"/>
   <Column ss:Width="160"/>
   <Column ss:Width="200"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SectionHeader"><Data ss:Type="String">CUSTOMER LOGIN HISTORY (${sanitize(customer.name)} - ${sanitize(customer.id)})</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Session #</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Device / Platform</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">IP Address</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>
   ${loginRowsXml}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Current Bag &amp; Cart">
  <Table ss:DefaultColumnWidth="140">
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="4" ss:StyleID="SectionHeader"><Data ss:Type="String">ACTIVE BAG ITEMS (${sanitize(customer.name)})</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Fragrance Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Price (₹)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Quantity</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Subtotal (₹)</Data></Cell>
   </Row>
   ${cartRowsXml}
   <Row>
    <Cell ss:StyleID="Total"></Cell>
    <Cell ss:StyleID="Total"></Cell>
    <Cell ss:StyleID="Total"></Cell>
    <Cell ss:StyleID="Total"><Data ss:Type="String">TOTAL BAG:</Data></Cell>
    <Cell ss:StyleID="Total"><Data ss:Type="Number">${bagTotal}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `LA_FIN_Customer_${customer.id}_${customer.name.replace(/\s+/g, '_')}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Export all customers to an Excel file
     */
    exportAllCustomersToExcel() {
        const customers = this.getCustomers();
        const fileName = `LA_FIN_All_Customers_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

        if (typeof XLSX !== 'undefined') {
            const rows = [
                ['LA FIN LUXURY PERFUMES - MASTER CUSTOMER DIRECTORY'],
                ['Export Date:', this.formatDateTime()],
                ['Total Customers:', customers.length],
                [''],
                ['Customer ID', 'Customer Name', 'Email', 'Phone', 'City / Location', 'Role', 'Registered At', 'Last Login', 'Login Count', 'Cart Items', 'Cart Value (₹)', 'Total Spent (₹)', 'Status']
            ];

            customers.forEach(c => {
                const cartVal = (c.cart || []).reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
                rows.push([
                    c.id,
                    c.name,
                    c.email,
                    c.phone || '',
                    c.city || '',
                    c.role || 'customer',
                    c.registeredAt || '',
                    c.lastLogin || '',
                    c.loginCount || 1,
                    (c.cart && c.cart.length) || 0,
                    cartVal,
                    c.totalSpent || 0,
                    c.status || 'Active'
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [
                { wch: 14 }, { wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 22 },
                { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
                { wch: 15 }, { wch: 15 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'All Customers');
            XLSX.writeFile(wb, fileName);
            return;
        }

        // CSV fallback with UTF-8 BOM
        let csv = '\uFEFF';
        csv += 'Customer ID,Customer Name,Email,Phone,City,Role,Registered At,Last Login,Login Count,Cart Items,Cart Value,Total Spent,Status\r\n';
        customers.forEach(c => {
            const cartVal = (c.cart || []).reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
            csv += `"${c.id}","${c.name}","${c.email}","${c.phone || ''}","${c.city || ''}","${c.role || 'customer'}","${c.registeredAt || ''}","${c.lastLogin || ''}",${c.loginCount || 1},${(c.cart && c.cart.length) || 0},${cartVal},${c.totalSpent || 0},"${c.status || 'Active'}"\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `LA_FIN_All_Customers_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Export all stocks/inventory to an Excel file
     */
    exportStocksToExcel() {
        const products = this.getProducts();
        const fileName = `LA_FIN_Stock_Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

        if (typeof XLSX !== 'undefined') {
            const rows = [
                ['LA FIN LUXURY PERFUMES - STOCK & INVENTORY MASTER REPORT'],
                ['Export Date:', this.formatDateTime()],
                ['Total Product Lines:', products.length],
                ['Total Units in Stock:', products.reduce((sum, p) => sum + (p.stock || 0), 0)],
                ['Total Inventory Value (₹):', products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0)],
                [''],
                ['Product ID', 'SKU', 'Fragrance Name', 'Category', 'Scent Notes', 'Unit Price (₹)', 'Current Stock', 'Min Stock Alert', 'Status', 'Inventory Value (₹)']
            ];

            products.forEach(p => {
                let status = 'In Stock';
                if (p.stock <= 0) status = 'Out of Stock';
                else if (p.stock <= (p.minStock || 10)) status = 'Low Stock';

                rows.push([
                    p.id,
                    p.sku,
                    p.name,
                    p.category,
                    p.notes,
                    p.price,
                    p.stock,
                    p.minStock || 10,
                    status,
                    (p.stock || 0) * (p.price || 0)
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [
                { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 30 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, ws, 'Stock Inventory');
            XLSX.writeFile(wb, fileName);
            return;
        }

        // CSV fallback
        let csv = '\uFEFF';
        csv += 'Product ID,SKU,Fragrance Name,Category,Scent Notes,Unit Price,Current Stock,Min Stock,Status,Inventory Value\r\n';
        products.forEach(p => {
            let status = 'In Stock';
            if (p.stock <= 0) status = 'Out of Stock';
            else if (p.stock <= (p.minStock || 10)) status = 'Low Stock';

            csv += `${p.id},"${p.sku}","${p.name}","${p.category}","${p.notes}",${p.price},${p.stock},${p.minStock || 10},"${status}",${(p.stock || 0) * (p.price || 0)}\r\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `LA_FIN_Stock_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Make Store available globally on window
if (typeof window !== 'undefined') {
    window.Store = Store;
}
