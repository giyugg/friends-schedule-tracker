# Schedule TBA

**Schedule TBA** is a private, section-based college schedule and academic tracker built to replace shared spreadsheet timetables. It brings class schedules, real-time friend availability, group coordination, and personal grade tracking into a single web application.

---

## Core Features

- **Side-by-Side Daily Grid:** View schedules across sections from **7:00 AM – 8:00 PM** (Monday–Saturday) in 30-minute intervals, complete with sticky time and section headers, filtering, a midday break highlight, and a live Philippine Time (`Asia/Manila`) indicator.
- **Section Weekly Timetable:** Inspect a full Monday–Saturday grid for any visible section, complete with structured college, program, and specialization metadata, plus quick switching across active and archived semesters.
- **Who's Free Now & Common Window Finder:**
  - Live status indicators showing whether friends are currently **Free**, **In Class** (with room, modality, and end time), or **Done Today**.
  - Multi-select availability calculator that finds overlapping free windows across chosen friends or sections for any day of the week.
- **Circles & Organization Dashboards:** Group spaces for friend circles and student organizations that bring member rosters, roles, live statuses, and combined timetables into one view.
- **Private Grades & GWA Tracker:** Personal semester-by-semester grade ledger featuring automatic GWA computation, academic vs. non-academic unit classification, honors standing checks, and term locking to prevent accidental edits.
- **Account & Theme Controls:** Optional persistent sessions, self-service password updates, display-name change requests, and a pastel-styled light/dark mode toggle.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components & Server Actions), React 19, TypeScript
- **Styling:** Tailwind CSS v4, `lucide-react`
- **Database & Auth:** Supabase (PostgreSQL, SSR Cookie Auth, Row-Level Security)

---

## Technical Highlights

- **Section-Centric Scheduling:** Class entries are attached to academic sections rather than individual users. Friends sharing a block automatically inherit the same timetable without duplicating schedule data.
- **Relationship-Scoped Visibility:** PostgreSQL Row-Level Security (RLS) restricts profile and schedule visibility based on shared sections, friend circles, and organizations, keeping schedules scoped to relevant peers.
- **Strict Grade Isolation & Term Locking:** Personal grade records are isolated to the account owner at the database policy level, and database triggers enforce immutability on locked terms until explicitly unlocked.
- **Timezone-Consistent Slot Engine:** Schedule rendering, overlap checks, and free-time intersections operate on discrete 30-minute slot indices anchored to `Asia/Manila` time so live statuses remain consistent regardless of client device settings.
- **Automatic Course Color Mapping:** Timetable blocks derive pastel color themes automatically from class category (*Major*, *Minor*, *Internship*, *Other*) and modality (*Face-to-Face*, *Online*, *Hybrid*), with support for manual palette overrides.

---

## Project Structure

```text
├── app/
│   ├── (app)/            # Authenticated pages (profile, daily, weekly, free-time, grades, groups, admin)
│   └── actions/          # Server Actions (auth, profile, grades, and domain-scoped admin/ modules)
├── components/
│   ├── admin/            # Admin dashboard shell and isolated tab modules
│   ├── auth/             # Login and password update forms
│   ├── grades/           # Private grade editor, honors cards, converter, and modals
│   ├── layout/           # AppShell, sidebar navigation, theme provider, and skeletons
│   ├── profile/          # Profile cards, live class status, and free-friends directory
│   └── schedule/         # Shared side-by-side timetable grid and schedule/group views
├── lib/                  # Domain types, academic catalog, GWA & schedule utilities, cached loaders
└── tests/                # Native Node test suite for GWA, schedule, and catalog logic
```

---

## Access & Administration

Schedule TBA is a privately operated, invite-only instance. Environment configuration, database operations, semester management, and member account provisioning are maintained centrally by the project administrator.
