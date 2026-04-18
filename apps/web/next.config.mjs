/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@market-copilot/shared"]
};

export default nextConfig;
