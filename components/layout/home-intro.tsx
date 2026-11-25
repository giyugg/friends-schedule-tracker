"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  LayoutGrid,
  Moon,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "./theme-provider";

interface HomeIntroProps {
  isSignedIn: boolean;
  displayName?: string;
}

export function HomeIntro({ isSignedIn, displayName }: HomeIntroProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/60 via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#F19C99]/35 dark:bg-[#6E2C2A] border border-[#DF7A76]/50 flex items-center justify-center text-[#9E2A26] dark:text-[#FDE8E8]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight">
              Schedule TBA
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <Link
              href={isSignedIn ? "/profile" : "/login"}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5"
            >
              {isSignedIn ? "Open Profile" : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Friends College Schedule Tracker
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-[1.1]">
            Everyone&apos;s college schedule,{" "}
            <span className="text-rose-600 dark:text-rose-400">
              all in one place.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            <strong>Schedule TBA</strong> replaces messy shared spreadsheets
            with a clean, section-based timetable—so you can instantly see who
            has class, where everyone is, and when the group is free to hang
            out.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/profile"
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-sm"
                >
                  Go to My Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/free-time"
                  className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Check Who&apos;s Free Now
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-sm"
              >
                Sign In to View Schedules
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {isSignedIn && displayName && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Signed in as <strong>{displayName}</strong>
            </p>
          )}

          {/* Mini Visual Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Monday · Side-by-Side Preview
                </span>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Color-Coded by Modality
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border p-3 bg-[#F19C99] border-[#DF7A76] text-[#3B1211] dark:bg-[#6E2C2A] dark:border-[#B55855] dark:text-[#FDE8E8]">
                <div className="text-xs font-bold">IT 208*</div>
                <div className="text-[11px] opacity-85 mt-0.5">Prog Lab 2</div>
                <div className="text-[10px] font-semibold uppercase opacity-75 mt-1">
                  Major · FTF
                </div>
              </div>

              <div className="rounded-xl border p-3 bg-[#F7D6D6] border-[#E5B3B3] text-[#4A1919] dark:bg-[#4C2629] dark:border-[#8A4A4F] dark:text-[#FCE7E7]">
                <div className="text-xs font-bold">IS 207</div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  ONLINE CLASS
                </div>
                <div className="text-[10px] font-semibold uppercase opacity-75 mt-1">
                  Major · Online
                </div>
              </div>

              <div className="rounded-xl border p-3 bg-[#F9D96B] border-[#E0B83C] text-[#3F2E05] dark:bg-[#634B14] dark:border-[#B88F2A] dark:text-[#FEF3C7]">
                <div className="text-xs font-bold">AAP 101</div>
                <div className="text-[11px] opacity-85 mt-0.5">ACAD 4</div>
                <div className="text-[10px] font-semibold uppercase opacity-75 mt-1">
                  Minor · FTF
                </div>
              </div>

              <div className="rounded-xl border p-3 bg-[#FFF3CC] border-[#E6D39A] text-[#45360B] dark:bg-[#473D1E] dark:border-[#8A7638] dark:text-[#FEF9E7]">
                <div className="text-xs font-bold">ETH 101</div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  ONLINE CLASS
                </div>
                <div className="text-[10px] font-semibold uppercase opacity-75 mt-1">
                  Minor · Online
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-4">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-base">Side-by-Side Daily Grid</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Compare every section&apos;s Monday–Saturday schedule from 7:00
                AM to 8:00 PM with sticky headers, filters, and a live time
                line.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-base">Section Weekly View</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                View your own section&apos;s full Monday–Saturday timetable at a
                glance, or switch to check any friend&apos;s section.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-base">Common Free Time Finder</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                See who&apos;s free right now in Philippine Time, and pick any
                group of friends to find overlapping free windows.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto space-y-1.5">
          <p>Schedule TBA · Invite-only college schedule tracker</p>
          <p>
            Created by Kyle A. Acuña of Bulacan State University, BS Information
            System Student
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <a
              href="https://github.com/giyugg/friends-schedule-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Source Code
            </a>
            <span aria-hidden="true">·</span>
            <span
              className="select-none"
              style={{
                direction: "rtl",
                unicodeBidi: "bidi-override",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              moc.liamg
              <span style={{ display: "none" }} aria-hidden="true">
                nospam
              </span>
              @
              <span style={{ display: "none" }} aria-hidden="true">
                invalid
              </span>
              sisb.elyk.anuca
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
