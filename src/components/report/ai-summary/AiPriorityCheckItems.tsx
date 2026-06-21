import type { SummaryPriorityCheckItem } from "@/components/report/ai-summary/types";

type AiPriorityCheckItemsProps = {
  getDisplayEvidence: (evidence: string | undefined) => string | null;
  items: SummaryPriorityCheckItem[];
  priorityBadgeClass: (
    priority: "high" | "medium" | "low" | undefined
  ) => string;
  priorityLabel: (priority: "high" | "medium" | "low" | undefined) => string;
  softenBlockingTerms: (text: string | undefined) => string;
};

export function AiPriorityCheckItems({
  getDisplayEvidence,
  items,
  priorityBadgeClass,
  priorityLabel,
  softenBlockingTerms,
}: AiPriorityCheckItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
      <p className="text-sm font-black text-violet-800">
        AI 우선 확인 항목
      </p>
      <ol className="mt-3 space-y-3">
        {items.map((item, index) => {
          const displayEvidence = getDisplayEvidence(item.evidence);

          return (
            <li key={`${item.title}-${index}`} className="flex gap-3">
              <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-violet-700 ring-1 ring-violet-100">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold leading-6 text-slate-900">
                    {softenBlockingTerms(item.title)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${priorityBadgeClass(
                      item.priority
                    )}`}
                  >
                    {priorityLabel(item.priority)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {softenBlockingTerms(item.reason)}
                </p>
                {displayEvidence && (
                  <p className="mt-1 text-xs leading-5 text-violet-700">
                    근거: {displayEvidence}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
