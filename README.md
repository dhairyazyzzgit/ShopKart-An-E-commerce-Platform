# ShopKart - Full-Stack E-Commerce Web Application

ShopKart is a modern, full-stack e-commerce web application designed to provide a seamless online shopping experience across multiple categories like Electronics, Fashion, Home & Living, Fitness, and Books.

## 🚀 Live Links
* **Frontend (Vercel):** https://shop-kart-an-e-commerce-platform-q658lq8ll.vercel.app
* **Backend API (Render):** https://shopkart-backend-90ix.onrender.com/

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS / Modern CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose ODM
* **Deployment:** Vercel (Frontend) & Render (Backend)

---

## ✨ Features

* **Dynamic Product Catalog:** Browse products across various categories with real-time searching and sorting.
* **Shopping Cart Management:** Add items, adjust quantities, and inspect totals seamlessly.
* **RESTful API Backend:** Robust backend handling product routes, inventory, and database queries.
* **Cloud Database Integration:** Scalable NoSQL database powered by MongoDB Atlas.
* **Responsive Design:** Fully responsive layout optimized for mobile, tablet, and desktop devices.

---

## 📂 Project Structure

```text
ShopKart/
├── shopkart-frontend/       # React + Vite frontend application
│   ├── src/
│   └── package.json
└── shopkart-backend/        # Node.js & Express backend server
    ├── models/              # Mongoose database schemas
    ├── routes/              # API endpoints
    ├── seed.js              # Database seeder script
    ├── server.js            # Entry point
    └── package.json
```
  #⚙️ Setup and Installation Instructions
Prerequisites
Node.js (v18+ recommended) installed on your machine.

A MongoDB Atlas connection string.

1. Backend Setup
Bash
cd shopkart-backend
npm install
Create a .env file in shopkart-backend/:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string_here
Run the backend server:

Bash
npm start
2. Frontend Setup
Open a second terminal window:

Bash
cd shopkart-frontend
npm install
Create a .env file in shopkart-frontend/:

Code snippet
VITE_API_URL=http://localhost:5000
Run the frontend server:

Bash
npm run dev
🔒 Security Note
Sensitive credentials, API keys, and .env files are excluded from version control via .gitignore to maintain security best practices.
