// Thin wrapper around the TMDB API. All outbound TMDB calls flow through this
// module so the read-access token / API key never leaks to the frontend and
// so we have one place to add caching, retries, or error normalization.
const axios = require('axios');
const { env } = require('../config/env');

const tmdb = axios.create({
  baseURL: env.tmdbBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Normalize TMDB errors into a consistent shape for our error middleware.
//
// IMPORTANT: previously any 401 from TMDB (bad/missing credentials) was
// silently rewritten into a generic "Failed to reach TMDB API" 502 with no
// indication of *why*. That's what produced "502 for every TMDB endpoint"
// with no way to diagnose it - the real cause (invalid TMDB_READ_ACCESS_TOKEN)
// was thrown away. This version:
//   1. Always logs the real upstream status + TMDB's own error message to
//      the server console, so the terminal running `npm run dev` tells you
//      exactly what's wrong.
//   2. Returns a specific, actionable message to the API client instead of
//      a generic one.
//   3. Still avoids returning a bare 401, because the frontend's axios
//      interceptor treats any 401 from OUR api as "your session expired"
//      and logs the user out - that must stay reserved for OUR auth
//      middleware, not TMDB's.
const TRANSIENT_ERROR_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EPIPE']);
const MAX_ATTEMPTS = 3; // 1 initial try + 2 retries

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function request(path, params = {}, attempt = 1) {
  try {
    const { data } = await tmdb.get(path, {
  headers: {}, // Don't send Bearer token
  params: {
    api_key: env.tmdbApiKey,
    include_adult: false,
    ...params,
  },
});
    return data;
  } catch (err) {
    // A reset/timeout can be a one-off network blip rather than a real
    // outage - retry with backoff before giving up and surfacing it to the client.
    if (!err.response && attempt < MAX_ATTEMPTS && TRANSIENT_ERROR_CODES.has(err.code)) {
      const backoffMs = 500 * attempt; // 500ms, then 1000ms
      // eslint-disable-next-line no-console
      console.warn(`[TMDB] ${err.code} on GET ${path} (attempt ${attempt}/${MAX_ATTEMPTS}) - retrying in ${backoffMs}ms...`);
      await delay(backoffMs);
      return request(path, params, attempt + 1);
    }

    if (err.response) {
      // TMDB responded, but with an error status.
      const upstreamStatus = err.response.status;
      const tmdbMessage = err.response.data?.status_message || err.message;

      // eslint-disable-next-line no-console
      console.error(
        `[TMDB] ${upstreamStatus} on GET ${path} - ${tmdbMessage}` +
          (upstreamStatus === 401
            ? ' | Check TMDB_READ_ACCESS_TOKEN in backend/.env - it must be the v4 "API Read Access Token", not the v3 API Key.'
            : '')
      );

      const wrapped = new Error(
        upstreamStatus === 401
          ? 'TMDB rejected our credentials. Verify TMDB_READ_ACCESS_TOKEN in backend/.env is the correct v4 Read Access Token from https://www.themoviedb.org/settings/api, then restart the server.'
          : upstreamStatus === 404
          ? 'The requested title could not be found on TMDB.'
          : upstreamStatus === 429
          ? 'TMDB rate limit reached. Please wait a moment and try again.'
          : `TMDB error: ${tmdbMessage}`
      );
      // Map TMDB's 401 to 502 (Bad Gateway - our upstream failed us) so it
      // never collides with our own session-expiry 401 on the frontend.
      wrapped.statusCode = upstreamStatus === 401 ? 502 : upstreamStatus;
      throw wrapped;
    }

    if (err.request) {
      // Request was sent but no response came back at all (DNS failure,
      // timeout, offline, wrong TMDB_BASE_URL, firewall, etc).
      // eslint-disable-next-line no-console
      console.error(`[TMDB] No response for GET ${path} - ${err.code || err.message}`);
      const wrapped = new Error(
        `Unable to reach TMDB (${err.code || err.message}) after retrying. This is usually a network path issue, not your credentials: check your internet connection, disable any VPN/proxy or antivirus HTTPS scanning temporarily, and confirm TMDB_BASE_URL in backend/.env is exactly https://api.themoviedb.org/3.`
      );
      wrapped.statusCode = 502;
      throw wrapped;
    }

    // Something went wrong building/sending the request itself.
    // eslint-disable-next-line no-console
    console.error(`[TMDB] Request setup failed for GET ${path} -`, err);
    const wrapped = new Error('Failed to build the TMDB request.');
    wrapped.statusCode = 500;
    throw wrapped;
  }
}

// Lightweight credential check used by the server startup log and by the
// standalone `npm run verify:tmdb` script. Hits TMDB's cheapest endpoint
// (the configuration endpoint) so it doesn't count against search/detail
// quotas and returns fast.
async function verifyCredentials(attempt = 1) {
  try {
    await tmdb.get("/configuration", {
  params: {
    api_key: env.tmdbApiKey,
  },
  });
    return { ok: true };
  } catch (err) {
    if (!err.response && attempt < MAX_ATTEMPTS && TRANSIENT_ERROR_CODES.has(err.code)) {
      await delay(500 * attempt);
      return verifyCredentials(attempt + 1);
    }
    const status = err.response?.status;
    const message = err.response?.data?.status_message || err.message;
    return { ok: false, status, message };
  }
}

const TmdbService = {
  verifyCredentials,

  // ---------- Discovery / Lists ----------
  trending: (mediaType = 'all', timeWindow = 'week', page = 1) =>
    request(`/trending/${mediaType}/${timeWindow}`, { page }),

  popular: (mediaType = 'movie', page = 1) => request(`/${mediaType}/popular`, { page }),

  topRated: (mediaType = 'movie', page = 1) => request(`/${mediaType}/top_rated`, { page }),

  upcoming: (page = 1) => request('/movie/upcoming', { page }),

  nowPlaying: (page = 1) => request('/movie/now_playing', { page }),

  onTheAir: (page = 1) => request('/tv/on_the_air', { page }),

  discoverByGenre: (mediaType = 'movie', genreId, page = 1, sortBy = 'popularity.desc') =>
    request(`/discover/${mediaType}`, { with_genres: genreId, page, sort_by: sortBy }),

  genreList: (mediaType = 'movie') => request(`/genre/${mediaType}/list`),

  // ---------- Search ----------
  searchMulti: (query, page = 1) => request('/search/multi', { query, page }),
  searchMovies: (query, page = 1) => request('/search/movie', { query, page }),
  searchTv: (query, page = 1) => request('/search/tv', { query, page }),
  searchPeople: (query, page = 1) => request('/search/person', { query, page }),

  // ---------- Details ----------
  details: (mediaType, id) =>
    request(`/${mediaType}/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations,reviews,keywords',
    }),

  personDetails: (id) =>
    request(`/person/${id}`, { append_to_response: 'combined_credits,images' }),

  // ---------- Similar / Recommendations (used by our recommendation engine) ----------
  similar: (mediaType, id, page = 1) => request(`/${mediaType}/${id}/similar`, { page }),
  recommendations: (mediaType, id, page = 1) =>
    request(`/${mediaType}/${id}/recommendations`, { page }),
};

module.exports = TmdbService;
