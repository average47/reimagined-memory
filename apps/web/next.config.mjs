/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the internal workspace packages (shipped as TypeScript source).
  transpilePackages: ["@repo/ui", "@repo/utils"],
};

export default nextConfig;
