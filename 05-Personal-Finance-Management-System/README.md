# Personal Finance Management System

A full-stack Personal Finance Management System that helps users manage their income, expenses, monthly budgets, and financial goals through an intuitive dashboard. The application includes secure authentication, transaction management, analytics, customizable financial planning, reporting, and statement import capabilities.

---

## ✨ Features

### Authentication

- User Registration & Login
- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Persistent User Sessions

### Dashboard

- Financial Overview Dashboard
- Total Income
- Total Expenses
- Current Balance
- Savings Overview
- Monthly Financial Summary

### Transaction Management

- Add Income & Expenses
- Edit Transactions
- Delete Transactions
- Search Transactions
- Filter by Category
- Filter by Date
- Transaction History

### Monthly Financial Plan

- Custom Monthly Budget Planning
- User-defined Budget Categories
- Budget Allocation Tracking
- Spending Progress
- Savings Goal Tracking
- Budget Utilization
- Overspending Alerts

### Analytics & Reports

- Income vs Expense Charts
- Category-wise Spending Analysis
- Monthly Financial Insights
- Expense Breakdown
- CSV Export
- Excel Export
- PDF Report Generation

### Import Center

- Import Bank Statements (.csv)
- Import Credit Card Statements (.csv)
- Import Excel Statements (.xlsx)
- Import UPI Export Files (.csv)
- Automatic Transaction Categorization
- Duplicate Transaction Detection
- Transaction Preview Before Import

### User Experience

- Responsive Design
- Premium FinTech-inspired UI
- Modern Dashboard
- Interactive Charts
- Smooth Animations

---

# 🚀 Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Recharts
- Lucide React
- PapaParse
- XLSX

## Backend

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt
- REST APIs

## Database

- PostgreSQL

## Tools

- Git
- GitHub
- VS Code
- Postman

---

# ⚙️ Setup

## Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

Run database migration

```bash
npm run db:migrate
```

Start backend

```bash
npm run dev
```

Backend runs on

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Configure `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 🏗️ Architecture

```
React Frontend (Vite)
        │
        ▼
Axios API Requests
        │
        ▼
Express REST API
        │
        ▼
JWT Authentication
        │
        ▼
Business Logic
        │
        ▼
PostgreSQL Database
```

---

# 📡 Major API Modules

| Module | Description |
|---------|-------------|
| Authentication | User Registration & Login |
| Dashboard | Financial Summary |
| Transactions | Income & Expense CRUD |
| Categories | Expense Categories |
| Monthly Financial Plan | Budget Management |
| Reports | Financial Reports |
| Import Center | CSV & Excel Transaction Import |
| User Profile | Profile Management |

---

# 📁 Project Structure

```text
05-personal-finance-management-system/
│
├── backend/
│   ├── database/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validations/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── services/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── utils/
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

# 🎯 Learning Outcomes

- Full-Stack Web Development
- JWT Authentication
- PostgreSQL Database Design
- REST API Development
- CRUD Operations
- Budget Planning System
- Financial Data Visualization
- File Import & Data Processing
- Responsive UI Design
- Component-Based Architecture
- State Management
- Secure Backend Development

---

# 🚀 Future Improvements

- PDF Bank Statement Import
- Firebase Authentication
- Google Sign-In
- Mobile Application
- Receipt OCR
- Smart Financial Insights
- Investment Tracking
- Push Notifications
- Cloud Synchronization

---

# 👨‍💻 Author

**Mahi Patel**

B.Tech Computer Engineering  
COEP Technological University

---

⭐ If you found this project interesting, feel free to explore the codebase and try it locally!