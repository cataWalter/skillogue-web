/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its hydration scripts and the theme init script.
      // 'unsafe-eval' is only added in development (React needs it for call-stack reconstruction).
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      // Tailwind / CSS-in-JS inline styles
      "style-src 'self' 'unsafe-inline'",
      // DiceBear avatars; data: for inline SVGs; blob: for generated content
      "img-src 'self' data: blob: https://api.dicebear.com",
      "font-src 'self'",
      // Appwrite REST API + Realtime WebSocket
      "connect-src 'self' https://*.appwrite.io wss://*.appwrite.io",
      // Service worker registration
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  async headers() {
    const rules = [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];

    // Only set immutable cache headers for static chunks in production.
    // Next.js dev server manages its own caching and warns about overrides.
    if (process.env.NODE_ENV === 'production') {
      rules.push({
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      });
    }

    return rules;
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
