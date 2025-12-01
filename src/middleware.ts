import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Define Content Security Policy (moderate strictness)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for Astro components
    "style-src 'self' 'unsafe-inline'", // Allow inline styles for Astro components
    "img-src 'self' data: https:", // Allow images from self, data URIs, and HTTPS
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com", // Allow GitHub API calls
    "frame-ancestors 'none'", // Prevent framing
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  const csp = cspDirectives.join('; ');

  // Continue with the request and get the response
  const response = await next();

  // Add security headers to the response
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add HSTS only in production (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
});
