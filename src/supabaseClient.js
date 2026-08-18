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
