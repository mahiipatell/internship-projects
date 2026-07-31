// Centralized environment variable access + startup validation.
// Fails fast with a clear message if required secrets are missing.
const path = require('path');

// Resolve .env explicitly from the backend project root (two levels up from
// this file: src/config/env.js -> backend/.env) instead of relying on
// dotenv's default `process.cwd()` lookup. This avoids "works on my machine"
// bugs where the server is started from a different working directory
// (e.g. an IDE run configuration, a monorepo root, or `nodemon` launched
// from outside `backend/`) and silently loads no .env at all, leaving every
// TMDB_* variable undefined.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Copy-pasting credentials (especially on Windows / from a browser) commonly
// introduces trailing whitespace, CRLF line endings, or wrapping quotes that
// dotenv doesn't always strip. A trailing "\r" or space on the TMDB token
// silently breaks the `Authorization: Bearer <token>` header and TMDB
// responds with 401 - which is confusing to debug. Trim every value we read.
function clean(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/^['"]|['"]$/g, '');
}

// TMDB's dashboard displays the Read Access Token in a wrapped textarea
// (it visually breaks across several lines even though it's one token).
// Selecting it by click-and-drag in some browsers copies those visual line
// breaks as real whitespace/newline characters. That's invisible once
// pasted into a text editor but silently corrupts the token. Opaque
// credentials (API keys/tokens/secrets) never legitimately contain
// whitespace, so strip ALL of it - not just leading/trailing - for those
// fields specifically.
function cleanToken(value) {
  const cleaned = clean(value);
  if (typeof cleaned !== 'string') return cleaned;
  return cleaned.replace(/\s+/g, '');
}

const required = ['DATABASE_URL', 'JWT_SECRET', 'TMDB_API_KEY', 'TMDB_READ_ACCESS_TOKEN'];

// Values still equal to the literal placeholders shipped in .env.example -
// i.e. the user copied the file but never actually filled it in.
const PLACEHOLDER_VALUES = new Set([
  'your_tmdb_v3_api_key_here',
  'your_tmdb_v4_read_access_token_here',
  'replace_this_with_a_long_random_secret_string',
]);

function validateEnv() {
  const missing = required.filter((key) => !clean(process.env[key]));
  const placeholders = required.filter((key) => PLACEHOLDER_VALUES.has(clean(process.env[key])));

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[FATAL] Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy backend/.env.example to backend/.env and fill in the values before starting the server.\n'
    );
    process.exit(1);
  }

  if (placeholders.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[FATAL] These environment variables are still set to their .env.example placeholder values: ${placeholders.join(
        ', '
      )}\n` +
        'Get real values from https://www.themoviedb.org/settings/api (TMDB_API_KEY / TMDB_READ_ACCESS_TOKEN) ' +
        'and set a random string for JWT_SECRET, then restart the server.\n'
    );
    process.exit(1);
  }

  // TMDB_READ_ACCESS_TOKEN is a long JWT (three dot-separated base64 segments).
  // If someone pastes the v3 API key (a short 32-char hex string) into this
  // field instead, every request will 401 against TMDB. Warn early instead
  // of letting it surface later as an opaque 502 on every movie endpoint.
  const token = cleanToken(process.env.TMDB_READ_ACCESS_TOKEN);
  if (token && token.split('.').length !== 3) {
    // eslint-disable-next-line no-console
    console.warn(
      '\n[WARN] TMDB_READ_ACCESS_TOKEN does not look like a TMDB v4 Read Access Token (it should be a long ' +
        'JWT with two dots in it, e.g. "eyJhbGci....xxx.yyy"). Did you paste the API Key by mistake? ' +
        'Get the correct value from the "API Read Access Token" field at ' +
        'https://www.themoviedb.org/settings/api\n'
    );
  }
}

const env = {
  port: clean(process.env.PORT) || 5000,
  nodeEnv: clean(process.env.NODE_ENV) || 'development',
  clientUrl: clean(process.env.CLIENT_URL) || 'http://localhost:5173',
  databaseUrl: clean(process.env.DATABASE_URL),
  jwtSecret: cleanToken(process.env.JWT_SECRET),
  jwtExpiresIn: clean(process.env.JWT_EXPIRES_IN) || '7d',
  jwtCookieName: clean(process.env.JWT_COOKIE_NAME) || 'mrs_token',
  tmdbApiKey: cleanToken(process.env.TMDB_API_KEY),
  tmdbReadAccessToken: cleanToken(process.env.TMDB_READ_ACCESS_TOKEN),
  tmdbBaseUrl: clean(process.env.TMDB_BASE_URL) || 'https://api.themoviedb.org/3',
  tmdbImageBaseUrl: clean(process.env.TMDB_IMAGE_BASE_URL) || 'https://image.tmdb.org/t/p',
};

module.exports = { env, validateEnv };
