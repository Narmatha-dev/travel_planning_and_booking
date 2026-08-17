# 🌍 Travelora — AI-Powered Smart Travel Planning & Booking Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React.js](https://img.shields.io/badge/React.js-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479a1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0_Swagger-85ea2d?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:5000/docs)
[![Postman](https://img.shields.io/badge/Postman-v2.1_Tests-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](backend/tests/Travelora_API.postman_collection.json)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> An enterprise-grade, full-stack travel discovery, AI itinerary generation, curated package booking, payment simulation, review moderation, and role-based administration platform.

---

## 📌 Table of Contents

- [1. Problem Statement](#-1-problem-statement)
- [2. Project Objectives](#-2-project-objectives)
- [3. Key Features & Core Modules](#-3-key-features--core-modules)
- [4. AI Systems & Recommendation Engine](#-4-ai-systems--recommendation-engine)
- [5. System Architecture](#-5-system-architecture)
- [6. Technology Stack](#-6-technology-stack)
- [7. Database Schema & ER Design](#-7-database-schema--er-design)
- [8. API Documentation & OpenAPI/Swagger](#-8-api-documentation--openapiswagger)
- [9. Postman Test Suite](#-9-postman-test-suite)
- [10. Quickstart Installation Guide](#-10-quickstart-installation-guide)
- [11. Environment Configuration](#-11-environment-configuration)
- [12. Automated Testing](#-12-automated-testing)
- [13. Security & Compliance Measures](#-13-security--compliance-measures)
- [14. Future Roadmap & Enhancements](#-14-future-roadmap--enhancements)
- [15. Final Submission Checklist](#-15-final-submission-checklist)

---

## 🎯 1. Problem Statement

Modern travelers face fragmented friction across multiple disconnected platforms:
1. **Scattered Planning**: Browsing destinations on blogs, researching separate daily activities on maps, and manually scheduling itineraries.
2. **Generic Recommendations**: Traditional booking engines lack multi-factor explainable recommendation algorithms that account for traveler interests, budget pacing, travel styles, and trip duration simultaneously.
3. **Disconnected Booking & Payments**: Complicated checkout funnels with hidden fees and no seamless transition between custom day-by-day itineraries and curated tour packages.
4. **Lack of 24/7 Context-Aware Assistance**: Travelers struggle to receive instant, verified answers regarding travel seasons, package inclusions, and cancellation policies without human support delays.

---

## 🚀 2. Project Objectives

**Travelora** solves these challenges by providing a unified, AI-enhanced platform:
- **Intelligent Destination Discovery**: Filter and search global destinations with climate highlights, real-time ratings, and category clustering.
- **Explainable Multi-Factor AI Recommendations**: Dynamic recommendation engine scoring destinations based on interest affinity, budget constraints, travel styles (solo/couple/family/adventure), and trip duration.
- **Algorithmic Smart Itinerary Synthesis**: Automatic generation of structured Day 1..N itineraries featuring morning/afternoon/evening scheduled activities and 3-meal culinary suggestions.
- **24/7 AI Travel Chatbot**: Context-aware assistant with built-in PCI safety guardrails and chat history persistence.
- **Frictionless Booking & Payment Simulation**: End-to-end checkout with unique booking reference IDs (`BK-YYYY-XXXX`) and simulated payment authorizations (Credit Card, UPI, Net Banking) with zero PCI leakage.
- **Role-Based Access Control (RBAC)**: Secure multi-tier permissions (Traveler, Agent, Administrator) with a real-time analytics and management dashboard.

---

## 🌟 3. Key Features & Core Modules

| Module | Features & Capabilities |
| :--- | :--- |
| **1. Authentication & Security** | JWT token authentication, Bcrypt salted password hashing, profile management, and role validation (`admin`, `agent`, `traveler`). |
| **2. Destination Discovery** | Multi-attribute search (name, city, country, category), popularity sorting, price filtering, and user wishlist favorites. |
| **3. Curated Travel Packages** | Comprehensive package listings with pricing, duration, inclusion/exclusion breakdowns, and instant booking continuation. |
| **4. AI Trip Planning Wizard** | Interactive multi-step wizard generating day-by-day structured activities with places, timings, costs, and MySQL persistence. |
| **5. Booking Management** | End-to-end booking flow, unique booking references, booking history dashboard, status transitions, and 48-hour free cancellation. |
| **6. Simulated Payment Gateway** | Safe sandbox checkout supporting Cards, UPI, and Net Banking; automatic booking confirmation; zero sensitive card/CVV storage. |
| **7. Reviews & Ratings** | 1–5 star ratings, dynamic average score calculations, rating distributions, verified traveler tags, and author-owned CRUD. |
| **8. AI Recommendation Engine** | Weighted scoring algorithm (35% Interest, 25% Budget, 20% Style, 10% Duration, 10% History) with USD/INR currency conversions. |
| **9. AI Smart Itinerary Generator** | Algorithmic generation of daily activities, landmark visits, and breakfast/lunch/dinner culinary dining recommendations. |
| **10. AI Travel Chatbot** | Floating interactive widget answering queries on weather, budget planning, packages, activities, and policies with safe guardrails. |
| **11. Admin Analytics Dashboard** | Real-time platform KPI metrics (Revenue in USD & INR, Bookings, Users), user role/status management, destination/package CRUD, and review moderation. |

---

## 🧠 4. AI Systems & Recommendation Engine

### 1. Multi-Factor Travel Recommendation Engine

The recommendation engine calculates a normalized Match Score ($0\% - 100\%$) for every destination:

$$\text{Match Score} = (0.35 \times S_{\text{interest}}) + (0.25 \times S_{\text{budget}}) + (0.20 \times S_{\text{style}}) + (0.10 \times S_{\text{duration}}) + (0.10 \times S_{\text{history}})$$

- **Interest Affinity ($35\%$)**: Semantic match across tags (`beach`, `mountain`, `culture`, `adventure`, `luxury`).
- **Budget Fit ($25\%$)**: Evaluates traveler's daily allowance against destination cost tiers ($100\%$ score if within $\pm25\%$ threshold).
- **Travel Style ($20\%$)**: Matches target style (`solo`, `couple`, `family`, `friends`).
- **Duration Factor ($10\%$)**: Compares ideal stay duration with requested trip length.
- **Novelty / History ($10\%$)**: Boosts new destinations or rewards favored travel categories.

### 2. AI Smart Day-by-Day Itinerary Engine

```
   ┌────────────────────────────────────────────────────────┐
   │                   ITINERARY WORKFLOW                   │
   │  Step 1: Traveler Style & Interest Profiling           │
   │  Step 2: Dynamic Budget Allocation & Daily Pacing      │
   │          (Stay 40%, Dining 30%, Activities 20%, Mix 10%)│
   │  Step 3: Geographic Clustering of Proximate Places     │
   │  Step 4: Iconic 3-Meal Culinary Curation (B, L, D)     │
   │  Step 5: Contextual Travel Tips & Seasonal Advice      │
   └────────────────────────────────────────────────────────┘
```

### 3. AI Travel Chatbot ("Travelora AI Assistant")
- Multi-domain knowledge base covering weather, seasons, packages, pricing, and policies.
- **Strict Safety Guardrail**: Refuses to fabricate sensitive payment data (card numbers, CVVs, bank credentials) and directs users to authenticated account dashboards.

---

## 🏗️ 5. System Architecture

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                        REACT 18 FRONTEND (SPA)                          │
   │  • React Router DOM v6 • AppContext Global Auth • Responsive Vanilla CSS│
   │  • Interactive Pages: Home, Destinations, Packages, Trip Planner,       │
   │    Recommendations, Bookings, My Trips, Profile, Admin Dashboard,       │
   │    Floating AI Chatbot Widget                                           │
   └────────────────────────────────────┬────────────────────────────────────┘
                                        │  Axios HTTP / JSON (Bearer Token)
                                        ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                       EXPRESS.JS REST API SERVER                        │
   │  • Security: HTTP Headers (nosniff, SAMEORIGIN), CORS Whitelist         │
   │  • Auth Middleware (JWT Verification) • Admin Middleware (RBAC 403)     │
   │  • Modules: Auth, Destinations, Packages, Trips, Bookings, Payments,   │
   │    Reviews, Recommendations, Chatbot, Admin Statistics                  │
   │  • Swagger OpenAPI 3.0 Documentation at /docs                           │
   └────────────────────────────────────┬────────────────────────────────────┘
                                        │  Prepared Statements (mysql2/promise)
                                        ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                         MYSQL RELATIONAL DATABASE                       │
   │  • 10 InnoDB Tables with Foreign Key Constraints & Cascading Indexes    │
   │  • Dual-Layer In-Memory Resilient Fallback Store                        │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 6. Technology Stack

- **Frontend**: React 18, Vite 5.4, React Router DOM 6, CSS3 Modern Glassmorphism & Micro-animations.
- **Backend**: Node.js v18+, Express.js 4.21, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, CORS, Swagger UI Express.
- **Database**: MySQL 8.0+ (InnoDB, `utf8mb4`), `mysql2/promise` connection pooling.
- **API Documentation & Testing**: OpenAPI 3.0 (Swagger UI at `/docs`), Postman Collection v2.1, Native Node Test Suites.

---

## 🗄️ 7. Database Schema & ER Design

The database consists of **10 interconnected tables**:

```
users (id, full_name, email, password_hash, role, is_active)
  ├──< destinations (id, name, slug, country, city, category, rating)
  │      ├──< packages (id, destination_id, title, duration_days, base_price, is_available)
  │      ├──< trips (id, user_id, destination_id, package_id, total_budget, start_date, end_date)
  │      │      └──< trip_itineraries (id, trip_id, day_number, activity_time, title, cost)
  │      ├──< reviews (id, user_id, destination_id, package_id, rating, comment, is_approved)
  │      └──< favorites (id, user_id, destination_id)
  └──< bookings (id, user_id, package_id, destination_id, booking_reference, total_amount, status)
         └──< payments (id, booking_id, user_id, transaction_id, amount, status, payment_method)
```

---

## 📖 8. API Documentation & OpenAPI/Swagger

Interactive API documentation is accessible in real-time:
- **Swagger Interactive UI**: [`http://localhost:5000/docs`](http://localhost:5000/docs)
- **Raw OpenAPI Spec**: [`http://localhost:5000/docs.json`](http://localhost:5000/docs.json)

### Key API Endpoints

| Category | Method & Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Register new user account | Public |
| **Auth** | `POST /api/auth/login` | Login and obtain JWT token | Public |
| **Auth** | `GET /api/auth/profile` | Get current user profile | Bearer |
| **Destinations** | `GET /api/destinations` | Browse destinations with filters | Public |
| **Destinations** | `GET /api/destinations/search` | Search destinations by keyword | Public |
| **Packages** | `GET /api/packages` | List travel packages | Public |
| **Trips** | `POST /api/trips/generate-preview` | Generate day-by-day preview | Public |
| **Trips** | `POST /api/trips` | Save trip and day-wise activities | Bearer |
| **Bookings** | `POST /api/bookings` | Create new travel booking | Bearer |
| **Payments** | `POST /api/payments/process` | Simulate payment transaction | Bearer |
| **Reviews** | `GET /api/reviews` | Get destination reviews & aggregates | Public |
| **Reviews** | `POST /api/reviews` | Submit verified review | Bearer |
| **AI** | `POST /api/recommendations` | Compute personalized recommendations | Public |
| **AI** | `POST /api/trips/generate-ai-itinerary` | Generate AI day-wise smart itinerary | Public |
| **Chatbot** | `POST /api/chatbot/message` | AI Travel Assistant question & answer | Public |
| **Admin** | `GET /api/admin/stats` | Platform KPIs & revenue analytics | Admin |
| **Admin** | `GET /api/admin/users` | List platform users & change roles | Admin |
| **Admin** | `PUT /api/admin/bookings/:id/status` | Update booking lifecycle status | Admin |

---

## 🧪 9. Postman Test Suite

An exportable Postman Collection (v2.1) is available at:
📁 `backend/tests/Travelora_API.postman_collection.json`

Import this file into **Postman** to execute pre-configured requests with automated assertion scripts across all modules.

---

## ⚡ 10. Quickstart Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0+ (Optional: System runs with automatic resilient memory fallback if MySQL is offline)

### 1. Clone Repository
```bash
git clone https://github.com/Narmatha-dev/travel_planning_and_booking.git
cd travel_planning_and_booking
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run db:setup      # Initializes MySQL schema & seed data (optional)
npm start             # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev           # Starts Vite dev server on http://localhost:5173
```

---

## ⚙️ 11. Environment Configuration

### Backend Environment (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_travelora_jwt_production_key_2026
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=travel_booking_db
```

---

## 🔬 12. Automated Testing

Run the full end-to-end regression and security test suite across all 11 test modules:

```bash
cd backend
npm run test:all
```

### Test Suite Execution Output:
```
================================================================
  📊 FINAL SYSTEM TEST MATRIX & VERIFICATION REPORT             
================================================================
  ✔ [PASS]  1. User Authentication & Registration
  ✔ [PASS]  2. Destination Catalog & Full-Text Search
  ✔ [PASS]  3. Trip Planning & Itineraries
  ✔ [PASS]  4. Travel Packages & Pricing
  ✔ [PASS]  5. Booking Creation & Lifecycle
  ✔ [PASS]  6. Payment Processing & PCI Security
  ✔ [PASS]  7. Reviews & Star Ratings Aggregates
  ✔ [PASS]  8. AI Multi-Factor Recommendations
  ✔ [PASS]  9. AI Smart Day-by-Day Itinerary
  ✔ [PASS]  10. AI Travel Chatbot & Guardrails
  ✔ [PASS]  11. Admin Dashboard & RBAC Guards
----------------------------------------------------------------
  Total Test Suites: 11/11 Passed (100% Success)
================================================================
```

---

## 🛡️ 13. Security & Compliance Measures

1. **Password Protection**: Salted Bcrypt hashing with 10+ rounds. Plaintext passwords are never stored.
2. **JWT Security**: Signed tokens with tamper detection and automatic expiration checks.
3. **Role-Based Access Control**: Strict `adminMiddleware` returning `HTTP 403 Forbidden` for non-admin accounts.
4. **SQL Injection Prevention**: 100% parameterized SQL queries (`?` prepared statements).
5. **PCI-DSS Compliance**: Zero storage of sensitive credit card numbers or CVVs.
6. **HTTP Security Headers**: Injected `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
7. **CORS Isolation**: Whitelisted frontend origin communication.

---

## 🔮 14. Future Roadmap & Enhancements

- 🌐 **Real-time Forex Exchange**: Live multi-currency conversion APIs with automatic geo-detection.
- ✈️ **GDS Flight & Hotel APIs**: Direct integration with Amadeus / Sabre global distribution systems.
- 📱 **Progressive Web App (PWA)**: Offline itinerary caching and push notifications.
- 🗺️ **Interactive 3D Map View**: Mapbox GL integration with 3D terrain elevation and route paths.

---

## 📋 15. Final Submission Checklist

- [x] **Frontend**: Responsive React 18 UI with glassmorphism aesthetics, error handling, loading states, and full routing.
- [x] **Backend**: Modular Express.js REST API with standardized response schemas and robust error middleware.
- [x] **Database**: 10 relational MySQL InnoDB tables with foreign key cascades and resilient offline fallback.
- [x] **AI Systems**: Multi-factor recommendation scoring, day-wise smart itinerary generator, and 24/7 AI chatbot widget.
- [x] **Testing**: 11 automated test suites passing with 100% success rate, plus exportable Postman Collection v2.1.
- [x] **Security**: Bcrypt hashing, JWT authorization, RBAC 403 guards, SQL injection prevention, and PCI compliance.
- [x] **Documentation**: Complete portfolio-grade `README.md`, Swagger OpenAPI documentation, and test logs.
- [x] **GitHub**: Clean repository status, verified `.gitignore`, no committed `.env` secrets, and release tagged `v1.0.0`.

---

**Developed with ❤️ for the Advanced Travel Planning & Booking Platform Submission.**
