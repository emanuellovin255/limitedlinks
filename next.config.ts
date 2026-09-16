import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site-urile găzduite au nevoie de "/" la final ca să meargă căile relative.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
