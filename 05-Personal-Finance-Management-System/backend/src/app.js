/**
 * Express app configuration.
 *
 * This is deliberately split from server.js: app.js builds the Express
 * app (middleware + routes) and exports it, while server.js is the only
 * file that actually calls `.listen()`. This separation is a common,
 * lightweight pattern that makes the app easy to import in tests later
 * without spinning up a real network port.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// --- Security & parsing middleware -----------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Logging (skip in test env to keep test output clean) ------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Rate limiting -----------------------------------------------------
// A simple, generous global limit — enough to stop abuse/brute force
// without needing Redis or a distributed store for a project this size.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Routes ------------------------------------------------------------
app.use('/api', routes);

// --- 404 + centralized error handling -----------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
