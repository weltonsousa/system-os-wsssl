import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
