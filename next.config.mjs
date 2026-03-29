/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is the recommended way to tell Next.js to not bundle a package
    // in the server-side build. This resolves the incompatibility.
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;