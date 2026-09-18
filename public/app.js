let products = [];
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

async function fetchProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    renderProducts();
}

function renderProducts() {
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="price">$${p.price.toFixed(2)}</p>
            <button class="btn-secondary" onclick="viewProduct(${p.id})">Details</button>
            <button class="btn-primary" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
    `).join('');
}

function viewProduct(id) {
    const product = products.find(p => p.id === id);
    const detailCard = document.getElementById('product-detail-card');
    detailCard.innerHTML = `
        <img src="${product.image}" style="max-width:300px; border-radius:8px;">
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <h3>$${product.price.toFixed(2)}</h3>
        <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    showSection('product-detail-section');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    cart.push(product);
    updateCartUI();
    alert(`${product.name} added to cart!`);
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const items = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    items.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; background:#fff; padding:1rem; margin-bottom:0.5rem; border-radius:6px;">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
            <button style="color:red;" onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join('');

    document.getElementById('cart-total').innerText = total.toFixed(2);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

async function checkout() {
    if (cart.length === 0) return alert('Cart is empty!');
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total })
    });

    if (res.ok) {
        alert('Order placed successfully!');
        cart = [];
        updateCartUI();
        showSection('products-section');
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    alert(data.message || data.error);
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        document.getElementById('auth-btn').innerText = `Hello, ${data.username}`;
        showSection('products-section');
    } else {
        alert(data.error);
    }
}

function showSection(id) {
    ['products-section', 'product-detail-section', 'cart-section', 'auth-section'].forEach(sec => {
        document.getElementById(sec).classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}