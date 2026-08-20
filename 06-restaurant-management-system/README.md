# Restaurant Management & Billing System

A full-stack, production-quality restaurant management and billing platform built with **React (Vite) + Tailwind CSS** on the frontend and **Node.js/Express + PostgreSQL** on the backend, with JWT authentication, role-based access control, and PDF invoice generation via PDFKit.

---

## 1. Tech Stack

| Layer          | Technology                                   |
|----------------|-----------------------------------------------|
| Frontend       | React 18, Vite, React Router 6, Tailwind CSS, Axios |
| Backend        | Node.js, Express.js                          |
| Database       | PostgreSQL                                   |
| Auth           | JWT + bcrypt                                 |
| Invoices       | PDFKit                                       |
| Architecture   | MVC (Routes → Controllers → Services → DB)   |

---

## 2. Folder Structure

```
restaurant-management-system/
├── backend/
│   ├── src/
│   │   ├── config/        # DB pool + env config
│   │   ├── controllers/   # Thin HTTP handlers
│   │   ├── services/      # Business logic (transactions live here)
│   │   ├── routes/        # Express routers, wired with auth/role/validation
│   │   ├── middleware/    # auth, role, error handling, validation
│   │   ├── validators/    # express-validator rule sets
│   │   ├── utils/         # ApiError, asyncHandler, jwt, apiResponse, invoiceNumber
│   │   ├── db/             # schema.sql, seed.sql, init.js
│   │   └── app.js
│   ├── invoices/           # Generated PDF invoices (gitignored)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/            # axios instance + typed endpoint wrappers
│   │   ├── context/         # AuthContext (JWT session, role helpers)
│   │   ├── components/
│   │   │   ├── common/      # LoadingSpinner, EmptyState, Modal, StatusBadge, ErrorBanner
│   │   │   └── layout/      # AppLayout, Sidebar, Topbar
│   │   ├── pages/            # one folder per module (auth, dashboard, menu, categories,
│   │   │                      tables, orders, billing, sales, reports, users, profile)
│   │   ├── routes/           # ProtectedRoute (auth + role guard)
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 3. Database Design

Fully normalized PostgreSQL schema (see `backend/src/db/schema.sql`):

- **users** — admin / cashier / waiter, bcrypt password hashes, soft-deactivation via `is_active`
- **categories** — menu categories
- **menu_items** — FK → categories, price, availability
- **restaurant_tables** — table number, capacity, status (available/occupied/reserved)
- **orders** — FK → tables, waiter; status lifecycle (pending → preparing → served → completed/cancelled)
- **order_items** — FK → orders, menu_items; **price is snapshotted at order time** so historical bills are unaffected by future menu price changes
- **bills** — FK → orders (1:1); subtotal, discount, GST, grand total, payment method/status
- **invoices** — FK → bills (1:1); invoice number, generated PDF path

All tables use `SERIAL` primary keys, explicit foreign keys with appropriate `ON DELETE` rules, `CHECK` constraints on numeric fields, indexes on foreign keys and frequently filtered columns, and `updated_at` triggers.

---

## 4. Installation Guide

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 13

### Step 1 — Clone & configure environment

```bash
cd backend
cp .env.example .env
# edit .env with your PostgreSQL credentials and a strong JWT_SECRET

cd ../frontend
cp .env.example .env
# defaults to http://localhost:5000/api — adjust if needed
```

### Step 2 — Create the database

```sql
CREATE DATABASE restaurant_db;
```

### Step 3 — Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 4 — Initialize schema + seed data

```bash
cd backend
npm run db:init
```

This runs `schema.sql` (tables, enums, indexes, triggers) followed by `seed.sql` (demo users, categories, menu items, tables).

> **Demo accounts** (password for all: `Password123!`)
> - Admin: `admin@restaurant.com`
> - Cashier: `cashier@restaurant.com`
> - Waiter: `waiter@restaurant.com`

### Step 5 — Run the app

```bash
# Terminal 1
cd backend && npm run dev      # http://localhost:5000

# Terminal 2
cd frontend && npm run dev     # http://localhost:5173
```

---

## 5. Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 6. API Documentation (summary)

Base URL: `/api`

| Module | Endpoint | Method | Roles |
|---|---|---|---|
| Auth | `/auth/login` | POST | Public |
| Auth | `/auth/me` | GET | Any authenticated |
| Users | `/users` | GET/POST | admin |
| Users | `/users/:id`, `/users/:id/password` | PUT/DELETE | admin |
| Categories | `/categories` | GET | Any authenticated |
| Categories | `/categories`, `/categories/:id` | POST/PUT/DELETE | admin |
| Menu | `/menu-items?search=&categoryId=&available=` | GET | Any authenticated |
| Menu | `/menu-items`, `/menu-items/:id` | POST/PUT/DELETE | admin |
| Tables | `/tables?status=` | GET | Any authenticated |
| Tables | `/tables`, `/tables/:id` | POST/PUT/DELETE | admin |
| Orders | `/orders?status=&date=` | GET | Any authenticated |
| Orders | `/orders` | POST | admin, waiter |
| Orders | `/orders/:id/items` | PUT | admin, waiter |
| Orders | `/orders/:id/status` | PUT | admin, waiter, cashier |
| Orders | `/orders/:id` | DELETE | admin, waiter |
| Billing | `/bills?status=&from=&to=&search=` | GET | admin, cashier |
| Billing | `/bills` | POST | admin, cashier |
| Billing | `/bills/:id/payment` | PUT | admin, cashier |
| Invoices | `/invoices/bill/:billId` | POST (generate PDF) | admin, cashier |
| Invoices | `/invoices/download/:invoiceNumber` | GET (download PDF) | admin, cashier |
| Dashboard | `/dashboard/summary` | GET | Any authenticated |
| Reports | `/reports/sales?period=&from=&to=` | GET | admin |
| Reports | `/reports/best-sellers?from=&to=&limit=` | GET | admin |
| Reports | `/reports/revenue?from=&to=` | GET | admin |

All responses are shaped as `{ success, message, data }`. Errors return `{ success: false, message, details? }` with an appropriate HTTP status.

Authenticated requests must send `Authorization: Bearer <token>`.

---

## 7. Key Business Rules

- **Billing math**: `subtotal → discount% off subtotal → GST% on the discounted (taxable) amount → grand total`.
- **Order → Bill → Invoice** is a one-way pipeline: an order can only be billed once (`bills.order_id` is unique), and billing atomically marks the order `completed`.
- **Table lifecycle**: creating an order marks the table `occupied`; completing/cancelling the order (or marking a bill `paid`) frees it back to `available`.
- **Price snapshotting**: `order_items.unit_price` is copied from the menu at order time, so later menu price edits never retroactively change historical bills.
- Multi-step operations (order creation, order item updates, bill generation) run inside PostgreSQL transactions with row locking (`FOR UPDATE`) to stay consistent under concurrent access.

---

## 8. Testing Instructions

Automated tests are not included in this deliverable; the project is structured (thin controllers, isolated services, a shared `query`/`getClient` DB layer) to make unit and integration testing straightforward to add — e.g. with Jest + Supertest against the Express `app` export, and a test PostgreSQL database seeded per test run.

**Manual verification performed:**
- `node --check` passed on every backend source file.
- Backend `src/app.js` loads cleanly with `require()`.
- Frontend `npm run build` completes with zero errors (Vite production build).

**Suggested manual test flow:**
1. Log in as each role and confirm the sidebar only shows permitted modules.
2. As admin: create a category → a menu item in it → a table.
3. As waiter: place an order against that table with 2+ items; watch the table flip to `occupied`.
4. Advance the order to `served`.
5. As cashier: generate a bill (try a discount %), mark it `paid`, download the PDF invoice.
6. As admin: check Dashboard and Reports reflect the new order/bill.

---

## 9. Future Improvements

- Automated test suite (Jest/Supertest for API, React Testing Library for UI)
- Refresh tokens / token revocation list for logout
- Table reservations with time slots, not just a status flag
- Kitchen Display System (KDS) view filtered to `pending`/`preparing` orders
- Real-time updates (WebSockets) for order status and table availability
- Multi-branch / multi-restaurant support
- Menu item images via file upload + object storage
- Rate limiting and audit logging on sensitive admin actions
- CSV/Excel export for reports

---

## 10. Sample Data

Seeded via `npm run db:init` (`backend/src/db/seed.sql`): 3 users (one per role), 5 categories, 10 menu items, 6 tables — enough to exercise every module immediately after setup.
