import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Content Security Policy, the main protection against XSS: the page may run only its own scripts
// and talk only to its own origin. frame-ancestors forbids embedding it in a frame (clickjacking).
const contentSecurityPolicy = (dev: boolean) =>
  [
    "default-src 'self'",
    // Dev only: React Fast Refresh's inline script, and CSS that Vite injects as <style> tags.
    // The build has neither.
    `script-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
    `style-src 'self'${dev ? " 'unsafe-inline'" : ''}`,
    // Screenshot previews are blob: URLs, small assets are inlined by the build as data: URLs.
    "img-src 'self' blob: data:",
    // Dev only: Vite's hot reload websocket.
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

const securityHeaders = (dev: boolean) => ({
  'Content-Security-Policy': contentSecurityPolicy(dev),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
});

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 43200,
    strictPort: true,
    watch: { usePolling: true },
    headers: securityHeaders(true),
    // Everything server-side goes through the BFF on the app's own origin, so its session cookie is
    // first-party.
    proxy: {
      '/api': process.env.BFF_PROXY_TARGET || 'http://localhost:43400',
      '/auth': process.env.BFF_PROXY_TARGET || 'http://localhost:43400',
    },
  },
  // `vite preview` serves the production build with the strict policy. A production web server
  // must send the same headers.
  preview: {
    headers: securityHeaders(false),
  },
});
