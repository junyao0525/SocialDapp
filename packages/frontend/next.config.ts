import { config } from 'dotenv';
import type { NextConfig } from "next";
config();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  },
  images: {
    domains: ['gateway.pinata.cloud'],
  },
};

export default nextConfig;
