# Expense Tracker

A full-stack personal expense tracking application.

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Lucide React, Recharts
**Backend:** Node.js, Express.js (MVC architecture)
**Database:** PostgreSQL
**Auth:** JWT + bcrypt

## Features

- Signup / Login / Logout with JWT auth and protected routes
- Dashboard: hero overview, quick actions, total income/expenses/balance/savings, recent transactions, monthly expense chart, category breakdown
- Transactions: full CRUD, search, filter by type/category, sort, pagination
- Categories: 12 seeded defaults (Food, Groceries, Bills, Shopping, Travel, Entertainment, Gym & Sports, Education, Medical, Other, Salary, Investments), plus unlimited custom categories (including ones created automatically from Monthly Financial Plan allocations)
- Analytics: monthly spending, income vs expense, category distribution, monthly trends, top spending categories
- Reports page: CSV, Excel, and PDF export
- **Import Center**: import transactions from a **Bank Statement (.csv)**, **Credit Card Statement (.csv)**, **Excel Statement (.xlsx)**, or **UPI Export (.csv)** (Google Pay, PhonePe, Paytm, or BHIM transaction history exports) — accessible from Dashboard Quick Actions and the Transactions page. A 5-step wizard (Choose Import Type → Upload → Preview → Review Categories → Import Summary) auto-detects column layouts (Date, Narration/Description, Debit/Credit or Amount, UPI payee/payer fields, etc.), falls back to a manual column-mapping screen if detection fails, infers income vs. expense (including from a single Amount + Debit/Credit-label column, common in UPI exports), and auto-suggests a category from the merchant name. Likely duplicates are flagged against existing transactions with a per-row Skip/Import Anyway choice. The final Import Summary is a full financial snapshot — total imported/skipped/failed, income/expenses/current savings, top spending category, largest expense, most frequent merchant, average daily spend, savings rate, and (if the Monthly Financial Plan is enabled) budget status, utilization, highest spending allocation, and remaining planned budget. Every import type shares one processing pipeline, so adding a future source (PDF statements, Google Takeout, Apple Wallet export) only means adding a new parser, not touching the wizard UI.
- Profile: edit profile, change password, logout
- **Monthly Financial Plan** (optional, toggle on/off in Settings): set a monthly income and savings goal, then create **unlimited custom allocations** (any name + emoji icon + amount) — no fixed category list. Each allocation's spend is tracked automatically from transactions in the matching category. Shows Allocated / Remaining to Allocate / Total Spent, a warning banner if allocations + savings goal exceed income, per-allocation progress bars with 90%+ and overspend warnings, and a Savings Goal card with a 🎉 congratulations state when the goal is reached.

## Design

Warm, premium finance-app look (butter yellow / warm white / pastel green / soft coral / dark olive text), rounded 2xl cards with soft shadows and hover-lift, Plus Jakarta Sans typography, and subtle page/card/modal animations.

## Project structure

```
expense-tracker/
├── backend/
│   ├── database/
│   │   ├── schema.sql       # tables, indexes, constraints, seed data
│   │   └── migrate.js       # applies schema.sql
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/db.js
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       └── validations/
└── frontend/
    └── src/
        ├── components/{ui,layout,dashboard,transactions,budget,charts}/
        ├── pages/
        ├── layouts/
        ├── context/
        ├── hooks/
        ├── services/
        └── utils/
```

## Setup

### 1. Database
```bash
createdb expense_tracker
cd backend
cp .env.example .env      # set DB credentials and a JWT_SECRET
npm install
npm run db:migrate        # applies database/schema.sql + database/increments/*.sql
                           # (safe to re-run — skips anything already applied)
```

### 2. Backend
```bash
cd backend
npm run dev                # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Sign up for a new account at http://localhost:5173/signup, then log in.

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Current user |
| PUT | /api/users/me | Update profile |
| PUT | /api/users/change-password | Change password |
| GET | /api/categories | List categories |
| POST | /api/categories | Create custom category |
| DELETE | /api/categories/:id | Delete custom category |
| GET/POST/PUT/DELETE | /api/transactions | Transaction CRUD |
| POST | /api/transactions/import/check-duplicates | Flag likely duplicate rows before import |
| POST | /api/transactions/import/bulk | Commit reviewed CSV import rows |
| GET | /api/transactions/summary | Income/expense/balance totals |
| GET | /api/transactions/analytics/monthly | Monthly income/expense breakdown |
| GET | /api/transactions/analytics/category-breakdown | Spending by category |
| GET | /api/budget | Current Monthly Financial Plan + progress |
| POST | /api/budget | Enable plan (monthly income + savings goal) |
| PUT | /api/budget | Update income/savings goal |
| POST | /api/budget/allocations | Add a custom allocation |
| PUT | /api/budget/allocations/:id | Edit an allocation |
| DELETE | /api/budget/allocations/:id | Delete an allocation |
| POST | /api/budget/disable | Turn the plan off |
| POST | /api/budget/reset | Clear all plan data |
| GET | /api/reports/csv \| /excel \| /pdf | Export transactions |

## Deployment notes

- Set `NODE_ENV=production` and a strong `JWT_SECRET` in production.
- Point `DB_*` env vars at your managed PostgreSQL instance and run `npm run db:migrate` once.
- Set `CLIENT_URL` to your deployed frontend origin (used for CORS).
- Build the frontend with `npm run build` (outputs to `frontend/dist`) and serve it via any static host (Vercel, Netlify, Nginx, etc.), with `VITE_API_URL` pointed at your deployed backend.
- The backend can run on any Node host (Render, Railway, EC2, etc.) — it's a plain Express app with no external services besides PostgreSQL.
