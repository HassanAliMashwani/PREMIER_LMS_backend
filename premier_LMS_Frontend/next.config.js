const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Handle Zoom SDK's WebAssembly files and package resolution aliases
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/wasm/[name][ext]',
        },
      });
    }

    // Avoid Webpack trying to resolve unpublished/internal Zoom dependencies.
    // This MUST be applied to both client and server (SSR) builds, otherwise
    // the dev server will crash when pre-compiling the component for SSR.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@zoom/download-manager': false,
    };

    return config;
  },

  // Scoped COEP/COOP headers — ONLY on classroom routes where Zoom SDK runs.
  // These headers enable SharedArrayBuffer (required by Zoom's WASM video pipeline)
  // but would break third-party iframes (YouTube) on other pages if applied globally.
  async headers() {
    return [
      {
        source: '/dashboard/classes/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
