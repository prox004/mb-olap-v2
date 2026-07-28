import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (default in Next.js 16, used by Vercel builds)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    // Force redux to CJS build - fixes @babel/runtime/helpers/esm/objectSpread2 default export error
    resolveAlias: {
      "redux": "redux/dist/redux.js",
    },
  },
  // Webpack config (used for local dev)
  webpack(config) {
    // Force redux to CJS build for same reason
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "redux": require.resolve("redux/dist/redux.js"),
    };
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
