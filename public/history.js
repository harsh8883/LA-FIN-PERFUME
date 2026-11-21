/**
 * LA FIN Luxury Fragrances - Order History & Live Tracking Controller
 * Real-time tracking stepper, courier checkpoints, invoice generation, reordering, and store sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Nav & Menu Elements
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const cartCount = document.getElementById('cartCount');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnLabel = document.getElementById('loginBtnLabel');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownUserId = document.getElementById('dropdownUserId');
    const dropdownOrderCount = document.getElementById('dropdownOrderCount');
    const logoutBtn = document.getElementById('logoutBtn');
    const guestSyncBanner = document.getElementById('guestSyncBanner');
    const btnBannerSignIn = document.getElementById('btnBannerSignIn');

    // Stats Elements
    const statOrdersCount = document.getElementById('statOrdersCount');
    const statInTransitCount = document.getElementById('statInTransitCount');
    const statDeliveredCount = document.getElementById('statDeliveredCount');
    const ordersHeadingCount = document.getElementById('ordersHeadingCount');
    const ordersSectionHeading = document.getElementById('ordersSectionHeading');

    // Search & Filter Elements
    const orderSearchInput = document.getElementById('orderSearchInput');
    const btnSearchTrack = document.getElementById('btnSearchTrack');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Live Tracking Showcase Elements
    const trackingShowcaseSection = document.getElementById('trackingShowcaseSection');
    const liveTrackingId = document.getElementById('liveTrackingId');
    const btnCopyOrderId = document.getElementById('btnCopyOrderId');
    const liveTrackingStatusBadge = document.getElementById('liveTrackingStatusBadge');
    const liveTrackingStatusText = document.getElementById('liveTrackingStatusText');
    const liveEstDelivery = document.getElementById('liveEstDelivery');
    const liveCourierName = document.getElementById('liveCourierName');
    const liveCourierAwb = document.getElementById('liveCourierAwb');
    const liveRecipientName = document.getElementById('liveRecipientName');
    const liveRecipientCity = document.getElementById('liveRecipientCity');
    const liveOrderTotal = document.getElementById('liveOrderTotal');
    const livePaymentMethod = document.getElementById('livePaymentMethod');
    const stepperLineFill = document.getElementById('stepperLineFill');
    const checkpointTimelineList = document.getElementById('checkpointTimelineList');
    const simButtons = document.querySelectorAll('.sim-btn');

    // Order History Grid Elements
    const ordersGrid = document.getElementById('ordersGrid');
    const emptyOrdersBox = document.getElementById('emptyOrdersBox');

    // Invoice Modal Elements
    const invoiceModal = document.getElementById('invoiceModal');
    const btnCloseInvoice = document.getElementById('btnCloseInvoice');
    const btnPrintInvoice = document.getElementById('btnPrintInvoice');
    const invNumber = document.getElementById('invNumber');
    const invDate = document.getElementById('invDate');
    const invCustomerName = document.getElementById('invCustomerName');
    const invCustomerAddress = document.getElementById('invCustomerAddress');
    const invCustomerContact = document.getElementById('invCustomerContact');
    const invCustomerEmail = document.getElementById('invCustomerEmail');
    const invCarrier = document.getElementById('invCarrier');
    const invAwb = document.getElementById('invAwb');
    const invPaymentMode = document.getElementById('invPaymentMode');
    const invItemsBody = document.getElementById('invItemsBody');
    const invSubtotal = document.getElementById('invSubtotal');
    const invGrandTotal = document.getElementById('invGrandTotal');

    // Auth Modal
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const customerLoginForm = document.getElementById('customerLoginForm');
    const modalCustomerEmail = document.getElementById('modalCustomerEmail');
    const modalCustomerPassword = document.getElementById('modalCustomerPassword');

    // Toast
    const historyToast = document.getElementById('historyToast');

    // Internal State
    let activeTrackedOrder = null;
    let currentFilter = 'all';

    // -------------------------------------------------------------
    // TOAST HELPER
    // -------------------------------------------------------------
    function showToast(message) {
        if (!historyToast) return;
        historyToast.textContent = message;
        historyToast.style.display = 'block';
        setTimeout(() => {
            historyToast.style.display = 'none';
        }, 3200);
    }

    // -------------------------------------------------------------
    // MOBILE NAVIGATION
    // -------------------------------------------------------------
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            menuToggle.textContent = isOpen ? '✕' : '☰';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = '☰';
            });
        });
    }

    // -------------------------------------------------------------
    // AUTH & USER STATE
    // -------------------------------------------------------------
    function updateAuthState() {
        if (typeof Store === 'undefined') return;

        const currentUser = Store.getCurrentUser();
        const summary = Store.getCartSummary();
        if (cartCount) cartCount.textContent = summary.itemCount || 0;

        if (currentUser) {
            if (loginBtn) {
                loginBtn.classList.add('logged-in');
                const firstName = (currentUser.name || 'Account').split(' ')[0];
                if (loginBtnLabel) loginBtnLabel.textContent = firstName;
            }

            const initials = (currentUser.name || 'CU')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            if (dropdownAvatar) dropdownAvatar.textContent = initials;
            if (dropdownUserName) dropdownUserName.textContent = currentUser.name;
            if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.email;
            if (dropdownUserId) dropdownUserId.textContent = currentUser.id || 'CUST';
            if (dropdownOrderCount) dropdownOrderCount.textContent = currentUser.totalOrders || 0;
            if (guestSyncBanner) guestSyncBanner.style.display = 'none';
        } else {
            if (loginBtn) {
                loginBtn.classList.remove('logged-in');
                if (loginBtnLabel) loginBtnLabel.textContent = 'Sign In';
            }
            if (userDropdown) userDropdown.style.display = 'none';
            if (guestSyncBanner) guestSyncBanner.style.display = 'flex';
        }
    }

    // Login button handler
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentUser = Store.getCurrentUser();
            if (currentUser) {
                const isShown = userDropdown.style.display === 'block';
                userDropdown.style.display = isShown ? 'none' : 'block';
            } else {
                openAuthModal();
            }
        });
    }

    if (btnBannerSignIn) {
        btnBannerSignIn.addEventListener('click', openAuthModal);
    }

    function openAuthModal() {
        if (authModal) authModal.style.display = 'flex';
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => {
            if (authModal) authModal.style.display = 'none';
        });
    }

    // Customer Auth Tabs
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const customerRegisterForm = document.getElementById('customerRegisterForm');

    function switchHistoryAuthTab(tab) {
        if (!customerLoginForm || !customerRegisterForm) return;
        if (tab === 'login') {
            customerLoginForm.style.display = 'flex';
            customerRegisterForm.style.display = 'none';
            if (tabLoginBtn) {
                tabLoginBtn.style.color = 'var(--gold)';
                tabLoginBtn.style.borderBottom = '2px solid var(--gold)';
            }
            if (tabRegisterBtn) {
                tabRegisterBtn.style.color = 'var(--muted)';
                tabRegisterBtn.style.borderBottom = 'none';
            }
        } else {
            customerLoginForm.style.display = 'none';
            customerRegisterForm.style.display = 'flex';
            if (tabRegisterBtn) {
                tabRegisterBtn.style.color = 'var(--gold)';
                tabRegisterBtn.style.borderBottom = '2px solid var(--gold)';
            }
            if (tabLoginBtn) {
                tabLoginBtn.style.color = 'var(--muted)';
                tabLoginBtn.style.borderBottom = 'none';
            }
        }
    }

    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchHistoryAuthTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchHistoryAuthTab('register'));

    // Customer Login Submit
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = modalCustomerEmail.value.trim();
            const pwd = modalCustomerPassword.value.trim();

            const res = Auth.loginCustomer(email, pwd);
            if (res.success) {
                if (authModal) authModal.style.display = 'none';
                updateAuthState();
                loadOrdersData();
                showToast(`✨ Welcome back, ${res.user.name}! Orders synced.`);
            } else {
                showToast(`❌ ${res.message || 'Unable to sign in.'}`);
            }
        });
    }

    // Customer Register Submit
    if (customerRegisterForm) {
        customerRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('regName').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                phone: document.getElementById('regPhone').value.trim(),
                city: document.getElementById('regCity').value.trim(),
                password: document.getElementById('regPassword').value
            };

            const res = Auth.registerCustomer(data);
            if (res.success) {
                if (authModal) authModal.style.display = 'none';
                updateAuthState();
                loadOrdersData();
                showToast(`✨ Welcome to LA FIN, ${data.name.split(' ')[0]}!`);
            } else {
                showToast(`❌ ${res.message || 'Unable to register.'}`);
            }
        });
    }

    // Sign out handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
            updateAuthState();
            loadOrdersData();
            showToast('You have signed out.');
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.style.display = 'none';
        }
        if (authModal && e.target === authModal) {
            authModal.style.display = 'none';
        }
        if (invoiceModal && e.target === invoiceModal) {
            invoiceModal.style.display = 'none';
        }
    });

    // -------------------------------------------------------------
    // ORDERS RETRIEVAL & FILTERING
    // -------------------------------------------------------------
    function getApplicableOrders() {
        if (typeof Store === 'undefined') return [];

        const allOrders = Store.getOrders();
        const currentUser = Store.getCurrentUser();

        // 1. If customer is signed in, return ONLY their placed orders
        if (currentUser) {
            return allOrders.filter(o =>
                (o.customerId && o.customerId === currentUser.id) ||
                (o.customerEmail && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase())
            );
        }

        // 2. If guest user placed an order in this browser session
        let lastOrderId = null;
        try {
            lastOrderId = sessionStorage.getItem('lafin_last_order_id');
        } catch(e) {}

        if (lastOrderId) {
            const guestOrder = allOrders.find(o => o.id === lastOrderId);
            if (guestOrder) return [guestOrder];
        }

        // 3. If an explicit order is requested via URL ?orderId=...
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const reqId = urlParams.get('orderId');
            if (reqId) {
                const found = allOrders.find(o => o.id && o.id.toUpperCase() === reqId.toUpperCase());
                if (found) return [found];
            }
        } catch(e) {}

        // Otherwise, no orders for this user/guest session
        return [];
    }

    function loadOrdersData() {
        const orders = getApplicableOrders();
        const hasOrders = orders.length > 0;

        // Update KPIs
        if (statOrdersCount) statOrdersCount.textContent = orders.length;
        const inTransit = orders.filter(o => o.orderStatus === 'In Transit' || o.orderStatus === 'Out for Delivery' || o.orderStatus === 'Processing' || o.orderStatus === 'Confirmed').length;
        if (statInTransitCount) statInTransitCount.textContent = inTransit;
        const delivered = orders.filter(o => o.orderStatus === 'Delivered').length;
        if (statDeliveredCount) statDeliveredCount.textContent = delivered;

        // Check URL parameter for specific order
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const requestedId = urlParams.get('orderId');
            if (requestedId) {
                const found = Store.getOrderById(requestedId);
                if (found) {
                    activeTrackedOrder = found;
                }
            }
        } catch(e) {}

        // If user ordered something:
        if (hasOrders) {
            if (!activeTrackedOrder || !orders.some(o => o.id === activeTrackedOrder.id)) {
                activeTrackedOrder = orders[0];
            }
            // SHOW TRACKING SHOWCASE & SECTION HEADING
            if (trackingShowcaseSection) {
                trackingShowcaseSection.style.display = 'block';
                renderTrackingShowcase(activeTrackedOrder);
            }
            if (ordersSectionHeading) ordersSectionHeading.style.display = 'flex';
            if (emptyOrdersBox) emptyOrdersBox.style.display = 'none';
        } else if (activeTrackedOrder) {
            // User searched a specific valid order ID
            if (trackingShowcaseSection) {
                trackingShowcaseSection.style.display = 'block';
                renderTrackingShowcase(activeTrackedOrder);
            }
            if (ordersSectionHeading) ordersSectionHeading.style.display = 'flex';
            if (emptyOrdersBox) emptyOrdersBox.style.display = 'none';
        } else {
            // USER HAS NOT ORDERED ANYTHING:
            // HIDE TRACKING CARD AND SHOW ONLY EMPTY STATE
            activeTrackedOrder = null;
            if (trackingShowcaseSection) {
                trackingShowcaseSection.style.display = 'none';
            }
            if (ordersSectionHeading) ordersSectionHeading.style.display = 'none';
            if (ordersGrid) ordersGrid.innerHTML = '';
            if (emptyOrdersBox) emptyOrdersBox.style.display = 'block';
        }

        renderOrdersGrid(orders);
    }

    // -------------------------------------------------------------
    // RENDER LIVE TRACKING SHOWCASE & STEPPER
    // -------------------------------------------------------------
    function renderTrackingShowcase(order) {
        if (!order || !trackingShowcaseSection) return;

        // Header info
        if (liveTrackingId) liveTrackingId.textContent = order.id;

        // Status badge styling
        const statusMap = {
            'Confirmed': { text: 'Order Confirmed', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)', stage: 1 },
            'Processing': { text: 'Atelier Blending &amp; Macerating', color: '#dfc28d', bg: 'rgba(198, 165, 107, 0.15)', border: 'rgba(198, 165, 107, 0.3)', stage: 2 },
            'Packaged': { text: 'Packaged &amp; Wax Sealed', color: '#dfc28d', bg: 'rgba(198, 165, 107, 0.15)', border: 'rgba(198, 165, 107, 0.3)', stage: 3 },
            'In Transit': { text: 'In Transit (Air Express Cargo)', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)', stage: 4 },
            'Out for Delivery': { text: 'Out for Doorstep Delivery', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)', stage: 5 },
            'Delivered': { text: 'Delivered (Signature Verified)', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)', stage: 6 },
            'Cancelled': { text: 'Order Cancelled', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)', stage: 0 }
        };

        const currentConf = statusMap[order.orderStatus] || statusMap['Confirmed'];

        if (liveTrackingStatusBadge) {
            liveTrackingStatusBadge.style.background = currentConf.bg;
            liveTrackingStatusBadge.style.color = currentConf.color;
            liveTrackingStatusBadge.style.border = `1px solid ${currentConf.border}`;
        }
        if (liveTrackingStatusText) {
            liveTrackingStatusText.innerHTML = currentConf.text;
        }

        // Meta details
        if (liveEstDelivery) liveEstDelivery.textContent = order.estimatedDelivery || 'Within 3 Business Days';
        if (liveCourierName) liveCourierName.textContent = order.courier ? order.courier.name : 'BlueDart Luxury Air Express';
        if (liveCourierAwb) liveCourierAwb.textContent = `AWB: ${order.courier ? order.courier.awb : 'BD-PENDING'}`;
        if (liveRecipientName) liveRecipientName.textContent = order.customerName || 'Valued Client';
        if (liveRecipientCity) liveRecipientCity.textContent = `${order.city || 'Destination City'}, ${order.state || 'India'}`;
        if (liveOrderTotal) liveOrderTotal.textContent = `₹${(order.total || 0).toLocaleString('en-IN')}`;
        if (livePaymentMethod) livePaymentMethod.textContent = `${order.paymentStatus} (${(order.paymentMethod || 'cod').toUpperCase()})`;

        // Visual Stepper Progression
        const stageNum = order.courier && order.courier.stage !== undefined ? order.courier.stage : currentConf.stage;

        const stagePercentages = { 0: 0, 1: 0, 2: 20, 3: 40, 4: 60, 5: 80, 6: 100 };
        const fillWidth = stagePercentages[stageNum] !== undefined ? stagePercentages[stageNum] : 0;
        if (stepperLineFill) stepperLineFill.style.width = `${fillWidth}%`;

        for (let i = 1; i <= 6; i++) {
            const node = document.getElementById(`stepNode${i}`);
            if (!node) continue;

            node.classList.remove('completed', 'active');
            if (stageNum === 0) {
                // Cancelled
                node.style.opacity = '0.4';
            } else if (i < stageNum) {
                node.classList.add('completed');
                node.querySelector('.step-circle').textContent = '✓';
            } else if (i === stageNum) {
                node.classList.add('active');
            } else {
                node.style.opacity = '0.6';
            }
        }

        // Checkpoints timeline
        renderCheckpoints(order);
    }

    function renderCheckpoints(order) {
        if (!checkpointTimelineList) return;

        const checkpoints = (order.courier && order.courier.checkpoints) ? order.courier.checkpoints : [
            {
                time: order.createdAt || '2026-11-01 10:00:00',
                stage: 'Confirmed',
                title: 'Order Confirmed & Logged in Atelier Queue',
                location: 'LA FIN Perfumery Atelier, Surat',
                desc: 'Consignment booking verified. Master perfumer assigned for artisan bottling.'
            }
        ];

        checkpointTimelineList.innerHTML = checkpoints.map((cp, idx) => `
            <div class="timeline-item ${idx === 0 ? 'latest' : ''}">
                <span class="timeline-time">${escapeHtml(cp.time)}</span>
                <h4 class="timeline-heading">${escapeHtml(cp.title)}</h4>
                <p class="timeline-desc">${escapeHtml(cp.desc)}</p>
                <span class="timeline-loc">📍 ${escapeHtml(cp.location || 'Air Freight Hub')}</span>
            </div>
        `).join('');
    }

    // Copy Order ID
    if (btnCopyOrderId) {
        btnCopyOrderId.addEventListener('click', () => {
            if (activeTrackedOrder) {
                navigator.clipboard.writeText(activeTrackedOrder.id).then(() => {
                    showToast(`📋 Copied Order ID: ${activeTrackedOrder.id}`);
                }).catch(() => {
                    showToast(`Order ID: ${activeTrackedOrder.id}`);
                });
            }
        });
    }

    // Interactive Stage Simulator Buttons
    simButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!activeTrackedOrder) return;
            const newStage = btn.dataset.stage;
            const updated = Store.updateOrderStatus(activeTrackedOrder.id, newStage, `Interactive simulation updated to ${newStage}`);
            if (updated) {
                activeTrackedOrder = updated;
                renderTrackingShowcase(updated);
                renderOrdersGrid();
                showToast(`⚡ Tracking stage simulated: ${newStage}`);
            }
        });
    });

    // -------------------------------------------------------------
    // RENDER ORDERS DIRECTORY GRID
    // -------------------------------------------------------------
    function renderOrdersGrid(ordersList = null) {
        if (!ordersGrid) return;

        const allOrders = ordersList !== null ? ordersList : getApplicableOrders();
        const searchQuery = (orderSearchInput ? orderSearchInput.value : '').toLowerCase().trim();

        if (allOrders.length === 0) {
            ordersGrid.innerHTML = '';
            if (emptyOrdersBox) emptyOrdersBox.style.display = 'block';
            if (ordersSectionHeading) ordersSectionHeading.style.display = 'none';
            if (ordersHeadingCount) ordersHeadingCount.textContent = '0 Orders';
            return;
        }

        const filtered = allOrders.filter(order => {
            const matchesSearch =
                (order.id && order.id.toLowerCase().includes(searchQuery)) ||
                (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery)) ||
                (order.customerPhone && order.customerPhone.toLowerCase().includes(searchQuery)) ||
                (order.courier && order.courier.awb && order.courier.awb.toLowerCase().includes(searchQuery)) ||
                (order.items && order.items.some(i => i.name.toLowerCase().includes(searchQuery)));

            if (!matchesSearch) return false;

            if (currentFilter === 'active') {
                return order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled';
            }
            if (currentFilter !== 'all') {
                return order.orderStatus === currentFilter;
            }
            return true;
        });

        if (ordersHeadingCount) {
            ordersHeadingCount.textContent = `Showing ${filtered.length} Order${filtered.length === 1 ? '' : 's'}`;
        }

        if (filtered.length === 0) {
            ordersGrid.innerHTML = '';
            if (emptyOrdersBox) emptyOrdersBox.style.display = 'block';
            return;
        }

        if (emptyOrdersBox) emptyOrdersBox.style.display = 'none';
        if (ordersSectionHeading) ordersSectionHeading.style.display = 'flex';

        ordersGrid.innerHTML = filtered.map(order => {
            const statusClassMap = {
                'Confirmed': 'badge-status-confirmed',
                'Processing': 'badge-status-processing',
                'Packaged': 'badge-status-processing',
                'In Transit': 'badge-status-intransit',
                'Out for Delivery': 'badge-status-outfordelivery',
                'Delivered': 'badge-status-delivered',
                'Cancelled': 'badge-status-cancelled'
            };
            const statusClass = statusClassMap[order.orderStatus] || 'badge-status-confirmed';

            const itemsHtml = (order.items || []).map(item => `
                <div class="order-item-row">
                    <img src="${escapeHtml(item.image || 'perfume1.png')}" alt="${escapeHtml(item.name)}" class="order-item-thumb" onerror="this.src='perfume1.png'">
                    <div class="order-item-info">
                        <h4 class="order-item-name">${escapeHtml(item.name)}</h4>
                        <p class="order-item-notes">${escapeHtml(item.notes || 'CITRUS · AMBER · MUSK')}</p>
                        <p class="order-item-price-qty">₹${(item.price || 0).toLocaleString('en-IN')} × ${item.qty || 1}</p>
                    </div>
                    <div class="order-item-total">
                        ₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                    </div>
                </div>
            `).join('');

            const canCancel = order.orderStatus === 'Confirmed' || order.orderStatus === 'Processing';

            return `
                <article class="order-card" data-id="${escapeHtml(order.id)}">
                    <header class="order-card-header">
                        <div class="order-header-left">
                            <span class="order-id-label">${escapeHtml(order.id)}</span>
                            <span class="order-date-label">Placed: ${escapeHtml(order.createdAt || '-')}</span>
                        </div>
                        <div class="order-header-right">
                            <span class="badge-status ${statusClass}">
                                ● ${escapeHtml(order.orderStatus || 'Confirmed')}
                            </span>
                        </div>
                    </header>

                    <div class="order-card-body">
                        <!-- Left: Item list -->
                        <div class="order-items-column">
                            ${itemsHtml}
                        </div>

                        <!-- Right: Breakdown & Actions -->
                        <div class="order-details-column">
                            <div>
                                <div class="order-summary-row">
                                    <span>Fragrance Subtotal:</span>
                                    <span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div class="order-summary-row">
                                    <span>Express Courier:</span>
                                    <span style="color: var(--gold); font-weight: 600;">₹${order.deliveryFee || 50}</span>
                                </div>
                                <div class="order-summary-row grand">
                                    <span>Grand Total:</span>
                                    <strong>₹${(order.total || 0).toLocaleString('en-IN')}</strong>
                                </div>
                                <div class="order-shipping-summary">
                                    <span style="display:block; font-size: 11px; text-transform: uppercase; color: var(--muted); margin-bottom: 2px;">Shipping To:</span>
                                    <strong>${escapeHtml(order.customerName)}</strong><br>
                                    ${escapeHtml(order.shippingAddress || '')}, ${escapeHtml(order.city || '')}
                                </div>
                            </div>

                            <div class="order-card-actions">
                                <button type="button" class="btn-card-action primary btn-track-this-order" data-id="${escapeHtml(order.id)}">
                                    🚚 Track Live
                                </button>
                                <button type="button" class="btn-card-action btn-view-invoice" data-id="${escapeHtml(order.id)}">
                                    🧾 Invoice
                                </button>
                                <button type="button" class="btn-card-action btn-reorder-items" data-id="${escapeHtml(order.id)}">
                                    🔄 Buy Again
                                </button>
                                ${canCancel ? `
                                    <button type="button" class="btn-card-action danger btn-cancel-order" data-id="${escapeHtml(order.id)}">
                                        ✕ Cancel
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Wire up buttons on each card
        ordersGrid.querySelectorAll('.btn-track-this-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.id;
                const found = Store.getOrderById(orderId);
                if (found) {
                    activeTrackedOrder = found;
                    renderTrackingShowcase(found);
                    if (trackingShowcaseSection) {
                        trackingShowcaseSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    showToast(`📍 Tracking loaded for ${orderId}`);
                }
            });
        });

        ordersGrid.querySelectorAll('.btn-view-invoice').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.id;
                openInvoiceModal(orderId);
            });
        });

        ordersGrid.querySelectorAll('.btn-reorder-items').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.id;
                reorderItems(orderId);
            });
        });

        ordersGrid.querySelectorAll('.btn-cancel-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.dataset.id;
                if (confirm(`Are you sure you want to cancel order ${orderId}? This will restock the inventory.`)) {
                    const res = Store.cancelOrder(orderId, 'Customer cancellation request');
                    if (res.success) {
                        showToast(`Order ${orderId} has been cancelled.`);
                        loadOrdersData();
                    } else {
                        showToast(`❌ ${res.message}`);
                    }
                }
            });
        });
    }

    // -------------------------------------------------------------
    // REORDER FUNCTIONALITY
    // -------------------------------------------------------------
    function reorderItems(orderId) {
        const order = Store.getOrderById(orderId);
        if (!order) return;

        let addedCount = 0;
        (order.items || []).forEach(item => {
            const res = Store.addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                qty: item.qty || 1
            });
            if (res.success) addedCount++;
        });

        updateAuthState();
        showToast(`✨ Reordered ${addedCount} items into your Bag!`);
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 800);
    }

    // -------------------------------------------------------------
    // TAX INVOICE MODAL
    // -------------------------------------------------------------
    function openInvoiceModal(orderId) {
        const order = Store.getOrderById(orderId);
        if (!order || !invoiceModal) return;

        if (invNumber) invNumber.textContent = `LAF-INV-${order.id.replace('LAF-ORD-', '')}`;
        if (invDate) invDate.textContent = order.createdAt ? order.createdAt.split(' ')[0] : '2026-11-01';
        if (invCustomerName) invCustomerName.textContent = order.customerName;
        if (invCustomerAddress) invCustomerAddress.textContent = `${order.shippingAddress || ''}, ${order.city || ''}, ${order.state || 'Maharashtra'} - ${order.pincode || ''}`;
        if (invCustomerContact) invCustomerContact.textContent = `Phone: ${order.customerPhone || 'N/A'}`;
        if (invCustomerEmail) invCustomerEmail.textContent = `Email: ${order.customerEmail || 'N/A'}`;
        if (invCarrier) invCarrier.textContent = order.courier ? order.courier.name : 'BlueDart Luxury Air Express';
        if (invAwb) invAwb.textContent = order.courier ? order.courier.awb : 'BD-PENDING';
        if (invPaymentMode) invPaymentMode.textContent = `${order.paymentStatus} via ${(order.paymentMethod || 'cod').toUpperCase()}`;

        if (invItemsBody) {
            invItemsBody.innerHTML = (order.items || []).map(item => `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.name)}</strong><br>
                        <small style="color: #666;">50 ML Eau de Parfum · Artisanal Formulation</small>
                    </td>
                    <td>3303.00.10</td>
                    <td>${item.qty || 1}</td>
                    <td>₹${(item.price || 0).toLocaleString('en-IN')}</td>
                    <td style="text-align: right; font-weight: 600;">₹${((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</td>
                </tr>
            `).join('');
        }

        if (invSubtotal) invSubtotal.textContent = `₹${(order.subtotal || 0).toLocaleString('en-IN')}`;
        if (invGrandTotal) invGrandTotal.textContent = `₹${(order.total || 0).toLocaleString('en-IN')}`;

        invoiceModal.style.display = 'flex';
    }

    if (btnCloseInvoice) {
        btnCloseInvoice.addEventListener('click', () => {
            if (invoiceModal) invoiceModal.style.display = 'none';
        });
    }

    if (btnPrintInvoice) {
        btnPrintInvoice.addEventListener('click', () => {
            window.print();
        });
    }

    // -------------------------------------------------------------
    // SEARCH & FILTER EVENTS
    // -------------------------------------------------------------
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', () => {
            renderOrdersGrid();
        });
    }

    if (btnSearchTrack) {
        btnSearchTrack.addEventListener('click', () => {
            const query = (orderSearchInput.value || '').trim();
            if (!query) return;

            const found = Store.getOrderById(query);
            if (found) {
                activeTrackedOrder = found;
                if (trackingShowcaseSection) {
                    trackingShowcaseSection.style.display = 'block';
                    renderTrackingShowcase(found);
                    trackingShowcaseSection.scrollIntoView({ behavior: 'smooth' });
                }
                if (ordersSectionHeading) ordersSectionHeading.style.display = 'flex';
                if (emptyOrdersBox) emptyOrdersBox.style.display = 'none';
                renderOrdersGrid([found]);
                showToast(`📍 Found and tracking order ${found.id}`);
            } else {
                renderOrdersGrid();
                const matched = getApplicableOrders().some(o => (o.id && o.id.toLowerCase().includes(query.toLowerCase())));
                if (!matched) {
                    showToast(`❌ No order found matching "${query}".`);
                }
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderOrdersGrid();
        });
    });

    // -------------------------------------------------------------
    // HELPERS & STORAGE LISTENERS
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

    function refreshAll() {
        updateAuthState();
        loadOrdersData();
    }

    window.addEventListener('storage', refreshAll);
    window.addEventListener('lafin_store_update', refreshAll);
    window.addEventListener('lafin_auth_change', refreshAll);
    window.addEventListener('lafin_order_created', refreshAll);

    // Initial load
    refreshAll();
});

