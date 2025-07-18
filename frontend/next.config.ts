import type { NextConfig } from "next";

// Read host + ports from env (fall back to localhost for safety)
const HOST_IP = process.env.HOST_IP || "127.0.0.1";
const BACKEND_PORT = process.env.HOST_BACKEND_PORT || "8000";
const BACKEND = `http://${HOST_IP}:${BACKEND_PORT}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // FastAPI routes (leave /api/auth/* alone for NextAuth)
      { source: "/api/users/:path*",    destination: `${BACKEND}/api/users/:path*` },
      { source: "/api/face/:path*",     destination: `${BACKEND}/api/face/:path*` },
      // Register — two rules so *client* uses no‑slash but backend gets slash
      { source: "/api/register",        destination: `${BACKEND}/api/register/` },
      { source: "/api/register/:path*", destination: `${BACKEND}/api/register/:path*` },
    ];
  },
};

export default nextConfig;
