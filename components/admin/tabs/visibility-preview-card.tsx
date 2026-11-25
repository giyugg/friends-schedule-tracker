"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import type {
  Profile,
  SectionWithMembers,
  VisibilityGroupWithMembers,
} from "@/lib/types";

interface VisibilityPreviewCardProps {
  profiles: Profile[];
  sections: SectionWithMembers[];
  visibilityGroups: VisibilityGroupWithMembers[];
}

export function VisibilityPreviewCard({
  profiles,
  sections,
  visibilityGroups,
}: VisibilityPreviewCardProps) {
  const [previewUserId, setPreviewUserId] = useState(
    () => profiles.find((p) => p.role !== "admin")?.id ?? profiles[0]?.id ?? ""
  );

  const activePreviewUserId = profiles.some((p) => p.id === previewUserId)
    ? previewUserId
    : (profiles.find((p) => p.role !== "admin")?.id ?? profiles[0]?.id ?? "");

  const previewVisibility = useMemo(() => {
    const target = profiles.find((p) => p.id === activePreviewUserId);
    if (!target) return null;

    if (target.role === "admin") {
      return {
        target,
        isAdmin: true,
        groups: visibilityGroups.filter((g) => g.memberIds.includes(target.id)),
        visiblePeople: profiles.map((p) => ({
          profile: p,
          reasons: [p.id === target.id ? "Self" : "Admin Access"],
        })),
        visibleSectionCodes: sections.map((s) => s.code),
      };
    }

    const mySectionIds = new Set(
      sections
        .filter((s) => s.members.some((m) => m.id === target.id))
        .map((s) => s.id)
    );
    const myGroups = visibilityGroups.filter((g) =>
      g.memberIds.includes(target.id)
    );

    const visiblePeople: { profile: Profile; reasons: string[] }[] = [];
    const visibleUserIds = new Set<string>([target.id]);

    for (const p of profiles) {
      const reasons: string[] = [];
      if (p.id === target.id) {
        reasons.push("Self");
      }
      if (
        p.id !== target.id &&
        sections.some(
          (s) => mySectionIds.has(s.id) && s.members.some((m) => m.id === p.id)
        )
      ) {
        reasons.push("Classmate");
      }
      for (const g of myGroups) {
        if (p.id !== target.id && g.memberIds.includes(p.id)) {
          reasons.push(g.name);
        }
      }
      if (reasons.length > 0) {
        visibleUserIds.add(p.id);
        visiblePeople.push({ profile: p, reasons });
      }
    }

    const visibleSectionCodes = sections
      .filter((s) => s.members.some((m) => visibleUserIds.has(m.id)))
      .map((s) => s.code);

    return {
      target,
      isAdmin: false,
      groups: myGroups,
      visiblePeople,
      visibleSectionCodes,
    };
  }, [activePreviewUserId, profiles, sections, visibilityGroups]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
      <h2 className="font-bold text-base flex items-center gap-2">
        <Eye className="h-4 w-4 text-emerald-500" />
        Visibility Preview
      </h2>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Inspect User
        </label>
        <select
          value={activePreviewUserId}
          onChange={(e) => setPreviewUserId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name} ({p.role})
            </option>
          ))}
        </select>
      </div>

      {previewVisibility && (
        <div className="space-y-3 pt-1 text-xs">
          <div>
            <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1">
              Visible Sections ({previewVisibility.visibleSectionCodes.length})
            </div>
            {previewVisibility.visibleSectionCodes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {previewVisibility.visibleSectionCodes.map((code) => (
                  <span
                    key={code}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium"
                  >
                    {code}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">No sections visible yet</span>
            )}
          </div>

          <div>
            <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1.5">
              Can See ({previewVisibility.visiblePeople.length})
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {previewVisibility.visiblePeople.map(
                ({ profile: p, reasons }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                  >
                    <span className="font-medium truncate">
                      {p.display_name}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1 shrink-0">
                      {reasons.map((r) => (
                        <span
                          key={r}
                          className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
