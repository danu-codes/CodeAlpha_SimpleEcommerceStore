# 🛒 Modern Full-Stack E-Commerce Platform

A professional, device-responsive full-stack e-commerce web application built using **Node.js, Express, MongoDB Atlas, and Vanilla JavaScript/HTML/CSS**. Features session-based authentication, user profile management, cart persistence, dynamic product filtering, and order history tracking.

---

## 🌟 Key Features

* **📱 Responsive Design:** Modern, mobile-first UI with responsive navigation, dynamic grids, and glassmorphism styling.
* **🔐 Secure Authentication:** User registration and login using **bcrypt** for password hashing and Express sessions for protected routes.
* **👤 User Profile & Order History:** Dedicated profile dashboard tracking customer addresses and past order metrics.
* **💳 Session-Protected Checkout:** Secure API routes ensuring only authenticated users can place orders with linked shipping details.
* **🗃️ Real-Time Database Management:** Automatic seeding of product listings and automated MongoDB schema mapping.
* **🔍 Search & Category Filtering:** Instant client-side text search and category filtering for high-performance browsing.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
* **HTML5 / CSS3:** Custom CSS with CSS Variables, Flexbox/Grid layouts, and dynamic media queries.
* **Vanilla JavaScript (ES6+):** Async/Await Fetch API, dynamic DOM manipulation, and modular event listeners.
* **FontAwesome:** Scalable iconography.

### **Backend**
* **Node.js & Express.js:** RESTful API architecture for authentication, products, orders, and user sessions.
* **Express-Session:** Session management for secure route handling.
* **Bcrypt.js:** Industry-standard password hashing algorithm.

### **Database & Cloud**
* **MongoDB Atlas:** Cloud-hosted NoSQL database.
* **Mongoose ODM:** Data modeling and schema validation for Users, Products, and Orders.

---

## 📁 Repository Structure

```text
.
├── public/
│   ├── index.html       # Single-page application template & modal structures
│   ├── styles.css       # Full responsive styles & UI theme definition
│   └── app.js           # Client-side API integration & event management
├── server.js            # Express server, MongoDB schemas, and REST endpoints
├── package.json         # Dependencies & project scripts
├── vercel.json          # Deployment configuration (Serverless)
└── .env                 # Environment variables (git-ignored)