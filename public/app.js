let cart = [];
let activeAuthMode = 'login';
let currentCategory = 'All';
let products = [];
let currentDetailProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    checkSession();
});

async function fetchProducts(searchQuery = '') {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        
        products = Array.isArray(data) ? data : (data.products || []);
        
        // Apply client-side Category & Search filtering
        let filtered = products;
        if (currentCategory && currentCategory !== 'All') {
            filtered = filtered.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
        }
        if (searchQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        renderProducts(filtered);
    } catch (err) {
        console.error('Failed to fetch products:', err);
        showToast('Error loading products');
    }
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const list = Array.isArray(productsToRender) ? productsToRender : [];

    if (list.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No products found.</p>`;
        return;
    }

    grid.innerHTML = list.map(p => `
        <div class="product-card">
            <div class="product-image" onclick="openProductModal('${p._id}')" style="cursor:pointer;">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-info">
                <span class="category-tag">${p.category}</span>
                <h3 class="product-title" onclick="openProductModal('${p._id}')">${p.name}</h3>
                <div class="rating">★ ${p.rating || 4.8}</div>
                <div class="card-bottom">
                    <span class="price">$${p.price.toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart('${p._id}')">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
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

function addToCart(productId, quantity = 1) {
    const item = products.find(p => p._id === productId);
    if (!item) return;

    const existing = cart.find(c => c._id === productId);

    if (existing) {
        existing.qty += quantity;
    } else {
        cart.push({ ...item, qty: quantity });
    }

    updateCart();
    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}${item.name} to cart`);
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
        credentials: 'include', // Retains session cookies
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
    const res = await fetch('/api/session', { credentials: 'include' });
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
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    showToast('Logged out');
    checkSession();
}

async function processCheckout() {
    if (cart.length === 0) return showToast('Cart is empty!');

    const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Sends cookie required by req.session.userId
        body: JSON.stringify({ items: cart, total })
    });

    const data = await res.json();

    if (res.ok) {
        showToast('Order successfully placed!');
        cart = [];
        updateCart();
        toggleCart();
    } else {
        showToast(data.error || 'Checkout failed');
        if (res.status === 401) {
            toggleCart();
            openAuthModal();
        }
    }
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

async function openProfileModal() {
    const res = await fetch('/api/profile', { credentials: 'include' });
    if (!res.ok) return showToast('Please log in first');

    const { user, orders } = await res.json();

    document.getElementById('profile-avatar-letter').innerText = user.username.charAt(0).toUpperCase();
    document.getElementById('profile-username-title').innerText = user.username;
    document.getElementById('profile-country-val').innerText = user.country;
    document.getElementById('profile-address-val').innerText = user.address;
    document.getElementById('profile-order-count').innerText = `${orders.length} Order(s)`;

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

function openProductModal(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;

    currentDetailProduct = product;
    document.getElementById('detail-img').src = product.image;
    document.getElementById('detail-category').innerText = product.category;
    document.getElementById('detail-title').innerText = product.name;
    document.getElementById('detail-rating').innerText = `★ ${product.rating || 4.8} / 5.0`;
    document.getElementById('detail-price').innerText = `$${product.price.toFixed(2)}`;
    document.getElementById('detail-description').innerText = product.description || 'High-quality product designed for durability and performance.';
    
    document.getElementById('detail-qty').value = 1;
    
    document.getElementById('detail-add-cart-btn').onclick = () => {
        const qty = parseInt(document.getElementById('detail-qty').value) || 1;
        addToCart(product._id, qty);
        closeModal('product-modal');
    };

    document.getElementById('product-modal').classList.add('active');
}

function adjustDetailQty(delta) {
    const qtyInput = document.getElementById('detail-qty');
    let val = parseInt(qtyInput.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    qtyInput.value = val;
}