/**
 * LA FIN Luxury Fragrances - Shop Page Script
 * Handles product catalog rendering, filtering, sorting, search,
 * cart sidebar interactions, and customer authentication.
 */

// ============================================================
// EXTENDED PRODUCT CATALOG (6 fragrances)
// The first 3 mirror the homepage products from Store.js.
// Products 4–6 are shop-only exclusives.
// ============================================================
const SHOP_PRODUCTS = [
    {
        id: 1,
        name: 'Ocean Rush',
        sku: 'LAF-001',
        category: 'fresh',
        notes: 'CITRUS · AQUATIC · MUSK',
        price: 599,
        stock: 45,
        minStock: 10,
        tag: '01 / FRESH',
        badge: 'bestseller',
        badgeLabel: '★ Bestseller',
        image: 'perfume1.png',
        fallbackImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=85',
        description: 'Crisp morning ocean spray fused with zesty Mediterranean bergamot and warm amber musk.'
    },
    {
        id: 2,
        name: 'Midnight Ember',
        sku: 'LAF-002',
        category: 'intense',
        notes: 'WOODY · AMBER · VANILLA',
        price: 699,
        stock: 28,
        minStock: 10,
        tag: '02 / INTENSE',
        badge: 'bestseller',
        badgeLabel: '★ Bestseller',
        image: 'perfume2.png',
        fallbackImage: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=700&q=85',
        description: 'A seductive blend of smoked vanilla bean, dark golden amber, and toasted cedarwood.'
    },
    {
        id: 3,
        name: 'Velvet Oud',
        sku: 'LAF-003',
        category: 'oriental',
        notes: 'OUD · SANDALWOOD · MUSK',
        price: 799,
        stock: 8,
        minStock: 10,
        tag: '03 / MYSTERY',
        badge: 'bestseller',
        badgeLabel: '★ Bestseller',
        image: 'perfume3.png',
        fallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=85',
        description: 'Rare Cambodian oud resin kissed by creamy Mysore sandalwood and velvet black musk.'
    },
    {
        id: 4,
        name: 'Rose Noir',
        sku: 'LAF-004',
        category: 'floral',
        notes: 'ROSE · PEONY · PATCHOULI',
        price: 749,
        stock: 22,
        minStock: 10,
        tag: '04 / FLORAL',
        badge: 'new',
        badgeLabel: '✦ New Arrival',
        image: null,
        fallbackImage: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=700&q=85',
        description: 'A bold floral statement — Damascus rose petals wrapped in dark patchouli and soft peony.'
    },
    {
        id: 5,
        name: 'Cedar & Smoke',
        sku: 'LAF-005',
        category: 'woody',
        notes: 'CEDAR · VETIVER · SMOKE',
        price: 849,
        stock: 14,
        minStock: 10,
        tag: '05 / WOODY',
        badge: 'limited',
        badgeLabel: '⊛ Limited',
        image: null,
        fallbackImage: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=700&q=85',
        description: 'Sun-scorched Himalayan cedar meets cool vetiver root and whisper-thin birchwood smoke.'
    },
    {
        id: 6,
        name: 'Golden Dusk',
        sku: 'LAF-006',
        category: 'intense',
        notes: 'SAFFRON · HONEY · AMBER',
        price: 899,
        stock: 0,
        minStock: 10,
        tag: '06 / LUXE',
        badge: 'limited',
        badgeLabel: '⊛ Limited',
        image: null,
        fallbackImage: 'https://images.unsplash.com/photo-1588514912908-bb5f69fe6be0?auto=format&fit=crop&w=700&q=85',
        description: 'Persian saffron threads and raw honey amber ignite into a golden sunset on the skin.'
    }
];

// ============================================================
// STATE
// ============================================================
let cart = []; // { id, name, price, qty, image }
let activeFilter = 'all';
let searchQuery = '';
let sortMode = 'default';

// ============================================================
// DOM REFERENCES
// ============================================================
const productsGrid     = document.getElementById('productsGrid');
const cartCount        = document.getElementById('cartCount');
const resultNum        = document.getElementById('resultNum');
const heroProductCount = document.getElementById('heroProductCount');
const filterChips      = document.getElementById('filterChips');
const searchInput      = document.getElementById('searchInput');
const sortSelect       = document.getElementById('sortSelect');
const shopToast        = document.getElementById('shopToast');

// Bag button
const bagBtn           = document.getElementById('bagBtn');

// Auth
const loginBtn         = document.getElementById('loginBtn');
const loginBtnLabel    = document.getElementById('loginBtnLabel');
const userDropdown     = document.getElementById('userDropdown');
const authModal        = document.getElementById('authModal');
const closeAuthModal   = document.getElementById('closeAuthModal');
const tabLoginBtn      = document.getElementById('tabLoginBtn');
const tabRegisterBtn   = document.getElementById('tabRegisterBtn');
const loginForm        = document.getElementById('loginForm');
const registerForm     = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin    = document.getElementById('switchToLogin');
const btnDemoCustomer  = document.getElementById('btnDemoCustomer');
const logoutBtn        = document.getElementById('logoutBtn');
const dropdownAvatar   = document.getElementById('dropdownAvatar');
const dropdownUserName = document.getElementById('dropdownUserName');
const dropdownUserEmail= document.getElementById('dropdownUserEmail');
const dropdownUserId   = document.getElementById('dropdownUserId');
const dropdownLoginCount = document.getElementById('dropdownLoginCount');
const menuToggle       = document.getElementById('menuToggle');
const navLinks         = document.getElementById('navLinks');

// ============================================================
// TOAST
// ============================================================
let toastTimer;
function showToast(message) {
    if (!shopToast) return;
    clearTimeout(toastTimer);
    shopToast.textContent = message;
    shopToast.style.display = 'block';
    toastTimer = setTimeout(() => {
        shopToast.style.display = 'none';
    }, 3200);
}

// ============================================================
// STOCK HELPERS (sync with Store.js if available)
// ============================================================
function getStockForProduct(id) {
    if (typeof Store !== 'undefined') {
        const products = Store.getProducts();
        const found = products.find(p => p.id === id);
        if (found !== undefined) return found.stock;
    }
    // Fallback to local catalog
    const found = SHOP_PRODUCTS.find(p => p.id === id);
    return found ? found.stock : 0;
}

function buildStockPill(stock) {
    if (stock === 0) {
        return `<div class="stock-pill out">Out of Stock</div>`;
    } else if (stock <= 10) {
        return `<div class="stock-pill low">Only ${stock} left</div>`;
    } else {
        return `<div class="stock-pill">${stock} in stock</div>`;
    }
}

// ============================================================
// PRODUCT CARD RENDERER
// ============================================================
function buildProductCard(product) {
    const stock = getStockForProduct(product.id);
    const isOut = stock === 0;

    const imgSrc = product.image || product.fallbackImage;
    const badgeHTML = product.badge
        ? `<span class="product-badge ${product.badge}">${product.badgeLabel}</span>`
        : '';

    // Check if this product is currently in the customer's bag
    let inCartQty = 0;
    if (typeof Store !== 'undefined' && Store.getCurrentUser()) {
        const cartItem = Store.getCart().find(item => item.id === product.id);
        if (cartItem) inCartQty = cartItem.qty;
    }

    // If product is in bag, show +/- quantity control. Otherwise show "Add to Bag +"
    let actionHTML = '';
    if (inCartQty > 0) {
        actionHTML = `
        <div class="card-qty-control" data-id="${product.id}">
            <button type="button" class="card-qty-btn card-qty-minus" data-id="${product.id}" aria-label="Decrease quantity">−</button>
            <span class="card-qty-number">${inCartQty}</span>
            <button type="button" class="card-qty-btn card-qty-plus" data-id="${product.id}" aria-label="Increase quantity" ${inCartQty >= stock ? 'disabled' : ''}>+</button>
        </div>`;
    } else {
        actionHTML = `
        <button class="add-btn"
                data-id="${product.id}"
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="${imgSrc}"
                ${isOut ? 'disabled' : ''}>
            ${isOut ? 'Out of Stock' : 'Add to Bag +'}
        </button>`;
    }

    return `
    <article class="product-card" data-product-id="${product.id}" data-category="${product.category}">
        ${badgeHTML}
        <div class="product-image">
            <span class="product-tag">${product.tag}</span>
            <img src="${imgSrc}"
                 alt="${product.name} luxury perfume"
                 onerror="this.src='${product.fallbackImage}'">
            <button class="wishlist-btn" data-id="${product.id}" aria-label="Add to wishlist" title="Add to wishlist">♡</button>
        </div>
        <div class="product-info">
            <p class="notes">${product.notes}</p>
            <h3>${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            ${buildStockPill(stock)}
            <div class="product-bottom">
                <span class="price">₹${product.price.toLocaleString('en-IN')}</span>
                ${actionHTML}
            </div>
        </div>
    </article>`;
}

// ============================================================
// FILTER & SORT PIPELINE
// ============================================================
function getFilteredSortedProducts() {
    let list = [...SHOP_PRODUCTS];

    // Sync stocks from Store if available
    if (typeof Store !== 'undefined') {
        const storeProducts = Store.getProducts();
        list = list.map(p => {
            const sp = storeProducts.find(s => s.id === p.id);
            return sp ? { ...p, stock: sp.stock } : p;
        });
    }

    // Filter by category
    if (activeFilter !== 'all') {
        list = list.filter(p => p.category === activeFilter);
    }

    // Filter by search
    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        list = list.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.notes.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }

    // Sort
    switch (sortMode) {
        case 'price-asc':
            list.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            list.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            list.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'stock-desc':
            list.sort((a, b) => b.stock - a.stock);
            break;
        default:
            // Featured — keep original order
            break;
    }

    return list;
}

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
    const list = getFilteredSortedProducts();

    // Update count
    if (resultNum) resultNum.textContent = list.length;
    if (heroProductCount) heroProductCount.textContent = SHOP_PRODUCTS.length;

    if (list.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No fragrances found</h3>
                <p>Try a different search term or filter.</p>
                <button class="btn-clear-filter" id="clearFilterBtn">Clear Filters</button>
            </div>`;
        document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);
        return;
    }

    productsGrid.innerHTML = list.map(buildProductCard).join('');

    // Bind Add to Bag buttons
    productsGrid.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });

    // Bind +/- Quantity buttons (shown after Add to Bag is pressed)
    productsGrid.querySelectorAll('.card-qty-minus').forEach(btn => {
        btn.addEventListener('click', handleCardQtyMinus);
    });
    productsGrid.querySelectorAll('.card-qty-plus').forEach(btn => {
        btn.addEventListener('click', handleCardQtyPlus);
    });

    // Bind wishlist buttons
    productsGrid.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', handleWishlist);
    });
}

function clearFilters() {
    activeFilter = 'all';
    searchQuery = '';
    sortMode = 'default';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('[data-filter="all"]');
    if (allChip) allChip.classList.add('active');
    renderProducts();
}

// ============================================================
// CART LOGIC (Customer Auth Required)
// ============================================================
function processPendingCartItem() {
    const pendingRaw = sessionStorage.getItem('lafin_pending_add_item');
    if (!pendingRaw) return;
    sessionStorage.removeItem('lafin_pending_add_item');

    try {
        const pending = JSON.parse(pendingRaw);
        if (typeof Store !== 'undefined' && Store.getCurrentUser()) {
            const res = Store.addToCart(pending);
            updateCartUI();
            if (res.success) {
                showToast(`✨ Signed in! ${pending.name} added to your bag.`);
            }
        }
    } catch(e) {
        console.error('Error processing pending cart item', e);
    }
}

// ============================================================
// FLYING PLANE TO CART ANIMATION
// ============================================================
function triggerPlaneToBagAnimation(startBtn, onComplete) {
    const targetElement = document.getElementById('bagBtn') || bagBtn;
    if (!startBtn || !targetElement) {
        if (onComplete) onComplete();
        return;
    }

    const btnRect = startBtn.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    // Start coordinates (center of Add to Bag button)
    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;

    // Target coordinates (center of Bag button in navbar)
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    // Angle of flight direction
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Create plane element with luxury gold gradient
    const plane = document.createElement('div');
    plane.className = 'flying-plane-wrapper';
    plane.innerHTML = `
        <svg class="flying-plane-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="url(#lafinPlaneGold)" />
            <defs>
                <linearGradient id="lafinPlaneGold" x1="2" y1="3" x2="23" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FFF5DE" />
                    <stop offset="0.35" stop-color="#E8CE96" />
                    <stop offset="0.75" stop-color="#C6A56B" />
                    <stop offset="1" stop-color="#8F6E33" />
                </linearGradient>
            </defs>
        </svg>
    `;
    document.body.appendChild(plane);

    // High arcing midpoint in flight path
    const midX = (startX + targetX) / 2 + (startX < targetX ? -30 : 30);
    const midY = Math.min(startY, targetY) - 80;

    // Particle vapor trail during flight
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

    // Smooth physics-based flight animation (cinematic slow flight)
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

        // Bounce bag icon in navbar
        targetElement.classList.remove('bag-bump-effect');
        void targetElement.offsetWidth; // Trigger DOM reflow
        targetElement.classList.add('bag-bump-effect');
        setTimeout(() => targetElement.classList.remove('bag-bump-effect'), 650);

        // Gold sparkle burst on bag impact
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

function handleAddToCart(e) {
    const btn = e.currentTarget;
    const id    = parseInt(btn.dataset.id);
    const name  = btn.dataset.name;
    const price = parseInt(btn.dataset.price);
    const image = btn.dataset.image;

    // 1. Must be logged in first
    const currentUser = (typeof Store !== 'undefined') ? Store.getCurrentUser() : null;
    if (!currentUser) {
        sessionStorage.setItem('lafin_pending_add_item', JSON.stringify({ id, name, price, image }));
        showToast(`⚠️ Please sign in first before adding ${name} to your bag.`);
        openAuthModal();
        return;
    }

    // 2. Check stock from Store
    const currentStock = getStockForProduct(id);
    if (currentStock <= 0) {
        showToast(`⚠️ ${name} is out of stock`);
        renderProducts();
        return;
    }

    if (typeof Store !== 'undefined') {
        const result = Store.addToCart({ id, name, price, image });
        if (!result.success) {
            showToast(`⚠️ ${result.message}`);
            return;
        }
    }

    // Button flight feedback
    btn.disabled = true;
    btn.textContent = '✈️ Adding...';

    // Trigger Plane Flight Animation from button to bag
    triggerPlaneToBagAnimation(btn, () => {
        updateCartUI();
        showToast(`✓ ${name} added to your bag`);
        // Immediately transforms button into [-] 1 [+] control!
        renderProducts();
    });
}

// Handle + quantity click on product card
function handleCardQtyPlus(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    const stock = getStockForProduct(id);
    const cart = (typeof Store !== 'undefined') ? Store.getCart() : [];
    const item = cart.find(i => i.id === id);

    if (!item) return;

    if (item.qty >= stock) {
        showToast(`⚠️ Only ${stock} units of ${item.name} available in stock`);
        return;
    }

    btn.disabled = true;
    triggerPlaneToBagAnimation(btn, () => {
        btn.disabled = false;
        Store.updateCartQty(id, item.qty + 1);
        updateCartUI();
        renderProducts();
        showToast(`Updated ${item.name} quantity to ${item.qty + 1}`);
    });
}

// Handle - quantity click on product card
function handleCardQtyMinus(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    const cart = (typeof Store !== 'undefined') ? Store.getCart() : [];
    const item = cart.find(i => i.id === id);

    if (!item) return;

    if (item.qty <= 1) {
        // Revert back to "Add to Bag +" button
        Store.removeFromCart(id);
        updateCartUI();
        renderProducts();
        showToast(`Removed ${item.name} from bag`);
    } else {
        Store.updateCartQty(id, item.qty - 1);
        updateCartUI();
        renderProducts();
        showToast(`Updated ${item.name} quantity to ${item.qty - 1}`);
    }
}

function handleWishlist(e) {
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
    const name = btn.closest('.product-card').querySelector('h3').textContent;
    showToast(btn.classList.contains('active') ? `♥ ${name} saved to wishlist` : `${name} removed from wishlist`);
}

function updateCartUI() {
    if (cartCount && typeof Store !== 'undefined') {
        cartCount.textContent = Store.getCartCount();
    }
}

// ============================================================
// AUTH UI HELPERS (mirrors Homepage.js logic)
// ============================================================
function refreshAuthUI() {
    if (typeof Store === 'undefined') return;
    const user = Store.getCurrentUser();
    if (user) {
        loginBtn.classList.add('logged-in');
        loginBtnLabel.textContent = user.name.split(' ')[0];
        if (dropdownAvatar) dropdownAvatar.textContent = user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
        if (dropdownUserName) dropdownUserName.textContent = user.name;
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
        if (dropdownUserId) dropdownUserId.textContent = user.id;
        if (dropdownLoginCount) dropdownLoginCount.textContent = user.loginCount || 0;
    } else {
        loginBtn.classList.remove('logged-in');
        loginBtnLabel.textContent = 'Sign In';
        if (userDropdown) userDropdown.style.display = 'none';
    }
}

function openAuthModal() {
    if (authModal) {
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModalFn() {
    if (authModal) {
        authModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function showTab(tab) {
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

// ============================================================
// EVENT BINDING
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // Initial render
    renderProducts();
    refreshAuthUI();
    updateCartUI();

    window.addEventListener('storage', () => {
        renderProducts();
        refreshAuthUI();
        updateCartUI();
    });
    window.addEventListener('lafin_store_update', () => {
        renderProducts();
        refreshAuthUI();
        updateCartUI();
    });

    // ---- Filter chips ----
    filterChips.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.filter;
            renderProducts();
        });
    });

    // ---- Search ----
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // ---- Sort ----
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortMode = e.target.value;
            renderProducts();
        });
    }

    // ---- Mobile menu ----
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

    // ---- Auth modal open ----
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof Store !== 'undefined' && Store.getCurrentUser()) {
                // Toggle dropdown
                const isShown = userDropdown.style.display !== 'none';
                userDropdown.style.display = isShown ? 'none' : 'block';
            } else {
                openAuthModal();
            }
        });
    }

    // ---- Auth modal close ----
    if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuthModalFn);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModalFn();
        });
    }

    // ---- Auth tabs ----
    if (tabLoginBtn)    tabLoginBtn.addEventListener('click',    () => showTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => showTab('register'));
    if (switchToRegister && switchToRegister.addEventListener) {
        switchToRegister.addEventListener('click', (e) => { e.preventDefault(); showTab('register'); });
    }
    if (switchToLogin && switchToLogin.addEventListener) {
        switchToLogin.addEventListener('click', (e) => { e.preventDefault(); showTab('login'); });
    }

    // ---- Demo fill ----
    if (btnDemoCustomer) {
        btnDemoCustomer.addEventListener('click', () => {
            document.getElementById('loginEmail').value = 'aarav.sharma@example.com';
            document.getElementById('loginPassword').value = 'password123';
        });
    }

    // ---- Login form ----
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof Auth === 'undefined') { showToast('Auth module not loaded'); return; }
            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const result   = Auth.loginCustomer(email, password);
            if (result.success) {
                closeAuthModalFn();
                refreshAuthUI();
                updateCartUI();
                showToast(`Welcome back, ${result.user.name.split(' ')[0]}! ✨`);
                processPendingCartItem();
            } else {
                showToast(`❌ ${result.message}`);
            }
        });
    }

    // ---- Register form ----
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof Auth === 'undefined') { showToast('Auth module not loaded'); return; }
            const data = {
                name:     document.getElementById('regName').value.trim(),
                email:    document.getElementById('regEmail').value.trim(),
                phone:    document.getElementById('regPhone').value.trim(),
                city:     document.getElementById('regCity').value.trim(),
                password: document.getElementById('regPassword').value
            };
            const result = Auth.registerCustomer(data);
            if (result.success) {
                closeAuthModalFn();
                refreshAuthUI();
                updateCartUI();
                showToast(`Welcome to LA FIN, ${data.name.split(' ')[0]}! 🎉`);
                processPendingCartItem();
            } else {
                showToast(`❌ ${result.message}`);
            }
        });
    }

    // ---- Logout ----
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof Auth !== 'undefined') Auth.logout();
            if (userDropdown) userDropdown.style.display = 'none';
            refreshAuthUI();
            showToast('You have been signed out.');
        });
    }

    // ---- Close dropdown on outside click ----
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && e.target !== loginBtn) {
            userDropdown.style.display = 'none';
        }
    });

    // ---- Escape key closes modals ----
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModalFn();
        }
    });

    // Refresh every 30s to sync stock
    setInterval(() => {
        renderProducts();
        refreshAuthUI();
    }, 30000);
});
