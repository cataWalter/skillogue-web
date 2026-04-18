/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
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

// Enable Cloudflare bindings during `next dev`
if (process.env.NODE_ENV === 'development') {
  const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
  initOpenNextCloudflareForDev();
}
