/**
 * Cloudflare Worker: Reverse proxy for /api/* requests to Render backend,
 * and serves static assets for all other routes.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Forward API requests to Render backend
    if (url.pathname.startsWith('/api')) {
      const backendOrigin = env.RENDER_API_ORIGIN || 'https://munchy-api.onrender.com';
      const targetUrl = new URL(url.pathname + url.search, backendOrigin);

      // Hop-by-hop headers that should not be forwarded
      const hopByHopHeaders = new Set([
        'connection',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
        'host',
      ]);

      const forwardHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (!hopByHopHeaders.has(key.toLowerCase())) {
          forwardHeaders.set(key, value);
        }
      }

      forwardHeaders.set('X-Forwarded-Host', url.host);
      forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
      const fetchOptions = {
        method: request.method,
        headers: forwardHeaders,
        body: hasBody ? request.body : null,
        redirect: 'manual',
      };

      try {
        const response = await fetch(targetUrl.toString(), fetchOptions);

        const responseHeaders = new Headers(response.headers);
        if (!responseHeaders.has('Cache-Control')) {
          responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            message:
              'Backend service unreachable. If the server is spinning up from cold sleep, please retry in a moment.',
            error: error.message,
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          },
        );
      }
    }

    // Default: Serve static SPA frontend
    return env.ASSETS.fetch(request);
  },
};
