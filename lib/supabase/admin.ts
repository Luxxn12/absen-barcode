"use server";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrlEnv) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL wajib diisi untuk akses Supabase admin."
  );
}

const supabaseUrl = supabaseUrlEnv as string;
const ACCOUNT_TABLE = "GuruAccounts" as const;

let cachedClient: SupabaseClient | null = null;
let cachedKey: string | null = null;

function getAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk operasi admin Supabase."
    );
  }
  if (!cachedClient || cachedKey !== serviceRoleKey) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedKey = serviceRoleKey;
  }
  if (!cachedClient) {
    throw new Error("Supabase admin client tidak tersedia.");
  }
  return cachedClient;
}

export type EnsureGuruAccountOptions = {
  email?: string;
  password?: string;
  name?: string;
};

function resolveOption(
  value: string | undefined,
  fallbackEnvKey: "SEED_GURU_EMAIL" | "SEED_GURU_PASSWORD" | "SEED_GURU_NAME"
) {
  if (value && value.trim().length) {
    return value.trim();
  }
  const envValue = process.env[fallbackEnvKey];
  if (envValue && envValue.trim().length) {
    return envValue.trim();
  }
  return null;
}

export async function ensureGuruAccount(
  options: EnsureGuruAccountOptions = {}
) {
  const adminClient = getAdminClient();
  const email = resolveOption(options.email, "SEED_GURU_EMAIL");
  const password = resolveOption(options.password, "SEED_GURU_PASSWORD");
  const name = resolveOption(options.name, "SEED_GURU_NAME");

  if (!email || !password) {
    throw new Error(
      "Email dan password guru harus disediakan melalui argumen atau variabel lingkungan."
    );
  }

  const resolvedName = name ?? email;

  const passwordHash = await hash(password, 10);
  const now = new Date().toISOString();

  const {
    data: existing,
    error: existingError,
  } = await adminClient
    .from(ACCOUNT_TABLE)
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`Gagal memeriksa akun guru: ${existingError.message}`);
  }

  const existingId =
    typeof (existing as { id?: unknown } | null)?.id === "string"
      ? (existing as { id: string }).id
      : null;

  if (existingId) {
    const { error: updateError } = await adminClient
      .from(ACCOUNT_TABLE)
      .update({
        name: resolvedName,
        password_hash: passwordHash,
        updated_at: now,
      } satisfies Record<string, unknown>)
      .eq("id", existingId);

    if (updateError) {
      throw new Error(`Gagal memperbarui akun guru: ${updateError.message}`);
    }

    return { created: false, email };
  }

  const { error: insertError } = await adminClient
    .from(ACCOUNT_TABLE)
    .insert({
      email: email.toLowerCase(),
      name: resolvedName,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    } satisfies Record<string, unknown>);

  if (insertError) {
    throw new Error(`Gagal membuat akun guru: ${insertError.message}`);
  }

  return { created: true, email };
}
