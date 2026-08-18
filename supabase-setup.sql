-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor → New query).

create table if not exists items (
  id text primary key,
  name text not null,
  type text,
  type_group text,
  room text,
  style text,
  status text not null default 'not-started',
  photo text,
  description text default '',
  created_at bigint,
  updated_at bigint
);

-- Realtime: lets every connected account see changes made by anyone else, live.
alter publication supabase_realtime add table items;

-- Row Level Security: this app has no login system, so every account uses the
-- same shared "anon" key. These policies let that shared key read/write freely.
-- That's the right tradeoff for a small internal team tool — anyone with the
-- app URL can edit data, same as everyone sharing one spreadsheet.
alter table items enable row level security;

create policy "Anyone can read items"
  on items for select
  using (true);

create policy "Anyone can insert items"
  on items for insert
  with check (true);

create policy "Anyone can update items"
  on items for update
  using (true);

create policy "Anyone can delete items"
  on items for delete
  using (true);
