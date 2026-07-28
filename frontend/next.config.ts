import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-dnd", "dnd-core", "@react-dnd/invariant", "@react-dnd/shallowequal", "@react-dnd/asap"],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
