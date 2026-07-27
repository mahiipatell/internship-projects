# Task Management System

A full-stack task management application that enables authenticated users to organize, manage, and track their daily tasks. The application demonstrates CRUD operations, authentication, and PostgreSQL integration.

---

## Features

- User Authentication
- Create Tasks
- Update Tasks
- Delete Tasks
- Task Completion Status
- Secure REST APIs
- PostgreSQL Database
- Responsive Frontend

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
- JWT Authentication

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`

```
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000
```

Start backend

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

## Architecture

```
React Frontend
      │
      ▼
Axios Requests
      │
      ▼
Express REST API
      │
      ▼
JWT Authentication
      │
      ▼
PostgreSQL Database
```

---

## Project Structure

```
02-task-management-system/
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
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

- CRUD Operations
- REST APIs
- Authentication
- Database Design
- State Management
- Backend Architecture

---

## Future Improvements

- Task Categories
- Due Dates
- Calendar View
- Search & Filters
- Notifications
- Drag & Drop Support