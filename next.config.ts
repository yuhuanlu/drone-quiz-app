import type { NextConfig } from "next";
const isGithubPages = process.env.NODE_ENV === 'production'

const repo = 'drone-quiz-app' // <- 換成你的 repo 名稱
const nextConfig: NextConfig = {
  /* config options here */
   output: 'export', // 啟用 static export
  basePath: isGithubPages ? `/${repo}` : '',
  assetPrefix: isGithubPages ? `/${repo}/` : '',
};

export default nextConfig;
