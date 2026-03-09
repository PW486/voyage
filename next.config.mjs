/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/voyage',
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
};

export default nextConfig;
