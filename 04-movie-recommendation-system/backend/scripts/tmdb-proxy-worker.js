// TMDB reverse proxy for Cloudflare Workers.
//
// Purpose: some ISPs reset connections specifically to themoviedb.org's
// domain at the TLS handshake level (SNI-based interference), even though
// TMDB itself is fully up. This worker sits on Cloudflare's own domain
// (which isn't blocked) and transparently forwards requests to the real
// TMDB API and image CDN, so the backend/frontend never talk to
// themoviedb.org directly.
//
// It does NOT store or inject any credentials itself - it just forwards
// whatever Authorization header the caller (our backend) already sends,
// so your TMDB token never has to live in this file or in Cloudflare.
//
// Routes:
//   https://<your-worker>.workers.dev/3/...   -> https://api.themoviedb.org/3/...
//   https://<your-worker>.workers.dev/t/p/... -> https://image.tmdb.org/t/p/...

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let targetUrl;

    if (url.pathname.startsWith('/3/')) {
      targetUrl = 'https://api.themoviedb.org' + url.pathname + url.search;
    } else if (url.pathname.startsWith('/t/p/')) {
      targetUrl = 'https://image.tmdb.org' + url.pathname + url.search;
    } else {
      return new Response('Not found. This proxy only serves /3/... (API) and /t/p/... (images).', {
        status: 404,
      });
    }

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });

    const response = await fetch(proxyRequest);

    // Pass the upstream response straight through (status, body, headers).
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  },
};
