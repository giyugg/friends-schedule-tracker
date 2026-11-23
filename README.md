# Schedule TBA — Friends College Schedule Tracker

A modern, section-based college schedule tracker built with **Next.js 16**, **Tailwind CSS v4**, and **Supabase** to replace shared Google Sheets timetables.

## Features

- **Introduction Homepage (`/`):** Public landing page introducing Schedule TBA with quick access to sign in or open schedules.
- **Side-by-Side Daily Grid (`/daily`):** View all friends/sections side by side from **7:00 AM – 8:00 PM** (Monday–Saturday) in 30-minute slots, complete with sticky time and section headers, search & column filtering, a live Philippine Time (`Asia/Manila`) indicator, and a visual `12:00 PM – 1:00 PM` Lunch Time highlight.
- **Section Weekly View (`/weekly`):** Full Monday–Saturday timetable named by **section** (e.g., `BSIS 2B-G2`), defaulting to your own section with a quick switcher for any other section.
- **Who's Free Now & Common Free Time Finder (`/free-time`):**
  - Live status cards showing who is currently **Free**, **In Class** (with room/modality and end time), or **Done Today**.
  - Multi-select any friends/sections and a day to find overlapping free hangout windows.
- **Semester Switcher:** Switch between active and archived semesters from the top bar.
- **Sheet-Matched Auto-Coloring + Manual Override:**
  - **Coral:** Major FTF / Lab / Internship
  - **Blush:** Major Online / Hybrid
  - **Amber:** Minor / GenEd FTF
  - **Cream:** Minor / GenEd Online / Hybrid
  - Plus optional manual overrides (`Coral`, `Blush`, `Amber`, `Cream`, `Sage`, `Sky`, `Lavender`).
- **Admin-Only Management (`/admin`):**
  - Create, activate, archive, and clone **Semesters**.
  - Create, reorder, and manage **Sections & Friend Rosters** (multiple friends can share the same section).
  - Add, edit, and delete **Schedule Entries** with automatic overlap detection.
  - Create and manage **Friend Accounts** via the Supabase Admin API (`email_confirm: true`), bypassing Supabase's free-tier email rate limit. New accounts are forced to set their own password on first login.
- **Stay Logged In Opt-In (`/login`):** Users can check **Stay logged in** (30-day persistent cookie) or leave it unchecked (browser session cookie cleared on close).
- **Light & Dark Mode:** Clean pastel aesthetic with a one-click theme toggle.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, `proxy.ts`, Cache Components)
- **Styling:** Tailwind CSS v4 + `lucide-react`
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, `@supabase/ssr`)

---

## Setup Guide (Supabase + Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once provisioned, open **SQL Editor → New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) into the editor and click **Run**.
   - This creates all 5 tables (`semesters`, `sections`, `profiles`, `section_members`, `schedule_entries`), Row Level Security policies, and the auto-admin trigger for your configured admin email.

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

In your Supabase Dashboard, go to **Project Settings → API** (or **API Keys**) and fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

> **Security note:** Never commit `.env.local` and never expose `SUPABASE_SERVICE_ROLE_KEY` with a `NEXT_PUBLIC_` prefix. It is only used server-side in `/admin` to create/reset friend accounts without hitting email rate limits.

### 4. Create your Admin account

1. In your Supabase Dashboard, go to **Authentication → Users → Add user → Create new user**.
2. Enter:
   - **Email:** `admin@example.com` *(matching the admin email configured in `supabase/schema.sql`)*
   - **Password:** *(your chosen admin password)*
   - Check **Auto Confirm User**.
3. Click **Create user**. The database trigger automatically assigns `role = 'admin'` and `must_change_password = false`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your admin email.

### 6. First steps in `/admin`

1. **Semesters tab:** Create your first semester (e.g., `2026-2027 1st Sem`) and set it as **Active**.
2. **Sections & Rosters tab:** Add each college section (e.g., `BSIS 2A-G1`, `BSIT 2A-G1`).
3. **Friend Accounts tab:** Create accounts for your friends with an initial password and assign them to their section. Share their email + initial password — they will be prompted to set their own private password on first login.
4. **Schedules tab:** Add classes per section and day.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in [Vercel](https://vercel.com).
3. Add the same 3 environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in **Project Settings → Environment Variables**.
4. Deploy!

---

## Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Run the production server
- `npm run lint` — Run ESLint
