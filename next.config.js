/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  ...(process.env.E2E_MODE
    ? {
      webpack: (config) => {
        config.devtool = 'source-map';
        config.optimization = {
          ...config.optimization,
          minimize: false,
        };

        return config;
      },
    }
    : {}),
};

module.exports = nextConfig;
