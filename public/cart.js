/**
 * LA FIN Luxury Fragrances - Dedicated Cart & Checkout Script
 * Handles authentication enforcement, live cart calculations with fixed ₹50 delivery charge,
 * shipping address management, multi-option payment workflows (COD, UPI, Card, NetBanking),
 * and order confirmation receipt generation.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // DOM ELEMENTS
    // ============================================================
    // Main Section States
    const authRequiredBox   = document.getElementById('authRequiredBox');
    const emptyCartBox      = document.getElementById('emptyCartBox');
    const cartContentGrid   = document.getElementById('cartContentGrid');
    const btnOpenLoginReq   = document.getElementById('btnOpenLoginReq');

    // Cart Items Container & Counters
    const cartItemsList     = document.getElementById('cartItemsList');
    const panelCartCount    = document.getElementById('panelCartCount');
    const btnClearBag       = document.getElementById('btnClearBag');
    const cartCountNav      = document.getElementById('cartCount');

    // Order Summary Elements
    const summaryItemCount  = document.getElementById('summaryItemCount');
    const summarySubtotal   = document.getElementById('summarySubtotal');
    const summaryDeliveryFee= document.getElementById('summaryDeliveryFee');
    const summaryGrandTotal = document.getElementById('summaryGrandTotal');
    const btnPayAmount      = document.getElementById('btnPayAmount');
    const codAmountPill     = document.getElementById('codAmountPill');
    const qrAmountDisplay   = document.getElementById('qrAmountDisplay');

    // Shipping Form
    const shippingForm      = document.getElementById('shippingForm');
    const shipName          = document.getElementById('shipName');
    const shipPhone         = document.getElementById('shipPhone');
    const shipAddress       = document.getElementById('shipAddress');
    const shipCity          = document.getElementById('shipCity');
    const shipState         = document.getElementById('shipState');
    const shipPincode       = document.getElementById('shipPincode');
    const shipNotes         = document.getElementById('shipNotes');

    // Payment Elements
    const paymentRadios     = document.querySelectorAll('input[name="paymentOption"]');
    const paymentCards      = document.querySelectorAll('.payment-card');
    const panelCOD          = document.getElementById('panelCOD');
    const panelUPI          = document.getElementById('panelUPI');
    const panelCard         = document.getElementById('panelCard');
    const panelNet          = document.getElementById('panelNet');

    // UPI Subtabs
    const tabUpiId          = document.getElementById('tabUpiId');
    const tabUpiQr          = document.getElementById('tabUpiQr');
    const upiIdView         = document.getElementById('upiIdView');
    const upiQrView         = document.getElementById('upiQrView');
    const upiVpa            = document.getElementById('upiVpa');
    const btnVerifyUpi      = document.getElementById('btnVerifyUpi');
    const upiStatusText     = document.getElementById('upiStatusText');

    // Card & Bank Inputs
    const cardNum           = document.getElementById('cardNum');
    const cardExp           = document.getElementById('cardExp');
    const cardCvv           = document.getElementById('cardCvv');
    const cardName          = document.getElementById('cardName');
    const bankSelect        = document.getElementById('bankSelect');

    // Place Order Button & Modal
    const btnPlaceOrder     = document.getElementById('btnPlaceOrder');
    const orderSuccessModal = document.getElementById('orderSuccessModal');
    const receiptOrderId    = document.getElementById('receiptOrderId');
    const receiptDate       = document.getElementById('receiptDate');
    const receiptPayment    = document.getElementById('receiptPayment');
    const receiptName       = document.getElementById('receiptName');
    const receiptAddress    = document.getElementById('receiptAddress');
    const receiptItemsList  = document.getElementById('receiptItemsList');
    const receiptSubtotal   = document.getElementById('receiptSubtotal');
    const receiptGrandTotal = document.getElementById('receiptGrandTotal');
    const btnPrintReceipt   = document.getElementById('btnPrintReceipt');

    // Auth & Dropdown Elements
    const loginBtn          = document.getElementById('loginBtn');
    const loginBtnLabel     = document.getElementById('loginBtnLabel');
    const userDropdown      = document.getElementById('userDropdown');
    const dropdownAvatar    = document.getElementById('dropdownAvatar');
    const dropdownUserName  = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownUserId    = document.getElementById('dropdownUserId');
    const dropdownOrderCount= document.getElementById('dropdownOrderCount');
    const logoutBtn         = document.getElementById('logoutBtn');

    // Auth Modal Elements
    const authModal         = document.getElementById('authModal');
    const closeAuthModal    = document.getElementById('closeAuthModal');
    const tabLoginBtn       = document.getElementById('tabLoginBtn');
    const tabRegisterBtn    = document.getElementById('tabRegisterBtn');
    const loginForm         = document.getElementById('loginForm');
    const registerForm      = document.getElementById('registerForm');
    const switchToRegister  = document.getElementById('switchToRegister');
    const switchToLogin     = document.getElementById('switchToLogin');
    const btnDemoCustomer   = document.getElementById('btnDemoCustomer');

    // Toast
    const cartToast         = document.getElementById('cartToast');
    const menuToggle        = document.getElementById('menuToggle');
    const navLinks          = document.getElementById('navLinks');

    let isUpiVerified = false;

    // ============================================================
    // TOAST HELPER
    // ============================================================
    let toastTimeout;
    function showToast(msg) {
        if (!cartToast) return;
        clearTimeout(toastTimeout);
        cartToast.textContent = msg;
        cartToast.style.display = 'block';
        toastTimeout = setTimeout(() => {
            cartToast.style.display = 'none';
        }, 3200);
    }

    // ============================================================
    // AUTH MODAL HELPERS
    // ============================================================
    function openAuthModal(tab = 'login') {
        if (!authModal) return;
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        switchAuthTab(tab);
    }

    function closeAuthModalDialog() {
        if (!authModal) return;
        authModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function switchAuthTab(tab) {
        if (tab === 'login') {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }

    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalDialog);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModalDialog();
        });
    }
    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
    if (switchToRegister) switchToRegister.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });

    // Demo customer fill
    if (btnDemoCustomer) {
        btnDemoCustomer.addEventListener('click', () => {
            document.getElementById('loginEmail').value = 'aarav.sharma@example.com';
            document.getElementById('loginPassword').value = 'password123';
        });
    }

    // Login submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (typeof Auth !== 'undefined') {
                const res = Auth.loginCustomer(email, password);
                if (res.success) {
                    closeAuthModalDialog();
                    refreshPage();
                    showToast(`Welcome back, ${res.user.name.split(' ')[0]}! ✨`);
                } else {
                    showToast(`❌ ${res.message}`);
                }
            }
        });
    }

    // Register submit
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('regName').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                phone: document.getElementById('regPhone').value.trim(),
                city: document.getElementById('regCity').value.trim(),
                password: document.getElementById('regPassword').value
            };

            if (typeof Auth !== 'undefined') {
                const res = Auth.registerCustomer(data);
                if (res.success) {
                    closeAuthModalDialog();
                    refreshPage();
                    showToast(`Welcome to LA FIN, ${data.name.split(' ')[0]}! 🎉`);
                } else {
                    showToast(`❌ ${res.message}`);
                }
            }
        });
    }

    // ============================================================
    // USER NAVBAR & DROPDOWN UI
    // ============================================================
    function refreshAuthUI() {
        if (typeof Store === 'undefined') return;
        const user = Store.getCurrentUser();

        if (user) {
            loginBtn.classList.add('logged-in');
            loginBtnLabel.textContent = user.name.split(' ')[0];
            if (dropdownAvatar) {
                dropdownAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            }
            if (dropdownUserName) dropdownUserName.textContent = user.name;
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            if (dropdownUserId) dropdownUserId.textContent = user.id;
            if (dropdownOrderCount) dropdownOrderCount.textContent = user.totalOrders || 0;
        } else {
            loginBtn.classList.remove('logged-in');
            loginBtnLabel.textContent = 'Sign In';
            if (userDropdown) userDropdown.style.display = 'none';
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof Store !== 'undefined' && Store.getCurrentUser()) {
                const isShown = userDropdown.style.display !== 'none';
                userDropdown.style.display = isShown ? 'none' : 'block';
            } else {
                openAuthModal('login');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof Auth !== 'undefined') Auth.logout();
            refreshPage();
            showToast('You have been signed out.');
        });
    }

    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.style.display = 'none';
        }
    });

    if (btnOpenLoginReq) {
        btnOpenLoginReq.addEventListener('click', () => openAuthModal('login'));
    }

    // Mobile menu toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            menuToggle.textContent = isOpen ? '✕' : '☰';
        });
    }

    // ============================================================
    // CART RENDERING & CALCULATIONS (Fixed ₹50 Delivery Fee)
    // ============================================================
    function renderCartView() {
        if (typeof Store === 'undefined') return;

        const user = Store.getCurrentUser();

        // 1. If not logged in -> Show Auth Required
        if (!user) {
            authRequiredBox.style.display = 'flex';
            emptyCartBox.style.display = 'none';
            cartContentGrid.style.display = 'none';
            if (cartCountNav) cartCountNav.textContent = '0';
            return;
        }

        authRequiredBox.style.display = 'none';

        // 2. Fetch User's Cart
        const cart = Store.getCart();
        const summary = Store.getCartSummary();

        // Update nav badge
        if (cartCountNav) cartCountNav.textContent = summary.count;

        // 3. If cart is empty -> Show Empty Cart
        if (cart.length === 0) {
            emptyCartBox.style.display = 'flex';
            cartContentGrid.style.display = 'none';
            return;
        }

        emptyCartBox.style.display = 'none';
        cartContentGrid.style.display = 'grid';

        // 4. Populate Shipping Form Defaults from User Profile
        if (shipName && !shipName.value) shipName.value = user.name || '';
        if (shipPhone && !shipPhone.value) shipPhone.value = user.phone || '';
        if (shipAddress && !shipAddress.value) shipAddress.value = user.city || '';
        if (shipCity && !shipCity.value && user.city) {
            const parts = user.city.split(',');
            shipCity.value = parts[0].trim();
            if (parts[1]) shipState.value = parts[1].trim();
        }

        // 5. Render Cart Items
        if (panelCartCount) panelCartCount.textContent = summary.count;
        if (summaryItemCount) summaryItemCount.textContent = summary.count;

        cartItemsList.innerHTML = cart.map(item => {
            const itemTotal = (item.price * item.qty).toLocaleString('en-IN');
            const unitPrice = item.price.toLocaleString('en-IN');
            const imgSrc = item.image || item.fallbackImage || 'perfume1.png';

            return `
            <div class="cart-item-row" data-id="${item.id}">
                <img src="${imgSrc}" alt="${item.name}" class="cart-item-img"
                     onerror="this.src='https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85'">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-notes">${item.notes || 'LUXURY EAU DE PARFUM · 50 ML'}</p>
                    <p class="cart-item-unit-price">Unit Price: <strong>₹${unitPrice}</strong></p>
                </div>
                <div class="cart-qty-ctrls">
                    <button type="button" class="btn-qty btn-minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                    <span class="qty-val">${item.qty}</span>
                    <button type="button" class="btn-qty btn-plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                </div>
                <div class="cart-item-subtotal-box">
                    <span class="item-subtotal">₹${itemTotal}</span>
                    <button type="button" class="btn-remove-item" data-id="${item.id}" aria-label="Remove item">✕ Remove</button>
                </div>
            </div>`;
        }).join('');

        // Bind item actions
        cartItemsList.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const item = cart.find(i => i.id === id);
                if (!item) return;
                if (item.qty <= 1) {
                    if (confirm(`Remove ${item.name} from your bag?`)) {
                        Store.removeFromCart(id);
                        renderCartView();
                        showToast(`Removed ${item.name} from bag.`);
                    }
                } else {
                    Store.updateCartQty(id, item.qty - 1);
                    renderCartView();
                }
            });
        });

        cartItemsList.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const product = Store.getProductById(id);
                const maxStock = product ? product.stock : 99;
                const item = cart.find(i => i.id === id);

                if (item && item.qty >= maxStock) {
                    showToast(`⚠️ Only ${maxStock} units of ${item.name} available in stock.`);
                    return;
                }

                Store.updateCartQty(id, (item ? item.qty : 1) + 1);
                renderCartView();
            });
        });

        cartItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const item = cart.find(i => i.id === id);
                const name = item ? item.name : 'Item';
                Store.removeFromCart(id);
                renderCartView();
                showToast(`Removed ${name} from bag.`);
            });
        });

        // 6. Update Summary Breakdown (Fixed ₹50 Delivery Fee)
        const subtotalFormatted = `₹${summary.subtotal.toLocaleString('en-IN')}`;
        const grandTotalFormatted = `₹${summary.total.toLocaleString('en-IN')}`;

        if (summarySubtotal) summarySubtotal.textContent = subtotalFormatted;
        if (summaryDeliveryFee) summaryDeliveryFee.textContent = '₹50';
        if (summaryGrandTotal) summaryGrandTotal.textContent = grandTotalFormatted;
        if (btnPayAmount) btnPayAmount.textContent = grandTotalFormatted;
        if (codAmountPill) codAmountPill.textContent = grandTotalFormatted;
        if (qrAmountDisplay) qrAmountDisplay.textContent = grandTotalFormatted;
    }

    // Clear Bag
    if (btnClearBag) {
        btnClearBag.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove all items from your bag?')) {
                Store.clearCart();
                renderCartView();
                showToast('Bag has been cleared.');
            }
        });
    }

    // ============================================================
    // PAYMENT METHOD SWITCHER (COD Only Active)
    // ============================================================
    paymentCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (card.classList.contains('payment-card-disabled')) {
                e.preventDefault();
                showToast('ℹ️ Only Cash on Delivery (COD) is available right now.');
            }
        });
    });

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.disabled) {
                const codRadio = document.getElementById('payCOD');
                if (codRadio) codRadio.checked = true;
                return;
            }
            paymentCards.forEach(card => card.classList.remove('active'));
            const parentCard = e.target.closest('.payment-card');
            if (parentCard) parentCard.classList.add('active');

            // Hide all subpanels
            if (panelCOD) panelCOD.style.display = 'none';
            if (panelUPI) panelUPI.style.display = 'none';
            if (panelCard) panelCard.style.display = 'none';
            if (panelNet) panelNet.style.display = 'none';

            // Show selected panel
            const val = e.target.value;
            if (val === 'cod' && panelCOD) panelCOD.style.display = 'block';
            if (val === 'upi' && panelUPI) panelUPI.style.display = 'block';
            if (val === 'card' && panelCard) panelCard.style.display = 'block';
            if (val === 'netbanking' && panelNet) panelNet.style.display = 'block';
        });
    });

    // UPI Subtabs Switcher
    if (tabUpiId && tabUpiQr) {
        tabUpiId.addEventListener('click', () => {
            tabUpiId.classList.add('active');
            tabUpiQr.classList.remove('active');
            upiIdView.style.display = 'block';
            upiQrView.style.display = 'none';
        });

        tabUpiQr.addEventListener('click', () => {
            tabUpiQr.classList.add('active');
            tabUpiId.classList.remove('active');
            upiIdView.style.display = 'none';
            upiQrView.style.display = 'block';
        });
    }

    // UPI Verification Simulation
    if (btnVerifyUpi && upiVpa) {
        btnVerifyUpi.addEventListener('click', () => {
            const vpa = upiVpa.value.trim();
            if (!vpa || !vpa.includes('@')) {
                upiStatusText.textContent = '❌ Please enter a valid UPI address (e.g. name@upi)';
                upiStatusText.style.color = '#e74c3c';
                isUpiVerified = false;
                return;
            }

            btnVerifyUpi.textContent = 'Verifying...';
            btnVerifyUpi.disabled = true;

            setTimeout(() => {
                btnVerifyUpi.textContent = '✓ Verified';
                btnVerifyUpi.disabled = false;
                btnVerifyUpi.style.background = '#27ae60';
                upiStatusText.textContent = `✓ UPI ID verified for ${vpa.split('@')[0].toUpperCase()}. Proceed to pay.`;
                upiStatusText.style.color = '#27ae60';
                isUpiVerified = true;
            }, 600);
        });
    }

    // Card Input Auto-Formatting
    if (cardNum) {
        cardNum.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').slice(0, 16);
            val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = val;
        });
    }

    if (cardExp) {
        cardExp.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '').slice(0, 4);
            if (val.length >= 2) {
                val = val.slice(0, 2) + '/' + val.slice(2);
            }
            e.target.value = val;
        });
    }

    // ============================================================
    // PLACE ORDER & CHECKOUT EXECUTION
    // ============================================================
    if (btnPlaceOrder) {
        btnPlaceOrder.addEventListener('click', () => {
            const user = Store.getCurrentUser();
            if (!user) {
                showToast('⚠️ Please sign in to place your order.');
                openAuthModal('login');
                return;
            }

            const cart = Store.getCart();
            if (cart.length === 0) {
                showToast('⚠️ Your bag is empty.');
                return;
            }

            // Validate Shipping Fields
            const nameVal    = shipName.value.trim();
            const phoneVal   = shipPhone.value.trim();
            const addressVal = shipAddress.value.trim();
            const cityVal    = shipCity.value.trim();
            const stateVal   = shipState.value.trim();
            const pinVal     = shipPincode.value.trim();

            if (!nameVal) {
                showToast('⚠️ Please provide recipient full name.');
                shipName.focus();
                return;
            }
            if (!phoneVal || phoneVal.length < 10) {
                showToast('⚠️ Please provide a valid 10-digit mobile number for delivery OTP.');
                shipPhone.focus();
                return;
            }
            if (!addressVal || addressVal.length < 8) {
                showToast('⚠️ Please enter complete street address & flat/house number.');
                shipAddress.focus();
                return;
            }
            if (!cityVal) {
                showToast('⚠️ Please enter delivery city.');
                shipCity.focus();
                return;
            }
            if (!pinVal || pinVal.length < 6) {
                showToast('⚠️ Please provide a valid 6-digit postal pincode.');
                shipPincode.focus();
                return;
            }

            // Validate Payment Method: Only COD is permitted for now
            const selectedPayment = document.querySelector('input[name="paymentOption"]:checked')?.value || 'cod';

            if (selectedPayment !== 'cod') {
                showToast('⚠️ Only Cash on Delivery (COD) is currently accepted.');
                const codRadio = document.getElementById('payCOD');
                if (codRadio) {
                    codRadio.checked = true;
                    codRadio.dispatchEvent(new Event('change'));
                }
                return;
            }

            // Button Feedback
            btnPlaceOrder.disabled = true;
            btnPlaceOrder.textContent = 'Securing Your Fragrance Order...';

            setTimeout(() => {
                try {
                    const orderPayload = {
                        name: nameVal,
                        phone: phoneVal,
                        address: addressVal,
                        city: cityVal,
                        state: stateVal,
                        pincode: pinVal,
                        notes: shipNotes ? shipNotes.value.trim() : '',
                        paymentMethod: 'cod',
                        paymentDetails: {
                            type: 'Cash on Delivery',
                            cod: true
                        }
                    };

                    const order = Store.createOrder(orderPayload);
                    try {
                        sessionStorage.setItem('lafin_last_order_id', order.id);
                    } catch(e) {}
                    showOrderReceipt(order);
                } catch (err) {
                    showToast(`❌ Error placing order: ${err.message}`);
                    btnPlaceOrder.disabled = false;
                    btnPlaceOrder.textContent = `Place Order • Pay ₹${Store.getCartSummary().total} ↗`;
                }
            }, 900);
        });
    }

    // ============================================================
    // DISPLAY ORDER RECEIPT MODAL
    // ============================================================
    function showOrderReceipt(order) {
        if (!orderSuccessModal) return;

        // Populate receipt details
        if (receiptOrderId) receiptOrderId.textContent = order.id;
        if (receiptDate) receiptDate.textContent = order.createdAt;
        if (receiptName) receiptName.textContent = `${order.customerName} (${order.customerPhone})`;
        if (receiptAddress) receiptAddress.textContent = `${order.shippingAddress}, ${order.city}, ${order.state} - ${order.pincode}`;

        let payLabel = 'Cash on Delivery (COD)';
        if (order.paymentMethod === 'upi') payLabel = `UPI (${order.paymentDetails.upiId || 'Direct UPI'})`;
        else if (order.paymentMethod === 'card') payLabel = `Card Ending in •••• ${order.paymentDetails.cardLast4 || '4242'}`;
        else if (order.paymentMethod === 'netbanking') payLabel = `Net Banking (${order.paymentDetails.bank || 'Selected Bank'})`;
        if (receiptPayment) receiptPayment.textContent = payLabel;

        // Render itemized list
        if (receiptItemsList) {
            receiptItemsList.innerHTML = order.items.map(item => `
                <div class="receipt-item-row">
                    <div>
                        <span class="receipt-item-name">${item.name}</span>
                        <span class="receipt-item-qty">× ${item.qty}</span>
                    </div>
                    <span class="receipt-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
            `).join('');
        }

        if (receiptSubtotal) receiptSubtotal.textContent = `₹${order.subtotal.toLocaleString('en-IN')}`;
        if (receiptGrandTotal) receiptGrandTotal.textContent = `₹${order.total.toLocaleString('en-IN')}`;

        const btnReceiptTrack = document.getElementById('btnReceiptTrack');
        if (btnReceiptTrack && order.id) {
            btnReceiptTrack.href = `history.html?orderId=${encodeURIComponent(order.id)}`;
        }

        // Show modal
        orderSuccessModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Re-render background cart view (which will now show empty)
        renderCartView();
    }

    if (btnPrintReceipt) {
        btnPrintReceipt.addEventListener('click', () => {
            window.print();
        });
    }

    // ============================================================
    // REFRESH & CROSS-TAB LISTENERS
    // ============================================================
    function refreshPage() {
        refreshAuthUI();
        renderCartView();
    }

    window.addEventListener('storage', refreshPage);
    window.addEventListener('lafin_store_update', refreshPage);
    window.addEventListener('lafin_auth_change', refreshPage);

    // Initial Execution
    refreshPage();
});

