"use client";

import { useMemo, useState } from "react";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import {
  buildQaReviewItems,
  getDefaultQaReviewItems,
  type QaReviewTag,
} from "@/lib/report/qaReviewItemBuilder";
import type { AnalysisSummaryState } from "@/types/report";

function tagClassName(tag: QaReviewTag) {
  if (tag === "우선" || tag === "조건부") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }
  if (tag === "재검증" || tag === "정책") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  if (tag === "후속") {
    return "bg-indigo-50 text-indigo-700 ring-indigo-100";
  }
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

export function QaFollowUpDashboardCard({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const [showAll, setShowAll] = useState(false);
  const reviewItems = useMemo(
    () => buildQaReviewItems(analysisSummary),
    [analysisSummary]
  );
  const defaultItems = useMemo(
    () => getDefaultQaReviewItems({ analysisSummary, items: reviewItems }),
    [analysisSummary, reviewItems]
  );
  const visibleItems = showAll ? reviewItems : defaultItems;
  const hasMoreItems = reviewItems.length > defaultItems.length;

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            QA 협의/확인 항목
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            QA 코멘트와 잔여 이슈를 기준으로 협의된 내용과 후속 확인 대상을 정리합니다.
          </p>
        </div>
        {hasMoreItems && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            {showAll ? "접기" : `전체 보기 (${reviewItems.length})`}
          </button>
        )}
      </div>

      {reviewItems.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {visibleItems.map((item) => (
            <li
              key={item.id}
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
                    {item.title}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tagClassName(
                  item.tag
                )}`}
              >
                {item.tag}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 QA 확인 항목이 없습니다.
        </p>
      )}
    </section>
  );
}
