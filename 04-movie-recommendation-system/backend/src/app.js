const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const moviesRoutes = require('./routes/movies.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const ratingsRoutes = require('./routes/ratings.routes');
const historyRoutes = require('./routes/history.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');

const app = express();

// ---------- Security & core middleware ----------
app.use(helmet({ crossOriginResourcePolicy: false }));

// In development, Vite may start on 5174/5175/etc. if 5173 is already taken,
// which previously caused every request to fail with an opaque CORS error
// in the browser console (no help from our server logs at all). Accept the
// configured CLIENT_URL plus the common local Vite ports in dev, and log
// any origin we actually reject so it's obvious what to fix.
const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173'];
const allowedOrigins = env.nodeEnv === 'development' ? [...new Set([env.clientUrl, ...devOrigins])] : [env.clientUrl];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl/Postman) that send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      // eslint-disable-next-line no-console
      console.warn(`[CORS] Blocked request from origin "${origin}". Allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (env.nodeEnv === 'development') app.use(morgan('dev'));

// Basic rate limiting to protect auth + TMDB proxy endpoints from abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
