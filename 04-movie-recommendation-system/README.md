# CineMatch — Movie Recommendation System

A full-stack movie & TV recommendation platform that enables authenticated users to discover, track, and rate movies and TV shows. The application demonstrates third-party API integration, personalized recommendation logic, authentication, and PostgreSQL/Prisma integration.

---

## Features

- User Authentication
- Search Movies, TV Shows & People
- Trending, Popular, Top Rated & Upcoming
- Genre-Wise Browsing
- Watchlist
- Favorites
- User Ratings & Reviews
- Watch History
- Personalized Recommendations
- Dashboard with Statistics
- Secure REST APIs
- PostgreSQL Database (via Prisma ORM)
- Responsive Netflix-Style Frontend

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcrypt

### External API

- TMDB (The Movie Database) API

---

## How to get your API Key

1. Go to https://www.themoviedb.org/signup and create a free account.
2. Open **Settings → API**.
3. Copy the **API Key (v3 auth)**.
4. Copy the **API Read Access Token (v4 auth)** — this is the long token the backend actually uses to call TMDB.

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
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
TMDB_API_KEY=your_tmdb_api_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

Run database migrations

```bash
npx prisma migrate dev --name init
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

Configure `.env`

```
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

Start frontend

```bash
npm run dev
```

Runs on

```
http://localhost:5173
```

---

## Architecture

```
React Frontend (Vite)
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
    Prisma ORM
        │
        ▼
PostgreSQL Database
```

```
 Express REST API
        │
        ▼
  TMDB Service Layer
        │
        ▼
    TMDB API
```

The frontend never calls TMDB directly for data — all requests are routed through the Express backend, keeping the TMDB credentials secure. Poster/backdrop images are loaded straight from TMDB's image CDN in the browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Get current user |
| PATCH | /api/users/me | Update profile |
| GET | /api/movies/trending | Trending movies/TV |
| GET | /api/movies/popular | Popular movies/TV |
| GET | /api/movies/top-rated | Top rated movies/TV |
| GET | /api/movies/upcoming | Upcoming releases |
| GET | /api/movies/genre/:genreId | Browse by genre |
| GET | /api/movies/search | Search movies/TV/people |
| GET | /api/movies/:mediaType/:id | Full title details |
| GET/POST/DELETE | /api/watchlist | Manage watchlist |
| GET/POST/DELETE | /api/favorites | Manage favorites |
| GET/POST/DELETE | /api/ratings | Rate & review titles |
| GET/POST/DELETE | /api/history | Watch history |
| GET | /api/recommendations | Personalized recommendations |

---

## Project Structure

```
04-movie-recommendation-system/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   └── verify-tmdb.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── services/
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## Learning Outcomes

- CRUD Operations
- REST APIs
- Authentication
- Third-Party API Integration
- Recommendation Algorithms
- Database Design with Prisma ORM
- State Management
- Backend Architecture
- Responsive UI Design

---

## Future Improvements

- Social Features (Follow Friends, Share Lists)
- Streaming Availability (Watch Providers)
- Advanced Filters & Sorting
- Email Notifications
- Admin Dashboard
- Dark/Light Theme Toggle
- Offline Support (PWA)