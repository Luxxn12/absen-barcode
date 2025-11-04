import { randomBytes } from "node:crypto";

export function nextPrefixedId(
  existingIds: string[],
  prefix: string,
  pad = 3
): string {
  let max = 0;
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  for (const id of existingIds) {
    const match = pattern.exec(id);
    if (!match) continue;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isNaN(value) && value > max) {
      max = value;
    }
  }
  const next = (max + 1).toString().padStart(pad, "0");
  return `${prefix}${next}`;
}

function randomString(length: number) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    const byte = bytes[index];
    output += charset[byte % charset.length];
  }
  return output;
}

export function randomPrefixedId(
  existingIds: Iterable<string>,
  prefix: string,
  randomLength = 6
): string {
  const existingSet = new Set(existingIds);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = `${prefix}${randomString(randomLength)}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  throw new Error("Tidak dapat menghasilkan ID unik. Coba lagi.");
}
