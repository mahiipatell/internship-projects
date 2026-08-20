const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { nodeEnv } = require('./config/env');
const routes = require('./routes');
const {
  errorHandler,
  notFoundHandler,
} = require('./middleware/error.middleware');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an origin, such as Postman or PowerShell
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

if (nodeEnv !== 'test') {
  app.use(
    morgan(nodeEnv === 'production' ? 'combined' : 'dev')
  );
}

app.use('/api', routes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;