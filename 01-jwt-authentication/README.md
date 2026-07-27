# JWT Authentication System

A full-stack authentication system built using React, Express.js, PostgreSQL, bcrypt, and JSON Web Tokens (JWT). The project demonstrates secure user registration, login, password hashing, and protected API routes.

---

## Features

- User Registration
- Secure Login
- Password Hashing using bcrypt
- JWT Authentication
- Protected Routes
- PostgreSQL Database Integration
- Express Middleware
- Persistent User Sessions

---

## Tech Stack

### Frontend

- React
- Vite
- Axios

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure your `.env` file:

```
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000
```

Start the backend:

```bash
npm run dev
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Authentication Flow

```
React Frontend
      │
      ▼
 Login/Register
      │
      ▼
Express API
      │
      ▼
Validate Credentials
      │
      ▼
Hash Password (bcrypt)
      │
      ▼
Generate JWT
      │
      ▼
Protected API Requests
      │
      ▼
PostgreSQL
```

---

## Project Structure

```
01-jwt-authentication/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── schema.sql
```

---

## Learning Outcomes

- JWT Authentication
- Secure Password Storage
- Backend Middleware
- Database Connectivity
- React Forms
- Authentication Flow

---

## Future Improvements

- Refresh Tokens
- Email Verification
- Forgot Password
- User Roles
- Profile Management