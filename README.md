# 🛒 1. Project Banner — Balaji Mart

<p align="center">
  <img src="screenshots/customer_home.png" alt="Balaji Mart Enterprise Banner" width="100%" style="border-radius: 12px; box-shadow: 0px 8px 30px rgba(0,0,0,0.3);" />
</p>

<p align="center">
  <a href="https://bala-ji-ai-ecommerce.vercel.app/"><img src="https://img.shields.io/badge/Customer%20Portal-Live%20Demo-brightgreen?style=for-the-badge&logo=vercel" alt="Customer Portal"></a>
  <a href="https://bala-ji-ai-ecommerce-sam3-six.vercel.app/"><img src="https://img.shields.io/badge/Admin%20Dashboard-Live%20Demo-blue?style=for-the-badge&logo=vercel" alt="Admin Dashboard"></a>
  <a href="https://bala-ji-ai-ecommerce.vercel.app/delivery/portal"><img src="https://img.shields.io/badge/Delivery%20Portal-Live%20Demo-orange?style=for-the-badge&logo=vercel" alt="Delivery Portal"></a>
  <img src="https://img.shields.io/badge/Node.js-v20-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/React-v19-blue?style=for-the-badge&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/PostgreSQL-v16-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 🔗 Live Deployed Portals

Access all enterprise modules live on Vercel:

| Portal Component | Direct Access URL | Core Functions & Highlights |
| :--- | :--- | :--- |
| 🛒 **Customer Storefront** | [https://bala-ji-ai-ecommerce.vercel.app/](https://bala-ji-ai-ecommerce.vercel.app/) | AI Semantic Search, Aura Voice Assistant, Cart, Stripe Payments |
| 👨‍💼 **Admin Control Hub** | [https://bala-ji-ai-ecommerce-sam3-six.vercel.app/](https://bala-ji-ai-ecommerce-sam3-six.vercel.app/) | Inventory Management, Sales Analytics, AI Marketing Studio |
| 🚚 **Delivery Registration** | [https://bala-ji-ai-ecommerce.vercel.app/delivery/register](https://bala-ji-ai-ecommerce.vercel.app/delivery/register) | Driver onboarding, vehicle details, document verification uploads |
| 🚚 **Delivery Biometric Login** | [https://bala-ji-ai-ecommerce.vercel.app/delivery/login](https://bala-ji-ai-ecommerce.vercel.app/delivery/login) | Real-time webcam facial verification shift clock-in |
| 🚚 **Delivery Fleet Portal** | [https://bala-ji-ai-ecommerce.vercel.app/delivery/portal](https://bala-ji-ai-ecommerce.vercel.app/delivery/portal) | Active shift dashboard, order dispatches, simulated GPS route tracker |
| 📋 **Admin Fleet Management** | [https://bala-ji-ai-ecommerce.vercel.app/admin](https://bala-ji-ai-ecommerce.vercel.app/admin) | Review driver applications, baseline face descriptors & shift logs |

---

## 📖 2. Project Introduction

**Balaji Mart** is a next-generation, enterprise-grade E-Commerce ecosystem powered by Artificial Intelligence (AI). Built for modern digital commerce, it seamlessly unifies three critical operational pillars:

1. **Customers**: Enjoy an intuitive shopping experience with natural language AI search, camera visual product search, live OCR text extraction, an interactive voice shopping assistant (**Aura**), and PCI-compliant Stripe checkout.
2. **Administrators**: Control inventory CRUD operations, track real-time revenue analytics charts, generate automated AI marketing campaigns, and oversee delivery driver compliance.
3. **Delivery Partners**: Complete secure shift clock-ins using browser-based webcam facial biometric verification, accept assigned orders, and navigate live delivery routes with real-time GPS tracking.

---

## 🚀 3. Features Overview

Here is a simple, easy-to-understand breakdown of key platform features:

* 🔐 **Secure Authentication**: Multi-mode login supporting Email/Password, Google OAuth, and 2-Factor OTP verification.
* ⚡ **Instant Catalog Browsing**: Real-time multi-attribute filtering by category, price range, customer ratings, and stock availability.
* ⚖️ **Side-by-Side Comparison**: Compare technical specifications and prices of up to 4 products simultaneously.
* 🛒 **Smart Shopping Cart**: Real-time price calculation, coupon discount applications, and dynamic tax estimations.
* 💳 **Stripe Payment Gateway**: Secure credit card payments powered by Stripe Elements with automated digital PDF invoice generation.
* ⭐ **Verified Product Reviews**: Verified buyers can leave 1-to-5 star ratings, detailed written feedback, and photo attachments.
* 💖 **Personalized Wishlist**: Bookmark favorite items for one-click future purchases.

---

## 🤖 4. Artificial Intelligence Suite

Balaji Mart integrates 6 specialized AI engines to transform online shopping:

* 🎙️ **AI Salesman Aura**: A conversational AI powered by OpenAI GPT-4. Aura understands voice and text inputs, recommends tailored products, and navigates users across the store.
* 🧠 **AI Semantic Vector Search**: Search using natural sentences (e.g., *"lightweight laptop for coding and video editing"*) and receive precise matches using 384-dimensional vector embeddings.
* 📷 **AI Camera Visual Search**: Snap or upload a photo of any item to locate visually similar products in the store catalog instantly.
* 📄 **AI OCR Text Extraction**: Extract printed text from images (like brand labels or book titles) via Tesseract.js to search the store instantly.
* 🎨 **AI Marketing Studio**: Automatically generate promotional banner copy, social media ad copy, and customer email newsletters in one click.
* 🎬 **AI Video Storyboard Studio**: Auto-create video ad reels and promotional storyboards for top-performing products.

---

## 💻 5. Technology Stack

| Layer | Technology Stack | Version / Specification | Engineering Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | v19.1.0 | Fast, responsive, component-based Single Page Application (SPA) |
| **Build Tool** | Vite | v7.0.4 | Ultra-fast module bundling and hot module replacement |
| **Styling & Motion** | Tailwind CSS + Framer Motion | v3.4 + v12.40 | Sleek dark-mode theme with fluid micro-animations |
| **State Management** | Redux Toolkit | v2.8.2 | Centralized store managing cart, user auth, wishlist, and search state |
| **Backend Framework** | Node.js + Express.js | v20.x | High-performance RESTful API Gateway and business logic routing |
| **Database System** | PostgreSQL | v16.x (21 Tables) | Enterprise relational database storing users, orders, stock, and logs |
| **Edge & Local AI** | `@xenova/transformers` + `face-api.js` | All-MiniLM-L6-v2 + SSD Mobilenet | Local 384D vector search embeddings & 128-point webcam facial matching |
| **Cloud Integration** | Stripe API + Cloudinary CDN + OpenAI GPT-4 | Production APIs | PCI-compliant payments, image asset hosting, and conversational AI |

---

## 🏗️ 6. System Architecture & Workflow Diagram

Here is the interactive end-to-end system workflow diagram showing how data flows across the platform:

```mermaid
graph TB
    %% Styling Classes
    classDef client fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef localAI fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef backend fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef db fill:#064e3b,stroke:#059669,stroke-width:2px,color:#fff;
    classDef saas fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff;

    %% 👥 CLIENT PRESENTATION LAYER
    subgraph Layer1["👥 1. Client Presentation Layer (React 19 + Tailwind CSS)"]
        C1["🛒 Customer Storefront<br/>• Catalog & Multi-Filter<br/>• Aura AI Voice Bot<br/>• Cart & Stripe Checkout"]:::client
        C2["👨‍💼 Admin Control Hub<br/>• Product Inventory CRUD<br/>• Revenue Analytics Charts<br/>• AI Campaign Generator"]:::client
        C3["🚚 Delivery Fleet App<br/>• Driver Registration<br/>• Webcam Biometric Login<br/>• Shift & GPS Route Portal"]:::client
    end

    %% 💻 BROWSER ENGINE & LOCAL AI LAYER
    subgraph Layer2["💻 2. React 19 Frontend Engine & Edge AI"]
        FE1["⚡ Redux Toolkit<br/>(Cart, Auth, Wishlist, State)"]:::localAI
        FE2["👁️ face-api.js<br/>(128D Face Descriptor Matrix)"]:::localAI
        FE3["🧠 @xenova/transformers<br/>(384D Vector Embeddings)"]:::localAI
        FE4["📄 Tesseract.js<br/>(Client OCR Text Scanner)"]:::localAI
    end

    %% ⚙️ BACKEND REST API GATEWAY LAYER
    subgraph Layer3["⚙️ 3. Node.js + Express API Gateway"]
        BE1["🔒 Auth & Security Middleware<br/>(HttpOnly Cookie + JWT Verification)"]:::backend
        BE2["📦 Product & Vector Search Controller<br/>(Cosine Similarity + Catalog Queries)"]:::backend
        BE3["💳 Order & Stripe Intent Handler<br/>(PCI-DSS Compliant Transactions)"]:::backend
        BE4["🚛 Delivery Dispatcher & GPS Engine<br/>(Shift Tracking & GPS Logging)"]:::backend
    end

    %% ☁️ DATA STORAGE & SAAS SERVICES LAYER
    subgraph Layer4["☁️ 4. Data Storage & SaaS Cloud Layer"]
        DB[(📊 PostgreSQL Database<br/>21 Relational Tables<br/>Users, Stock, Orders, Logs)]:::db
        STRIPE["💳 Stripe Payment API<br/>(Credit Card Tokens & Receipts)"]:::saas
        OPENAI["🤖 OpenAI GPT-4 API<br/>(Aura Conversational Brain)"]:::saas
        CLOUDINARY["🖼️ Cloudinary CDN<br/>(Product & Avatar Image Hosting)"]:::saas
    end

    %% Workflow Data Flow Connections
    C1 -->|Customer Interactions| FE1
    C2 -->|Admin Operations| FE1
    C3 -->|Webcam Video Feed| FE2

    FE1 -->|384D Vector Calculation| FE3
    FE1 -->|Image OCR Extraction| FE4
    FE1 == "HTTPS REST API (HttpOnly JWT Cookies)" ==> BE1

    BE1 -->|Auth & Router Dispatch| BE2
    BE1 -->|Auth & Router Dispatch| BE3
    BE1 -->|Auth & Router Dispatch| BE4

    BE2 <-->|Relational Queries| DB
    BE3 <-->|Process Payments| STRIPE
    BE1 <-->|Prompt & Response Stream| OPENAI
    BE2 <-->|Upload & Fetch Media| CLOUDINARY
```

### 🔄 End-to-End Execution Workflow (5 Simple Steps):

1. 👤 **User Trigger**: Customer, Admin, or Delivery Driver interacts with the React 19 Single Page Application.
2. ⚡ **Local AI Computation**: Client-side AI algorithms (`face-api.js` for facial landmarks or `@xenova/transformers` for 384D vectors) process input locally in milliseconds.
3. 🔒 **Secure API Transport**: Requests travel over HTTPS with HttpOnly JWT session validation to the Node.js/Express backend gateway.
4. 🗄️ **Data & Service Execution**: The backend reads/writes to PostgreSQL (21 relational tables) while coordinating with Stripe API and OpenAI GPT-4.
5. 📊 **Instant State Update**: Structured JSON responses update Redux Toolkit state, instantly re-rendering UI components with smooth animations.

---

## 📁 7. Repository Structure

Balaji Mart is organized as a clean **Monorepo**:

```text
BALA-JI-AI-ECOMMERCE/
├── frontend/                # Customer Storefront & Delivery Fleet App (React 19 + Vite)
│   ├── src/
│   │   ├── components/      # UI Components (Navbar, Cart, AISalesman, Comparison)
│   │   ├── pages/           # Store & Delivery Pages (Home, Products, Admin, Delivery)
│   │   ├── store/           # Redux Toolkit Slices (auth, cart, product, popup)
│   │   └── utils/           # AI Utilities (vector Search, face Recognition)
│   └── public/              # Static Assets & Video Demos
├── backend/                 # Node.js + Express API Server
│   ├── controllers/         # API Business Logic (Auth, Products, Orders, Delivery)
│   ├── database/            # PostgreSQL Connection & Migrations (21 Tables)
│   ├── models/              # Schema Definitions & Relational Data Mapping
│   └── router/              # API Route Endpoints
├── dashboard/               # Admin Management Portal Architecture
├── screenshots/             # High-Resolution Application Screenshots & Preview GIFs
├── vercel.json              # Vercel Deployment & SPA Routing Rules
├── package.json             # Root Dependencies & Build Scripts
└── README.md                # Master Project Documentation
```

---

## 🚀 8. Quick Start Installation Guide

Run Balaji Mart locally in 3 steps:

### Step 1: Clone Repository
```bash
git clone https://github.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE.git
cd BALA-JI-AI-ECOMMERCE
```

### Step 2: Install Project Dependencies
```bash
# Install root & backend dependencies
cd backend && npm install

# Install customer frontend dependencies
cd ../frontend && npm install

# Install dashboard dependencies
cd ../dashboard && npm install
```

### Step 3: Launch Development Servers
```bash
# Terminal 1: Backend Server (Runs on Port 4000)
cd backend && npm run dev

# Terminal 2: Customer Storefront (Runs on Port 5173)
cd frontend && npm run dev

# Terminal 3: Admin Dashboard (Runs on Port 5174)
cd dashboard && npm run dev
```

---

## 🔑 9. Environment Configuration

### Backend Environment File (`backend/config/config.env`):
```ini
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/balajimart
JWT_SECRET=balaji_mart_enterprise_jwt_secure_key_2026
STRIPE_SECRET_KEY=sk_test_51P...your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENAI_API_KEY=sk-proj-...your_openai_api_key
```

### Frontend Environment File (`frontend/.env`):
```ini
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 📊 10. Database Schema (21 Relational Tables)

Balaji Mart relies on a normalized **PostgreSQL** schema consisting of 21 interconnected tables:

| # | Table Name | Core Purpose | Key Attributes / Data Tracked |
| :--- | :--- | :--- | :--- |
| **1** | `userTable` | User Accounts | ID, Name, Email, Password Hash, Role (`customer`, `delivery`, `admin`), Avatar |
| **2** | `productTable` | Product Catalog | ID, Title, Category, Price, Stock, Image, 384D Vector Embeddings |
| **3** | `productReviewsTable` | Customer Reviews | ID, Product ID, User ID, Star Rating (1-5), Comment, Timestamp |
| **4** | `productReelsTable` | Video Reels | ID, Product ID, Reel Video URL, Title, Likes Count |
| **5** | `ordersTable` | Customer Orders | ID, User ID, Total Amount, Order Status, Payment Status, Created Date |
| **6** | `orderItemsTable` | Order Line Items | ID, Order ID, Product ID, Quantity, Unit Price |
| **7** | `orderReturnsTable` | Return Requests | ID, Order ID, Return Reason, Status (`pending`, `approved`, `refunded`) |
| **8** | `shippinginfoTable` | Shipping Address | ID, Order ID, Street Address, City, Zip Code, Recipient Phone |
| **9** | `paymentsTable` | Payment Records | ID, Order ID, Stripe Payment Intent ID, Amount, Receipt URL |
| **10** | `deliveryAgentsTable` | Driver Profiles | ID, User ID, Vehicle Type, License No, Baseline Facial Descriptor Array |
| **11** | `deliveryShiftBookingsTable` | Driver Shifts | ID, Driver ID, Shift Date, Slot Hours, Booking Status |
| **12** | `deliveryAgentWorkLogsTable` | Shift Timestamps | ID, Driver ID, Clock-in Time, Clock-out Time, Biometric Verification Match % |
| **13** | `deliveryAgentGpsLogsTable` | Real-Time GPS | ID, Driver ID, Latitude, Longitude, Recorded Speed, Timestamp |
| **14** | `deliveryAgentOfflineLogsTable` | Offline Logs | ID, Driver ID, Disconnect Timestamp, Reconnect Timestamp, Reason |
| **15** | `finesTable` | Compliance Fines | ID, Driver ID, Violation Type, Fine Amount, Status (`unpaid`, `paid`) |
| **16** | `supportChatsTable` | Live AI Support | ID, User ID, Session ID, User Message, AI Response |
| **17** | `supportEmailsTable` | Support Tickets | ID, User Email, Subject, Query Body, Resolution Status |
| **18** | `salesCampaignsTable` | Ad Campaigns | ID, Campaign Name, Banner Image, Discount %, Start Date, End Date |
| **19** | `SiteSettings` | Global Config | Announcement Text, Default Currency, Maintenance Mode Flag |
| **20** | `userAddressesTable` | Address Book | ID, User ID, Address Label (`home`, `work`), Full Address, Phone |
| **21** | `browsingHistoryTable` | User Activity | ID, User ID, Product ID, View Count, Timestamp for AI Recommendations |

---

## 🖼️ 11. Screenshots & UI Feature Walkthrough

<p align="center">
  <img src="screenshots/customer_home.png" alt="Customer Storefront UI" width="48%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
  <img src="screenshots/admin_dashboard.png" alt="Admin Control Hub UI" width="48%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</p>
<p align="center">
  <img src="screenshots/delivery_login.png" alt="Delivery Biometric Login UI" width="48%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
  <img src="screenshots/github_live_readme.png" alt="GitHub Repository Overview" width="48%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</p>

---

## 🎥 12. Demo Video & Walkthrough (3 Portal Demonstration Videos)

### 📹 Video 1: Customer Storefront & AI Features Walkthrough (10 Mins)
> **Demonstrates**: Natural Language Vector Search, Aura Voice Salesman, Camera Search, OCR Text Extraction, Shopping Cart, and Stripe Payment Elements.

<p align="center">
  <a href="https://raw.githubusercontent.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE/main/customer_demo_walkthrough.mp4">
    <img src="screenshots/customer_demo_preview.gif" alt="Customer App Live Demo Walkthrough" width="90%" style="border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);" />
  </a>
  <br/>
  <sub>▶️ <b>Live Auto-Playing Video Walkthrough</b> — (Plays inline directly on GitHub README)</sub>
</p>

<br/>

### 📹 Video 2: Admin Dashboard & AI Studio Walkthrough (10 Mins)
> **Demonstrates**: Inventory CRUD management, Sales Analytics Charts, User Access Controls, AI Marketing Campaign Generator, and AI Video Storyboard Engine.

<p align="center">
  <a href="https://bala-ji-ai-ecommerce.vercel.app/demo-video" target="_blank">
    <img src="screenshots/admin_demo_preview.gif" alt="Admin Dashboard Video Walkthrough" width="90%" style="border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);" />
  </a>
  <br/>
  <sub>🎬 <b><a href="https://bala-ji-ai-ecommerce.vercel.app/demo-video" target="_blank">▶️ Click Here to Watch Full 2:33 Min HD Video (with YouTube Song)</a></b> — (Opens Full-Screen Player, No Download)</sub>
</p>

<br/>

### 📹 Video 3: Delivery Partner & Biometric Webcam Portal (10 Mins)
> **Demonstrates**: Driver Registration & Document Uploads, Live Webcam Facial Biometric Verification Login, Active Shift Portal, and Simulated GPS Route Navigation.

<p align="center">
  <a href="https://raw.githubusercontent.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE/main/delivery_boy.mp4">
    <img src="screenshots/delivery_demo_preview.gif" alt="Delivery Partner Video Walkthrough" width="90%" style="border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);" />
  </a>
  <br/>
  <sub>▶️ <b>Live Auto-Playing Video Walkthrough</b> — (Plays inline directly on GitHub README)</sub>
</p>

---

## 🔌 13. Core REST API Endpoints

Primary API gateway endpoints powering the platform:

| Endpoint Path | Method | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Public | Register new customer or delivery partner account |
| `/api/v1/auth/login` | `POST` | Public | Authenticate user & issue HttpOnly JWT cookie |
| `/api/v1/products` | `GET` | Public | Fetch paginated product catalog with category & price filters |
| `/api/v1/products/semantic-search` | `POST` | Public | Execute 384D vector search matching natural language queries |
| `/api/v1/orders/create` | `POST` | Customer | Create order record and return Stripe Client Secret |
| `/api/v1/delivery/verify-face` | `POST` | Delivery | Match webcam 128-point face descriptor against registered profile |
| `/api/v1/admin/users/block` | `POST` | Admin | Lock or restore user account access |

---

## 🧠 14. Deep Dive: AI & Machine Learning Infrastructure

* **Dense Vector Semantic Search**:
  When a product is added, `@xenova/transformers` (running the `all-MiniLM-L6-v2` neural model) converts product titles and descriptions into a **384-dimensional floating-point vector**. When a user types a query like *"waterproof watch for swimming"*, Cosine Similarity measures the angular distance between the query vector and catalog vectors to return contextually matching products—even if the exact words don't match.

* **Biometric Facial Recognition**:
  Using `face-api.js` (SSD Mobilenet v1 neural network), the browser captures real-time video frames from the delivery partner's webcam, detects facial landmarks, and computes a **128-point facial descriptor matrix**. The backend verifies this descriptor against the driver's registered baseline with 98%+ confidence before granting shift clock-in access.

---

## 🛍️ 15. Customer Storefront Module

* **Smart Product Discovery**: Instant instant search, price sliders, category chips, customer rating filters, and stock indicators.
* **Multi-Product Specification Comparison**: Compare prices, dimensions, warranty, and ratings of up to 4 items in a clean side-by-side drawer.
* **Seamless Checkout & Payment**: Integrated Stripe Elements UI supporting credit cards with instant PDF invoice downloads upon payment confirmation.

---

## 👨‍💼 16. Admin Control Hub Module

* **Inventory CRUD & Catalog Operations**: Add new items, update pricing, upload product images, adjust stock counts, and soft-delete items.
* **Executive Sales Analytics**: Interactive charts powered by Recharts showing total monthly revenue, order volume, return rates, and top-performing categories.
* **Driver Onboarding & Fleet Compliance**: Review uploaded driver licenses, inspect baseline facial photos, and manage driver fines and shift bookings.

---

## 🚚 17. Delivery Fleet & Biometric Module

* **Biometric Shift Clock-In**: Live webcam facial verification ensures zero shift-sharing and absolute identity verification.
* **Active Shift & Dispatch Portal**: Drivers view assigned delivery packages, mark items as delivered, track earnings, and follow simulated live GPS turn-by-turn routes.

---

## 📣 18. AI Marketing Studio Module

An automated marketing assistant that evaluates store sales trends and product reviews to generate high-converting promotional campaign banners, social media posts, and targeted email newsletters with a single click.

---

## 🎬 19. AI Video Storyboard Studio Module

Automatically creates vertical promotional video reels and visual storyboards for catalog products. These video reels are showcased directly on the customer homepage in a modern TikTok/Instagram-style shopping feed.

---

## 💫 20. AI Salesman Aura

Positioned at the bottom-right of the storefront, **Aura** is an interactive shopping assistant powered by OpenAI GPT-4. Users can chat with Aura via voice or text to get instant product recommendations, ask technical questions, and navigate directly to product pages.

---

## 🔎 21. Hybrid AI Search Engine

Combines standard SQL keyword matching with 384-dimensional vector semantic search. This dual approach guarantees that exact keyword queries (e.g., *"iPhone 15 Pro"*) and descriptive natural queries (e.g., *"durable phone with great camera"*) return accurate results.

---

## 🔒 22. Enterprise Security & Compliance

* **HttpOnly JWT Session Storage**: Prevents XSS script execution from stealing session tokens.
* **Bcrypt Password Encryption**: All user credentials are hashed using `bcrypt` with salt rounds.
* **Biometric Facial Liveness Checks**: Prevents photo-impersonation during driver shift verification.
* **Stripe PCI-DSS Level 1 Compliance**: Sensitive credit card details never touch our application servers.

---

## 🔮 23. Future Innovations & Roadmap

* 🎙️ **End-to-End Voice Checkout**: Complete item selection, address entry, and payment using voice commands.
* 🗺️ **Automated Route Optimization**: Mapbox Directions API integration for multi-stop delivery driver routing.
* 📱 **Native Mobile Apps**: Cross-platform iOS and Android mobile apps built with React Native.

---

## 👥 24. Team

- **Premdeep Gupta** — Lead Full-Stack Architect & AI Engineer
- **Development Team** — Balaji Mart Engineering Group

---

## 📜 25. License

This project is licensed under the **MIT License**. See the `LICENSE` file for full details.

---

## 📞 26. Contact & Support

For inquiries, enterprise deployment, or collaboration:
- **Lead Developer**: Premdeep Gupta
- **GitHub Repository**: [https://github.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE](https://github.com/Premdeep-Gupta/BALA-JI-AI-ECOMMERCE)
- **Live Production App**: [https://bala-ji-ai-ecommerce.vercel.app/](https://bala-ji-ai-ecommerce.vercel.app/)

---

<p align="center">
  Built with ❤️ for Next-Generation AI E-Commerce | <b>Balaji Mart 2026</b>
</p>
