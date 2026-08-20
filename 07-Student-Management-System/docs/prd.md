# Student Management System — Internship Project PRD & Build Plan

**Type:** Solo-developer internship project (AI-assisted)
**Timeline:** 2–4 weeks
**Stack:** React + Vite + TypeScript + Tailwind + shadcn/ui | Node.js + Express + TypeScript | PostgreSQL + Prisma | JWT + Refresh Tokens

---

## 1. Overview

A clean, responsive, production-quality Student Management System for a school/college, sized for a solo developer to build in 2–4 weeks. Scope is deliberately minimal: 4 roles, 11 core modules, no enterprise features. Optimized to be portfolio-worthy and interview-defensible.

**Roles:** Admin, Teacher, Student, Parent

---

## 2. Out of Scope

Library, Hostel, Transport, Payroll, Inventory, AI features, Analytics/BI, Messaging/Chat, Payment Gateway, Multi-tenancy, SMS, Mobile App, Microservices, complex notification pipelines, Face Recognition, OCR, LMS, and any other enterprise-only functionality. Notifications are in-app only (no email/SMS delivery in v1).

---

## 3. Core Modules

### 3.1 Authentication
- **Purpose:** Secure login/logout with role-based access.
- **Features:** Login, Logout, Forgot/Reset Password, JWT access token + refresh token, RBAC middleware.
- **User Flow:** User submits email/password → server validates → returns access + refresh token → client stores access token in memory, refresh token in httpOnly cookie → protected routes attach `Authorization` header.
- **Acceptance Criteria:** Invalid credentials rejected with generic error; expired access token auto-refreshes via refresh endpoint; logout invalidates refresh token; unauthorized role access returns 403.
- **Future Improvements:** Email verification, OAuth login.

### 3.2 Dashboard
- **Purpose:** Role-specific landing page summarizing key info.
- **Features:** Admin: total students/teachers/classes, today's attendance %. Teacher: today's classes, pending marks entry. Student: attendance %, upcoming assignments, timetable snippet. Parent: child's attendance/marks summary.
- **User Flow:** User logs in → redirected to role dashboard → widgets fetch summary data on load.
- **Acceptance Criteria:** Dashboard loads within 2s with skeleton loaders; each role sees only their own relevant data.
- **Future Improvements:** Charts/trends, customizable widgets.

### 3.3 Student Management
- **Purpose:** Manage student records end-to-end.
- **Features:** Create/edit/view student profile (name, DOB, contact, class/section, parent link), search & filter, list with pagination.
- **User Flow:** Admin adds student → assigns class/section → links parent (optional) → student appears in roster.
- **Acceptance Criteria:** Required fields validated; duplicate email rejected; only Admin can create/edit; Teacher/Student/Parent have read-only scoped access.
- **Future Improvements:** Bulk CSV import/export, document uploads.

### 3.4 Teacher Management
- **Purpose:** Manage teacher records and class/subject assignments.
- **Features:** Create/edit/view teacher profile, assign subjects and class-sections.
- **User Flow:** Admin adds teacher → assigns to subject(s) + section(s) → teacher sees assigned classes on login.
- **Acceptance Criteria:** A teacher only sees data for their assigned sections; only Admin can create/edit teachers.
- **Future Improvements:** Qualifications/document uploads.

### 3.5 Classes & Subjects
- **Purpose:** Define the academic structure.
- **Features:** Create classes, sections, subjects; map subjects to classes.
- **User Flow:** Admin creates a class (e.g., "Grade 10") → adds sections (e.g., "A") → adds subjects → maps subjects to the class.
- **Acceptance Criteria:** Section names unique per class; subject codes unique; only Admin can manage.
- **Future Improvements:** Academic year versioning.

### 3.6 Attendance
- **Purpose:** Track daily student attendance.
- **Features:** Teacher marks daily attendance per section (Present/Absent/Late), student/parent view attendance %, admin views all.
- **User Flow:** Teacher opens section roster for today → marks status per student → submits → attendance % recalculated.
- **Acceptance Criteria:** One record per student per date; only the assigned teacher (or Admin) can mark/edit; students/parents see read-only view.
- **Future Improvements:** Leave requests, holiday calendar.

### 3.7 Marks / Results
- **Purpose:** Record and publish exam results.
- **Features:** Teacher creates an exam (name, subject, max marks), enters marks per student, Admin/Teacher publishes results, student/parent view results.
- **User Flow:** Teacher creates exam → enters marks for the section → marks saved as draft → submits (locks) → Admin/Teacher publishes → students see results.
- **Acceptance Criteria:** Marks cannot exceed max marks; results hidden from students until published; only assigned teacher enters marks.
- **Future Improvements:** GPA/CGPA calculation, downloadable report card PDF.

### 3.8 Assignments
- **Purpose:** Homework creation, submission, and grading.
- **Features:** Teacher creates assignment (title, description, due date, subject/section), student submits (text or file), teacher grades with marks + feedback.
- **User Flow:** Teacher posts assignment → students see it in their list → student submits before due date → teacher reviews submissions → grades each.
- **Acceptance Criteria:** Submission blocked after due date (v1: hard deadline, no late-submission logic); teacher only sees/grades submissions for their own assignments.
- **Future Improvements:** Late submission with penalty, rubric-based grading.

### 3.9 Timetable
- **Purpose:** Weekly class schedule.
- **Features:** Admin builds a weekly timetable per section (day, period, subject, teacher); student/teacher view their own schedule.
- **User Flow:** Admin assigns subject + teacher to a day/period slot for a section → timetable renders as a grid → student/teacher see their filtered view.
- **Acceptance Criteria:** A teacher cannot be double-booked in the same day/period; only Admin can edit.
- **Future Improvements:** Room allocation, conflict auto-suggestions.

### 3.10 Announcements
- **Purpose:** Simple one-way communication.
- **Features:** Admin/Teacher posts an announcement (title, body, scope: institution-wide or section-specific); all relevant users see it in a feed.
- **User Flow:** Teacher/Admin creates announcement → scoped users see it on their dashboard/feed.
- **Acceptance Criteria:** Teacher can only post to their own sections; Admin can post institution-wide; feed sorted newest-first.
- **Future Improvements:** Read receipts, attachments.

### 3.11 User Profile
- **Purpose:** Self-service account management.
- **Features:** View/edit own profile (limited fields), change password.
- **User Flow:** User opens Profile page → edits allowed fields or changes password → saves.
- **Acceptance Criteria:** Password change requires current password; role/permission fields are never user-editable.
- **Future Improvements:** Profile picture upload, notification preferences.

---

## 4. Database Design (PostgreSQL / Prisma)

Minimal, normalized schema. All PKs are `String @id @default(uuid())`; timestamps `createdAt`/`updatedAt` on every table.

| Table | Key Fields | Notes |
|---|---|---|
| `User` | email (unique), passwordHash, role (enum: ADMIN/TEACHER/STUDENT/PARENT) | Central auth table |
| `RefreshToken` | userId (FK), tokenHash, expiresAt, revokedAt | Session management |
| `Student` | userId (FK, unique), firstName, lastName, dob, sectionId (FK), parentId (FK → User, nullable) | One row per student |
| `Teacher` | userId (FK, unique), firstName, lastName | One row per teacher |
| `Class` | name | e.g. "Grade 10" |
| `Section` | classId (FK), name | e.g. "A" — unique per class |
| `Subject` | name, code (unique) | |
| `ClassSubject` | classId (FK), subjectId (FK) | Join table: subjects offered per class |
| `TeacherAssignment` | teacherId (FK), subjectId (FK), sectionId (FK) | Which teacher teaches what, where |
| `Attendance` | studentId (FK), sectionId (FK), date, status (enum: PRESENT/ABSENT/LATE) | Unique on (studentId, date) |
| `Exam` | subjectId (FK), sectionId (FK), name, maxMarks, examDate | |
| `Mark` | examId (FK), studentId (FK), marksObtained, published (bool) | Unique on (examId, studentId) |
| `Assignment` | subjectId (FK), sectionId (FK), teacherId (FK), title, description, dueDate, maxMarks | |
| `Submission` | assignmentId (FK), studentId (FK), fileUrl / textContent, submittedAt, marksObtained, feedback | Unique on (assignmentId, studentId) |
| `TimetableSlot` | sectionId (FK), subjectId (FK), teacherId (FK), dayOfWeek, period | Unique on (teacherId, dayOfWeek, period) and (sectionId, dayOfWeek, period) |
| `Announcement` | authorId (FK), scope (enum: INSTITUTION/SECTION), sectionId (FK, nullable), title, body | |

**Relationships (summary):** `User` 1:1 `Student`/`Teacher` (role-dependent) · `Class` 1:N `Section` · `Section` 1:N `Student` · `Class` N:M `Subject` via `ClassSubject` · `Teacher` N:M `Subject`/`Section` via `TeacherAssignment` · `Student` N:1 `User` (parent, nullable) · `Exam` 1:N `Mark` · `Assignment` 1:N `Submission`.

---

## 5. API Endpoints

| Method | Route | Purpose | Authorization |
|---|---|---|---|
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Authenticated |
| POST | `/api/auth/refresh` | Refresh access token | Public (valid refresh token) |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public (valid reset token) |
| GET | `/api/dashboard` | Role-specific dashboard summary | Authenticated |
| GET | `/api/students` | List/search students | Admin, Teacher (scoped) |
| POST | `/api/students` | Create student | Admin |
| GET | `/api/students/:id` | Get student detail | Admin, Teacher (scoped), Student (self), Parent (own child) |
| PATCH | `/api/students/:id` | Update student | Admin |
| DELETE | `/api/students/:id` | Deactivate student | Admin |
| GET | `/api/teachers` | List teachers | Admin |
| POST | `/api/teachers` | Create teacher | Admin |
| GET | `/api/teachers/:id` | Get teacher detail | Admin, Teacher (self) |
| PATCH | `/api/teachers/:id` | Update teacher | Admin |
| POST | `/api/teachers/:id/assignments` | Assign subject/section to teacher | Admin |
| GET | `/api/classes` | List classes | Authenticated |
| POST | `/api/classes` | Create class | Admin |
| GET | `/api/sections` | List sections | Authenticated |
| POST | `/api/sections` | Create section | Admin |
| GET | `/api/subjects` | List subjects | Authenticated |
| POST | `/api/subjects` | Create subject | Admin |
| GET | `/api/attendance` | Get attendance (filterable) | Admin, Teacher (scoped), Student (self), Parent (own child) |
| POST | `/api/attendance` | Mark attendance for a section/date | Teacher (assigned), Admin |
| PATCH | `/api/attendance/:id` | Edit attendance record | Teacher (assigned), Admin |
| GET | `/api/exams` | List exams | Authenticated (scoped) |
| POST | `/api/exams` | Create exam | Teacher, Admin |
| POST | `/api/exams/:id/marks` | Enter/update marks | Teacher (assigned) |
| POST | `/api/exams/:id/publish` | Publish results | Teacher, Admin |
| GET | `/api/exams/:id/marks` | View marks | Admin, Teacher (scoped), Student (self, post-publish), Parent (own child, post-publish) |
| GET | `/api/assignments` | List assignments | Authenticated (scoped) |
| POST | `/api/assignments` | Create assignment | Teacher |
| GET | `/api/assignments/:id/submissions` | View submissions | Teacher (owner), Admin |
| POST | `/api/assignments/:id/submissions` | Submit assignment | Student |
| PATCH | `/api/assignments/:id/submissions/:sid` | Grade submission | Teacher (owner) |
| GET | `/api/timetable` | Get timetable (by section or teacher) | Authenticated (scoped) |
| POST | `/api/timetable` | Create timetable slot | Admin |
| DELETE | `/api/timetable/:id` | Remove timetable slot | Admin |
| GET | `/api/announcements` | List announcements (scoped) | Authenticated |
| POST | `/api/announcements` | Create announcement | Admin, Teacher (scoped) |
| GET | `/api/profile` | Get own profile | Authenticated |
| PATCH | `/api/profile` | Update own profile | Authenticated |
| PATCH | `/api/profile/password` | Change password | Authenticated |

---

## 6. UI Pages

| Page | Purpose | Main Components | Buttons | Tables | Forms | Navigation |
|---|---|---|---|---|---|---|
| Login | Authenticate user | Login card | Login | — | Email/password form | → Dashboard |
| Dashboard (role-aware) | Role summary landing page | KPI cards, quick list | Quick action buttons per role | Recent activity (compact) | — | Sidebar |
| Students List | Browse/search students | Search bar, filter dropdowns, table | Add Student | Student table (paginated) | Search/filter form | → Student Detail |
| Student Detail/Form | View/edit one student | Profile card, tabs (Info/Attendance/Marks) | Save, Cancel | Attendance/marks mini-tables | Student info form | Back to list |
| Teachers List | Browse teachers | Table | Add Teacher | Teacher table | — | → Teacher Detail |
| Teacher Detail/Form | View/edit teacher + assignments | Profile card, assignment list | Save, Assign Subject | Assignments table | Teacher info + assignment form | Back to list |
| Classes & Sections | Manage academic structure | Class list, section list, subject list | Add Class, Add Section, Add Subject | Class/section/subject tables | Simple name/code forms | Sidebar |
| Attendance | Mark/view attendance | Section+date picker, roster grid | Mark All Present, Submit | Roster table with status toggles | — | Sidebar |
| Exams & Marks | Create exams, enter/view marks | Exam list, marks entry grid | Add Exam, Submit Marks, Publish | Marks entry table | Exam creation form | → Marks Entry |
| Assignments List | Browse assignments | List/cards | Add Assignment (Teacher) | Submission roster (Teacher) | Assignment creation form | → Assignment Detail |
| Assignment Detail | View/submit/grade one assignment | Instructions panel, submission form/roster | Submit (Student), Grade (Teacher) | Submissions table (Teacher) | Submission form, grading form | Back to list |
| Timetable | View/edit weekly schedule | Day × period grid | Add Slot (Admin) | Grid acts as table | Slot creation form (Admin) | Sidebar |
| Announcements | Feed of announcements | Reverse-chron feed | Post Announcement (Admin/Teacher) | — | Announcement form | Sidebar |
| Profile | Manage own account | Profile card | Save, Change Password | — | Profile edit form, password form | Top-bar menu |

**Shared UI shell:** Sidebar nav (role-filtered) + top bar (page title, profile menu). Responsive: sidebar collapses to a drawer on mobile; tables become stacked cards below 640px.

---

## 7. Non-Functional Requirements

- **Security:** Passwords hashed (bcrypt), JWT short-lived access token + rotating refresh token, RBAC enforced server-side on every route, input validation (Zod) on all request bodies.
- **Performance:** Paginated list endpoints (default 20/page); indexed foreign keys and unique constraints per §4.
- **Validation:** Required-field and format validation on both client (form-level) and server (schema-level); server is the source of truth.
- **Responsiveness:** Mobile-first layout; usable down to 375px width.
- **Accessibility:** Semantic HTML, labeled form fields, keyboard-navigable menus and modals, visible focus states.
- **Error Handling:** Centralized API error middleware returning `{ error: { code, message } }`; client shows inline field errors + toast for general failures; no unhandled promise rejections.

---

## 8. Project Structure (No Monorepo)

```
student-management-system/
├── client/
│   ├── src/
│   │   ├── pages/            # one folder per §6 page
│   │   ├── components/       # shared UI (shadcn/ui based)
│   │   ├── features/         # api hooks + feature-specific components, per module
│   │   ├── lib/               # api client, auth context, utils
│   │   └── routes.tsx
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── modules/           # one folder per module: auth, students, teachers, classes, attendance, exams, assignments, timetable, announcements, profile
│   │   │   └── students/
│   │   │       ├── students.routes.ts
│   │   │       ├── students.controller.ts
│   │   │       ├── students.service.ts
│   │   │       └── students.schema.ts   # Zod validation
│   │   ├── middleware/         # auth, rbac, error-handler
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── app.ts
│   └── package.json
└── docs/
    ├── prd.md                 # this document
    └── api-reference.md       # generated/maintained alongside routes
```

---

## 9. Build Plan (Milestones)

Each milestone ends with a **runnable application**.

### Milestone 1 — Project Setup
- **Objective:** Scaffold client and server, connect to a local PostgreSQL DB.
- **Database:** Initialize Prisma, create `User` model, run first migration.
- **Backend:** Express app skeleton, health-check route, env config, error middleware.
- **Frontend:** Vite + React + TS scaffold, Tailwind + shadcn/ui configured, base routing shell.
- **Testing:** Health-check endpoint returns 200; app boots without errors.
- **Completion Checklist:** [ ] Client runs on `npm run dev` [ ] Server runs and connects to DB [ ] `/health` returns 200
- **Git Commit:** `chore: project scaffold with client, server, and prisma setup`

### Milestone 2 — Authentication
- **Objective:** Full login/logout/refresh flow with RBAC middleware.
- **Database:** `RefreshToken` model + migration.
- **Backend:** `/api/auth/*` routes, JWT issuing/verification, RBAC middleware, password hashing.
- **Frontend:** Login page, auth context, protected route wrapper, token refresh interceptor.
- **Testing:** Login with valid/invalid credentials; protected route blocks unauthenticated access.
- **Completion Checklist:** [ ] Login works end-to-end [ ] Refresh token rotates [ ] Logout clears session
- **Git Commit:** `feat: JWT authentication with refresh tokens and RBAC middleware`

### Milestone 3 — Classes & Subjects + Student Module
- **Objective:** Academic structure + student CRUD.
- **Database:** `Class`, `Section`, `Subject`, `ClassSubject`, `Student` models + migrations.
- **Backend:** CRUD routes for classes/sections/subjects (Admin-only writes); student CRUD + search/pagination.
- **Frontend:** Classes & Sections page, Students List page, Student Detail/Form page.
- **Testing:** Create class → section → student, verify relations persist; validation errors surface correctly.
- **Completion Checklist:** [ ] Admin can create class/section/subject [ ] Admin can add/edit/search students [ ] Non-admins get read-only or 403
- **Git Commit:** `feat: class, section, subject, and student management modules`

### Milestone 4 — Teacher Module
- **Objective:** Teacher CRUD + subject/section assignment.
- **Database:** `Teacher`, `TeacherAssignment` models + migrations.
- **Backend:** Teacher CRUD routes, assignment endpoint.
- **Frontend:** Teachers List page, Teacher Detail/Form with assignment UI.
- **Testing:** Assign a teacher to subject+section, verify scoped queries filter correctly for that teacher.
- **Completion Checklist:** [ ] Admin can add/edit teachers [ ] Admin can assign subjects/sections [ ] Teacher sees only assigned data
- **Git Commit:** `feat: teacher management with subject and section assignments`

### Milestone 5 — Attendance
- **Objective:** Daily attendance marking and viewing.
- **Database:** `Attendance` model + migration (unique on studentId+date).
- **Backend:** Mark/edit/list attendance routes, scoped by role.
- **Frontend:** Attendance page (roster grid, date/section picker).
- **Testing:** Mark attendance for a section, verify duplicate-date prevention and correct % calculation.
- **Completion Checklist:** [ ] Teacher can mark attendance in under a minute [ ] Student/Parent see read-only view [ ] Duplicate records blocked
- **Git Commit:** `feat: daily attendance tracking module`

### Milestone 6 — Marks / Results
- **Objective:** Exam creation, marks entry, publishing.
- **Database:** `Exam`, `Mark` models + migrations.
- **Backend:** Exam CRUD, marks entry/publish routes with max-marks validation.
- **Frontend:** Exams & Marks page (exam list + marks entry grid), results view for students/parents.
- **Testing:** Enter marks exceeding max marks → rejected; unpublished results hidden from student.
- **Completion Checklist:** [ ] Teacher can create exam and enter marks [ ] Publish gate works [ ] Students see results only after publish
- **Git Commit:** `feat: exam and marks entry module with result publishing`

### Milestone 7 — Assignments
- **Objective:** Assignment creation, submission, grading.
- **Database:** `Assignment`, `Submission` models + migrations.
- **Backend:** Assignment CRUD, submission + grading routes.
- **Frontend:** Assignments List + Assignment Detail page (submission form / grading roster).
- **Testing:** Submit before/after due date; teacher grades a submission and student sees feedback.
- **Completion Checklist:** [ ] Teacher can post assignments [ ] Student can submit [ ] Teacher can grade with feedback
- **Git Commit:** `feat: assignment creation, submission, and grading`

### Milestone 8 — Timetable
- **Objective:** Weekly schedule builder and viewer.
- **Database:** `TimetableSlot` model + migration (unique constraints on teacher/section+day+period).
- **Backend:** CRUD routes with conflict detection.
- **Frontend:** Timetable grid page (Admin edit, others view).
- **Testing:** Attempt to double-book a teacher/section → rejected with clear error.
- **Completion Checklist:** [ ] Admin can build timetable [ ] Conflicts blocked [ ] Student/Teacher see their own schedule
- **Git Commit:** `feat: timetable module with scheduling conflict prevention`

### Milestone 9 — Announcements
- **Objective:** Simple announcement feed.
- **Database:** `Announcement` model + migration.
- **Backend:** Create/list routes, scope filtering.
- **Frontend:** Announcements feed page + creation form.
- **Testing:** Teacher-scoped announcement only visible to their section; Admin announcement visible to all.
- **Completion Checklist:** [ ] Admin/Teacher can post [ ] Feed correctly scoped [ ] Sorted newest-first
- **Git Commit:** `feat: announcements module`

### Milestone 10 — Dashboard & Profile
- **Objective:** Tie everything together with role dashboards and profile management.
- **Database:** No new models (aggregation queries only).
- **Backend:** `/api/dashboard` aggregation route per role; `/api/profile` routes.
- **Frontend:** Four role dashboards, Profile page (edit + change password).
- **Testing:** Each role sees correct, scoped summary data; password change requires current password.
- **Completion Checklist:** [ ] All 4 dashboards implemented [ ] Profile edit + password change work
- **Git Commit:** `feat: role-based dashboards and user profile management`

### Milestone 11 — Testing & Polish
- **Objective:** Harden the app for demo/portfolio quality.
- **Database:** Seed script with realistic sample data for all roles/modules.
- **Backend:** Key integration tests (auth, attendance, marks, assignments); consistent error responses across all routes.
- **Frontend:** Loading/empty/error states on every page; responsive pass on mobile widths; accessibility pass (labels, focus states, contrast).
- **Testing:** Full manual walkthrough of every module as each of the 4 roles.
- **Completion Checklist:** [ ] Seed data loads cleanly [ ] No console errors across all pages [ ] Mobile layout usable [ ] Core flows covered by tests
- **Git Commit:** `test: integration tests, seed data, and UI polish pass`

### Milestone 12 — Deployment
- **Objective:** Ship a live, demo-able instance.
- **Database:** Hosted PostgreSQL (e.g., Railway/Supabase/Render), production migration run.
- **Backend:** Deploy server (Render/Railway/Fly.io), environment variables configured, CORS locked to production frontend origin.
- **Frontend:** Deploy client (Vercel/Netlify), pointed at production API URL.
- **Testing:** Smoke-test all core flows against the live deployment.
- **Completion Checklist:** [ ] Live URL works end-to-end [ ] Environment variables secured (no secrets in repo) [ ] README with setup + demo credentials
- **Git Commit:** `chore: production deployment configuration and README`

---

*End of document.*