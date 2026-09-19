# 🛒 AURA — Modern E-Commerce Web Application

A full-stack, responsive e-commerce web application featuring a modern client interface, secure session-based authentication, user profile management, dynamic cart operations, and a real-time Administrator Control Panel.

---

## ✨ Features

### 🛍️ Client Experience
* **Dynamic Product Catalog:** Filter products by category, perform instant text searches, and view item details in dedicated modal windows.
* **Interactive Shopping Cart:** Slide-out drawer cart with real-time total calculations and item quantity adjustments.
* **User Accounts & Profiles:** Secure user registration, authentication, profile inspection, and order history tracking.
* **Responsive Layout:** Designed for seamless usability across desktops, tablets, and smartphones.

### 🛡️ Administrator Panel
* **Analytics Dashboard:** Live Key Performance Indicators (KPIs) monitoring total revenue, order count, registered users, and active product inventory.
* **Inventory Management:** Full CRUD capabilities to list, add, and remove catalog products.
* **Protected Routes & RBAC:** Express middleware security ensuring non-admin users cannot access administrative endpoints or functions.

---

## 🛠️ Tech Stack

### Frontend
* **HTML5 & CSS3:** Modern Flexbox/Grid systems, CSS Variables, and custom media queries for responsive UI.
* **JavaScript (ES6+):** Vanilla JS using Async/Await, Fetch API, dynamic DOM manipulation, and modular architecture.
* **FontAwesome:** Icons for navigation and status elements.

### Backend
* **Node.js & Express.js:** RESTful API architecture with express-session authentication.
* **MongoDB & Mongoose:** NoSQL database schema modeling for users, products, and order data.

---

## 📁 Repository Structure

```text
├── index.html          # Single Page Application entry point & modal definitions
├── styles.css          # Global design system, layout rules, and media queries
├── app.js             # Client-side state handling, UI rendering, & API communications
├── server.js           # Node/Express API routes, middleware, and database connectivity
├── make-admin.js       # Utility script to promote user roles in MongoDB
└── README.md           # Project documentation