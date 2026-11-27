"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  createFriendAccountAction,
  deleteFriendAccountAction,
  resetFriendPasswordAction,
  updateFriendProfileAction,
} from "@/app/actions/admin/accounts";
import type { ActionResult } from "@/app/actions/admin/types";
import {
  COLLEGES,
  UNASSIGNED_COLLEGE_GROUP_KEY,
  formatSectionTooltip,
  getCollegeTheme,
  getSectionAcademicInfo,
  groupSectionsByCollege,
  type AcademicCollege,
  type CollegeSectionGroup,
  type SectionAcademicInfo,
} from "@/lib/academic-catalog";
import type {
  Profile,
  SectionWithMembers,
  Semester,
  UserRole,
} from "@/lib/types";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "COF-";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

interface CollegeSectionPickerProps {
  collegeFilter: string;
  sectionId: string;
  onCollegeFilterChange: (collegeCode: string) => void;
  onSectionIdChange: (sectionId: string) => void;
  sections: SectionWithMembers[];
  sectionGroups: CollegeSectionGroup<SectionWithMembers>[];
  collegeSectionCounts: Map<string, number>;
  legacySectionCount: number;
  disabled?: boolean;
  compact?: boolean;
  collegeLabel?: string;
  sectionLabel?: string;
  unassignedLabel?: string;
}

function CollegeSectionPicker({
  collegeFilter,
  sectionId,
  onCollegeFilterChange,
  onSectionIdChange,
  sections,
  sectionGroups,
  collegeSectionCounts,
  legacySectionCount,
  disabled = false,
  compact = false,
  collegeLabel = "College Filter",
  sectionLabel = "Assign Section",
  unassignedLabel = "None / Unassigned",
}: CollegeSectionPickerProps) {
  const selectClass = compact
    ? "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
    : "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed";

  const selectedCollegeGroup = useMemo(
    () =>
      collegeFilter
        ? sectionGroups.find((g) => g.key === collegeFilter) ?? null
        : null,
    [collegeFilter, sectionGroups]
  );

  const handleCollegeChange = (nextCollege: string) => {
    onCollegeFilterChange(nextCollege);
    if (nextCollege && sectionId) {
      const currentSection = sections.find((s) => s.id === sectionId);
      if (currentSection) {
        const key =
          getSectionAcademicInfo(currentSection).college?.code ??
          UNASSIGNED_COLLEGE_GROUP_KEY;
        if (key !== nextCollege) {
          onSectionIdChange("");
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          {collegeLabel}
        </label>
        <select
          disabled={disabled || sections.length === 0}
          value={collegeFilter}
          onChange={(e) => handleCollegeChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All Colleges ({sections.length})</option>
          {COLLEGES.map((college) => {
            const count = collegeSectionCounts.get(college.code) ?? 0;
            return (
              <option key={college.code} value={college.code}>
                {college.code} — {college.name} ({count})
              </option>
            );
          })}
          {legacySectionCount > 0 && (
            <option value={UNASSIGNED_COLLEGE_GROUP_KEY}>
              Other / Unassigned College ({legacySectionCount})
            </option>
          )}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          {sectionLabel}
        </label>
        <select
          disabled={disabled || sections.length === 0}
          value={sectionId}
          onChange={(e) => onSectionIdChange(e.target.value)}
          className={selectClass}
        >
          <option value="">
            {sections.length === 0
              ? "No sections in semester yet"
              : unassignedLabel}
          </option>
          {collegeFilter === "" ? (
            sectionGroups.map((group) => (
              <optgroup key={group.key} label={group.label}>
                {group.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code}
                  </option>
                ))}
              </optgroup>
            ))
          ) : selectedCollegeGroup ? (
            selectedCollegeGroup.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No sections under {collegeFilter} this semester
            </option>
          )}
        </select>
      </div>
    </div>
  );
}

interface EnrichedAccountItem {
  profile: Profile;
  sections: {
    section: SectionWithMembers;
    academic: SectionAcademicInfo;
  }[];
  colleges: AcademicCollege[];
  hasLegacySection: boolean;
  searchIndex: string;
}

interface AccountsTabProps {
  currentAdminId: string;
  activeSemester: Semester | null;
  profiles: Profile[];
  sections: SectionWithMembers[];
  hasServiceRoleKey: boolean;
  isPending: boolean;
  runAction: (fn: () => Promise<ActionResult>) => void;
}

export function AccountsTab({
  currentAdminId,
  activeSemester,
  profiles,
  sections,
  hasServiceRoleKey,
  isPending,
  runAction,
}: AccountsTabProps) {
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState(() => generateTempPassword());
  const [newAccRole, setNewAccRole] = useState<UserRole>("member");
  const [newAccCollegeFilter, setNewAccCollegeFilter] = useState("");
  const [newAccSectionId, setNewAccSectionId] = useState("");
  const [copiedPass, setCopiedPass] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [accountCollegeFilter, setAccountCollegeFilter] =
    useState<string>("all");

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetTempPass, setResetTempPass] = useState("");

  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileRole, setEditProfileRole] = useState<UserRole>("member");
  const [editCollegeFilter, setEditCollegeFilter] = useState("");
  const [editSectionId, setEditSectionId] = useState("");
  const [editInitialSectionId, setEditInitialSectionId] = useState("");
  const [editSectionTouched, setEditSectionTouched] = useState(false);

  const sectionGroups = useMemo(
    () => groupSectionsByCollege(sections),
    [sections]
  );

  const { collegeSectionCounts, legacySectionCount } = useMemo(() => {
    const counts = new Map<string, number>();
    let legacy = 0;
    for (const group of sectionGroups) {
      if (group.college) {
        counts.set(group.college.code, group.sections.length);
      } else {
        legacy += group.sections.length;
      }
    }
    return { collegeSectionCounts: counts, legacySectionCount: legacy };
  }, [sectionGroups]);

  const enrichedAccounts = useMemo<EnrichedAccountItem[]>(() => {
    const sectionsByUser = new Map<string, SectionWithMembers[]>();
    for (const sec of sections) {
      for (const member of sec.members) {
        const list = sectionsByUser.get(member.id) ?? [];
        list.push(sec);
        sectionsByUser.set(member.id, list);
      }
    }

    return profiles.map((profile) => {
      const userSections = sectionsByUser.get(profile.id) ?? [];
      const detailed = userSections.map((section) => ({
        section,
        academic: getSectionAcademicInfo(section),
      }));

      const seenColleges = new Set<string>();
      const colleges: AcademicCollege[] = [];
      let hasLegacySection = false;

      for (const { academic } of detailed) {
        if (academic.college) {
          if (!seenColleges.has(academic.college.code)) {
            seenColleges.add(academic.college.code);
            colleges.push(academic.college);
          }
        } else {
          hasLegacySection = true;
        }
      }

      const tokens = [
        profile.display_name,
        profile.email,
        profile.role,
        ...detailed.flatMap(({ section, academic }) => [
          section.code,
          academic.college?.code ?? "",
          academic.college?.name ?? "",
          academic.program?.code ?? "",
          academic.program?.name ?? "",
          academic.specialization ?? "",
        ]),
      ];

      return {
        profile,
        sections: detailed,
        colleges,
        hasLegacySection,
        searchIndex: tokens.join(" ").toLowerCase(),
      };
    });
  }, [profiles, sections]);

  const filterSummary = useMemo(() => {
    const collegeAccountCounts = new Map<string, number>();
    let legacyAccountCount = 0;
    let unassignedAccountCount = 0;

    for (const item of enrichedAccounts) {
      if (item.sections.length === 0) {
        unassignedAccountCount++;
        continue;
      }
      for (const col of item.colleges) {
        collegeAccountCounts.set(
          col.code,
          (collegeAccountCounts.get(col.code) ?? 0) + 1
        );
      }
      if (item.hasLegacySection) {
        legacyAccountCount++;
      }
    }

    const presentColleges = COLLEGES.filter(
      (c) => (collegeAccountCounts.get(c.code) ?? 0) > 0
    );

    return {
      presentColleges,
      collegeAccountCounts,
      legacyAccountCount,
      unassignedAccountCount,
    };
  }, [enrichedAccounts]);

  const effectiveCollegeFilter = useMemo(() => {
    if (accountCollegeFilter === "all") return "all";
    if (accountCollegeFilter === "unassigned") {
      return activeSemester && filterSummary.unassignedAccountCount > 0
        ? "unassigned"
        : "all";
    }
    if (accountCollegeFilter === UNASSIGNED_COLLEGE_GROUP_KEY) {
      return filterSummary.legacyAccountCount > 0
        ? UNASSIGNED_COLLEGE_GROUP_KEY
        : "all";
    }
    return (filterSummary.collegeAccountCounts.get(accountCollegeFilter) ?? 0) >
      0
      ? accountCollegeFilter
      : "all";
  }, [accountCollegeFilter, activeSemester, filterSummary]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return enrichedAccounts.filter((item) => {
      if (effectiveCollegeFilter === "unassigned") {
        if (item.sections.length > 0) return false;
      } else if (effectiveCollegeFilter === UNASSIGNED_COLLEGE_GROUP_KEY) {
        if (!item.hasLegacySection) return false;
      } else if (effectiveCollegeFilter !== "all") {
        if (!item.colleges.some((c) => c.code === effectiveCollegeFilter)) {
          return false;
        }
      }

      if (normalizedQuery && !item.searchIndex.includes(normalizedQuery)) {
        return false;
      }

      return true;
    });
  }, [enrichedAccounts, effectiveCollegeFilter, searchQuery]);

  const hasFilterControls =
    Boolean(activeSemester) &&
    (filterSummary.presentColleges.length > 0 ||
      filterSummary.legacyAccountCount > 0 ||
      filterSummary.unassignedAccountCount > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 h-fit">
        <h2 className="font-bold text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-rose-500" />
          Create Friend Account
        </h2>

        {!hasServiceRoleKey && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200">
            Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> to create and reset
            accounts directly from here.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(async () => {
              const res = await createFriendAccountAction({
                displayName: newAccName,
                email: newAccEmail,
                initialPassword: newAccPass,
                role: newAccRole,
                sectionId: newAccSectionId || undefined,
              });
              if (res.ok) {
                setNewAccName("");
                setNewAccEmail("");
                setNewAccPass(generateTempPassword());
                setNewAccRole("member");
                setNewAccCollegeFilter("");
                setNewAccSectionId("");
              }
              return res;
            });
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              placeholder="e.g., Giyu, Mark, Zeke"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={newAccEmail}
              onChange={(e) => setNewAccEmail(e.target.value)}
              placeholder="friend@ms.bulsu.edu.ph"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Initial Password (forced change on first login)
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                required
                minLength={8}
                value={newAccPass}
                onChange={(e) => setNewAccPass(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                title="Generate new password"
                onClick={() => setNewAccPass(generateTempPassword())}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Copy password"
                onClick={() => {
                  navigator.clipboard.writeText(newAccPass);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 1500);
                }}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {copiedPass ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <CollegeSectionPicker
            collegeFilter={newAccCollegeFilter}
            sectionId={newAccSectionId}
            onCollegeFilterChange={setNewAccCollegeFilter}
            onSectionIdChange={setNewAccSectionId}
            sections={sections}
            sectionGroups={sectionGroups}
            collegeSectionCounts={collegeSectionCounts}
            legacySectionCount={legacySectionCount}
            disabled={!activeSemester}
            collegeLabel="College"
            sectionLabel={
              activeSemester
                ? `Assign Section (${activeSemester.name})`
                : "Assign Section"
            }
            unassignedLabel="None yet"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Role
            </label>
            <select
              value={newAccRole}
              onChange={(e) => setNewAccRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="member">Friend (View-only)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending || !hasServiceRoleKey}
            className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold py-2.5 text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create Account
          </button>
        </form>
      </div>

      {/* Existing Accounts */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base">
              All Accounts ({profiles.length})
            </h2>
            {activeSemester && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing college &amp; section assignments for{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeSemester.name}
                </span>
              </p>
            )}
          </div>
          {(searchQuery.trim() !== "" || effectiveCollegeFilter !== "all") && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing {filteredAccounts.length} of {profiles.length}
            </span>
          )}
        </div>

        {/* Search & College Filter Controls */}
        {profiles.length > 0 && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, college, or section…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 pl-9 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-slate-400 dark:focus:border-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  title="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {hasFilterControls && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAccountCollegeFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    effectiveCollegeFilter === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All ({profiles.length})
                </button>

                {filterSummary.presentColleges.map((college) => {
                  const count =
                    filterSummary.collegeAccountCounts.get(college.code) ?? 0;
                  const theme = getCollegeTheme(college.code);
                  const active = effectiveCollegeFilter === college.code;
                  return (
                    <button
                      key={college.code}
                      type="button"
                      title={college.name}
                      onClick={() => setAccountCollegeFilter(college.code)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        active
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${theme.dotClass}`}
                      />
                      <span>
                        {college.code} ({count})
                      </span>
                    </button>
                  );
                })}

                {filterSummary.legacyAccountCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAccountCollegeFilter(UNASSIGNED_COLLEGE_GROUP_KEY)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      effectiveCollegeFilter === UNASSIGNED_COLLEGE_GROUP_KEY
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    }`}
                  >
                    Needs College ({filterSummary.legacyAccountCount})
                  </button>
                )}

                {filterSummary.unassignedAccountCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAccountCollegeFilter("unassigned")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      effectiveCollegeFilter === "unassigned"
                        ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Unassigned ({filterSummary.unassignedAccountCount})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No accounts match your current filter.
            </p>
            {(searchQuery.trim() !== "" ||
              effectiveCollegeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setAccountCollegeFilter("all");
                }}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Reset search &amp; filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAccounts.map((item) => {
              const p = item.profile;
              const isMe = p.id === currentAdminId;
              const isEditing = editProfileId === p.id;
              const isResetting = resetUserId === p.id;

              return (
                <div key={p.id} className="py-3 space-y-2.5">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {p.display_name}
                        </span>
                        {p.role === "admin" && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase">
                            Admin
                          </span>
                        )}
                        {p.must_change_password && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                            Pending Password Change
                          </span>
                        )}
                        {activeSemester &&
                          (item.sections.length > 0 ? (
                            <>
                              {item.colleges.map((college) => (
                                <span
                                  key={college.code}
                                  title={college.name}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    getCollegeTheme(college.code).badgeClass
                                  }`}
                                >
                                  {college.code}
                                </span>
                              ))}
                              {item.sections.map(({ section }) => (
                                <span
                                  key={section.id}
                                  title={formatSectionTooltip(section)}
                                  className="px-2 py-0.5 rounded bg-sky-100/80 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 text-[10px] font-semibold"
                                >
                                  {section.code}
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                              No section
                            </span>
                          ))}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {p.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit profile & section"
                        onClick={() => {
                          if (isEditing) {
                            setEditProfileId(null);
                            return;
                          }
                          const primarySectionId =
                            item.sections[0]?.section.id ?? "";
                          setResetUserId(null);
                          setEditProfileId(p.id);
                          setEditProfileName(p.display_name);
                          setEditProfileRole(p.role);
                          setEditCollegeFilter("");
                          setEditSectionId(primarySectionId);
                          setEditInitialSectionId(primarySectionId);
                          setEditSectionTouched(false);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Reset temporary password"
                        disabled={!hasServiceRoleKey}
                        onClick={() => {
                          if (isResetting) {
                            setResetUserId(null);
                            return;
                          }
                          setEditProfileId(null);
                          setResetUserId(p.id);
                          setResetTempPass(generateTempPassword());
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      {!isMe && (
                        <button
                          type="button"
                          title="Delete account"
                          disabled={!hasServiceRoleKey || isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `Permanently delete ${p.display_name} (${p.email})?`
                              )
                            ) {
                              runAction(() => deleteFriendAccountAction(p.id));
                            }
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 flex items-center justify-center text-slate-500 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-8">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={editProfileName}
                            onChange={(e) => setEditProfileName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Role
                          </label>
                          <select
                            value={editProfileRole}
                            disabled={isMe}
                            onChange={(e) =>
                              setEditProfileRole(e.target.value as UserRole)
                            }
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs disabled:opacity-60"
                          >
                            <option value="member">Friend</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      <CollegeSectionPicker
                        collegeFilter={editCollegeFilter}
                        sectionId={editSectionId}
                        onCollegeFilterChange={setEditCollegeFilter}
                        onSectionIdChange={(val) => {
                          setEditSectionId(val);
                          setEditSectionTouched(true);
                        }}
                        sections={sections}
                        sectionGroups={sectionGroups}
                        collegeSectionCounts={collegeSectionCounts}
                        legacySectionCount={legacySectionCount}
                        disabled={!activeSemester}
                        compact
                        collegeLabel="College"
                        sectionLabel={
                          activeSemester
                            ? `Section (${activeSemester.name})`
                            : "Section"
                        }
                        unassignedLabel="None / Unassigned"
                      />

                      {item.sections.length > 1 && activeSemester && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          {editSectionTouched
                            ? `Saving will replace their ${item.sections.length} assigned sections in ${activeSemester.name} with ${editSectionId ? "the selected section" : "no section"}.`
                            : `Currently assigned to ${item.sections.length} sections in Sections & Rosters. Leave Section untouched to keep all of them, or choose one to set a single section.`}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditProfileId(null)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isPending || !editProfileName.trim()}
                          onClick={() =>
                            runAction(async () => {
                              const shouldSyncSection =
                                Boolean(activeSemester) &&
                                (editSectionTouched ||
                                  (item.sections.length <= 1 &&
                                    editSectionId !== editInitialSectionId));

                              const res = await updateFriendProfileAction({
                                userId: p.id,
                                displayName: editProfileName,
                                role: editProfileRole,
                                ...(shouldSyncSection && activeSemester
                                  ? {
                                      semesterId: activeSemester.id,
                                      sectionId: editSectionId || null,
                                    }
                                  : {}),
                              });
                              if (res.ok) setEditProfileId(null);
                              return res;
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {isResetting && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={resetTempPass}
                        onChange={(e) => setResetTempPass(e.target.value)}
                        placeholder="New temporary password"
                        className="flex-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-transparent px-2.5 py-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          runAction(async () => {
                            const res = await resetFriendPasswordAction({
                              userId: p.id,
                              temporaryPassword: resetTempPass,
                            });
                            if (res.ok) setResetUserId(null);
                            return res;
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Set Temp Password
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
