/**
 * Cloudflare Pages Function: Reverse proxy for /api/* requests to Render backend.
 *
 * Handles:
 * - Method, path, and query forwarding
 * - Streaming request and response bodies (including webhooks and uploads)
 * - Removing hop-by-hop headers and host header
 * - Forwarding X-Forwarded-Host and X-Forwarded-Proto headers
 * - Passing Set-Cookie headers back to the browser unmodified on the Pages domain
 * - Disabling proxy-level caching for API routes
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Backend target origin configured in Cloudflare Pages dashboard
  // e.g. RENDER_API_ORIGIN = "https://munchy-api.onrender.com"
  const backendOrigin = env.RENDER_API_ORIGIN || "http://localhost:3000";

  // Retain the full /api/... path and query parameters
  const targetUrl = new URL(url.pathname + url.search, backendOrigin);

  // Hop-by-hop headers that should not be forwarded
  const hopByHopHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
  ]);

  const forwardHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  // Set forwarding identity headers
  forwardHeaders.set("X-Forwarded-Host", url.host);
  forwardHeaders.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const fetchOptions = {
    method: request.method,
    headers: forwardHeaders,
    body: hasBody ? request.body : null,
    redirect: "manual",
  };

  try {
    const response = await fetch(targetUrl.toString(), fetchOptions);

    // Clone response headers
    const responseHeaders = new Headers(response.headers);

    // Disable caching for dynamic API responses by default
    if (!responseHeaders.has("Cache-Control")) {
      responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");
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
          "Backend service unreachable. If the server is spinning up from cold sleep, please retry in a moment.",
        error: error.message,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
