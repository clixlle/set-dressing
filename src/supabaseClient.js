import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them in your Vercel project's Environment Variables (Settings → Environment Variables), then redeploy."
    : null;

// A placeholder URL/key that createClient() will accept without throwing,
// used only when real env vars aren't present — so the app can still render
// and show a clear on-page message instead of a blank white screen.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

/* ---------- Auth ----------
   There's no public sign-up — just two fixed accounts (Modeler / Admin),
   created once by hand in the Supabase dashboard. Supabase Auth requires an
   email format under the hood, so a plain username like "3Dmodel" maps to
   3dmodel@set-dressing.internal — the person only ever sees the username. */
const AUTH_DOMAIN = "set-dressing.internal";
export const ADMIN_EMAIL = `realview@${AUTH_DOMAIN}`;
export const MODELER_EMAIL = `3dmodel@${AUTH_DOMAIN}`;

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${AUTH_DOMAIN}`;
}

export function roleForEmail(email) {
  if (email === ADMIN_EMAIL) return "admin";
  if (email === MODELER_EMAIL) return "modeler";
  return null;
}

export async function signIn(username, password) {
  const email = usernameToEmail(username);
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/* ---------- Row <-> app item mapping ----------
   The database uses snake_case columns; the app uses camelCase fields. */
export function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    typeGroup: row.type_group,
    room: row.room,
    style: row.style,
    status: row.status,
    photo: row.photo,
    description: row.description || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function itemToRow(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    type_group: item.typeGroup,
    room: item.room,
    style: item.style,
    status: item.status,
    photo: item.photo,
    description: item.description || "",
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}
