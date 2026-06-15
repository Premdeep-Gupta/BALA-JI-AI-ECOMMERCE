# BALA-JI-AI-ECOMMERCE (Monorepo)

Welcome to the **Bala Ji AI Ecommerce** full-stack repository. This project is structured as a monorepo containing three main components: the backend server, the customer frontend application, and the admin dashboard portal.

---

## 🔗 Live Deployed URLs

You can access the various portals of the deployed application using the links below:

### 1. 🛒 Customer/User Portal
* **Main URL:** [https://bala-ji-ai-ecommerce.vercel.app/](https://bala-ji-ai-ecommerce.vercel.app/)

### 2. 🚚 Delivery Boy Portal
All delivery partner pages are accessible via client-side routes on the main web application:
* **Register (Registration Page):** [https://bala-ji-ai-ecommerce.vercel.app/delivery/register](https://bala-ji-ai-ecommerce.vercel.app/delivery/register)
* **Login (Login Page):** [https://bala-ji-ai-ecommerce.vercel.app/delivery/login](https://bala-ji-ai-ecommerce.vercel.app/delivery/login)
* **Portal (Active Shifts & Orders):** [https://bala-ji-ai-ecommerce.vercel.app/delivery/portal](https://bala-ji-ai-ecommerce.vercel.app/delivery/portal)

### 3. 👨‍💼 Admin Dashboard (Separate Vercel Application)
Manage product inventory, user accounts, order dispatching, support emails, and delivery agents:
* **Admin Dashboard URL:** [https://bala-ji-ai-ecommerce-sam3-six.vercel.app/](https://bala-ji-ai-ecommerce-sam3-six.vercel.app/)

### 4. 📋 Admin Fleet Directory (Inside Web App)
Verify delivery boy registration profiles and review GPS compliance shifts:
* **Admin Fleet Portal URL:** [https://bala-ji-ai-ecommerce.vercel.app/admin](https://bala-ji-ai-ecommerce.vercel.app/admin)

---

## 📁 Repository Structure

```
BALA-JI-AI-ECOMMERCE/
├── backend/       # Express & PostgreSQL Backend API Server
├── frontend/      # Customer-facing Vite + React Application
├── dashboard/     # Admin Portal Vite + React Application
└── README.md      # Root documentation
```

---

## ⚙️ Environment Configurations

Each folder contains a template `.env.example` or `config.env.example` file. To run the services locally or deploy them:

1. **Backend Server (`backend/config/config.env`)**:
   - Copy `backend/config/config.env.example` to `backend/config/config.env` and fill in your database credentials, Stripe keys, Gemini keys, and other required variables.

2. **Customer Frontend (`frontend/.env`)**:
   - Copy `frontend/.env.example` to `frontend/.env` and update the backend URL if running in production:
     ```env
     VITE_API_URL=http://localhost:4000/api/v1
     ```

3. **Admin Dashboard (`dashboard/.env`)**:
   - Copy `dashboard/.env.example` to `dashboard/.env` and update the backend URLs:
     ```env
     VITE_API_URL=http://localhost:4000/api/v1
     VITE_BACKEND_URL=http://localhost:4000
     ```

---

## 🚀 Running Locally

Open three terminal windows/tabs to run the services:

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### 2. Start Customer Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start Admin Dashboard
```bash
cd dashboard
npm install
npm run dev
```

---

## ☁️ Deployment Guide

When deploying this repository to hosting platforms like **Render**, **Railway**, or **Vercel**, configure them to run from their respective subfolders (Monorepo settings):

### 1. Backend API (e.g., Render, Railway, Fly.io)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add all keys defined in `config.env`.

### 2. Customer Frontend (e.g., Vercel, Netlify, Hostinger)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Add `VITE_API_URL` pointing to your deployed backend API URL (e.g., `https://your-backend.onrender.com/api/v1`).

### 3. Admin Dashboard (e.g., Vercel, Netlify)
- **Root Directory**: `dashboard`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Deployed API base (e.g., `https://your-backend.onrender.com/api/v1`)
  - `VITE_BACKEND_URL`: Deployed Backend host (e.g., `https://your-backend.onrender.com`)
