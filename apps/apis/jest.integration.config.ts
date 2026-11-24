import type { Config } from "jest";

const config: Config = {
  rootDir: ".",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  watchman: false,
  testRegex: ".*\\.integration\\.spec\\.ts$",
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/test/setup-integration-env.ts"],
  testTimeout: 30_000,
};

export default config;
