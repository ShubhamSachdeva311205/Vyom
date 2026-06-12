import type { NextConfig } from "next";

// Content-Security-Policy. Scoped to the third parties the app actually loads:
//   - Razorpay checkout script + its API/telemetry hosts
//   - Supabase (auth, REST, storage, realtime) over https + wss
//   - pdf.js worker (bundled, same-origin; needs blob: worker + wasm)
// script/style keep 'unsafe-inline' as a pragmatic baseline (Next ships inline
// bootstrap scripts and Razorpay injects inline). Tighten to nonces later
// (Issue #76). frame-ancestors 'none' + X-Frame-Options: DENY kill the
// /admin clickjacking finding (#114).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://api.cloudinary.com http://127.0.0.1:54321 ws://127.0.0.1:54321",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // pdfkit loads its .afm font metric files from disk at runtime via
  // fs.readFileSync. Next/Turbopack would otherwise tree-shake them
  // out of the bundle and the renderer throws "ENOENT data/Helvetica.afm".
  // Externalising it leaves pdfkit in node_modules where its relative
  // paths work.
  serverExternalPackages: ["pdfkit"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
