# API Reference

Base URL: `/api`. All responses are JSON.

Auth: every route except `/health` and `/auth/*` requires
`Authorization: Bearer <accessToken>`. Refresh tokens are sent as an
httpOnly cookie and rotate on every `/auth/refresh`.

"Roles" is the `requireRole` guard on the route. Routes with no guard are open
to any authenticated user but are **scoped in the service layer** — a STUDENT
sees only their own rows, a PARENT only their children's, a TEACHER only their
assigned sections.

Errors: `{ error: { code, message, details? } }` with
`400 VALIDATION_ERROR` (zod, or invalid foreign key), `401 UNAUTHENTICATED`,
`403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` (unique constraint).

---

## Health

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness probe. |

## Auth — `/auth`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | — | Email + password; returns access token and sets the refresh cookie. |
| POST | `/auth/refresh` | — | Rotates the refresh cookie and returns a new access token. |
| POST | `/auth/logout` | — | Revokes the refresh token and clears the cookie. |
| POST | `/auth/forgot-password` | — | Issues a reset token for the email. |
| POST | `/auth/reset-password` | — | Consumes a reset token and sets a new password. |

## Classes — `/classes`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/classes` | any | List classes. |
| POST | `/classes` | ADMIN | Create a class. |
| GET | `/classes/:id/subjects` | any | Subjects mapped to the class. |
| POST | `/classes/:id/subjects` | ADMIN | Map a subject to the class. |
| DELETE | `/classes/:id/subjects/:subjectId` | ADMIN | Unmap a subject. |

## Sections — `/sections`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/sections` | any | List sections, scoped by role (teacher → assigned, student → own, parent → children's). Optional `?classId=`. |
| POST | `/sections` | ADMIN | Create a section under a class. |

## Subjects — `/subjects`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/subjects` | any | List subjects. |
| POST | `/subjects` | ADMIN | Create a subject. |

## Students — `/students`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/students` | ADMIN, TEACHER | List students; teachers see only their assigned sections. Optional `?search=&sectionId=`. |
| POST | `/students` | ADMIN | Create a student + login user (`password` required, min 8). |
| GET | `/students/:id` | any | Student detail; self / own child / assigned-section teacher / admin only. |
| GET | `/students/:id/marks` | any | Student's marks; students and parents see published marks only. |
| PATCH | `/students/:id` | ADMIN | Update student fields, including `parentId` linking. |
| DELETE | `/students/:id` | ADMIN | Soft-delete (deactivate) a student. |

## Teachers — `/teachers`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/teachers` | ADMIN | List teachers. Optional `?search=`. |
| POST | `/teachers` | ADMIN | Create a teacher + login user (`password` required, min 8). |
| GET | `/teachers/:id` | any | Teacher detail with subject/section assignments. |
| PATCH | `/teachers/:id` | ADMIN | Update teacher fields. |
| POST | `/teachers/:id/assignments` | ADMIN | Assign a subject + section to the teacher. |

## Parents — `/parents`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/parents` | ADMIN | List parent users with their linked children. Optional `?search=`. |
| POST | `/parents` | ADMIN | Create a parent login (role `PARENT`). |

## Attendance — `/attendance`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/attendance` | any | Attendance records. Filters `?studentId=&sectionId=&date=`. Students are pinned to themselves, parents to their children. |
| POST | `/attendance` | ADMIN, TEACHER | Bulk upsert a day's attendance for a section. |
| PATCH | `/attendance/:id` | ADMIN, TEACHER | Correct a single record. |

## Exams — `/exams`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/exams` | any | List exams, scoped by role. |
| POST | `/exams` | ADMIN, TEACHER | Create an exam; teachers only for their assigned sections. |
| GET | `/exams/:id/marks` | any | Marks for an exam; students/parents see published marks only. |
| POST | `/exams/:id/marks` | ADMIN, TEACHER | Enter or update marks in bulk. |
| POST | `/exams/:id/publish` | ADMIN, TEACHER | Publish the exam's marks. |

## Assignments — `/assignments`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/assignments` | any | List assignments, scoped by role. |
| POST | `/assignments` | TEACHER | Create an assignment for one of the teacher's own sections. |
| GET | `/assignments/:id/submissions` | any | Submissions; students see only their own. |
| POST | `/assignments/:id/submissions` | STUDENT | Submit or resubmit work. |
| PATCH | `/assignments/:id/submissions/:sid` | ADMIN, TEACHER | Grade a submission. |

## Timetable — `/timetable`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/timetable` | any | Timetable slots, scoped by role. Optional `?sectionId=`. |
| POST | `/timetable` | ADMIN | Create a slot (section + day + period). |
| DELETE | `/timetable/:id` | ADMIN | Remove a slot. |

## Announcements — `/announcements`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/announcements` | any | Announcements visible to the caller's role. |
| POST | `/announcements` | ADMIN, TEACHER | Publish an announcement to selected roles. |

## Dashboard — `/dashboard`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard` | any | Role-shaped summary: admin KPIs, teacher today's classes + exams awaiting marks, student attendance/assignments/timetable, parent per-child summary. |

## Profile — `/profile`

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/profile` | any | Current user's profile. |
| PATCH | `/profile` | any | Update own name/email. |
| PATCH | `/profile/password` | any | Change own password (requires current password). |
