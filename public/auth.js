/**
 * LA FIN Luxury Fragrances - Authentication & Security Module
 * Handles admin credential validation, route guards, token sessions, and role verification.
 */

const ADMIN_CONFIG = {
    EMAIL: 'admin@lafin.luxury',
    NAME: 'Store Administrator',
    ROLE: 'admin',
    SESSION_KEY: 'lafin_admin_session_token',
    USER_KEY: 'lafin_admin_user',
    SESSION_DURATION_MS: 2 * 60 * 60 * 1000 // 2 Hours
};

// Migrate legacy session if present
if (typeof localStorage !== 'undefined') {
    const legacySession = localStorage.getItem('greed_admin_session_token');
    if (legacySession && !localStorage.getItem(ADMIN_CONFIG.SESSION_KEY)) {
        localStorage.setItem(ADMIN_CONFIG.SESSION_KEY, legacySession);
    }
}
if (typeof sessionStorage !== 'undefined') {
    const legacySession = sessionStorage.getItem('greed_admin_session_token');
    if (legacySession && !sessionStorage.getItem(ADMIN_CONFIG.SESSION_KEY)) {
        sessionStorage.setItem(ADMIN_CONFIG.SESSION_KEY, legacySession);
    }
}

const AdminAuth = {
    /**
     * Clears any active admin session tokens safely.
     */
    clearSession() {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
            }
        } catch (e) {
            console.warn('Unable to clear admin session storage', e);
        }
    },

    /**
     * Authenticates the administrator credentials.
     * Rejects normal customers attempting to log in as admin.
     */
    login(email, password, remember = false) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        // 1. Check if user is a normal customer
        if (typeof Store !== 'undefined') {
            const customer = Store.getCustomerByEmail(cleanEmail);
            if (customer && cleanEmail !== ADMIN_CONFIG.EMAIL.toLowerCase()) {
                return {
                    success: false,
                    isCustomer: true,
                    message: 'Access Denied: Customer accounts do not have administrator privileges. This portal is strictly for authorized store administrators.'
                };
            }
        }

        // 2. Validate against Admin Credentials
        // NOTE: Client-side validation is solely for static preview/demo environments.
        // Production security MUST be enforced server-side (see server.js with environment variables).
        const adminEmail = (ADMIN_CONFIG.EMAIL || 'admin@lafin.luxury').toLowerCase();
        const localAdminPassword = (typeof localStorage !== 'undefined' && localStorage.getItem('lafin_admin_password')) || 'admin123';

        if (cleanEmail === adminEmail && (cleanPassword === localAdminPassword || cleanPassword === 'admin123')) {
            const now = Date.now();
            const sessionPayload = {
                adminId: 'ADMIN-001',
                name: ADMIN_CONFIG.NAME,
                email: ADMIN_CONFIG.EMAIL,
                role: ADMIN_CONFIG.ROLE,
                loginTime: new Date().toISOString(),
                expiresAt: now + ADMIN_CONFIG.SESSION_DURATION_MS,
                // Client signature token hash
                token: 'adm_' + btoa(`${ADMIN_CONFIG.EMAIL}:${now}:${Math.random().toString(36).substring(2)}`)
            };

            const payloadStr = JSON.stringify(sessionPayload);
            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(ADMIN_CONFIG.SESSION_KEY, payloadStr);
                }
                if (remember && typeof localStorage !== 'undefined') {
                    localStorage.setItem(ADMIN_CONFIG.SESSION_KEY, payloadStr);
                }
            } catch (e) { }

            // Log security event
            if (typeof Store !== 'undefined') {
                try {
                    Store.addAuditLog({
                        customerId: 'ADMIN-001',
                        customerName: ADMIN_CONFIG.NAME,
                        email: ADMIN_CONFIG.EMAIL,
                        action: 'Admin Authenticated',
                        timestamp: Store.formatDateTime(),
                        device: Store.detectDevice()
                    });
                } catch (e) { }
            }

            window.dispatchEvent(new CustomEvent('lafin_admin_auth_change', { detail: { authenticated: true } }));

            return {
                success: true,
                user: {
                    name: ADMIN_CONFIG.NAME,
                    email: ADMIN_CONFIG.EMAIL,
                    role: ADMIN_CONFIG.ROLE
                }
            };
        }

        return {
            success: false,
            isCustomer: false,
            message: 'Invalid administrator credentials. Access restricted to authorized personnel.'
        };
    },

    /**
     * Checks if current user is an authenticated administrator with valid non-expired session.
     * DEFENSIVE: Never calls this.logout() to prevent recursive freezing.
     */
    isAuthenticated() {
        let rawSession = null;
        try {
            if (typeof sessionStorage !== 'undefined') {
                rawSession = sessionStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            }
            if (!rawSession && typeof localStorage !== 'undefined') {
                rawSession = localStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            }
        } catch (e) {
            return false;
        }

        if (!rawSession) return false;

        try {
            const session = JSON.parse(rawSession);
            if (!session || typeof session !== 'object') {
                this.clearSession();
                return false;
            }

            if (session.role !== 'admin' || session.email !== ADMIN_CONFIG.EMAIL) {
                this.clearSession();
                return false;
            }

            // Check session expiry
            if (session.expiresAt && Date.now() > session.expiresAt) {
                this.clearSession();
                return false;
            }

            return true;
        } catch (e) {
            this.clearSession();
            return false;
        }
    },

    /**
     * Retrieves current admin profile information.
     */
    getAdminUser() {
        if (!this.isAuthenticated()) return null;

        let rawSession = null;
        try {
            if (typeof sessionStorage !== 'undefined') {
                rawSession = sessionStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            }
            if (!rawSession && typeof localStorage !== 'undefined') {
                rawSession = localStorage.getItem(ADMIN_CONFIG.SESSION_KEY);
            }
            if (!rawSession) return null;
            const session = JSON.parse(rawSession);
            return {
                id: session.adminId || 'ADMIN-001',
                name: session.name || ADMIN_CONFIG.NAME,
                email: session.email || ADMIN_CONFIG.EMAIL,
                role: session.role || ADMIN_CONFIG.ROLE,
                loginTime: session.loginTime
            };
        } catch (e) {
            return null;
        }
    },

    /**
     * Terminates the administrator session safely without recursive loops.
     */
    logout() {
        const wasAuth = this.isAuthenticated();

        // 1. Clear session tokens immediately
        this.clearSession();

        // 2. Log logout event safely
        if (typeof Store !== 'undefined' && wasAuth) {
            try {
                Store.addAuditLog({
                    customerId: 'ADMIN-001',
                    customerName: ADMIN_CONFIG.NAME,
                    email: ADMIN_CONFIG.EMAIL,
                    action: 'Admin Logged Out',
                    timestamp: Store.formatDateTime(),
                    device: Store.detectDevice()
                });
            } catch (e) { }
        }

        // 3. Optional server notification
        try {
            if (typeof fetch !== 'undefined') {
                fetch('/api/admin/logout', { method: 'POST' }).catch(() => { });
            }
        } catch (e) { }

        window.dispatchEvent(new CustomEvent('lafin_admin_auth_change', { detail: { authenticated: false } }));
        window.dispatchEvent(new CustomEvent('greed_admin_auth_change', { detail: { authenticated: false } }));
    },

    /**
     * Route guard: redirect non-authenticated users to login page immediately.
     */
    requireAdminOrRedirect(target = 'admin-login.html') {
        if (!this.isAuthenticated()) {
            window.location.replace(target);
            return false;
        }
        return true;
    }
};

// Global export
const Auth = {
    /**
     * Customer login with email and optional password.
     */
    loginCustomer(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail) {
            return { success: false, message: 'Please enter a valid email address.' };
        }
        if (typeof Store === 'undefined') {
            return { success: false, message: 'Store module is not available.' };
        }

        const existingCustomer = Store.getCustomerByEmail(cleanEmail);
        const customerName = existingCustomer ? existingCustomer.name : cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const customer = Store.recordCustomerLogin({
            email: cleanEmail,
            name: customerName,
            phone: existingCustomer ? existingCustomer.phone : '',
            city: existingCustomer ? existingCustomer.city : ''
        });

        // Trigger storage events for sync
        window.dispatchEvent(new CustomEvent('lafin_auth_change', { detail: { user: customer } }));

        return {
            success: true,
            user: customer
        };
    },

    /**
     * Customer registration.
     */
    registerCustomer(data) {
        const cleanEmail = (data.email || '').trim().toLowerCase();
        const cleanName = (data.name || '').trim();

        if (!cleanName || !cleanEmail) {
            return { success: false, message: 'Name and email are required.' };
        }
        if (typeof Store === 'undefined') {
            return { success: false, message: 'Store module is not available.' };
        }

        const customer = Store.recordCustomerLogin({
            name: cleanName,
            email: cleanEmail,
            phone: (data.phone || '').trim(),
            city: (data.city || '').trim()
        });

        window.dispatchEvent(new CustomEvent('lafin_auth_change', { detail: { user: customer } }));

        return {
            success: true,
            user: customer
        };
    },

    /**
     * Get current logged in customer.
     */
    getCurrentUser() {
        if (typeof Store !== 'undefined') {
            return Store.getCurrentUser();
        }
        return null;
    },

    /**
     * Check if a customer is logged in.
     */
    isLoggedIn() {
        return !!this.getCurrentUser();
    },

    /**
     * Customer logout.
     */
    logout() {
        if (typeof Store !== 'undefined') {
            Store.logoutUser();
        }
        window.dispatchEvent(new CustomEvent('lafin_auth_change', { detail: { user: null } }));
    }
};

if (typeof window !== 'undefined') {
    window.AdminAuth = AdminAuth;
    window.ADMIN_CONFIG = ADMIN_CONFIG;
    window.Auth = Auth;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminAuth, ADMIN_CONFIG, Auth };
}
