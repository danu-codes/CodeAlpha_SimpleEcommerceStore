require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
        seedDatabase();
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// MongoDB Schemas & Models
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, required: true }
});

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 4.5 },
    description: { type: String },
    image: { type: String }
});

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    shippingAddress: {
        country: { type: String, required: true },
        address: { type: String, required: true }
    },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Initial Seed Data for MongoDB
async function seedDatabase() {
    const count = await Product.countDocuments();
    if (count === 0) {
        await Product.insertMany([
            { name: 'Ultra-HD Noise Cancelling Headphones', category: 'Electronics', price: 249.99, rating: 4.8, description: 'Experience crystal clear audio with studio-grade noise cancellation and 40-hour battery life.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
            { name: 'Minimalist Smart Watch Series 5', category: 'Electronics', price: 199.99, rating: 4.6, description: 'Sleek health tracking, heart rate monitoring, OLED display, and seamless phone integration.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800' },
            { name: 'Ergonomic Mesh Executive Chair', category: 'Furniture', price: 320.00, rating: 4.9, description: 'Premium lumbar support designed for all-day desk comfort and healthy body posture.', image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=800' },
            { name: 'Pro Mechanical Gaming Keyboard', category: 'Electronics', price: 129.50, rating: 4.7, description: 'Custom RGB backlighting, tactile blue switches, and durable aluminum top plate.', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800' },
            { name: 'Classic Heritage Leather Backpack', category: 'Fashion', price: 89.99, rating: 4.5, description: 'Handcrafted genuine leather daypack featuring dedicated laptop sleeve and weatherproofing.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800' },
            { name: 'Studio Wireless Soundbar', category: 'Electronics', price: 175.00, rating: 4.4, description: 'Immersive 3D audio experience with wireless subwoofer for deep cinema bass.', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800' }
        ]);
        console.log('Database seeded with initial products.');
    }
}

// API Routes (Interacting directly with MongoDB)

// 1. Get Products with MongoDB Filtering and Searching
app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let filter = {};

        if (category && category !== 'All') {
            filter.category = category;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search,$options: 'i' } },
                { description: { $regex: search,$options: 'i' } }
            ];
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// 2. User Registration (Save to MongoDB)
app.post('/api/register', async (req, res) => {
    const { username, password, country, address } = req.body;
    if (!username || !password || !country || !address) {
        return res.status(400).json({ error: 'All fields (Username, Password, Country, Address) are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, country, address });
        await newUser.save();
        res.status(201).json({ message: 'Account created! Please log in.' });
    } catch (err) {
        res.status(400).json({ error: 'Username already taken.' });
    }
});

// 3. User Login (Verify from MongoDB)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        req.session.username = user.username;
        res.json({ message: 'Welcome back!', username: user.username });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// 4. Session Check
app.get('/api/session', (req, res) => {
    if (req.session.username) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// 5. Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// 6. Checkout (Protected Route - User Must Be Logged In)
app.post('/api/checkout', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to place an order.' });
    }

    const { items, total } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    try {
        // Fetch full user profile from database to attach snapshot of user details to order
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'User account not found' });

        const newOrder = new Order({
            userId: user._id,
            customerName: user.username,
            shippingAddress: {
                country: user.country,
                address: user.address
            },
            items,
            total
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process order' });
    }
});

// 7. Get User Profile & Order History
app.get('/api/profile', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await User.findById(req.session.userId).select('-password');
        const orders = await Order.find({ userId: req.session.userId }).sort({ createdAt: -1 });

        res.json({ user, orders });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.listen(PORT, () => {
    console.log(`Server live at http://localhost:${PORT}`);
});