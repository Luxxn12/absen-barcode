import "dotenv/config";
import { ensureGuruAccount } from "../lib/supabase/admin";

type CliOptions = {
  email?: string;
  password?: string;
  name?: string;
  role?: "guru" | "superadmin";
};

function parseArgs(): CliOptions {
  const options: CliOptions = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, ...rest] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    if (!key || !value.length) continue;
    if (key === "email") {
      options.email = value;
    } else if (key === "password") {
      options.password = value;
    } else if (key === "name") {
      options.name = value;
    } else if (key === "role") {
      if (value === "guru" || value === "superadmin") {
        options.role = value;
      } else {
        console.warn(`Role ${value} tidak dikenal. Gunakan guru atau superadmin.`);
      }
    }
  }
  return options;
}

async function main() {
  try {
    const args = parseArgs();
    const { created, email } = await ensureGuruAccount(args);
    if (created) {
      console.log(`Akun ${email} berhasil dibuat.`);
    } else {
      console.log(`Akun ${email} sudah ada dan telah diperbarui.`);
    }
  } catch (error) {
    console.error("Gagal memastikan akun guru:", error);
    process.exit(1);
  }
}

main();
