import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function getGitShortHash() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function getBuildTime() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_POINT_APP_MODE: "DEV",
    NEXT_PUBLIC_POINT_BUILD_TIME: getBuildTime(),
    NEXT_PUBLIC_POINT_COMMIT: getGitShortHash(),
    NEXT_PUBLIC_POINT_DECISIONS_VERSION: "Decisions v3",
    NEXT_PUBLIC_POINT_WORKSPACE_VERSION: "v0.2.0",
  },
};

export default nextConfig;
