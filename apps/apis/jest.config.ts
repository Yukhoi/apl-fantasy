import type { Config } from "jest";

const config: Config = {
  rootDir: ".",
  testEnvironment: "node",

  testRegex: ".*\\.spec\\.ts$",
  testPathIgnorePatterns: ["/node_modules/", "\\.integration\\.spec\\.ts$"],

  moduleFileExtensions: ["ts", "js", "json"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.spec.ts",
  ],

  coverageDirectory: "coverage",
};

export default config;
