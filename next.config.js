/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/inngest': ['./data/**/*'],
  },
};

module.exports = nextConfig;
