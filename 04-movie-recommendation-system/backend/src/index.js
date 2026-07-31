// Node 18+ resolves DNS as "verbatim" by default, meaning it tries whichever
// address family (IPv4/IPv6) the DNS server returns first - often IPv6 on
// Windows. Many home routers/ISPs have a broken or blackholed IPv6 route
// while IPv4 works fine, which surfaces as a confusing "ECONNRESET / no
// response" on every outbound HTTPS request (e.g. to api.themoviedb.org)
// even though the credentials and code are correct. Forcing IPv4-first
// resolution is Node's own documented fix for exactly this symptom.
require('dns').setDefaultResultOrder('ipv4first');

const { validateEnv, env } = require('./config/env');

// Fail fast if required secrets are missing before touching the DB or TMDB.
validateEnv();

const app = require('./app');
const prisma = require('./config/prisma');
const TmdbService = require('./services/tmdb.service');

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`🎬 Movie Recommendation API running on port ${env.port} [${env.nodeEnv}]`);
});

// Non-blocking startup check: confirms TMDB credentials actually work and
// prints a clear pass/fail line, instead of letting the first user request
// silently 502 with no explanation. Doesn't delay `server.listen` above.
TmdbService.verifyCredentials().then((result) => {
  if (result.ok) {
    // eslint-disable-next-line no-console
    console.log('✅ TMDB credentials verified - movie/TV endpoints are ready.');
  } else {
    // eslint-disable-next-line no-console
    console.error(
      `❌ TMDB credential check failed (status ${result.status || 'no response'}): ${result.message}\n` +
        '   Run `npm run verify:tmdb` for a detailed diagnosis, or see backend/.env.'
    );
  }
});

// Graceful shutdown: close DB connections and the HTTP server cleanly.
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', err);
});
