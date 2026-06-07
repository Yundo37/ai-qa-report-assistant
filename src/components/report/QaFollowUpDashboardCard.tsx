"use client";

import { useState } from "react";

const ACTION_BADGES = ["우선 확인", "후속 확인", "정책 확인", "모니터링"];

export function QaFollowUpDashboardCard({
  followUps,
}: {
  followUps: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleFollowUps = showAll ? followUps : followUps.slice(0, 5);
  const hiddenCount = Math.max(followUps.length - visibleFollowUps.length, 0);

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Follow-up Actions
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            AI Follow-up Actions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            QA 데이터와 Follow-up 내용을 기반으로 정리한 후속 확인 항목입니다.
          </p>
        </div>
        {followUps.length > 5 && (
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
          {visibleFollowUps.map((followUp, index) => (
            <li
              key={followUp}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                  {followUp}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  QA Comment / Follow-up 원문 기반 후속 확인 항목입니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                {ACTION_BADGES[index % ACTION_BADGES.length]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 QA Follow-up Action이 없습니다.
        </p>
      )}
    </section>
  );
}
