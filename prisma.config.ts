import { defineConfig } from "prisma/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  const contents = readFileSync(envPath, "utf-8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || key in process.env) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
});
