# Set Dressing — Production Tracker

A shared modeling checklist for furniture, decor, and kitchen-system assets.
Data lives in Supabase, so everyone editing it — on any account — sees the
same live data.

## One-time setup (do this once, in this order)

### 1. Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's created, open **SQL Editor** → **New query**, paste in the
   contents of `supabase-setup.sql` from this repo, and run it. This creates
   the `items` table and turns on realtime + sharing.
3. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key — you'll need both in step 3.

### 2. Push this code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
(Create the empty repo on GitHub first via "New repository" — don't
initialize it with a README, or the push above will conflict.)

### 3. Connect Vercel to the repo
1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   the GitHub repo you just pushed.
2. Vercel auto-detects Vite — leave the build settings as default.
3. Before deploying, add two **Environment Variables**:
   - `VITE_SUPABASE_URL` — the Project URL from step 1.3
   - `VITE_SUPABASE_ANON_KEY` — the anon public key from step 1.3
4. Click **Deploy**.

That's it — from now on, **every push to the `main` branch on GitHub
automatically redeploys on Vercel**, with no further setup needed.

## Local development
```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

## How data sharing works
There's no login system — anyone who has the deployed URL can view and edit
items, and changes sync live to everyone else via Supabase Realtime. That's
intentional for a small internal team (like one shared spreadsheet), not
meant for a public-facing app. If you ever want to lock it down to specific
people, that's a Supabase Auth addition on top of this — just ask.

## Notes
- Photos are stored as base64 directly in the database. That's fine for a
  small team's use, but if the library grows very large, moving photos to
  Supabase Storage (instead of inline base64) would keep the database
  lighter — happy to make that change later if it becomes worth it.
