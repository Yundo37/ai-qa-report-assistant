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

function normalizeFallbackText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function isGenericFallbackReviewItem(
  item: ReturnType<typeof buildQaReviewItems>[number]
) {
  const normalizedTitle = normalizeFallbackText(item.title);
  const normalizedDescription = normalizeFallbackText(item.description);
  const normalizedText = `${normalizedTitle} ${normalizedDescription}`;
  const genericFallbackKeywords = [
    "원문확인필요",
    "원문확인",
    "상세확인",
    "분류불가",
    "미분류",
    "기타",
    "추가확인",
    "확인필요",
  ];

  if (item.id.startsWith("generic:unclassified:")) return true;

  return genericFallbackKeywords.some((keyword) =>
    normalizedText.includes(keyword)
  );
}

export function QaFollowUpDashboardCard({
  analysisSummary,
  className = "",
  onExpandedChange,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const reviewItems = useMemo(
    () =>
      buildQaReviewItems(analysisSummary).filter(
        (item) => !isGenericFallbackReviewItem(item)
      ),
    [analysisSummary]
  );
  const defaultItems = useMemo(
    () => getDefaultQaReviewItems({ analysisSummary, items: reviewItems }),
    [analysisSummary, reviewItems]
  );
  const visibleItems = showAll ? reviewItems : defaultItems;
  const hasMoreItems = reviewItems.length > defaultItems.length;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            QA 협의/확인 항목
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            TC Comment 중 ##로 표시된 협의/후속 확인 항목만 선별해 정리합니다.
          </p>
        </div>
        {hasMoreItems && (
          <button
            type="button"
            onClick={() =>
              setShowAll((value) => {
                const nextValue = !value;
                onExpandedChange?.(nextValue);
                return nextValue;
              })
            }
            className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            {showAll ? "접기" : `전체 보기 (${reviewItems.length})`}
          </button>
        )}
      </div>

      {reviewItems.length > 0 ? (
        <ul
          className={`mt-4 space-y-2 ${
            showAll ? "" : "flex-1"
          }`}
        >
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
        <p className="mt-4 flex min-h-[180px] flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          표시할 QA 확인 항목이 없습니다.
        </p>
      )}
    </section>
  );
}
