import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Add them as environment variables (locally in a .env file, and in your Vercel project settings)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}
