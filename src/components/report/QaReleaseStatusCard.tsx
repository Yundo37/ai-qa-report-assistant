import { createOverallDashboardMetrics } from "@/components/report/reportDashboardUtils";
import { ReportAssetSlot } from "@/components/report/ReportAssetSlot";
import type { AnalysisSummaryState } from "@/types/report";

const STATUS_PANEL_CLASS = {
  stable: "border-emerald-100 bg-white/85 text-slate-900",
  caution: "border-amber-100 bg-white/85 text-slate-900",
  risk: "border-rose-100 bg-white/85 text-slate-900",
};

const STATUS_LABEL = {
  stable: "\uC548\uC815",
  caution: "\uC8FC\uC758 \uD544\uC694",
  risk: "\uC704\uD5D8",
};

const STATUS_TEXT_CLASS = {
  stable: "text-emerald-600",
  caution: "text-amber-600",
  risk: "text-red-600",
};

const STATUS_ICON_CLASS = {
  stable: "bg-transparent ring-emerald-100/40",
  caution: "bg-transparent ring-amber-100/40",
  risk: "bg-transparent ring-rose-100/40",
};

function createStatusLines(
  tone: "stable" | "caution" | "risk",
  rcLabel?: string
) {
  const targetText =
    rcLabel && rcLabel !== "-"
      ? `\uD604\uC7AC ${rcLabel}\uB294`
      : "\uD604\uC7AC \uB9AC\uD3EC\uD2B8\uB294";

  if (tone === "risk") {
    return [
      `${targetText} \uBC30\uD3EC \uC804 \uCD94\uAC00 \uD655\uC778\uC774 \uD544\uC694\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`,
      "High / Highest \uC794\uC5EC \uC774\uC288\uC640 Blocked \uD56D\uBAA9 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    ];
  }

  if (tone === "caution") {
    return [
      `${targetText} \uC6B4\uC601 \uBAA8\uB2C8\uD130\uB9C1\uC774 \uD544\uC694\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`,
      "일부 잔여 이슈 및 후속 확인 항목을 중심으로 확인이 필요합니다.",
    ];
  }

  return [
    `${targetText} \uC8FC\uC694 \uCC28\uB2E8 \uD56D\uBAA9\uC774 \uB0AE\uC740 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`,
    "\uB0A8\uC740 \uC774\uC288\uB294 \uC6B4\uC601 \uBAA8\uB2C8\uD130\uB9C1 \uC911\uC2EC\uC73C\uB85C \uD655\uC778 \uAC00\uB2A5\uD569\uB2C8\uB2E4.",
  ];
}

export function QaReleaseStatusCard({
  analysisSummary,
  rcLabel,
}: {
  analysisSummary: NonNullable<AnalysisSummaryState>;
  rcLabel?: string;
}) {
  const metrics = createOverallDashboardMetrics(analysisSummary);
  const messageLines = createStatusLines(metrics.status.tone, rcLabel);
  const statusLabel = STATUS_LABEL[metrics.status.tone];

  return (
    <section
      className={`rounded-[1.5rem] border p-4 shadow-sm shadow-indigo-100/40 ${
        STATUS_PANEL_CLASS[metrics.status.tone]
      }`}
    >
      <div className="grid gap-3 md:grid-cols-[160px_64px_minmax(0,1fr)] md:items-center">
        <div className="min-w-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            QA Release Status
          </p>
          <h3
            className={`mt-2 text-4xl font-black tracking-tight ${
              STATUS_TEXT_CLASS[metrics.status.tone]
            }`}
          >
            {statusLabel}
          </h3>
        </div>

        <div className="justify-self-center">
          <ReportAssetSlot
            type="status"
            className={`size-14 rounded-2xl bg-none shadow-none ring-1 ${
              STATUS_ICON_CLASS[metrics.status.tone]
            }`}
            imageClassName="size-12"
          />
        </div>

        <div className="min-w-0 space-y-1 text-sm font-medium leading-6 text-slate-600">
          {messageLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
