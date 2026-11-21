/**
 * LA FIN Luxury Fragrances - Homepage Script
 * Coordinates mobile menu, live stock validation, cart state,
 * customer authentication, and real-time synchronization with Admin Portal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Nav & Menu Elements
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const cartCount = document.getElementById("cartCount");
    const cartMessage = document.getElementById("cartMessage");
    const bagBtn = document.getElementById("bagBtn");

    // Login & User Menu Elements
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnLabel = document.getElementById("loginBtnLabel");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownAvatar = document.getElementById("dropdownAvatar");
    const dropdownUserName = document.getElementById("dropdownUserName");
    const dropdownUserEmail = document.getElementById("dropdownUserEmail");
    const dropdownUserId = document.getElementById("dropdownUserId");
    const dropdownLoginCount = document.getElementById("dropdownLoginCount");
    const logoutBtn = document.getElementById("logoutBtn");

    // Auth Modal Elements (Customer only)
    const authModal = document.getElementById("authModal");
    const closeAuthModal = document.getElementById("closeAuthModal");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const switchToRegister = document.getElementById("switchToRegister");
    const switchToLogin = document.getElementById("switchToLogin");
    const btnDemoCustomer = document.getElementById("btnDemoCustomer");
    const homeToast = document.getElementById("homeToast");

    // In-memory cart
    let cart = [];

    // -------------------------------------------------------------
    // TOAST NOTIFICATION
    // -------------------------------------------------------------
    function showToast(message) {
        if (!homeToast) return;
        homeToast.textContent = message;
        homeToast.style.display = 'block';
        setTimeout(() => {
            homeToast.style.display = 'none';
        }, 3200);
    }

    // -------------------------------------------------------------
    // MOBILE MENU
    // -------------------------------------------------------------
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", isOpen);
            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";
            });
        });
    }

    // -------------------------------------------------------------
    // LIVE STOCK SYNCHRONIZATION WITH STORE
    // -------------------------------------------------------------
    function syncProductStocks() {
        if (typeof Store === 'undefined') return;

        const products = Store.getProducts();

        products.forEach(product => {
            const stockTag = document.getElementById(`stockTag-${product.id}`);
            const addBtn = document.querySelector(`.add-btn[data-id="${product.id}"]`);

            if (stockTag) {
                const stock = product.stock || 0;
                const minStock = product.minStock || 10;

                if (stock <= 0) {
                    stockTag.textContent = "Out of Stock";
                    stockTag.className = "stock-pill out";
                    if (addBtn) {
                        addBtn.disabled = true;
                        addBtn.textContent = "Sold Out";
                    }
                } else if (stock <= minStock) {
                    stockTag.textContent = `Low Stock (${stock} left)`;
                    stockTag.className = "stock-pill low";
                    if (addBtn) {
                        addBtn.disabled = false;
                        if (!addBtn.dataset.added) addBtn.textContent = "Add to Bag +";
                    }
                } else {
                    stockTag.textContent = `${stock} in stock`;
                    stockTag.className = "stock-pill";
                    if (addBtn) {
                        addBtn.disabled = false;
                        if (!addBtn.dataset.added) addBtn.textContent = "Add to Bag +";
                    }
                }
            }
        });
    }

    // -------------------------------------------------------------
    // CART COUNT SYNC
    // -------------------------------------------------------------
    function syncCartCount() {
        if (!cartCount) return;
        if (typeof Store !== 'undefined') {
            const count = Store.getCartCount();
            cartCount.textContent = count;
        }
    }

    // -------------------------------------------------------------
    // FLYING PLANE ANIMATION HELPER
    // -------------------------------------------------------------
    function triggerPlaneToBagAnimation(startBtn, onComplete) {
        const targetElement = document.getElementById('bagBtn') || bagBtn;
        if (!startBtn || !targetElement) {
            if (onComplete) onComplete();
            return;
        }

        const btnRect = startBtn.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const startX = btnRect.left + btnRect.width / 2;
        const startY = btnRect.top + btnRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        const plane = document.createElement('div');
        plane.className = 'flying-plane-wrapper';
        plane.innerHTML = `
            <svg class="flying-plane-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="url(#lafinHomePlaneGold)" />
                <defs>
                    <linearGradient id="lafinHomePlaneGold" x1="2" y1="3" x2="23" y2="21" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FFF5DE" />
                        <stop offset="0.35" stop-color="#E8CE96" />
                        <stop offset="0.75" stop-color="#C6A56B" />
                        <stop offset="1" stop-color="#8F6E33" />
                    </linearGradient>
                </defs>
            </svg>
        `;
        document.body.appendChild(plane);

        const midX = (startX + targetX) / 2 + (startX < targetX ? -30 : 30);
        const midY = Math.min(startY, targetY) - 80;

        const particleInterval = setInterval(() => {
            const curRect = plane.getBoundingClientRect();
            if (curRect.width > 0) {
                const p = document.createElement('div');
                p.className = 'plane-particle';
                p.style.left = `${curRect.left + 14}px`;
                p.style.top = `${curRect.top + 14}px`;
                document.body.appendChild(p);
                setTimeout(() => p.remove(), 850);
            }
        }, 35);

        const animation = plane.animate([
            {
                transform: `translate3d(${startX - 19}px, ${startY - 19}px, 0) scale(0.65) rotate(${angle - 22}deg)`,
                opacity: 1
            },
            {
                transform: `translate3d(${midX}px, ${midY}px, 0) scale(1.3) rotate(${angle - 6}deg)`,
                opacity: 1,
                offset: 0.5
            },
            {
                transform: `translate3d(${targetX - 19}px, ${targetY - 19}px, 0) scale(0.45) rotate(${angle + 12}deg)`,
                opacity: 0.95,
                offset: 0.9
            },
            {
                transform: `translate3d(${targetX - 19}px, ${targetY - 19}px, 0) scale(0) rotate(${angle}deg)`,
                opacity: 0
            }
        ], {
            duration: 1400,
            easing: 'cubic-bezier(0.25, 0.9, 0.35, 1)'
        });

        animation.onfinish = () => {
            clearInterval(particleInterval);
            plane.remove();

            targetElement.classList.remove('bag-bump-effect');
            void targetElement.offsetWidth;
            targetElement.classList.add('bag-bump-effect');
            setTimeout(() => targetElement.classList.remove('bag-bump-effect'), 650);

            for (let i = 0; i < 9; i++) {
                const spark = document.createElement('div');
                spark.className = 'plane-particle';
                const offsetX = (Math.random() - 0.5) * 36;
                const offsetY = (Math.random() - 0.5) * 36;
                spark.style.left = `${targetX + offsetX}px`;
                spark.style.top = `${targetY + offsetY}px`;
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), 650);
            }

            if (onComplete) onComplete();
        };
    }

    // -------------------------------------------------------------
    // ADD TO BAG HANDLER (Login Required First)
    // -------------------------------------------------------------
    document.querySelectorAll(".add-btn").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const name = button.dataset.name;
            const price = Number(button.dataset.price);

            // 1. Enforce Customer Login Requirement
            const currentUser = (typeof Store !== 'undefined') ? Store.getCurrentUser() : null;
            if (!currentUser) {
                // Save intended item so after login it is immediately added
                sessionStorage.setItem('lafin_pending_add_item', JSON.stringify({ id, name, price }));
                showToast("⚠️ Please sign in first before adding fragrances to your bag.");
                openAuthModal('login');
                return;
            }

            // 2. Check stock in Store
            if (typeof Store !== 'undefined') {
                const product = Store.getProductById(id);
                if (product && product.stock <= 0) {
                    showToast(`Sorry, ${name} is currently out of stock.`);
                    syncProductStocks();
                    return;
                }

                // Add to persistent user bag
                const addResult = Store.addToCart({ id, name, price });
                if (!addResult.success) {
                    showToast(addResult.message);
                    return;
                }

                // Flight feedback
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = "✈️ Adding...";

                triggerPlaneToBagAnimation(button, () => {
                    syncCartCount();
                    const totalItemCount = Store.getCartCount();
                    const summary = Store.getCartSummary();

                    if (cartMessage) {
                        cartMessage.textContent = `${name} added to your bag. Items: ${totalItemCount} | Total: ₹${summary.subtotal}`;
                    }

                    button.textContent = "Added ✓";
                    showToast(`✓ ${name} added to your bag`);

                    setTimeout(() => {
                        button.disabled = false;
                        button.textContent = originalText;
                        syncProductStocks();
                    }, 1200);
                });
            }

            syncProductStocks();
        });
    });

    // -------------------------------------------------------------
    // PROCESS PENDING ADD-TO-BAG AFTER LOGIN
    // -------------------------------------------------------------
    function processPendingCartItem() {
        const pendingRaw = sessionStorage.getItem('lafin_pending_add_item');
        if (!pendingRaw) return;
        sessionStorage.removeItem('lafin_pending_add_item');

        try {
            const pending = JSON.parse(pendingRaw);
            if (typeof Store !== 'undefined' && Store.getCurrentUser()) {
                const res = Store.addToCart(pending);
                syncCartCount();
                if (res.success) {
                    showToast(`✨ Signed in! ${pending.name} has been added to your bag.`);
                }
            }
        } catch (e) {
            console.error('Error processing pending item', e);
        }
    }

    // -------------------------------------------------------------
    // CUSTOMER AUTHENTICATION STATE & NAVBAR UI
    // -------------------------------------------------------------
    function updateAuthState() {
        if (typeof Store === 'undefined') return;

        const currentUser = Store.getCurrentUser();

        if (currentUser) {
            // Customer is signed in
            loginBtn.classList.add("logged-in");
            // Show first name
            const firstName = currentUser.name.split(" ")[0];
            loginBtnLabel.textContent = firstName;

            // Update user dropdown details
            const initials = currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

            dropdownAvatar.textContent = initials;
            dropdownUserName.textContent = currentUser.name;
            dropdownUserEmail.textContent = currentUser.email;
            dropdownUserId.textContent = currentUser.id;
            dropdownLoginCount.textContent = `${currentUser.loginCount || 1} logins`;

            // Sync user's cart if already stored
            if (currentUser.cart && currentUser.cart.length > 0 && cart.length === 0) {
                cart = [...currentUser.cart];
                const totalItemCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
                cartCount.textContent = totalItemCount;
            }
        } else {
            // Customer is signed out
            loginBtn.classList.remove("logged-in");
            loginBtnLabel.textContent = "Sign In";
            if (userDropdown) userDropdown.style.display = "none";
        }
    }

    // Login button click handler
    if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const currentUser = Store ? Store.getCurrentUser() : null;

            if (currentUser) {
                // Toggle dropdown menu
                const isShown = userDropdown.style.display === "block";
                userDropdown.style.display = isShown ? "none" : "block";
            } else {
                // Open auth modal
                openAuthModal('login');
            }
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.style.display = "none";
        }
    });

    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (Store) Store.logoutUser();
            userDropdown.style.display = "none";
            updateAuthState();
            showToast("You have been signed out successfully.");
        });
    }

    // -------------------------------------------------------------
    // AUTH MODAL LOGIC (CUSTOMER LOGIN & REGISTER)
    // -------------------------------------------------------------
    function openAuthModal(tab = 'login') {
        if (!authModal) return;
        authModal.style.display = "flex";
        switchAuthTab(tab);
    }

    function closeAuthModalDialog() {
        if (authModal) authModal.style.display = "none";
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener("click", closeAuthModalDialog);
    }

    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                closeAuthModalDialog();
            }
        });
    }

    function switchAuthTab(tab) {
        tabLoginBtn.classList.remove("active");
        tabRegisterBtn.classList.remove("active");

        loginForm.classList.remove("active");
        registerForm.classList.remove("active");

        if (tab === 'login') {
            tabLoginBtn.classList.add("active");
            loginForm.classList.add("active");
        } else if (tab === 'register') {
            tabRegisterBtn.classList.add("active");
            registerForm.classList.add("active");
        }
    }

    if (tabLoginBtn) tabLoginBtn.addEventListener("click", () => switchAuthTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener("click", () => switchAuthTab('register'));

    if (switchToRegister) {
        switchToRegister.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab('register');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener("click", (e) => {
            e.preventDefault();
            switchAuthTab('login');
        });
    }

    // Quick Demo Customer autofill
    if (btnDemoCustomer) {
        btnDemoCustomer.addEventListener("click", () => {
            document.getElementById("loginEmail").value = "aarav.sharma@example.com";
            document.getElementById("loginPassword").value = "password123";
        });
    }

    // Sign In form submit
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();

            if (!email) return;

            // Find existing customer or register on login
            let existingCustomer = Store.getCustomerByEmail(email);
            const customerName = existingCustomer ? existingCustomer.name : email.split('@')[0];

            const customer = Store.recordCustomerLogin({
                email: email,
                name: customerName
            });

            closeAuthModalDialog();
            updateAuthState();
            syncCartCount();
            showToast(`Welcome back, ${customer.name}!`);
            processPendingCartItem();
        });
    }

    // Register form submit
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const phone = document.getElementById("regPhone").value.trim();
            const city = document.getElementById("regCity").value.trim();

            if (!name || !email) return;

            const customer = Store.recordCustomerLogin({
                name,
                email,
                phone,
                city
            });

            closeAuthModalDialog();
            updateAuthState();
            syncCartCount();
            showToast(`Welcome to LA FIN, ${customer.name}!`);
            processPendingCartItem();
        });
    }

    // -------------------------------------------------------------
    // CROSS-TAB & STORE SYNC LISTENERS
    // -------------------------------------------------------------
    window.addEventListener('storage', () => {
        syncProductStocks();
        updateAuthState();
        syncCartCount();
    });

    window.addEventListener('lafin_store_update', () => {
        syncProductStocks();
        updateAuthState();
        syncCartCount();
    });
    window.addEventListener('greed_store_update', () => {
        syncProductStocks();
        updateAuthState();
        syncCartCount();
    });

    // -------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------
    syncProductStocks();
    updateAuthState();
    syncCartCount();
});
