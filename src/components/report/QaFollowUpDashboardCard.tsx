"use client";

import { useState } from "react";

export function QaFollowUpDashboardCard({
  followUps,
}: {
  followUps: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleFollowUps = showAll ? followUps : followUps.slice(0, 6);
  const hiddenCount = Math.max(followUps.length - visibleFollowUps.length, 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            QA Follow-up
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            QA Comment / Follow-up
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            협의 사항과 후속 확인이 필요한 항목입니다.
          </p>
        </div>
        {followUps.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            {showAll ? "접기" : `더 보기 (${hiddenCount})`}
          </button>
        )}
      </div>

      {followUps.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {visibleFollowUps.map((followUp) => (
            <li
              key={followUp}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
            >
              {followUp}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 QA Comment가 없습니다.
        </p>
      )}
    </section>
  );
}
