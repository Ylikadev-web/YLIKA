import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ensure instrumentation.ts runs on boot (Drive DDL self-heal)
  },
};

export default nextConfig;
