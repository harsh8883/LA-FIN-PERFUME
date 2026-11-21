/**
 * LA FIN Luxury Fragrances - Admin Portal Controller
 * Real-time stocks management, customer directory, login tracking, and Excel generation.
 * Protected by AdminAuth gatekeeper.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // ADMIN AUTHENTICATION & GATEWAY CONTROLLER
    // -------------------------------------------------------------
    const adminGatewayOverlay = document.getElementById('adminGatewayOverlay');
    const gateLoginForm = document.getElementById('gateLoginForm');
    const gateAdminEmail = document.getElementById('gateAdminEmail');
    const gateAdminPassword = document.getElementById('gateAdminPassword');
    const gateTogglePwd = document.getElementById('gateTogglePwd');
    const gateBtnSubmit = document.getElementById('gateBtnSubmit');
    const gateAlert = document.getElementById('gateAlert');

    const headerAdminName = document.getElementById('headerAdminName');
    const headerAdminEmail = document.getElementById('headerAdminEmail');
    const btnAdminLogout = document.getElementById('btnAdminLogout');

    function showGateAlert(message, type = 'error') {
        if (!gateAlert) return;
        gateAlert.textContent = message;
        gateAlert.className = `gate-alert ${type}`;
        gateAlert.style.display = 'block';
    }

    function checkAuthAndGate() {
        const isAuth = typeof AdminAuth !== 'undefined' && AdminAuth.isAuthenticated();

        if (isAuth) {
            if (adminGatewayOverlay) adminGatewayOverlay.style.display = 'none';
            const user = AdminAuth.getAdminUser();
            if (user) {
                if (headerAdminName) headerAdminName.textContent = user.name;
                if (headerAdminEmail) headerAdminEmail.textContent = user.email;
            }
            renderAll();
            return true;
        } else {
            if (adminGatewayOverlay) {
                adminGatewayOverlay.style.display = 'flex';
            }
            return false;
        }
    }

    // Toggle password eye icon
    if (gateTogglePwd && gateAdminPassword) {
        gateTogglePwd.addEventListener('click', () => {
            const isPwd = gateAdminPassword.type === 'password';
            gateAdminPassword.type = isPwd ? 'text' : 'password';
            gateTogglePwd.textContent = isPwd ? '🙈' : '👁️';
        });
    }

    // Form submission inside gateway
    if (gateLoginForm) {
        gateLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = gateAdminEmail.value.trim();
            const password = gateAdminPassword.value.trim();

            gateBtnSubmit.disabled = true;
            gateBtnSubmit.innerHTML = '<span>Verifying Security Keys...</span>';

            setTimeout(() => {
                const res = AdminAuth.login(email, password, true);
                if (res.success) {
                    showGateAlert('Authentication verified! Access granted.', 'success');
                    setTimeout(() => {
                        gateBtnSubmit.disabled = false;
                        gateBtnSubmit.innerHTML = '<span>🛡️ Authenticate &amp; Access Dashboard</span>';
                        checkAuthAndGate();
                        showNotification('Welcome Store Administrator. Admin Dashboard unlocked.');
                    }, 400);
                } else {
                    gateBtnSubmit.disabled = false;
                    gateBtnSubmit.innerHTML = '<span>🛡️ Authenticate &amp; Access Dashboard</span>';
                    showGateAlert(res.message, 'error');
                }
            }, 300);
        });
    }

    // Admin Logout Handler
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out from the Admin Portal?')) {
                if (typeof AdminAuth !== 'undefined') {
                    AdminAuth.logout();
                }
                checkAuthAndGate();
            }
        });
    }

    // Cross-tab logout listener
    const handleAuthChange = (e) => {
        if (!e.detail.authenticated) {
            checkAuthAndGate();
        }
    };
    window.addEventListener('lafin_admin_auth_change', handleAuthChange);
    window.addEventListener('greed_admin_auth_change', handleAuthChange);

    // Current state
    let activeCustomerForModal = null;

    // DOM Elements
    const liveClock = document.getElementById('liveClock');
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // KPI Metric Elements
    const statTotalCustomers = document.getElementById('statTotalCustomers');
    const statActiveCustomers = document.getElementById('statActiveCustomers');
    const statTotalStock = document.getElementById('statTotalStock');
    const statLowStock = document.getElementById('statLowStock');
    const statStockValue = document.getElementById('statStockValue');
    const statStockLines = document.getElementById('statStockLines');
    const statTotalOrders = document.getElementById('statTotalOrders');
    const statInTransitOrders = document.getElementById('statInTransitOrders');

    // Customer Elements
    const customersTableBody = document.getElementById('customersTableBody');
    const customerSearchInput = document.getElementById('customerSearchInput');
    const customerFilterStatus = document.getElementById('customerFilterStatus');
    const customerRefreshBtn = document.getElementById('customerRefreshBtn');
    const btnExportAllCustomers = document.getElementById('btnExportAllCustomers');
    const btnOpenAddCustomer = document.getElementById('btnOpenAddCustomer');

    // Stock Elements
    const stocksTableBody = document.getElementById('stocksTableBody');
    const btnExportStocks = document.getElementById('btnExportStocks');
    const btnOpenAddProduct = document.getElementById('btnOpenAddProduct');

    // Orders Elements
    const ordersTableBody = document.getElementById('ordersTableBody');
    const orderSearchInput = document.getElementById('orderSearchInput');
    const orderFilterStatus = document.getElementById('orderFilterStatus');
    const orderRefreshBtn = document.getElementById('orderRefreshBtn');
    const btnExportOrders = document.getElementById('btnExportOrders');

    const orderEditModal = document.getElementById('orderEditModal');
    const closeOrderEditModal = document.getElementById('closeOrderEditModal');
    const orderModalBadge = document.getElementById('orderModalBadge');
    const orderModalBody = document.getElementById('orderModalBody');

    // Audit Log Elements
    const loginLogsTableBody = document.getElementById('loginLogsTableBody');
    const btnClearLogs = document.getElementById('btnClearLogs');

    // Modals
    const customerDetailModal = document.getElementById('customerDetailModal');
    const closeCustomerDetailModal = document.getElementById('closeCustomerDetailModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCustomerBadge = document.getElementById('modalCustomerBadge');
    const modalCustomerName = document.getElementById('modalCustomerName');
    const customerDetailContent = document.getElementById('customerDetailContent');
    const modalDownloadParticularExcel = document.getElementById('modalDownloadParticularExcel');

    const customerEditModal = document.getElementById('customerEditModal');
    const closeCustomerEditModal = document.getElementById('closeCustomerEditModal');
    const btnCancelCustomerForm = document.getElementById('btnCancelCustomerForm');
    const customerForm = document.getElementById('customerForm');
    const customerModalTitle = document.getElementById('customerModalTitle');

    const productEditModal = document.getElementById('productEditModal');
    const closeProductEditModal = document.getElementById('closeProductEditModal');
    const btnCancelProductForm = document.getElementById('btnCancelProductForm');
    const productForm = document.getElementById('productForm');
    const productModalTitle = document.getElementById('productModalTitle');

    const btnResetData = document.getElementById('btnResetData');
    const adminNotification = document.getElementById('adminNotification');

    // -------------------------------------------------------------
    // CLOCK & TICKER
    // -------------------------------------------------------------
    function updateClock() {
        if (liveClock) {
            const now = new Date();
            liveClock.textContent = Store.formatDateTime(now);
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // -------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // -------------------------------------------------------------
    function showNotification(message, type = 'success') {
        if (!adminNotification) return;
        adminNotification.textContent = message;
        adminNotification.style.display = 'flex';
        adminNotification.className = `notification-toast ${type === 'danger' ? 'badge-danger' : ''}`;

        setTimeout(() => {
            adminNotification.style.display = 'none';
        }, 3500);
    }

    // -------------------------------------------------------------
    // TAB NAVIGATION
    // -------------------------------------------------------------
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // -------------------------------------------------------------
    // RENDER KPI DASHBOARD METRICS
    // -------------------------------------------------------------
    function renderKPIs() {
        const customers = Store.getCustomers();
        const products = Store.getProducts();

        const totalCustomers = customers.length;
        const activeCustomers = customers.filter(c => c.status === 'Active').length;

        const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const lowStockCount = products.filter(p => (p.stock || 0) <= (p.minStock || 10)).length;
        const totalValuation = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

        statTotalCustomers.textContent = totalCustomers;
        statActiveCustomers.textContent = activeCustomers;
        statTotalStock.textContent = totalStockUnits;
        statLowStock.textContent = lowStockCount;
        statStockValue.textContent = `₹${totalValuation.toLocaleString('en-IN')}`;
        statStockLines.textContent = `${products.length} Fragrance Lines`;

        const orders = Store.getOrders ? Store.getOrders() : [];
        if (statTotalOrders) statTotalOrders.textContent = orders.length;
        const activeTransit = orders.filter(o => o.orderStatus === 'In Transit' || o.orderStatus === 'Out for Delivery' || o.orderStatus === 'Processing' || o.orderStatus === 'Confirmed').length;
        if (statInTransitOrders) statInTransitOrders.textContent = `${activeTransit} Active Dispatch`;
    }

    // -------------------------------------------------------------
    // RENDER CUSTOMER DIRECTORY
    // -------------------------------------------------------------
    function renderCustomers() {
        const customers = Store.getCustomers();
        const searchQuery = (customerSearchInput.value || '').toLowerCase().trim();
        const filterStatus = customerFilterStatus.value;

        const filtered = customers.filter(customer => {
            const matchesSearch =
                customer.name.toLowerCase().includes(searchQuery) ||
                customer.email.toLowerCase().includes(searchQuery) ||
                (customer.phone && customer.phone.toLowerCase().includes(searchQuery)) ||
                customer.id.toLowerCase().includes(searchQuery) ||
                (customer.city && customer.city.toLowerCase().includes(searchQuery));

            if (!matchesSearch) return false;

            if (filterStatus === 'active') {
                return customer.status === 'Active';
            }
            if (filterStatus === 'with_cart') {
                return customer.cart && customer.cart.length > 0;
            }
            return true;
        });

        customersTableBody.innerHTML = '';

        if (filtered.length === 0) {
            customersTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--muted);">
                        No customer records found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(customer => {
            const tr = document.createElement('tr');

            // Initials
            const initials = customer.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            // Bag calculation
            const cartItemsCount = customer.cart ? customer.cart.reduce((s, i) => s + (i.qty || 1), 0) : 0;
            const cartTotalVal = customer.cart ? customer.cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0) : 0;

            tr.innerHTML = `
                <td><span class="customer-id">${customer.id}</span></td>
                <td>
                    <div class="user-cell">
                        <div class="avatar-initials">${initials}</div>
                        <div class="user-cell-meta">
                            <span class="user-cell-name">${escapeHtml(customer.name)}</span>
                            <span class="user-cell-registered">Since ${customer.registeredAt ? customer.registeredAt.slice(0, 10) : 'Recent'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-meta">
                        <span class="contact-email">${escapeHtml(customer.email)}</span>
                        <span class="contact-phone">${escapeHtml(customer.phone || 'No phone recorded')}</span>
                    </div>
                </td>
                <td><span>${escapeHtml(customer.city || 'Not provided')}</span></td>
                <td><strong>${customer.loginCount || 1}</strong> logins</td>
                <td><small style="color: var(--muted);">${customer.lastLogin || 'Just now'}</small></td>
                <td>
                    ${cartItemsCount > 0
                        ? `<span class="badge badge-cart">${cartItemsCount} item(s) · ₹${cartTotalVal}</span>`
                        : `<span style="color: var(--muted-dark); font-size: 11px;">Empty</span>`
                    }
                </td>
                <td>
                    <span class="badge ${customer.status === 'Active' ? 'badge-active' : 'badge-warning'}">
                        ${customer.status || 'Active'}
                    </span>
                </td>
                <td class="text-right">
                    <div class="action-group">
                        <!-- DIRECT PARTICULAR CUSTOMER EXCEL DOWNLOAD BUTTON -->
                        <button class="btn-excel btn-download-excel" data-id="${customer.id}" title="Download Excel report for ${escapeHtml(customer.name)}">
                            📥 Excel
                        </button>
                        <button class="btn btn-outline btn-sm btn-view-customer" data-id="${customer.id}" title="View complete details">
                            👁️ View
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete-customer" data-id="${customer.id}" title="Delete record" style="color: var(--danger);">
                            ✕
                        </button>
                    </div>
                </td>
            `;

            customersTableBody.appendChild(tr);
        });

        // Attach event listeners to customer row action buttons
        attachCustomerActionListeners();
    }

    function attachCustomerActionListeners() {
        // Individual Excel download for THAT particular customer
        document.querySelectorAll('.btn-download-excel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const customerId = btn.dataset.id;
                const customer = Store.getCustomerById(customerId);
                if (customer) {
                    Store.exportParticularCustomerToExcel(customer);
                    showNotification(`Downloaded Excel record for ${customer.name}`);
                }
            });
        });

        // View Customer Dossier Modal
        document.querySelectorAll('.btn-view-customer').forEach(btn => {
            btn.addEventListener('click', () => {
                const customerId = btn.dataset.id;
                openCustomerDetail(customerId);
            });
        });

        // Delete customer
        document.querySelectorAll('.btn-delete-customer').forEach(btn => {
            btn.addEventListener('click', () => {
                const customerId = btn.dataset.id;
                const customer = Store.getCustomerById(customerId);
                if (customer && confirm(`Are you sure you want to delete customer ${customer.name} (${customer.id})?`)) {
                    Store.deleteCustomer(customerId);
                    showNotification(`Customer ${customer.name} removed`, 'danger');
                    renderAll();
                }
            });
        });
    }

    // -------------------------------------------------------------
    // CUSTOMER DETAIL DOSSIER MODAL
    // -------------------------------------------------------------
    function openCustomerDetail(customerId) {
        const customer = Store.getCustomerById(customerId);
        if (!customer) return;

        activeCustomerForModal = customer;
        modalCustomerBadge.textContent = customer.id;
        modalCustomerName.textContent = customer.name;

        const cartTotal = (customer.cart || []).reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

        let cartItemsHtml = '';
        if (customer.cart && customer.cart.length > 0) {
            cartItemsHtml = `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-top: 8px;">
                    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                        <thead>
                            <tr style="color: var(--muted); border-bottom: 1px solid var(--border-color); text-align: left;">
                                <th style="padding: 6px;">Fragrance</th>
                                <th style="padding: 6px;">Unit Price</th>
                                <th style="padding: 6px;">Quantity</th>
                                <th style="padding: 6px; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customer.cart.map(item => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 8px 6px; font-weight: 600; color: var(--cream);">${escapeHtml(item.name)}</td>
                                    <td style="padding: 8px 6px;">₹${item.price}</td>
                                    <td style="padding: 8px 6px;">${item.qty || 1}</td>
                                    <td style="padding: 8px 6px; text-align: right; color: var(--gold); font-weight: 600;">₹${item.price * (item.qty || 1)}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td colspan="3" style="padding: 10px 6px; font-weight: 700; text-align: right;">Total Bag Value:</td>
                                <td style="padding: 10px 6px; text-align: right; font-weight: 700; color: var(--gold);">₹${cartTotal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            cartItemsHtml = `<p style="color: var(--muted); font-size: 13px; font-style: italic; margin-top: 8px;">Customer has no active items in their shopping bag.</p>`;
        }

        // Login history rows
        let loginHistoryHtml = '';
        const logins = customer.loginHistory || [
            { timestamp: customer.lastLogin, device: 'Web Desktop', ip: '192.168.1.100', status: 'Success' }
        ];

        loginHistoryHtml = `
            <div style="max-height: 200px; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-top: 8px;">
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                    <thead>
                        <tr style="color: var(--muted); border-bottom: 1px solid var(--border-color); text-align: left;">
                            <th style="padding: 6px;">Login Timestamp</th>
                            <th style="padding: 6px;">Platform / Browser</th>
                            <th style="padding: 6px;">IP Address</th>
                            <th style="padding: 6px; text-align: right;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logins.map(log => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 6px;">${log.timestamp}</td>
                                <td style="padding: 6px; color: var(--cream);">${escapeHtml(log.device)}</td>
                                <td style="padding: 6px; font-family: monospace; color: var(--muted);">${log.ip || '192.168.1.1'}</td>
                                <td style="padding: 6px; text-align: right;">
                                    <span class="badge ${log.status === 'Registration' ? 'badge-warning' : 'badge-active'}" style="font-size: 10px; padding: 2px 6px;">
                                        ${log.status || 'Success'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        customerDetailContent.innerHTML = `
            <div class="dossier-grid">
                <div class="dossier-item">
                    <span class="dossier-label">Email Address</span>
                    <span class="dossier-val">${escapeHtml(customer.email)}</span>
                </div>
                <div class="dossier-item">
                    <span class="dossier-label">Phone Contact</span>
                    <span class="dossier-val">${escapeHtml(customer.phone || 'N/A')}</span>
                </div>
                <div class="dossier-item">
                    <span class="dossier-label">City / Delivery Address</span>
                    <span class="dossier-val">${escapeHtml(customer.city || 'N/A')}</span>
                </div>
                <div class="dossier-item">
                    <span class="dossier-label">Total Logins Recorded</span>
                    <span class="dossier-val">${customer.loginCount || 1} Sessions</span>
                </div>
                <div class="dossier-item">
                    <span class="dossier-label">Registered Date</span>
                    <span class="dossier-val">${customer.registeredAt || 'N/A'}</span>
                </div>
                <div class="dossier-item">
                    <span class="dossier-label">Last Login Event</span>
                    <span class="dossier-val">${customer.lastLogin || 'N/A'}</span>
                </div>
            </div>

            <div class="dossier-section-title">
                <span>🛍️ Active Shopping Bag Record</span>
            </div>
            ${cartItemsHtml}

            <div class="dossier-section-title">
                <span>🕒 Customer Login Audit Trail</span>
            </div>
            ${loginHistoryHtml}
        `;

        customerDetailModal.style.display = 'flex';
    }

    if (modalDownloadParticularExcel) {
        modalDownloadParticularExcel.addEventListener('click', () => {
            if (activeCustomerForModal) {
                Store.exportParticularCustomerToExcel(activeCustomerForModal);
                showNotification(`Downloaded Excel record for ${activeCustomerForModal.name}`);
            }
        });
    }

    if (closeCustomerDetailModal) {
        closeCustomerDetailModal.addEventListener('click', () => customerDetailModal.style.display = 'none');
    }
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => customerDetailModal.style.display = 'none');
    }

    // -------------------------------------------------------------
    // RENDER STOCKS & INVENTORY
    // -------------------------------------------------------------
    function renderStocks() {
        const products = Store.getProducts();
        stocksTableBody.innerHTML = '';

        products.forEach(product => {
            const tr = document.createElement('tr');
            const stock = product.stock || 0;
            const minStock = product.minStock || 10;
            const inventoryValue = stock * (product.price || 0);

            let statusBadge = '';
            if (stock <= 0) {
                statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
            } else if (stock <= minStock) {
                statusBadge = `<span class="badge badge-warning">Low Stock (${stock} left)</span>`;
            } else {
                statusBadge = '<span class="badge badge-active">In Stock</span>';
            }

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="${product.image || 'perfume1.png'}"
                             onerror="this.src='${product.fallbackImage || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85'}'"
                             alt="${escapeHtml(product.name)}"
                             class="product-thumb">
                        <div class="product-meta">
                            <h4>${escapeHtml(product.name)}</h4>
                            <span class="product-sku">${product.sku || 'SKU-000'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: var(--cream); font-weight: 500;">${escapeHtml(product.category || 'Luxury Fragrance')}</span>
                        <small style="color: var(--muted); font-size: 11px;">${escapeHtml(product.notes || '')}</small>
                    </div>
                </td>
                <td><strong>₹${product.price}</strong></td>
                <td>
                    <div class="stock-stepper">
                        <button class="step-btn btn-stock-dec" data-id="${product.id}" title="Decrease Stock by 1">−</button>
                        <span class="stock-num">${stock}</span>
                        <button class="step-btn btn-stock-inc" data-id="${product.id}" title="Increase Stock by 1">+</button>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>₹${inventoryValue.toLocaleString('en-IN')}</td>
                <td>
                    <button class="btn btn-outline btn-sm btn-quick-stock" data-id="${product.id}">
                        Set Qty
                    </button>
                </td>
                <td class="text-right">
                    <div class="action-group">
                        <button class="btn btn-outline btn-sm btn-edit-product" data-id="${product.id}">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete-product" data-id="${product.id}" style="color: var(--danger);">
                            ✕
                        </button>
                    </div>
                </td>
            `;

            stocksTableBody.appendChild(tr);
        });

        attachStockActionListeners();
    }

    function attachStockActionListeners() {
        // Increment stock
        document.querySelectorAll('.btn-stock-inc').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                Store.adjustStock(id, 1);
                renderAll();
            });
        });

        // Decrement stock
        document.querySelectorAll('.btn-stock-dec').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                Store.adjustStock(id, -1);
                renderAll();
            });
        });

        // Quick set stock
        document.querySelectorAll('.btn-quick-stock').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const prod = Store.getProductById(id);
                if (prod) {
                    const input = prompt(`Enter new stock quantity for ${prod.name}:`, prod.stock);
                    if (input !== null) {
                        const parsed = parseInt(input, 10);
                        if (!isNaN(parsed) && parsed >= 0) {
                            Store.updateStock(id, parsed);
                            showNotification(`Updated ${prod.name} stock to ${parsed}`);
                            renderAll();
                        } else {
                            alert('Please enter a valid non-negative number.');
                        }
                    }
                }
            });
        });

        // Edit product
        document.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                openEditProductModal(id);
            });
        });

        // Delete product
        document.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const prod = Store.getProductById(id);
                if (prod && confirm(`Delete fragrance "${prod.name}" from inventory?`)) {
                    Store.deleteProduct(id);
                    showNotification(`Removed product ${prod.name}`, 'danger');
                    renderAll();
                }
            });
        });
    }

    // -------------------------------------------------------------
    // RENDER AUDIT LOGS
    // -------------------------------------------------------------
    function renderAuditLogs() {
        const logs = Store.getAuditLogs();
        loginLogsTableBody.innerHTML = '';

        if (logs.length === 0) {
            loginLogsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--muted); padding: 30px;">
                        No login events recorded yet.
                    </td>
                </tr>
            `;
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small style="color: var(--muted);">${log.timestamp}</small></td>
                <td><span class="customer-id">${log.customerId || 'GUEST'}</span></td>
                <td><strong style="color: var(--cream);">${escapeHtml(log.customerName || 'Anonymous')}</strong></td>
                <td>${escapeHtml(log.email || 'N/A')}</td>
                <td><small style="color: var(--gold);">${escapeHtml(log.device || 'Web Browser')}</small></td>
                <td><span class="badge ${log.action.includes('Admin') ? 'badge-warning' : 'badge-active'}">${escapeHtml(log.action || 'Login')}</span></td>
            `;
            loginLogsTableBody.appendChild(tr);
        });
    }

    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            if (confirm('Clear all access audit logs?')) {
                localStorage.removeItem(STORAGE_KEYS.LOGIN_LOGS);
                renderAuditLogs();
                showNotification('Login logs cleared');
            }
        });
    }

    // -------------------------------------------------------------
    // EXCEL EXPORTS (GLOBAL BUTTONS)
    // -------------------------------------------------------------
    if (btnExportAllCustomers) {
        btnExportAllCustomers.addEventListener('click', () => {
            Store.exportAllCustomersToExcel();
            showNotification('Exported all customers directory to Excel');
        });
    }

    if (btnExportStocks) {
        btnExportStocks.addEventListener('click', () => {
            Store.exportStocksToExcel();
            showNotification('Exported stock inventory report to Excel');
        });
    }

    // -------------------------------------------------------------
    // ADD / EDIT CUSTOMER MODAL
    // -------------------------------------------------------------
    if (btnOpenAddCustomer) {
        btnOpenAddCustomer.addEventListener('click', () => {
            customerForm.reset();
            document.getElementById('custFormId').value = '';
            customerModalTitle.textContent = 'Add New Customer Record';
            customerEditModal.style.display = 'flex';
        });
    }

    if (closeCustomerEditModal) {
        closeCustomerEditModal.addEventListener('click', () => customerEditModal.style.display = 'none');
    }
    if (btnCancelCustomerForm) {
        btnCancelCustomerForm.addEventListener('click', () => customerEditModal.style.display = 'none');
    }

    customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('custFormId').value;
        const name = document.getElementById('custFormName').value.trim();
        const email = document.getElementById('custFormEmail').value.trim();
        const phone = document.getElementById('custFormPhone').value.trim();
        const city = document.getElementById('custFormCity').value.trim();
        const status = document.getElementById('custFormStatus').value;

        if (id) {
            // Update
            Store.updateCustomer(id, { name, email, phone, city, status });
            showNotification(`Updated customer ${name}`);
        } else {
            // Create new
            Store.recordCustomerLogin({ name, email, phone, city, status });
            showNotification(`Added new customer ${name}`);
        }

        customerEditModal.style.display = 'none';
        renderAll();
    });

    // -------------------------------------------------------------
    // ADD / EDIT PRODUCT MODAL
    // -------------------------------------------------------------
    function openEditProductModal(id) {
        const product = Store.getProductById(id);
        if (!product) return;

        document.getElementById('prodFormId').value = product.id;
        document.getElementById('prodFormName').value = product.name;
        document.getElementById('prodFormSku').value = product.sku;
        document.getElementById('prodFormCategory').value = product.category || '';
        document.getElementById('prodFormPrice').value = product.price;
        document.getElementById('prodFormStock').value = product.stock;
        document.getElementById('prodFormMinStock').value = product.minStock || 10;
        document.getElementById('prodFormNotes').value = product.notes || '';

        productModalTitle.textContent = `Edit Fragrance: ${product.name}`;
        productEditModal.style.display = 'flex';
    }

    if (btnOpenAddProduct) {
        btnOpenAddProduct.addEventListener('click', () => {
            productForm.reset();
            document.getElementById('prodFormId').value = '';
            productModalTitle.textContent = 'Add New Fragrance Product';
            productEditModal.style.display = 'flex';
        });
    }

    if (closeProductEditModal) {
        closeProductEditModal.addEventListener('click', () => productEditModal.style.display = 'none');
    }
    if (btnCancelProductForm) {
        btnCancelProductForm.addEventListener('click', () => productEditModal.style.display = 'none');
    }

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prodFormId').value;
        const name = document.getElementById('prodFormName').value.trim();
        const sku = document.getElementById('prodFormSku').value.trim();
        const category = document.getElementById('prodFormCategory').value.trim();
        const price = Number(document.getElementById('prodFormPrice').value);
        const stock = Number(document.getElementById('prodFormStock').value);
        const minStock = Number(document.getElementById('prodFormMinStock').value);
        const notes = document.getElementById('prodFormNotes').value.trim();

        if (id) {
            // Update
            const products = Store.getProducts();
            const prod = products.find(p => p.id === Number(id));
            if (prod) {
                prod.name = name;
                prod.sku = sku;
                prod.category = category;
                prod.price = price;
                prod.stock = stock;
                prod.minStock = minStock;
                prod.notes = notes;
                Store.saveProducts(products);
                showNotification(`Updated fragrance ${name}`);
            }
        } else {
            // Add new
            Store.addProduct({ name, sku, category, price, stock, minStock, notes });
            showNotification(`Added new fragrance ${name}`);
        }

        productEditModal.style.display = 'none';
        renderAll();
    });

    // -------------------------------------------------------------
    // SEARCH & FILTER LISTENERS
    // -------------------------------------------------------------
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', renderCustomers);
    }
    if (customerFilterStatus) {
        customerFilterStatus.addEventListener('change', renderCustomers);
    }
    if (customerRefreshBtn) {
        customerRefreshBtn.addEventListener('click', () => {
            renderAll();
            showNotification('Data refreshed');
        });
    }

    // -------------------------------------------------------------
    // RESET DEMO DATA
    // -------------------------------------------------------------
    if (btnResetData) {
        btnResetData.addEventListener('click', () => {
            if (confirm('Reset all demo stocks, sample customers, and login history?')) {
                Store.resetToDefaults();
                renderAll();
                showNotification('Reset database to defaults');
            }
        });
    }

    // -------------------------------------------------------------
    // REALTIME STORAGE SYNC
    // -------------------------------------------------------------
    window.addEventListener('storage', () => {
        renderAll();
    });
    window.addEventListener('lafin_store_update', () => {
        renderAll();
    });
    window.addEventListener('greed_store_update', () => {
        renderAll();
    });

    // -------------------------------------------------------------
    // RENDER ORDERS & COURIER FULFILLMENT
    // -------------------------------------------------------------
    function renderOrders() {
        if (!ordersTableBody) return;
        const orders = Store.getOrders ? Store.getOrders() : [];
        const searchQuery = (orderSearchInput ? orderSearchInput.value : '').toLowerCase().trim();
        const filterStatus = orderFilterStatus ? orderFilterStatus.value : 'all';

        const filtered = orders.filter(order => {
            const matchesSearch =
                (order.id && order.id.toLowerCase().includes(searchQuery)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchQuery)) ||
                (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery)) ||
                (order.city && order.city.toLowerCase().includes(searchQuery)) ||
                (order.courier && order.courier.awb && order.courier.awb.toLowerCase().includes(searchQuery));

            if (!matchesSearch) return false;
            if (filterStatus !== 'all' && order.orderStatus !== filterStatus) return false;
            return true;
        });

        ordersTableBody.innerHTML = '';
        if (filtered.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--muted);">
                        No client orders found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(order => {
            const tr = document.createElement('tr');

            const statusClassMap = {
                'Confirmed': 'badge-status-confirmed',
                'Processing': 'badge-status-processing',
                'Packaged': 'badge-status-processing',
                'Dispatched': 'badge-status-intransit',
                'In Transit': 'badge-status-intransit',
                'Out for Delivery': 'badge-status-outfordelivery',
                'Delivered': 'badge-status-delivered',
                'Cancelled': 'badge-status-cancelled'
            };
            const statusClass = statusClassMap[order.orderStatus] || 'badge-status-confirmed';

            const itemsSummary = (order.items || []).map(i => `${escapeHtml(i.name)} (×${i.qty || 1})`).join(', ');

            tr.innerHTML = `
                <td>
                    <strong style="color: var(--gold); font-family: monospace; letter-spacing: 0.5px;">${escapeHtml(order.id)}</strong>
                </td>
                <td><small style="color: var(--muted);">${escapeHtml(order.createdAt || '-')}</small></td>
                <td>
                    <strong>${escapeHtml(order.customerName || 'Guest')}</strong><br>
                    <small style="color: var(--muted);">${escapeHtml(order.customerEmail || '-')}</small>
                </td>
                <td><span style="font-size: 12px; color: var(--cream);" title="${escapeHtml(itemsSummary)}">${escapeHtml(itemsSummary)}</span></td>
                <td><strong style="color: var(--cream);">₹${(order.total || 0).toLocaleString('en-IN')}</strong></td>
                <td>
                    <span class="badge ${order.paymentStatus === 'Paid Successfully' ? 'badge-success' : 'badge-warning'}" style="font-size: 11px;">
                        ${escapeHtml(order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD')}
                    </span>
                </td>
                <td>
                    <span class="badge-status ${statusClass}">
                        ● ${escapeHtml(order.orderStatus || 'Confirmed')}
                    </span>
                </td>
                <td>
                    <small style="color: var(--gold); font-weight: 600;">${escapeHtml(order.courier ? order.courier.name : 'BlueDart Express')}</small><br>
                    <small style="color: var(--muted); font-family: monospace;">${escapeHtml(order.courier ? order.courier.awb : '-')}</small>
                </td>
                <td class="text-right">
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn btn-sm btn-outline btn-edit-order-status" data-id="${escapeHtml(order.id)}">
                            ✏️ Update Tracking
                        </button>
                        <a href="history.html?orderId=${encodeURIComponent(order.id)}" target="_blank" class="btn btn-sm btn-gold" title="Track Live">
                            🚚 Track Live ↗
                        </a>
                    </div>
                </td>
            `;

            ordersTableBody.appendChild(tr);
        });

        // Attach listeners
        ordersTableBody.querySelectorAll('.btn-edit-order-status').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.id;
                openOrderEditModal(orderId);
            });
        });
    }

    // Modal to update order status
    function openOrderEditModal(orderId) {
        const order = Store.getOrderById ? Store.getOrderById(orderId) : null;
        if (!order || !orderEditModal) return;

        if (orderModalBadge) orderModalBadge.textContent = order.id;

        const itemsHtml = (order.items || []).map(i => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;">
                <span>${escapeHtml(i.name)} × ${i.qty || 1}</span>
                <strong>₹${((i.price || 0) * (i.qty || 1)).toLocaleString('en-IN')}</strong>
            </div>
        `).join('');

        orderModalBody.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h4 style="font-size: 13px; color: var(--gold); margin-bottom: 8px; text-transform: uppercase;">Customer & Delivery</h4>
                    <p style="font-size: 13px; color: var(--cream);"><strong>${escapeHtml(order.customerName)}</strong> (${escapeHtml(order.customerPhone || 'N/A')})</p>
                    <p style="font-size: 12px; color: var(--muted);">${escapeHtml(order.customerEmail)}</p>
                    <p style="font-size: 12px; color: var(--cream); margin-top: 6px;">${escapeHtml(order.shippingAddress || '')}, ${escapeHtml(order.city || '')} - ${escapeHtml(order.pincode || '')}</p>
                </div>
                <div style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <h4 style="font-size: 13px; color: var(--gold); margin-bottom: 8px; text-transform: uppercase;">Payment & Logistics</h4>
                    <p style="font-size: 13px; color: var(--cream);">Amount: <strong>₹${(order.total || 0).toLocaleString('en-IN')}</strong> (${escapeHtml(order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD')})</p>
                    <p style="font-size: 12px; color: var(--muted);">Courier: ${escapeHtml(order.courier ? order.courier.name : 'BlueDart Express')}</p>
                    <p style="font-size: 12px; color: var(--gold); font-family: monospace;">AWB: ${escapeHtml(order.courier ? order.courier.awb : '-')}</p>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="font-size: 13px; color: var(--gold); margin-bottom: 8px; text-transform: uppercase;">Ordered Fragrances</h4>
                ${itemsHtml}
            </div>

            <form id="orderStatusForm" style="background: rgba(198,165,107,0.06); padding: 16px; border-radius: 8px; border: 1px solid var(--border-gold);">
                <h4 style="font-size: 13px; color: var(--cream); margin-bottom: 12px;">Update Fulfillment & Tracking Stage</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="orderNewStatus">Select New Status *</label>
                        <select id="orderNewStatus" required style="width: 100%; padding: 10px; background: #0f0f0e; border: 1px solid var(--border-color); color: var(--cream); border-radius: 6px;">
                            <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed (Order logged)</option>
                            <option value="Processing" ${order.orderStatus === 'Processing' ? 'selected' : ''}>Processing & Blending (Atelier)</option>
                            <option value="Packaged" ${order.orderStatus === 'Packaged' ? 'selected' : ''}>Packaged & Wax Sealed</option>
                            <option value="In Transit" ${order.orderStatus === 'In Transit' ? 'selected' : ''}>In Transit (Air Express Cargo)</option>
                            <option value="Out for Delivery" ${order.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery (Courier Agent)</option>
                            <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered (Customer Handover)</option>
                            <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="orderCurrentLocation">Current Location Hub</label>
                        <input type="text" id="orderCurrentLocation" value="${escapeHtml(order.courier ? (order.courier.currentCity || '') : '')}" placeholder="e.g. Mumbai Regional Cargo Hub" style="width: 100%; padding: 10px; background: #0f0f0e; border: 1px solid var(--border-color); color: var(--cream); border-radius: 6px;">
                    </div>
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <label for="orderStatusNote">Checkpoint Description / Tracking Note</label>
                    <input type="text" id="orderStatusNote" placeholder="e.g. Package arrived at local sorting hub; assigned for doorstep run" style="width: 100%; padding: 10px; background: #0f0f0e; border: 1px solid var(--border-color); color: var(--cream); border-radius: 6px;">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px;">
                    <button type="button" class="btn btn-outline" id="btnCloseOrderModalInner">Cancel</button>
                    <button type="submit" class="btn btn-gold">Save &amp; Broadcast Status</button>
                </div>
            </form>
        `;

        orderEditModal.style.display = 'flex';

        const closeBtnInner = document.getElementById('btnCloseOrderModalInner');
        if (closeBtnInner) {
            closeBtnInner.addEventListener('click', () => orderEditModal.style.display = 'none');
        }

        const form = document.getElementById('orderStatusForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const newStatus = document.getElementById('orderNewStatus').value;
                const loc = document.getElementById('orderCurrentLocation').value.trim();
                const note = document.getElementById('orderStatusNote').value.trim();

                Store.updateOrderStatus(order.id, newStatus, note, loc);
                showNotification(`Order ${order.id} status updated to ${newStatus}`);
                orderEditModal.style.display = 'none';
                renderAll();
            });
        }
    }

    if (closeOrderEditModal) {
        closeOrderEditModal.addEventListener('click', () => orderEditModal.style.display = 'none');
    }

    // Export Orders to Excel (SheetJS)
    if (btnExportOrders) {
        btnExportOrders.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                showNotification('Excel export module loading... please try again.', 'danger');
                return;
            }

            const orders = Store.getOrders ? Store.getOrders() : [];
            if (orders.length === 0) {
                showNotification('No orders available to export.', 'danger');
                return;
            }

            const rows = [
                ['Order ID', 'Date Placed', 'Customer ID', 'Customer Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Pincode', 'Items Ordered', 'Subtotal (INR)', 'Delivery Fee (INR)', 'Grand Total (INR)', 'Payment Method', 'Payment Status', 'Tracking Status', 'Courier Partner', 'Air Waybill (AWB)']
            ];

            orders.forEach(o => {
                const itemsStr = (o.items || []).map(i => `${i.name} (x${i.qty || 1}) - Rs.${i.price}`).join('; ');
                rows.push([
                    o.id,
                    o.createdAt || '',
                    o.customerId || '',
                    o.customerName || '',
                    o.customerEmail || '',
                    o.customerPhone || '',
                    o.shippingAddress || '',
                    o.city || '',
                    o.state || '',
                    o.pincode || '',
                    itemsStr,
                    o.subtotal || 0,
                    o.deliveryFee || 50,
                    o.total || 0,
                    o.paymentMethod || 'cod',
                    o.paymentStatus || '',
                    o.orderStatus || 'Confirmed',
                    o.courier ? o.courier.name : 'BlueDart Express',
                    o.courier ? o.courier.awb : ''
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'Client Orders');
            XLSX.writeFile(wb, `LA_FIN_Orders_Export_${Date.now()}.xlsx`);
            showNotification('Client orders exported to Excel (.xlsx)');
        });
    }

    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', renderOrders);
    }
    if (orderFilterStatus) {
        orderFilterStatus.addEventListener('change', renderOrders);
    }
    if (orderRefreshBtn) {
        orderRefreshBtn.addEventListener('click', () => {
            renderOrders();
            renderKPIs();
            showNotification('Order records refreshed');
        });
    }

    // -------------------------------------------------------------
    // HELPERS & INITIAL RENDER
    // -------------------------------------------------------------
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderAll() {
        renderKPIs();
        renderCustomers();
        renderStocks();
        renderOrders();
        renderAuditLogs();
    }

    // Check authentication and initialize
    checkAuthAndGate();
});
