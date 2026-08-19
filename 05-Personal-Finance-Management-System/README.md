# Expense Tracker — Personal Finance Management System

A modern full-stack personal finance management application built using React, Vite, Express.js, PostgreSQL, and Firebase Authentication. The application helps users track income and expenses, manage financial accounts, create monthly budgets, monitor savings goals, manage recurring transactions, import transactions from bank and UPI statements, analyze spending patterns, and generate financial reports through an intuitive dashboard.

---

## Features

### Authentication

* Firebase Email & Password Authentication
* Google Sign-In
* Persistent Login Sessions
* Firebase ID Token Authentication
* Secure Backend Token Verification using Firebase Admin SDK
* Protected Application Routes
* Email Verification Status
* Forgot Password Flow
* User Profile Management
* Automatic User Profile Synchronization with PostgreSQL

---

### Dashboard

* Financial Overview
* Total Income
* Total Expenses
* Current Balance
* Savings Overview
* Recent Transactions
* Income vs Expense Summary
* Monthly Spending Overview
* Category-Based Expense Breakdown
* Budget Progress
* Savings Progress
* Financial Statistics
* Quick Access to Major Finance Features

---

### Transactions

* Add Income Transactions
* Add Expense Transactions
* Edit Transactions
* Delete Transactions
* View Individual Transactions
* Category-Based Organization
* Account-Based Organization
* Merchant Tracking
* Payment Method Tracking
* Transaction Notes
* Transaction Date Tracking
* Recurring Transaction Indicator
* Search Transactions
* Date-Based Filtering
* Type-Based Filtering
* Category Filtering
* Account Filtering
* Transaction Summary
* Monthly Transaction Analytics
* Category Expense Breakdown
* Financial Insights
* Bulk Transaction Import
* Duplicate Detection Before Import

---

### Financial Accounts

Users can organize transactions across multiple financial accounts.

Supported account types:

* Cash
* Bank Account
* Credit Card
* Wallet

Features:

* Create Accounts
* Edit Accounts
* Delete Accounts
* Set Default Account
* Assign Transactions to Accounts
* Account-Based Transaction Organization

---

### Budget Planner

* Monthly Financial Planning
* Enable/Disable Budget Mode
* Monthly Income Configuration
* Monthly Savings Goal
* Custom Category Allocations
* Category-Wise Budget Planning
* Spending Tracking
* Allocated Amount Tracking
* Spent Amount Tracking
* Budget Progress Indicators
* Update Budget Income
* Add Budget Allocations
* Edit Budget Allocations
* Delete Budget Allocations
* Reset Budget
* Disable Budget

---

### Savings Goals

* Create Savings Goals
* Edit Savings Goals
* Delete Savings Goals
* Track Current Savings
* Set Target Amount
* Set Target Date
* Add Contributions
* Goal Completion Tracking
* Custom Goal Icons
* Custom Goal Colors
* Progress Visualization

---

### Recurring Transactions

* Create Recurring Income
* Create Recurring Expenses
* Edit Recurring Transactions
* Delete Recurring Transactions
* Daily Frequency
* Weekly Frequency
* Monthly Frequency
* Yearly Frequency
* Start Date
* Next Run Date
* Last Run Date
* Active/Inactive Status
* Recurring Transaction Processing
* Automatic Due-Date Detection
* Notes for Recurring Transactions

---

### Categories

* Default Categories
* Custom Categories
* Income Categories
* Expense Categories
* Category Icons
* Category Colors
* User-Specific Categories
* Category-Based Analytics

Default categories include:

* Food
* Groceries
* Bills
* Rent
* EMI
* Shopping
* Travel
* Fuel
* Medical
* Education
* Entertainment
* Gym
* Salary
* Freelancing
* Investment
* Gift
* Refund
* Other

---

### Import Center

The application includes a multi-format transaction import workflow designed for Indian bank, credit-card, and UPI exports.

Supported formats:

* CSV
* Excel / XLSX
* Text-Based PDF
* UPI CSV Exports

Import workflow:

```text
Select Import Type
        │
        ▼
Upload Statement
        │
        ▼
Parse File
        │
        ▼
Detect Columns / Bank / Provider
        │
        ▼
Normalize Transactions
        │
        ▼
Suggest Categories
        │
        ▼
Detect Duplicates
        │
        ▼
Review Transactions
        │
        ▼
Import Selected Transactions
        │
        ▼
Save Import History
```

---

### CSV Import

* CSV Bank Statement Import
* Credit Card Statement Import
* UPI CSV Import
* Automatic Column Detection
* Manual Column Mapping
* Date Detection
* Debit/Credit Detection
* Single Amount Column Support
* Transaction Type Detection
* Description/Merchant Detection
* Reference Number Detection
* Amount Normalization
* Indian Date Format Support
* Rupee Symbol Handling
* Invalid Row Detection
* Duplicate Detection
* Selective Row Import

Recognized column aliases include:

* Date
* Transaction Date
* Txn Date
* Value Date
* Posting Date
* Narration
* Description
* Particulars
* Remarks
* Merchant
* Payee
* Payer
* Debit
* Withdrawal
* Credit
* Deposit
* Amount
* Transaction Type
* Reference Number
* UTR
* Balance

---

### Excel Import

* `.xlsx` File Support
* Automatic Worksheet Detection
* Transaction Sheet Selection
* Automatic Header Detection
* Excel-to-Transaction Conversion
* Data Validation
* Column Mapping
* Duplicate Detection
* Transaction Preview
* Selective Import

The importer automatically evaluates worksheets and selects the sheet containing the largest amount of transaction-like data.

---

### PDF Bank Statement Import

The application supports text-based bank statement PDFs.

Supported banks:

* State Bank of India (SBI)
* HDFC Bank
* ICICI Bank
* Axis Bank
* Kotak Mahindra Bank
* IDFC FIRST Bank
* Bank of Baroda

The application automatically attempts to detect the bank from the extracted PDF text.

If automatic detection fails, the user can manually select the bank or use the generic parser.

```text
PDF Statement
      │
      ▼
PDF.js Text Extraction
      │
      ▼
Bank Detection
      │
      ├── SBI
      ├── HDFC
      ├── ICICI
      ├── Axis
      ├── Kotak
      ├── IDFC
      └── Bank of Baroda
      │
      ▼
Bank-Specific Parser
      │
      ▼
Transaction Extraction
      │
      ▼
Column Normalization
      │
      ▼
Transaction Review
```

Additional PDF handling:

* Password-Protected PDF Detection
* Corrupted PDF Detection
* Unsupported PDF Detection
* Scanned PDF Detection
* Friendly Error Messages
* Generic Parser Fallback
* Manual Bank Selection

> Scanned/image-only PDFs are currently not supported. The application detects them and asks the user to provide a text-based PDF or export the statement as CSV/Excel.

---

### UPI Import

Supported UPI export providers:

* Google Pay
* PhonePe
* Paytm
* BHIM

UPI provider detection is based on recognizable header patterns.

The importer can recognize fields such as:

* Transaction ID
* UTR
* Order ID
* UPI Reference Number
* Payee
* Payer
* To/From
* Transaction Type
* Amount
* Date

---

### Automatic Category Suggestions

Imported transactions can receive category suggestions based on merchant or transaction description keywords.

Examples:

| Merchant / Keyword                  | Suggested Category |
| ----------------------------------- | ------------------ |
| Swiggy / Zomato                     | Food               |
| Uber / Ola / Rapido                 | Travel             |
| Amazon / Flipkart / Myntra / Ajio   | Shopping           |
| DMart / BigBasket / Blinkit         | Groceries          |
| Cult.fit / Decathlon                | Gym & Sports       |
| Apollo / PharmEasy / Netmeds        | Medical            |
| Netflix / Spotify / Hotstar         | Entertainment      |
| Salary / Payroll                    | Salary             |
| Electricity / Broadband / Rent      | Bills              |
| School / College / Udemy / Coursera | Education          |

Transactions that cannot be confidently categorized are assigned to `Other` and can be reviewed before import.

---

### Duplicate Protection

The import workflow includes duplicate checking before transactions are inserted.

Features:

* Duplicate Detection
* Duplicate Preview
* Skip Duplicate Option
* Import Duplicate Option
* Existing Transaction Comparison
* Import Statistics
* Failed Row Tracking

---

### Import History

Every import can be recorded with information including:

* File Name
* Import Type
* Detected Bank
* Parser Used
* Total Rows
* Transactions Imported
* Duplicates Skipped
* Failed Rows
* Import Duration
* Import Status
* Import Timestamp

Supported import statuses:

* Success
* Partial
* Failed

Users can:

* View Import History
* View Individual Import Details
* Delete Import History Records

---

### Analytics & Insights

The application provides financial analytics through interactive charts and summaries.

Analytics include:

* Monthly Expense Trends
* Income vs Expense
* Category Expense Breakdown
* Spending Trends
* Income Analysis
* Expense Analysis
* Monthly Statistics
* Category Statistics
* Financial Insights
* Budget Progress
* Savings Progress

Charts are implemented using Recharts.

---

### Reports & Data Export

Users can generate reports from their financial data.

Supported export formats:

* CSV
* Excel
* PDF

Backend report endpoints generate downloadable financial reports based on authenticated user data.

---

### Settings

The settings section provides controls for:

* Profile Information
* Currency
* Monthly Income
* Country
* Timezone
* Theme
* Notifications
* Financial Accounts
* Import Center
* Connected Account Information
* Security Settings

Direct bank/UPI account synchronization is currently not implemented. Users can instead import exported statements through the Import Center.

---

### User Experience

* Responsive Design
* Mobile-Friendly Layout
* Modern Financial Dashboard
* Clean Card-Based UI
* Tailwind CSS Styling
* Reusable UI Components
* Loading States
* Skeleton Loading
* Empty States
* Modal Components
* Progress Indicators
* Form Validation
* Error Handling
* Friendly Import Feedback
* Protected Navigation
* Consistent Financial Data Visualization

---

## Tech Stack

### Frontend

* React 19
* Vite
* React Router DOM
* Tailwind CSS
* Axios
* React Hook Form
* Firebase Authentication
* Recharts
* Lucide React
* PapaParse
* SheetJS / XLSX
* PDF.js
* JavaScript ES6+

---

### Backend

* Node.js
* Express.js
* PostgreSQL
* Firebase Admin SDK
* Express Validator
* CORS
* Helmet
* Express Rate Limit
* Morgan
* JSON2CSV
* ExcelJS
* PDFKit
* dotenv

---

### Development & Testing

* Jest
* Nodemon
* npm
* Git
* GitHub
* ESLint

---

### Database

* PostgreSQL

Core Tables:

* Users
* Categories
* Accounts
* Transactions
* Budgets
* Budget Allocations
* Savings Goals
* Recurring Transactions
* Import History

Database features:

* Primary Keys
* Foreign Keys
* Cascading Deletes
* Unique Constraints
* Check Constraints
* Database Indexes
* Automatic `updated_at` Triggers
* User-Specific Data Isolation

---

## Authentication Flow

```text
React Frontend
        │
        ▼
Firebase Authentication
        │
        ▼
Firebase ID Token
        │
        ▼
Axios API Request
        │
        ▼
Express Authentication Middleware
        │
        ▼
Firebase Admin SDK
        │
        ▼
Verify Token
        │
        ▼
Identify PostgreSQL User
        │
        ▼
Protected Controller
        │
        ▼
PostgreSQL
```

All protected API routes use the authentication middleware before accessing user-specific resources.

---

## Application Architecture

```text
React Frontend
        │
        │ Axios
        ▼
Express REST API
        │
        ├── Authentication Middleware
        │
        ├── Validation Middleware
        │
        ├── Controllers
        │
        ├── Models
        │
        └── Error Handling
                │
                ▼
           PostgreSQL
```

---

### Frontend Architecture

```text
React Application
        │
        ├── Authentication Context
        │
        ├── Protected Routes
        │
        ├── Layouts
        │
        ├── Pages
        │
        ├── Reusable Components
        │
        ├── Hooks
        │
        ├── API Services
        │
        └── Utility Functions
```

---

### Backend Architecture

```text
HTTP Request
      │
      ▼
Express Router
      │
      ▼
Authentication
      │
      ▼
Validation
      │
      ▼
Controller
      │
      ▼
Model
      │
      ▼
PostgreSQL
      │
      ▼
JSON Response
```

---

### Import Architecture

```text
                    Import Center
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
         CSV           Excel           PDF
          │              │              │
      PapaParse        XLSX           PDF.js
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                Column / Bank Detection
                         │
                         ▼
                Transaction Normalization
                         │
                         ▼
                 Category Suggestions
                         │
                         ▼
                  Duplicate Checking
                         │
                         ▼
                  Transaction Review
                         │
                         ▼
                  Bulk API Import
                         │
                         ▼
                    PostgreSQL
```

---

## Folder Structure

```text
expense-tracker/

├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── migrate.js
│   │   ├── migrate-v1-to-v2.sql
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── firebase.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── account.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── budget.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── importHistory.controller.js
│   │   │   ├── recurring.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── savingsGoal.controller.js
│   │   │   ├── transaction.controller.js
│   │   │   └── user.controller.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.middleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── account.model.js
│   │   │   ├── budget.model.js
│   │   │   ├── category.model.js
│   │   │   ├── importHistory.model.js
│   │   │   ├── recurring.model.js
│   │   │   ├── savingsGoal.model.js
│   │   │   ├── transaction.model.js
│   │   │   └── user.model.js
│   │   │
│   │   ├── routes/
│   │   │   ├── account.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── budget.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── importHistory.routes.js
│   │   │   ├── recurring.routes.js
│   │   │   ├── report.routes.js
│   │   │   ├── savingsGoal.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── format.js
│   │   │   └── generateToken.js
│   │   │
│   │   ├── validations/
│   │   │   ├── auth.validation.js
│   │   │   ├── budget.validation.js
│   │   │   └── transaction.validation.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── budget/
│   │   │   ├── charts/
│   │   │   ├── dashboard/
│   │   │   ├── goals/
│   │   │   ├── import/
│   │   │   ├── layout/
│   │   │   ├── recurring/
│   │   │   ├── settings/
│   │   │   ├── transactions/
│   │   │   └── ui/
│   │   │
│   │   ├── config/
│   │   │   └── firebase.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── core/
│   │   │   └── authLogic.js
│   │   │
│   │   ├── hooks/
│   │   │
│   │   ├── layouts/
│   │   │
│   │   ├── pages/
│   │   │   ├── Analytics.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Import.jsx
│   │   │   ├── ImportHistory.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Recurring.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SavingsGoals.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Transactions.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── account.service.js
│   │   │   ├── auth.service.js
│   │   │   ├── budget.service.js
│   │   │   ├── category.service.js
│   │   │   ├── importHistory.service.js
│   │   │   ├── recurring.service.js
│   │   │   ├── report.service.js
│   │   │   ├── savingsGoal.service.js
│   │   │   ├── transaction.service.js
│   │   │   └── user.service.js
│   │   │
│   │   ├── utils/
│   │   │   ├── parsers/
│   │   │   │   ├── csvParser.js
│   │   │   │   ├── excelParser.js
│   │   │   │   ├── pdfParser.js
│   │   │   │   ├── upiProviders.js
│   │   │   │   └── pdfParsers/
│   │   │   │       ├── axisParser.js
│   │   │   │       ├── baseParser.js
│   │   │   │       ├── bobParser.js
│   │   │   │       ├── hdfcParser.js
│   │   │   │       ├── iciciParser.js
│   │   │   │       ├── idfcParser.js
│   │   │   │       ├── kotakParser.js
│   │   │   │       ├── parserFactory.js
│   │   │   │       └── sbiParser.js
│   │   │   │
│   │   │   ├── importUtils.js
│   │   │   ├── importStats.js
│   │   │   ├── constants.js
│   │   │   ├── formatCurrency.js
│   │   │   └── formatDate.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## API Structure

The backend exposes a REST API under:

```text
/api
```

### Authentication

```text
GET /api/auth/me
```

### Users

```text
PUT /api/users/me
```

### Categories

```text
GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id
```

### Accounts

```text
GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
```

### Transactions

```text
GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

Analytics:

```text
GET /api/transactions/summary
GET /api/transactions/analytics/monthly
GET /api/transactions/analytics/category-breakdown
GET /api/transactions/insights
```

Import:

```text
POST /api/transactions/import/check-duplicates
POST /api/transactions/import/bulk
```

### Budget

```text
GET    /api/budget
POST   /api/budget
PUT    /api/budget

POST   /api/budget/allocations
PUT    /api/budget/allocations/:id
DELETE /api/budget/allocations/:id

POST /api/budget/disable
POST /api/budget/reset
```

### Savings Goals

```text
GET    /api/savings-goals
POST   /api/savings-goals
PUT    /api/savings-goals/:id
POST   /api/savings-goals/:id/contribute
DELETE /api/savings-goals/:id
```

### Recurring Transactions

```text
GET    /api/recurring
POST   /api/recurring
PUT    /api/recurring/:id
DELETE /api/recurring/:id
POST   /api/recurring/process
```

### Reports

```text
GET /api/reports/csv
GET /api/reports/excel
GET /api/reports/pdf
```

### Import History

```text
GET    /api/import-history
POST   /api/import-history
GET    /api/import-history/:id
DELETE /api/import-history/:id
```

### Health Check

```text
GET /api/health
```

---

## Setup

### Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* PostgreSQL
* Git
* Firebase Project

Check your versions:

```bash
node --version
npm --version
psql --version
```

---

### Clone Repository

```bash
git clone <repository-url>

cd expense-tracker
```

---

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE expense_tracker;
```

Make sure PostgreSQL is running.

If your PostgreSQL server uses a non-default port, update `DB_PORT` accordingly.

---

### Backend

```bash
cd backend

npm install

cp .env.example .env
```

On Windows PowerShell, if `cp` is unavailable:

```powershell
Copy-Item .env.example .env
```

Configure `.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker
DB_USER=postgres
DB_PASSWORD=your_password

CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

Run the database migration:

```bash
npm run migrate
```

Optional seed command:

```bash
npm run seed
```

Start the backend in development mode:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

Backend runs on:

```text
http://localhost:5000
```

API health check:

```text
http://localhost:5000/api/health
```

---

### Firebase Setup

Create a Firebase project and enable:

* Email/Password Authentication
* Google Authentication

Create a Firebase Web App and copy its configuration into the frontend `.env`.

For the backend, create a Firebase service account and provide:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

Keep Firebase service-account credentials private and never commit them to GitHub.

---

### Frontend

Open a second terminal:

```bash
cd frontend

npm install

cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure:

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run the frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Running the Complete Application

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Testing

The backend includes Jest tests for important database models.

Current tested models include:

* User Model
* Transaction Model
* Budget Model
* Savings Goal Model
* Recurring Transaction Model
* Import History Model

Run the test suite:

```bash
cd backend
npm test
```

---

## Available Scripts

### Backend

```bash
npm run dev
```

Starts the backend using Nodemon.

```bash
npm start
```

Starts the backend normally.

```bash
npm run migrate
```

Runs the PostgreSQL migration.

```bash
npm run seed
```

Seeds default database data.

```bash
npm test
```

Runs Jest tests.

---

### Frontend

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint.

---

## Database Design

The application uses a relational PostgreSQL database.

```text
Users
 │
 ├── Categories
 │
 ├── Accounts
 │
 ├── Transactions
 │
 ├── Budgets
 │      │
 │      └── Budget Allocations
 │
 ├── Savings Goals
 │
 ├── Recurring Transactions
 │
 └── Import History
```

Important relationships:

```text
users
  │
  ├── categories
  ├── accounts
  ├── transactions
  ├── budgets
  ├── savings_goals
  ├── recurring_transactions
  └── import_history

budgets
  │
  └── budget_allocations

transactions
  ├── categories
  └── accounts

recurring_transactions
  ├── categories
  └── accounts
```

User-owned data uses foreign keys with cascading deletes to maintain data consistency.

---

## Security

The backend includes several security measures:

* Firebase ID Token Verification
* Protected API Routes
* User-Level Data Isolation
* Helmet Security Headers
* CORS Configuration
* Express Rate Limiting
* Request Validation
* Centralized Error Handling
* PostgreSQL Parameterized Queries
* Environment-Based Secrets
* No Firebase Service Account Credentials in Source Control

---

## Current Limitations

The current implementation intentionally has a few limitations:

* Scanned/image-only PDF statements are not supported.
* Direct bank account APIs are not connected.
* Direct UPI synchronization is not available.
* Automatic transaction categorization is keyword-based rather than machine-learning based.
* Investment portfolio management is not currently implemented.
* Receipt OCR is not currently implemented.
* Multi-user/shared family budgets are not currently implemented.

For unsupported bank statement formats, users can use CSV/Excel exports or the generic PDF parser where applicable.

---

## Future Improvements

* AI-Based Receipt OCR
* Machine Learning Expense Categorization
* Improved AI Financial Insights
* Automatic Bank API Integration
* Open Banking Integration
* UPI Synchronization
* Investment Portfolio Tracking
* Net Worth Dashboard
* Bill Payment Reminders
* Advanced Financial Forecasting
* Cash Flow Forecasting
* Subscription Detection
* Anomaly / Unusual Spending Detection
* Multi-Currency Support
* Shared Family Budgets
* Financial Goal Recommendations
* Progressive Web App (PWA)
* Mobile Application using React Native / Expo
* Advanced PDF OCR for Scanned Statements
* Additional Indian Bank PDF Parsers
* Automated Recurring Transaction Scheduling

---

## Learning Outcomes

This project demonstrates practical experience in:

* Full-Stack Web Development
* React Development
* Vite-Based Frontend Architecture
* REST API Development
* Node.js & Express.js
* PostgreSQL Database Design
* Relational Data Modeling
* Firebase Authentication
* Firebase Admin SDK
* Secure API Authentication
* Middleware Design
* Request Validation
* CRUD API Development
* Financial Data Modeling
* Budget Management Systems
* Savings Goal Management
* Recurring Transaction Systems
* Data Visualization
* Recharts
* CSV Parsing
* Excel File Processing
* PDF Text Extraction
* Bank-Specific PDF Parsing
* UPI Export Processing
* Duplicate Detection
* Bulk Data Import
* Report Generation
* CSV/Excel/PDF Export
* Database Migrations
* Backend Unit Testing
* Responsive UI Development
* Tailwind CSS
* Error Handling
* Application Security
* Modular Project Architecture

---

## Project Highlights

Some of the more technically significant parts of the project are:

### 1. Multi-Format Financial Data Import

The application can process transaction data from CSV, Excel, UPI exports, and text-based PDF bank statements through a common normalization pipeline.

### 2. Bank-Specific PDF Parsing

Instead of relying on a single generic PDF parser, the application uses a parser factory with bank-specific parsing configurations for multiple Indian banks.

### 3. Intelligent Import Workflow

The import system automatically detects columns, identifies transaction direction, normalizes amounts and dates, suggests categories, detects duplicates, and allows users to review transactions before importing them.

### 4. Financial Analytics

Transaction data is transformed into monthly trends, category breakdowns, income/expense comparisons, and financial insights.

### 5. Relational Financial Data Model

PostgreSQL is used to maintain relationships between users, accounts, categories, transactions, budgets, savings goals, recurring transactions, and import history.

### 6. Secure Authentication

Firebase handles user authentication while the Express backend independently verifies Firebase ID tokens before allowing access to protected resources.

---

## License

This project is developed for educational and portfolio purposes.

---

## Author

**Mahi Patel**

B.Tech Computer Engineering • COEP Technological University

GitHub: https://github.com/mahiipatell
