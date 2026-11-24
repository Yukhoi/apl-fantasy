import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";

// Read the file explicitly: an inherited development DATABASE_URL must never win.
const { DATABASE_URL } = parse(
  readFileSync(resolve(__dirname, "../.env.test")),
);
if (!DATABASE_URL) {
  throw new Error("Integration tests require DATABASE_URL in apps/apis/.env.test");
}

const target = new URL(DATABASE_URL);
if (
  !["postgres:", "postgresql:"].includes(target.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
  target.port !== "5433" ||
  target.pathname !== "/apl_fantasy_test" ||
  target.username !== "apl_test" ||
  // Reject connection options that could redirect the adapter to another server.
  [...target.searchParams.keys()].some((key) => key !== "schema") ||
  (target.searchParams.has("schema") &&
    target.searchParams.get("schema") !== "public")
) {
  throw new Error(
    "Unsafe integration database: expected apl_test@localhost:5433/apl_fantasy_test (public schema)",
  );
}

process.env.DATABASE_URL = DATABASE_URL;
