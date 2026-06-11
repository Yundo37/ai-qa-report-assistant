"use client";

import { useState } from "react";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";

const ACTION_BADGES = ["Priority check", "Follow-up", "Policy check", "Monitor"];

export function QaFollowUpDashboardCard({
  followUps,
}: {
  followUps: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleFollowUps = showAll ? followUps : followUps.slice(0, 5);
  const hiddenCount = Math.max(followUps.length - visibleFollowUps.length, 0);

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            AI Follow-up Actions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Follow-up candidates organized from QA comments and report data.
          </p>
        </div>
        {followUps.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            {showAll ? "Collapse" : `View more (${hiddenCount})`}
          </button>
        )}
      </div>

      {followUps.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {visibleFollowUps.map((followUp, index) => (
            <li
              key={followUp}
              className="flex items-start justify-between gap-3 rounded-2xl border border-indigo-100/80 bg-white px-3 py-2 shadow-sm shadow-indigo-50/40"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <ReportAssetSlot
                  type="follow-up"
                  className="size-6 rounded-lg bg-indigo-50 bg-none shadow-sm ring-1 ring-indigo-100"
                  imageClassName="size-3"
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                    {followUp}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    Based on QA Comment / Follow-up text.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-100/80">
                {ACTION_BADGES[index % ACTION_BADGES.length]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No QA Follow-up Action to display.
        </p>
      )}
    </section>
  );
}
