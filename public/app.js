let products = [];
let cart = [];
let activeAuthMode = 'login';
let currentCategory = 'All';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    checkSession();
});

async function fetchProducts(searchQuery = '') {
    let url = `/api/products?category=${currentCategory}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(url);
    products = await res.json();
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (products.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b; padding:3rem;">No products found.</p>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-info">
                <span class="category-tag">${p.category}</span>
                <h3 class="product-title" onclick="openDetailModal('${p._id}')">${p.name}</h3>
                <div class="rating"><i class="fa-solid fa-star"></i> ${p.rating}</div>
                <div class="card-bottom">
                    <span class="price">$${p.price.toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart('${p._id}')"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = cat;
    fetchProducts();
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('search-input').value;
        fetchProducts(query);
    }, 300);
}

function addToCart(productId) {
    const item = products.find(p => p._id === productId);
    const existing = cart.find(c => c._id === productId);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    updateCart();
    showToast(`Added ${item.name} to cart`);
}

function updateCart() {
    const container = document.getElementById('cart-items-container');
    const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    document.getElementById('cart-count').innerText = totalCount;
    document.getElementById('cart-subtotal').innerText = `$${totalPrice.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `$${totalPrice.toFixed(2)}`;

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#64748b; margin-top:2rem;">Your cart is empty.</p>`;
        return;
    }

    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.qty}</div>
            </div>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('active');
    document.getElementById('cart-overlay').classList.toggle('active');
}

function openDetailModal(id) {
    const p = products.find(item => item._id === id);
    const body = document.getElementById('product-detail-body');
    body.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div>
            <span class="category-tag">${p.category}</span>
            <h2 style="margin:0.5rem 0;">${p.name}</h2>
            <div class="rating"><i class="fa-solid fa-star"></i> ${p.rating}</div>
            <p style="color:#64748b; font-size:0.9rem; margin:1rem 0;">${p.description}</p>
            <h3 style="font-size:1.5rem; margin-bottom:1rem;">$${p.price.toFixed(2)}</h3>
            <button class="add-btn" style="width:100%; padding:0.8rem;" onclick="addToCart('${p._id}'); closeModal('detail-modal');">Add To Cart</button>
        </div>
    `;
    document.getElementById('detail-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Auth Handlers
function openAuthModal() { document.getElementById('auth-modal').classList.add('active'); }

function switchAuthTab(mode) {
    activeAuthMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('auth-submit-text').innerText = mode === 'login' ? 'Log In' : 'Create Account';

    // Show/Hide extra registration fields
    const extraFields = document.getElementById('register-extra-fields');
    if (mode === 'register') {
        extraFields.style.display = 'block';
        document.getElementById('auth-country').required = true;
        document.getElementById('auth-address').required = true;
    } else {
        extraFields.style.display = 'none';
        document.getElementById('auth-country').required = false;
        document.getElementById('auth-address').required = false;
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    
    let bodyData = { username, password };

    if (activeAuthMode === 'register') {
        bodyData.country = document.getElementById('auth-country').value;
        bodyData.address = document.getElementById('auth-address').value;
    }

    const endpoint = activeAuthMode === 'login' ? '/api/login' : '/api/register';

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    const data = await res.json();
    if (res.ok) {
        showToast(data.message);
        closeModal('auth-modal');
        checkSession();
    } else {
        showToast(data.error);
    }
}

async function checkSession() {
    const res = await fetch('/api/session');
    const data = await res.json();
    const userInfo = document.getElementById('user-info');
    if (data.loggedIn) {
        userInfo.innerHTML = `
            <button class="btn-text" onclick="openProfileModal()"><i class="fa-solid fa-circle-user"></i> ${data.username}</button>
            <button class="btn-text" onclick="logout()" style="color:#ef4444; margin-left:0.3rem;">Logout</button>
        `;
    } else {
        userInfo.innerHTML = `<button class="btn-text" onclick="openAuthModal()"><i class="fa-regular fa-user"></i> Login</button>`;
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    showToast('Logged out');
    checkSession();
}

async function processCheckout() {
    if (cart.length === 0) return showToast('Cart is empty!');

    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total })
    });

    const data = await res.json();

    if (res.ok) {
        showToast('Order successfully placed!');
        cart = [];
        updateCart();
        toggleCart();
    } else {
        // If server returns 401 Unauthorized, open the login modal
        showToast(data.error);
        if (res.status === 401) {
            toggleCart(); // Close cart drawer
            openAuthModal(); // Prompt user to log in or register
        }
    }
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

async function openProfileModal() {
    const res = await fetch('/api/profile');
    if (!res.ok) return showToast('Please log in first');

    const { user, orders } = await res.json();

    // Populate Header & Info Cards
    document.getElementById('profile-avatar-letter').innerText = user.username.charAt(0).toUpperCase();
    document.getElementById('profile-username-title').innerText = user.username;
    document.getElementById('profile-country-val').innerText = user.country;
    document.getElementById('profile-address-val').innerText = user.address;
    document.getElementById('profile-order-count').innerText = `${orders.length} Order(s)`;

    // Populate Orders
    const ordersContainer = document.getElementById('profile-orders');
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div style="text-align:center; padding: 2rem 1rem; color: var(--text-muted);">
                <i class="fa-solid fa-cart-flatbed" style="font-size:2rem; margin-bottom:0.5rem; opacity:0.5;"></i>
                <p style="font-size:0.9rem;">No orders placed yet.</p>
            </div>`;
    } else {
        ordersContainer.innerHTML = orders.map(o => `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-id">#${o._id.slice(-8).toUpperCase()}</span>
                    <span class="order-status">Completed</span>
                </div>
                <div class="order-card-details">
                    <span>${new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span><strong>${o.items.length} item(s)</strong> — $${o.total.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('profile-modal').classList.add('active');
}