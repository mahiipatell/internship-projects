# Student Management System

A modern full-stack Student Management System built using React, Vite, TypeScript, Tailwind CSS, Node.js, Express.js, PostgreSQL, Prisma, and JWT authentication. The application provides role-based tools for Admins, Teachers, Students, and Parents to manage students, academics, attendance, examinations, assignments, timetables, announcements, profiles, and student reports through a responsive web interface.

---

## Features

### Authentication

* Email and Password Authentication
* JWT Access Token Authentication
* Refresh Token Rotation
* httpOnly Refresh Token Cookie
* Protected Application Routes
* Role-Based Access Control (RBAC)
* Forgot Password Flow
* Reset Password Flow
* Secure Logout with Refresh Token Revocation
* Password Change from Profile
* Active/Inactive Account Handling

---

### Role-Based Access

The system supports four user roles:

* ADMIN
* TEACHER
* STUDENT
* PARENT

Each role receives a different dashboard, navigation structure, permissions, and data scope.

#### Admin

* Manage students
* Manage teachers
* Manage parents
* Manage classes
* Manage sections
* Manage subjects
* Map subjects to classes
* Assign teachers to subjects and sections
* Manage attendance
* Manage exams and marks
* Manage timetable
* Publish announcements
* View dashboard KPIs
* View student reports

#### Teacher

* View assigned students
* View assigned sections
* Mark attendance
* Correct attendance records
* Create exams for assigned sections
* Enter and update marks
* Publish exam results
* Create assignments
* View assignment submissions
* Grade submissions
* View assigned timetable
* Publish section announcements
* View student reports for permitted students

#### Student

* View personal dashboard
* View personal profile
* View own attendance
* View published marks
* View assignments
* Submit and resubmit assignments
* View timetable
* View announcements
* View student report

#### Parent

* View child-related dashboard information
* View linked children
* View child attendance
* View published marks
* View assignments
* View timetable
* View announcements
* View child student reports

---

### Dashboard

The dashboard is role-aware and displays information relevant to the logged-in user.

#### Admin Dashboard

* Total Students
* Total Teachers
* Total Classes
* Attendance Overview
* Academic Overview
* System-Level KPIs

#### Teacher Dashboard

* Today's Classes
* Assigned Sections
* Exams Awaiting Marks
* Teaching Overview

#### Student Dashboard

* Attendance Percentage
* Upcoming Assignments
* Timetable Information
* Academic Information

#### Parent Dashboard

* Child Attendance Summary
* Child Academic Summary
* Child Assignments
* Child Timetable Information

---

### Student Management

* Create Student Accounts
* Edit Student Records
* View Student Details
* Search Students
* Filter Students by Section
* Assign Students to Classes/Sections
* Assign Roll Numbers
* Link Students to Parents
* View Student Attendance
* View Student Marks
* View Student Assignments
* Deactivate Students
* Role-Based Student Data Access
* Download Student Report Card PDF

Students can be soft-deactivated instead of being permanently deleted.

---

### Teacher Management

* Create Teacher Accounts
* Edit Teacher Profiles
* View Teacher Details
* Search Teachers
* Assign Subjects to Teachers
* Assign Teachers to Sections
* View Teacher Assignments
* Role-Based Teacher Access

Only Admin users can create and manage teacher records and assignments.

---

### Parent Management

* Create Parent Accounts
* Search Parents
* View Parent Details
* Link Parents to Students
* View Linked Children
* Role-Based Parent Access

A parent can access information only for their linked children.

---

### Classes & Sections

The academic structure is organized using classes, sections, and subjects.

Features:

* Create Classes
* List Classes
* Create Sections
* List Sections
* Filter Sections by Class
* Create Subjects
* List Subjects
* Map Subjects to Classes
* Remove Subject-Class Mappings
* Unique Section Names within a Class
* Unique Subject Codes

Example structure:

```text
Grade 10
│
├── Section A
│   ├── Mathematics
│   ├── English
│   └── Science
│
└── Section B
    ├── Mathematics
    └── English
```

---

### Attendance

* Daily Attendance Tracking
* Present Status
* Absent Status
* Late Status
* Bulk Attendance Entry
* Attendance Correction
* Attendance Percentage Calculation
* Student Attendance View
* Parent Child-Attendance View
* Teacher Section-Based Access
* Admin Attendance Access
* Attendance Filtering by Student
* Attendance Filtering by Section
* Attendance Filtering by Date
* One Attendance Record per Student per Date

Attendance is scoped according to the user's role.

---

### Exams & Marks

* Create Exams
* Assign Exams to Subjects
* Assign Exams to Sections
* Configure Maximum Marks
* Enter Marks in Bulk
* Update Marks
* Publish Results
* View Exam Marks
* Published/Unpublished Result Control
* Student Result Access
* Parent Result Access
* Teacher Section-Based Access
* Admin Result Access

Students and parents can only view marks after they have been published.

---

### Assignments

* Create Assignments
* Assignment Title
* Assignment Description
* Subject Association
* Section Association
* Due Date
* Maximum Marks
* Student Assignment List
* Submit Assignments
* Resubmit Assignments
* Text-Based Submission
* File URL Support
* View Submissions
* Grade Submissions
* Marks for Submissions
* Teacher Feedback
* Submission Status Tracking

Submission statuses include:

* Not submitted
* Submitted
* Graded

---

### Timetable

* Weekly Timetable
* Section-Based Timetable
* Teacher-Based Timetable
* Subject Assignment
* Teacher Assignment
* Day-of-Week Scheduling
* Period Scheduling
* Create Timetable Slots
* Delete Timetable Slots
* Role-Based Timetable Views
* Teacher Double-Booking Protection
* Section Double-Booking Protection

Timetable slots enforce uniqueness for both teachers and sections within the same day and period.

---

### Announcements

* Create Announcements
* Institution-Wide Announcements
* Section-Specific Announcements
* Role-Based Announcement Visibility
* Admin Announcements
* Teacher Announcements
* Newest-First Announcement Feed

Teachers are restricted to announcements for their assigned sections, while Admins can publish institution-wide announcements.

---

### Student Reports

The application includes a downloadable student report feature.

A student report can contain:

* Student Name
* Email
* Roll Number
* Class
* Section
* Parent Information
* Attendance Summary
* Attendance Percentage
* Present Count
* Absent Count
* Late Count
* Exam Results
* Subjects
* Exam Dates
* Marks Obtained
* Maximum Marks
* Percentage
* Assignment Status
* Assignment Marks
* Teacher Feedback
* Report Generation Timestamp

Reports are generated as PDF documents using PDFKit.

The same role-based authorization used for student details is applied to reports:

* Admin → Any student
* Teacher → Students in assigned sections
* Student → Self
* Parent → Own child

---

### User Profile

* View Own Profile
* Update Name
* Update Email
* Change Password
* Current Password Verification
* Protected Role Information
* Role-Based Profile Access

Users cannot change their own role or permissions.

---

## Tech Stack

### Frontend

* React 18
* Vite
* TypeScript
* React Router DOM
* Tailwind CSS
* Axios / Fetch-based API integration
* Lucide-style reusable icon components
* JavaScript / TypeScript ES Modules

---

### Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* PostgreSQL
* JSON Web Token (JWT)
* bcryptjs
* Zod
* Cookie Parser
* CORS
* dotenv
* PDFKit

---

### Development & Testing

* TypeScript
* Vitest
* tsx
* Prisma CLI
* npm
* Git
* GitHub

---

### Database

* PostgreSQL
* Prisma ORM

Core models include:

* User
* RefreshToken
* Student
* Teacher
* Class
* Section
* Subject
* ClassSubject
* TeacherAssignment
* Attendance
* Exam
* Mark
* Assignment
* Submission
* TimetableSlot
* Announcement

Database features include:

* UUID Primary Keys
* Foreign Keys
* Unique Constraints
* Composite Unique Constraints
* Cascading Deletes
* Indexed Foreign Keys
* Enum-Based Roles and Statuses
* Automatic Created/Updated Timestamps
* User-Level Data Isolation
* Soft Deactivation for Students

---

## Authentication Flow

```text
React Frontend
      │
      ▼
Login Request
      │
      ▼
Express Authentication API
      │
      ▼
Validate Email + Password
      │
      ▼
Generate JWT Access Token
      │
      ▼
Generate Refresh Token
      │
      ▼
httpOnly Refresh Cookie
      │
      ▼
Protected API Requests
      │
      ▼
Authentication Middleware
      │
      ▼
RBAC Middleware
      │
      ▼
Role-Scoped Service Logic
      │
      ▼
PostgreSQL
```

Access tokens are short-lived and refresh tokens are rotated through the `/auth/refresh` endpoint.

---

## Application Architecture

```text
React + Vite Frontend
        │
        │ HTTP / JSON
        ▼
Express REST API
        │
        ├── Authentication
        │
        ├── RBAC Middleware
        │
        ├── Validation
        │
        ├── Controllers
        │
        ├── Services
        │
        ├── Prisma ORM
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
        ├── Role-Based Routes
        │
        ├── Layout
        │
        ├── Pages
        │
        ├── Reusable UI Components
        │
        ├── API Client
        │
        ├── Theme Management
        │
        └── Utility Functions
```

Main frontend pages include:

```text
Login
Dashboard
Students
Student Detail
Teachers
Teacher Detail
Parents
Parent Detail
Academic
Attendance
My Attendance
Exams
Assignments
Timetable
Announcements
Profile
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
Authentication Middleware
      │
      ▼
RBAC Middleware
      │
      ▼
Request Validation
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL
      │
      ▼
JSON Response
```

Each backend module follows a modular controller, route, schema, and service structure.

---

### Student Report Architecture

```text
Student Detail / Report Request
          │
          ▼
Authentication
          │
          ▼
Role-Based Authorization
          │
          ▼
Student Data
          │
          ├── Attendance
          │
          ├── Marks
          │
          └── Assignments
                  │
                  ▼
          Report Data Builder
                  │
                  ▼
              PDFKit
                  │
                  ▼
            Student Report PDF
```

---

## Folder Structure

```text
Student Management System/

├── client/
│   ├── public/
│   │   └── _redirects
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── icons.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ui.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.tsx
│   │   │   ├── theme.tsx
│   │   │   └── utils.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── Academic.tsx
│   │   │   ├── Announcements.tsx
│   │   │   ├── Assignments.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Exams.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── MyAttendance.tsx
│   │   │   ├── ParentDetail.tsx
│   │   │   ├── Parents.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── StudentDetail.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── TeacherDetail.tsx
│   │   │   ├── Teachers.tsx
│   │   │   └── Timetable.tsx
│   │   │
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config.ts
│   │   ├── app.ts
│   │   ├── index.ts
│   │   │
│   │   ├── integration/
│   │   │   ├── admin.test.ts
│   │   │   └── auth.test.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── errors.ts
│   │   │   ├── password.ts
│   │   │   ├── prisma.ts
│   │   │   ├── tokens.ts
│   │   │   └── tokens.test.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── errorHandler.test.ts
│   │   │   ├── rbac.ts
│   │   │   └── rbac.test.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── announcements/
│   │   │   ├── assignments/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── classes/
│   │   │   ├── dashboard/
│   │   │   ├── exams/
│   │   │   ├── health/
│   │   │   ├── parents/
│   │   │   ├── profile/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   └── timetable/
│   │   │
│   │   └── types/
│   │       └── express.d.ts
│   │
│   ├── .env.example
│   ├── package.json
│   ├── render.yaml
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── docs/
│   ├── api-reference.md
│   └── prd.md
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

All protected endpoints require:

```text
Authorization: Bearer <accessToken>
```

Refresh tokens are handled through an httpOnly cookie.

---

### Health

```text
GET /api/health
```

Returns the API liveness status.

---

### Authentication

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

---

### Classes

```text
GET    /api/classes
POST   /api/classes
GET    /api/classes/:id/subjects
POST   /api/classes/:id/subjects
DELETE /api/classes/:id/subjects/:subjectId
```

---

### Sections

```text
GET  /api/sections
POST /api/sections
```

---

### Subjects

```text
GET  /api/subjects
POST /api/subjects
```

---

### Students

```text
GET    /api/students
POST   /api/students
GET    /api/students/:id
GET    /api/students/:id/marks
GET    /api/students/:id/report
PATCH  /api/students/:id
DELETE /api/students/:id
```

The report endpoint generates a PDF student report.

---

### Teachers

```text
GET  /api/teachers
POST /api/teachers
GET  /api/teachers/:id
PATCH /api/teachers/:id
POST /api/teachers/:id/assignments
```

---

### Parents

```text
GET  /api/parents
POST /api/parents
```

---

### Attendance

```text
GET   /api/attendance
POST  /api/attendance
PATCH /api/attendance/:id
```

Supported filters include:

```text
?studentId=
?sectionId=
?date=
```

---

### Exams

```text
GET  /api/exams
POST /api/exams
GET  /api/exams/:id/marks
POST /api/exams/:id/marks
POST /api/exams/:id/publish
```

---

### Assignments

```text
GET   /api/assignments
POST  /api/assignments
GET   /api/assignments/:id/submissions
POST  /api/assignments/:id/submissions
PATCH /api/assignments/:id/submissions/:sid
```

---

### Timetable

```text
GET    /api/timetable
POST   /api/timetable
DELETE /api/timetable/:id
```

---

### Announcements

```text
GET  /api/announcements
POST /api/announcements
```

---

### Dashboard

```text
GET /api/dashboard
```

The response is shaped according to the authenticated user's role.

---

### Profile

```text
GET   /api/profile
PATCH /api/profile
PATCH /api/profile/password
```

---

## Setup

### Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* PostgreSQL
* Git

Check your versions:

```bash
node --version
npm --version
psql --version
git --version
```

---

### Clone Repository

```bash
git clone <repository-url>

cd "Student Management System"
```

---

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE sms_dev;
```

Make sure PostgreSQL is running.

The included development configuration uses PostgreSQL on port `5433`. If your PostgreSQL server uses another port, update `DATABASE_URL` in `server/.env`.

Example:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5433/sms_dev?schema=public"
```

---

### Backend

Open a terminal:

```bash
cd server

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure `server/.env`:

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres:your_password@localhost:5433/sms_dev?schema=public"

JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma client:

```bash
npx prisma generate
```

Seed demo data:

```bash
npm run db:seed
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:4000
```

API health check:

```text
http://localhost:4000/api/health
```

---

### Frontend

Open a second terminal:

```bash
cd client

npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For local development, the client can use the default relative `/api` path. If the frontend is hosted separately, configure:

```env
VITE_API_URL=https://your-server.onrender.com
```

Start the frontend:

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
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Terminal 2 — Frontend

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Demo Credentials

The seed script creates demo users with the same password:

```text
password123
```

| Role | Email | Password |
|---|---|---|
| Admin | `admin@sms.test` | `password123` |
| Teacher | `teacher.math@sms.test` | `password123` |
| Teacher | `teacher.eng@sms.test` | `password123` |
| Parent | `parent@sms.test` | `password123` |
| Parent | `parent.mahi@sms.test` | `password123` |
| Parent | `parent.yug@sms.test` | `password123` |
| Parent | `parent.shruti@sms.test` | `password123` |
| Student | `arav.patel@sms.test` | `password123` |
| Student | `mahi.mayani@sms.test` | `password123` |
| Student | `yug.kashyap@sms.test` | `password123` |
| Student | `shruti.kumari@sms.test` | `password123` |

The seed data includes:

* Grade 10
* Section A
* Section B
* Mathematics
* English
* Science
* Teacher assignments
* Student records
* Parent-child relationships
* Attendance records
* Published exam marks
* Assignment and submission data
* Timetable entries
* Institution-wide announcement
* Section-specific announcement

> These credentials are for local development/demo use only. Do not use them in production.

---

## Testing

The backend uses Vitest for automated testing.

Test coverage includes:

* Authentication
* Admin flows
* Token utilities
* RBAC middleware
* Error handling
* Announcements
* Assignments
* Attendance
* Authentication services
* Classes
* Dashboard
* Exams
* Parents
* Profile
* Students
* Teachers
* Timetable

Run the complete test suite:

```bash
cd server
npm test
```

---

## Available Scripts

### Backend

```bash
npm run dev
```

Starts the Express development server using `tsx`.

```bash
npm run build
```

Compiles the TypeScript backend.

```bash
npm start
```

Starts the compiled production server.

```bash
npm run prisma:generate
```

Generates the Prisma client.

```bash
npm run prisma:migrate
```

Runs Prisma migrations in development.

```bash
npm run prisma:deploy
```

Applies existing migrations.

```bash
npm run db:seed
```

Seeds the PostgreSQL database with demo data.

```bash
npm test
```

Runs Vitest tests.

---

### Frontend

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript checking and creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run typecheck
```

Runs TypeScript type checking.

---

## Database Design

The application uses PostgreSQL with Prisma ORM.

```text
User
 │
 ├── Student
 │      │
 │      ├── Attendance
 │      ├── Marks
 │      └── Submissions
 │
 ├── Teacher
 │      │
 │      ├── Teacher Assignments
 │      ├── Assignments
 │      └── Timetable Slots
 │
 ├── Parent
 │      │
 │      └── Children → Student
 │
 └── Announcements

Class
 │
 ├── Sections
 │      │
 │      ├── Students
 │      ├── Exams
 │      ├── Assignments
 │      ├── Attendance
 │      ├── Timetable Slots
 │      └── Announcements
 │
 └── Class Subjects

Subject
 │
 ├── Class Subjects
 ├── Teacher Assignments
 ├── Exams
 ├── Assignments
 └── Timetable Slots

Exam
 │
 └── Marks

Assignment
 │
 └── Submissions

User
 │
 └── Refresh Tokens
```

---

### Core Database Relationships

```text
User
  │
  ├── Student
  ├── Teacher
  ├── Parent → Student[]
  ├── RefreshToken[]
  └── Announcement[]

Class
  │
  ├── Section[]
  └── ClassSubject[]

Section
  │
  ├── Student[]
  ├── Exam[]
  ├── Assignment[]
  ├── Attendance[]
  ├── TimetableSlot[]
  └── Announcement[]

Subject
  │
  ├── ClassSubject[]
  ├── TeacherAssignment[]
  ├── Exam[]
  ├── Assignment[]
  └── TimetableSlot[]

Teacher
  │
  ├── TeacherAssignment[]
  ├── Assignment[]
  └── TimetableSlot[]

Student
  │
  ├── Attendance[]
  ├── Mark[]
  └── Submission[]
```

---

## Security

The application implements multiple security controls:

* JWT Access Token Authentication
* Refresh Token Rotation
* httpOnly Refresh Token Cookies
* Refresh Token Revocation on Logout
* bcrypt Password Hashing
* Role-Based Access Control
* Server-Side Authorization
* Role-Scoped Data Access
* Protected API Routes
* Input Validation with Zod
* Centralized Error Handling
* CORS Configuration
* Environment-Based Secrets
* PostgreSQL Foreign Key Constraints
* Unique Constraints
* Student Soft Deactivation
* Published-Only Marks for Students and Parents

The frontend also hides pages that a role cannot access, but the backend remains the actual security boundary.

---

## Data Access Rules

The application uses both role checks and service-level data scoping.

```text
ADMIN
  → Full administrative access

TEACHER
  → Assigned sections / subjects / students

STUDENT
  → Own records only

PARENT
  → Linked children's records only
```

For example:

```text
Teacher A
   │
   ├── Section 10A
   │      ├── Student 1
   │      └── Student 2
   │
   └── Section 10B
          ├── Student 3
          └── Student 4
```

Teacher A cannot access students outside their assigned sections.

---

## Environment Variables

### Server

Create:

```text
server/.env
```

Important variables:

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `NODE_ENV` | Application environment |
| `CLIENT_URL` | Frontend origin used by CORS |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `ACCESS_TOKEN_TTL` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime |

### Client

Create:

```text
client/.env
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Absolute backend API URL when frontend and backend are hosted separately |

For local development, `VITE_API_URL` can remain unset when the application uses the relative `/api` path.

---

## Deployment

The application is structured so the frontend and backend can be deployed independently.

### Backend — Render

The repository includes:

```text
server/render.yaml
```

The Render configuration provides:

* Node.js Web Service
* PostgreSQL Database
* Prisma Client Generation
* Prisma Migration Deployment
* Production TypeScript Build
* Health Check Endpoint
* Generated JWT Secrets
* Production Environment Configuration

The backend health endpoint is:

```text
GET /api/health
```

For a separate frontend deployment, set:

```env
CLIENT_URL=https://your-frontend-url
```

---

### Frontend — Vercel / Netlify

Build the frontend with:

```bash
npm run build
```

The production output is generated in:

```text
client/dist/
```

For a separately hosted backend, configure:

```env
VITE_API_URL=https://your-server.onrender.com
```

The included:

```text
client/public/_redirects
```

supports SPA fallback behavior for Netlify deployments.

---

### Database

The application can use a hosted PostgreSQL database such as:

* Render PostgreSQL
* Railway PostgreSQL
* Supabase PostgreSQL
* Neon PostgreSQL

After configuring `DATABASE_URL`:

```bash
npx prisma migrate deploy
npm run db:seed
```

Run the seed command only when you want to create/reset the demo dataset.

---

## Current Limitations

The current implementation intentionally keeps the scope focused on core Student Management System functionality.

* No email/SMS notification delivery
* No file-storage service for assignment uploads
* Assignment `fileUrl` is stored as a URL rather than uploaded directly by the application
* No bulk CSV student import/export
* No report card customization UI
* No GPA/CGPA calculation
* No library management
* No hostel management
* No transport management
* No payroll management
* No inventory management
* No payment gateway
* No mobile application
* No multi-tenancy
* No messaging/chat system
* No face recognition
* No OCR
* No LMS integration
* No enterprise analytics/BI module

These limitations match the intentionally focused scope of the project.

---

## Future Improvements

* Downloadable report card customization
* GPA / CGPA Calculation
* Academic Performance Charts
* Attendance Trend Charts
* Bulk Student CSV Import
* Bulk Student CSV Export
* Assignment File Uploads
* Cloud File Storage
* Teacher Qualifications and Documents
* Leave Management
* Holiday Calendar
* Late Submission Handling
* Rubric-Based Assignment Grading
* Room Allocation for Timetable
* Automatic Timetable Conflict Suggestions
* Announcement Read Receipts
* Announcement Attachments
* Profile Picture Upload
* Notification Preferences
* Email Notifications
* SMS Notifications
* Parent Notification System
* Advanced Academic Analytics
* Mobile Application using React Native / Expo

---

## Learning Outcomes

This project demonstrates practical experience in:

* Full-Stack Web Development
* React Development
* Vite-Based Frontend Architecture
* TypeScript
* Tailwind CSS
* React Router
* REST API Development
* Node.js
* Express.js
* PostgreSQL
* Prisma ORM
* Relational Database Design
* JWT Authentication
* Refresh Token Management
* httpOnly Cookies
* Password Hashing
* Role-Based Access Control
* Middleware Design
* Request Validation with Zod
* CRUD API Development
* Modular Backend Architecture
* Service Layer Architecture
* Student Data Management
* Teacher Management
* Parent-Child Data Relationships
* Attendance Management
* Examination and Marks Management
* Assignment Management
* Timetable Management
* Announcement Management
* PDF Report Generation
* Database Migrations
* Database Seeding
* Automated Testing with Vitest
* Responsive UI Development
* Error Handling
* Secure API Design
* Deployment Configuration

---

## Project Highlights

Some of the more technically significant parts of the project are:

### 1. Role-Based Access Control

The system implements four distinct roles:

```text
ADMIN
TEACHER
STUDENT
PARENT
```

Permissions are enforced on the backend using authentication and RBAC middleware.

---

### 2. Role-Scoped Data Isolation

Authorization is not limited to checking the user's role.

The service layer also scopes records according to the authenticated user.

For example:

* Teachers only access assigned sections.
* Students only access their own records.
* Parents only access their linked children.
* Students and parents only see published marks.

---

### 3. Secure JWT Authentication

The authentication system uses:

* Short-lived access tokens
* Refresh tokens
* httpOnly cookies
* Refresh token rotation
* Token revocation
* Password hashing with bcryptjs

This provides a secure session architecture while keeping access tokens short-lived.

---

### 4. Modular Backend Architecture

Backend functionality is organized by domain modules:

```text
auth
students
teachers
parents
classes
attendance
exams
assignments
timetable
announcements
dashboard
profile
health
```

Each module contains its own routes, controllers, schemas, services, and tests where applicable.

---

### 5. Student Report Generation

The system can generate a PDF student report containing:

* Personal details
* Class and section
* Parent information
* Attendance summary
* Examination results
* Assignment status
* Marks
* Feedback

PDF generation is implemented using PDFKit.

---

### 6. Prisma-Based Database Management

Prisma provides:

* Type-safe database access
* Schema-based modeling
* Database migrations
* Relationship management
* Unique constraints
* Referential integrity
* Generated database client

---

### 7. Automated Testing

The backend includes Vitest tests for:

* Authentication
* RBAC
* Token utilities
* Error handling
* Admin flows
* Student services
* Teacher services
* Parent services
* Attendance
* Exams
* Assignments
* Timetable
* Announcements
* Dashboard
* Profile

---

### 8. Responsive Role-Based Frontend

The React frontend provides:

* Protected routes
* Role-based navigation
* Reusable components
* Responsive layouts
* Loading states
* Toast feedback
* Theme support
* Modular page architecture

---

## Documentation

Additional project documentation is available in:

```text
docs/
```

### Product Requirements

```text
docs/prd.md
```

Contains:

* Project overview
* Roles
* Core modules
* Acceptance criteria
* Database design
* API requirements
* Future improvements

### API Reference

```text
docs/api-reference.md
```

Contains:

* API routes
* HTTP methods
* Role requirements
* Data-scoping rules
* Authentication requirements
* Error response format

---

## License

This project is developed for educational, internship, and portfolio purposes.

---

## Author

**Mahi Patel**

B.Tech Computer Engineering • COEP Technological University

GitHub: https://github.com/mahiipatell
