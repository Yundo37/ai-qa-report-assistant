import {
  classifyQaComment,
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

export function QaFollowUpList({
  analysisSummary,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
}) {
  const followUps = analysisSummary.qaFollowUps;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">
        Full QA Comment / Follow-up
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        원문 QA Comment / Follow-up은 유지하고, 연결 Jira와 분류 정보를 함께 표시합니다.
      </p>

      {followUps.length > 0 ? (
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
          {followUps.map((followUp, index) => {
            const metadata = classifyQaComment(followUp, analysisSummary);

            return (
              <li
                key={`${followUp}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p>{followUp}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${tagClassName(
                      metadata.tag
                    )}`}
                  >
                    {metadata.tag}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    연결 이슈: {metadata.linkedIssueLabel}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    Priority: {metadata.priority}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                    Status: {metadata.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 QA Comment가 없습니다.
        </p>
      )}
    </section>
  );
}
