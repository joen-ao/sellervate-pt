import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // enables forbidden() from next/navigation and the app/forbidden.tsx page
  experimental: { authInterrupts: true },
};

export default nextConfig;
