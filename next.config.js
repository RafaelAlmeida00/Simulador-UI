/**
 * Next.js config: add webpack fallbacks for Node modules that may be
 * imported by libraries (like @asyncapi/parser) so the client bundle
 * doesn't try to resolve `fs` at build time.
 */
const nextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        devIndicators: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
