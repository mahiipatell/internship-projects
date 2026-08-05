# Expense Tracker — AI-Powered Personal Finance Manager

A modern full-stack personal finance application built using React, Express.js, PostgreSQL, and Firebase Authentication. The application helps users track income and expenses, plan monthly budgets, monitor savings goals, import bank statements, analyze spending patterns, and manage recurring transactions through an intuitive dashboard.

---

## Features

### Authentication

- Firebase Email & Password Authentication
- Google Sign-In
- Persistent Login Sessions
- Secure Backend Token Verification
- User Profile Management

---

### Dashboard

- Financial Overview
- Income vs Expense Summary
- Recent Transactions
- Monthly Spending Insights
- Budget Progress
- Savings Overview
- Quick Statistics

---

### Transactions

- Add Income & Expenses
- Edit Transactions
- Delete Transactions
- Category-Based Organization
- Transaction Notes
- Payment Method Tracking
- Merchant Tracking
- Date-Based Filtering
- Search Transactions

---

### Budget Planner

- Monthly Financial Planning
- Enable/Disable Budget Mode
- Monthly Income Configuration
- Savings Goal Planning
- Custom Budget Allocation
- Category-Wise Budget Tracking
- Budget Progress Indicators

---

### Savings Goals

- Create Savings Goals
- Track Progress
- Goal Completion Status
- Custom Icons & Colors
- Target Amount Management

---

### Recurring Transactions

- Create Recurring Income
- Create Recurring Expenses
- Daily
- Weekly
- Monthly
- Yearly Frequency
- Automatic Due Detection

---

### Categories

- Default Categories
- Custom Categories
- Income Categories
- Expense Categories
- Icons & Colors

---

### Import Features

- CSV Bank Statement Import
- PDF Statement Upload (Foundation Added)
- Import History
- Duplicate Protection
- Automatic Category Detection (In Progress)

---

### Analytics

- Spending Insights
- Income Analysis
- Expense Breakdown
- Monthly Reports
- Category Statistics
- Financial Trends

---

### User Experience

- Responsive Design
- Modern Dashboard
- Butter Yellow + White + Pastel Green Theme
- Smooth Animations
- Mobile Friendly
- Clean UI Components

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Firebase Authentication
- Recharts

---

### Backend

- Node.js
- Express.js
- PostgreSQL
- Firebase Admin SDK
- JWT Verification
- Multer
- pdf-parse
- csv-parser

---

### Database

- PostgreSQL

Core Tables

- Users
- Categories
- Transactions
- Budgets
- Budget Allocations
- Savings Goals
- Recurring Transactions
- Import Batches

---

## Authentication Flow

```
React Frontend
        │
        ▼
Firebase Authentication
        │
        ▼
Firebase ID Token
        │
        ▼
Express Backend
        │
        ▼
Firebase Admin SDK
        │
        ▼
PostgreSQL User Profile
```

---

## Application Architecture

```
React Frontend
        │
Axios Requests
        │
        ▼
Express REST API
        │
        ▼
Controllers
        │
        ▼
Models
        │
        ▼
PostgreSQL
```

```
CSV Upload
        │
        ▼
Parser
        │
        ▼
Transaction Import
        │
        ▼
PostgreSQL
```

```
PDF Statement
        │
        ▼
PDF Parser
        │
        ▼
Transaction Extraction
        │
        ▼
PostgreSQL
```

---

## Folder Structure

```
expense-tracker/

├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── migrate.js
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    │
    └── package.json
```

---

## Setup

### Clone Repository

```bash
git clone <repository-url>

cd expense-tracker
```

---

### Backend

```bash
cd backend

npm install

cp .env.example .env
```

Configure `.env`

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=expense_tracker
DB_USER=postgres
DB_PASSWORD=your_password

CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

Run database migration

```bash
npm run migrate
```

Start backend

```bash
npm run dev
```

Runs on

```
http://localhost:5000
```

---

### Frontend

```bash
cd frontend

npm install

cp .env.example .env
```

Configure

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run

```bash
npm run dev
```

Runs on

```
http://localhost:5173
```

---

## Future Improvements

- AI Receipt OCR
- Automatic Expense Categorization
- Bank API Integration
- UPI Synchronization
- Investment Portfolio Tracking
- Net Worth Dashboard
- Bill Payment Reminders
- Export to Excel & PDF
- Progressive Web App (PWA)
- Mobile Application (React Native / Expo)
- Multi-Currency Support
- Shared Family Budget
- AI Spending Insights
- AI Financial Recommendations

---

## Learning Outcomes

- Full-Stack Development
- Firebase Authentication
- PostgreSQL Database Design
- REST API Development
- Secure Authentication
- File Upload & Processing
- CSV Parsing
- PDF Processing
- Dashboard Development
- Data Visualization
- Responsive UI Design
- Financial Data Modeling
- Production Project Architecture

---

## License

This project is developed for educational and portfolio purposes.

---

## Author

**Mahi Patel**

B.Tech Computer Engineering • COEP Technological University

GitHub: https://github.com/mahiipatell