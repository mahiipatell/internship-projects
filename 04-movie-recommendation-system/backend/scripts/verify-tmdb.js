// Standalone TMDB credential/connectivity check - run with `npm run verify:tmdb`.
// Deliberately does NOT touch Prisma/PostgreSQL, so it isolates TMDB problems
// from database problems when debugging "everything is broken".
// See src/index.js for why this is needed - fixes ECONNRESET/no-response
// errors caused by broken IPv6 routes on some Windows/home networks.
require('dns').setDefaultResultOrder('ipv4first');

const { env } = require('../src/config/env');
const TmdbService = require('../src/services/tmdb.service');

async function main() {
  console.log('Checking TMDB credentials...');
  console.log(`  TMDB_BASE_URL:          ${env.tmdbBaseUrl}`);
  console.log(`  TMDB_READ_ACCESS_TOKEN: ${env.tmdbReadAccessToken ? env.tmdbReadAccessToken.slice(0, 12) + '...' : '(not set)'}`);

  const result = await TmdbService.verifyCredentials();

  if (result.ok) {
    console.log('\n✅ TMDB credentials are valid. The API is reachable.\n');
    process.exit(0);
  }

  console.error(`\n❌ TMDB request failed (status ${result.status || 'no response'}): ${result.message}`);
  if (result.status === 401) {
    console.error(
      '\nYour TMDB_READ_ACCESS_TOKEN was rejected. Go to https://www.themoviedb.org/settings/api and copy the\n' +
        '"API Read Access Token" (a long token starting with "eyJ..."), NOT the shorter "API Key". Paste it into\n' +
        'backend/.env as TMDB_READ_ACCESS_TOKEN, save, and re-run `npm run verify:tmdb`.'
    );
  } else if (!result.status) {
    console.error(
      '\nNo response was received from TMDB at all. Check your internet connection, any proxy/firewall, and\n' +
        'that TMDB_BASE_URL in backend/.env is exactly https://api.themoviedb.org/3'
    );
  }
  process.exit(1);
}

main();
